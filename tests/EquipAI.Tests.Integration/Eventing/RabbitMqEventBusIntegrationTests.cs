using System.Collections.Concurrent;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Messaging;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;

namespace EquipAI.Tests.Integration.Eventing;

/// <summary>
/// 使用真实 RabbitMQ 验证发布确认、处理器隔离、有限重试和重启恢复。
/// </summary>
[Collection("RabbitMQ 串行集成测试")]
public sealed class RabbitMqEventBusIntegrationTests
{
    [RabbitMqFact]
    public async Task 一个事件注册三个处理器_每个处理器各消费一次()
    {
        var options = CreateOptions();
        var tracker = new MultiHandlerTracker();
        var services = BaseServices()
            .AddSingleton(new FirstMultiHandler(tracker))
            .AddSingleton(new SecondMultiHandler(tracker))
            .AddSingleton(new ThirdMultiHandler(tracker));
        await using var provider = services.BuildServiceProvider();
        await using var bus = CreateBus(provider, options);
        bus.Subscribe<MultiHandlerEvent, FirstMultiHandler>();
        bus.Subscribe<MultiHandlerEvent, SecondMultiHandler>();
        bus.Subscribe<MultiHandlerEvent, ThirdMultiHandler>();

        await bus.StartAsync(CancellationToken.None);
        await bus.PublishAsync(NewMultiHandlerEvent());
        await tracker.AllHandled.Task.WaitAsync(TimeSpan.FromSeconds(20));

        tracker.First.Should().Be(1);
        tracker.Second.Should().Be(1);
        tracker.Third.Should().Be(1);
    }

    [RabbitMqFact]
    public async Task 一个处理器持续失败_成功处理器不重复且失败处理器按总次数进入死信()
    {
        var options = CreateOptions(maxRetryCount: 3, retryIntervalSeconds: 1);
        var success = new SuccessCounter();
        var failure = new FailureCounter(expectedAttempts: 3);
        var services = BaseServices()
            .AddSingleton(new RetrySuccessHandler(success))
            .AddSingleton(new RetryFailureHandler(failure));
        await using var provider = services.BuildServiceProvider();
        await using var bus = CreateBus(provider, options);
        bus.Subscribe<RetryEvent, RetrySuccessHandler>();
        bus.Subscribe<RetryEvent, RetryFailureHandler>();

        await bus.StartAsync(CancellationToken.None);
        await bus.PublishAsync(NewRetryEvent());
        await failure.ReachedExpectedAttempts.Task.WaitAsync(TimeSpan.FromSeconds(30));
        var deadQueue = RabbitMqTopologyNames.GetDeadQueueName(typeof(RetryEvent), typeof(RetryFailureHandler));
        await WaitForQueueCountAsync(options, deadQueue, expectedCount: 1, TimeSpan.FromSeconds(15));

        success.Count.Should().Be(1);
        failure.Count.Should().Be(3);
    }

    [RabbitMqFact]
    public async Task 并发发布一百条事件_全部获得确认并被唯一消费()
    {
        var options = CreateOptions();
        var tracker = new ConcurrentEventTracker(expectedCount: 100);
        var services = BaseServices().AddSingleton(new ConcurrentHandler(tracker));
        await using var provider = services.BuildServiceProvider();
        await using var bus = CreateBus(provider, options);
        bus.Subscribe<ConcurrentEvent, ConcurrentHandler>();
        await bus.StartAsync(CancellationToken.None);
        var events = Enumerable.Range(0, 100)
            .Select(_ => new ConcurrentEvent(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid()))
            .ToArray();

        await Task.WhenAll(events.Select(@event => bus.PublishAsync(@event)));
        await tracker.AllHandled.Task.WaitAsync(TimeSpan.FromSeconds(30));

        tracker.EventIds.Should().HaveCount(100);
    }

    [RabbitMqFact]
    public async Task 发布确认后重建总线_持久化消息仍可消费()
    {
        var options = CreateOptions();
        var firstServices = BaseServices().AddSingleton(new RestartHandler(new SuccessCounter()));
        await using (var firstProvider = firstServices.BuildServiceProvider())
        {
            await using var firstBus = CreateBus(firstProvider, options);
            firstBus.Subscribe<RestartEvent, RestartHandler>();
            await firstBus.StartAsync(CancellationToken.None);
            await firstBus.StopAsync(CancellationToken.None);
        }

        var pendingEvent = new RestartEvent(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid());
        await PublishPersistentDirectlyAsync(options, pendingEvent);

        var counter = new SuccessCounter(expectedCount: 1);
        var secondServices = BaseServices().AddSingleton(new RestartHandler(counter));
        await using var secondProvider = secondServices.BuildServiceProvider();
        await using var secondBus = CreateBus(secondProvider, options);
        secondBus.Subscribe<RestartEvent, RestartHandler>();
        await secondBus.StartAsync(CancellationToken.None);
        await counter.ReachedExpectedCount.Task.WaitAsync(TimeSpan.FromSeconds(20));

        counter.Count.Should().Be(1);
    }

    private static ServiceCollection BaseServices()
    {
        var services = new ServiceCollection();
        services.AddLogging(builder => builder.AddConsole().SetMinimumLevel(LogLevel.Warning));
        return services;
    }

    private static RabbitMqEventBus CreateBus(IServiceProvider provider, RabbitMqOptions options) =>
        new(
            provider,
            provider.GetRequiredService<ILogger<RabbitMqEventBus>>(),
            Options.Create(options));

    private static RabbitMqOptions CreateOptions(int maxRetryCount = 5, int retryIntervalSeconds = 1) => new()
    {
        Host = Environment.GetEnvironmentVariable("RABBITMQ_TEST_HOST") ?? "127.0.0.1",
        Port = int.TryParse(Environment.GetEnvironmentVariable("RABBITMQ_TEST_PORT"), out var port) ? port : 5672,
        Username = Environment.GetEnvironmentVariable("RABBITMQ_TEST_USERNAME") ?? "equipai_test",
        Password = Environment.GetEnvironmentVariable("RABBITMQ_TEST_PASSWORD") ?? "equipai_test_password",
        MaxRetryCount = maxRetryCount,
        RetryIntervalSeconds = retryIntervalSeconds,
        HandlerTimeoutSeconds = 10,
        PrefetchCount = 20,
    };

    private static ConnectionFactory CreateFactory(RabbitMqOptions options) => new()
    {
        HostName = options.Host,
        Port = options.Port,
        VirtualHost = options.VirtualHost,
        UserName = options.Username,
        Password = options.Password,
    };

    private static async Task WaitForQueueCountAsync(
        RabbitMqOptions options,
        string queueName,
        uint expectedCount,
        TimeSpan timeout)
    {
        await using var connection = await CreateFactory(options).CreateConnectionAsync();
        await using var channel = await connection.CreateChannelAsync();
        using var cancellation = new CancellationTokenSource(timeout);
        while (!cancellation.IsCancellationRequested)
        {
            var result = await channel.QueueDeclarePassiveAsync(queueName, cancellation.Token);
            if (result.MessageCount == expectedCount) return;
            await Task.Delay(100, cancellation.Token);
        }

        throw new TimeoutException($"队列 {queueName} 未在 {timeout} 内达到消息数 {expectedCount}");
    }

    private static async Task PublishPersistentDirectlyAsync(
        RabbitMqOptions options,
        RestartEvent @event)
    {
        await using var connection = await CreateFactory(options).CreateConnectionAsync();
        await using var channel = await connection.CreateChannelAsync(
            new CreateChannelOptions(
                publisherConfirmationsEnabled: true,
                publisherConfirmationTrackingEnabled: true));
        var body = System.Text.Json.JsonSerializer.SerializeToUtf8Bytes(@event);
        await channel.BasicPublishAsync(
            RabbitMqTopologyNames.GetExchangeName(typeof(RestartEvent)),
            string.Empty,
            mandatory: true,
            new BasicProperties
            {
                DeliveryMode = DeliveryModes.Persistent,
                ContentType = "application/json",
                MessageId = @event.EventId.ToString(),
            },
            body);
    }

    private static MultiHandlerEvent NewMultiHandlerEvent() =>
        new(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid());

    private static RetryEvent NewRetryEvent() =>
        new(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid());

    private sealed record MultiHandlerEvent(Guid EventId, DateTime OccurredAt, Guid TenantId) : IIntegrationEvent;
    private sealed record RetryEvent(Guid EventId, DateTime OccurredAt, Guid TenantId) : IIntegrationEvent;
    private sealed record ConcurrentEvent(Guid EventId, DateTime OccurredAt, Guid TenantId) : IIntegrationEvent;
    private sealed record RestartEvent(Guid EventId, DateTime OccurredAt, Guid TenantId) : IIntegrationEvent;

    private sealed class MultiHandlerTracker
    {
        public int First;
        public int Second;
        public int Third;
        public TaskCompletionSource AllHandled { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);

        public void Record(ref int counter)
        {
            Interlocked.Increment(ref counter);
            if (Volatile.Read(ref First) == 1
                && Volatile.Read(ref Second) == 1
                && Volatile.Read(ref Third) == 1)
            {
                AllHandled.TrySetResult();
            }
        }
    }

    private sealed class FirstMultiHandler(MultiHandlerTracker tracker) : IEventHandler<MultiHandlerEvent>
    {
        public Task HandleAsync(MultiHandlerEvent @event, CancellationToken cancellationToken = default)
        {
            tracker.Record(ref tracker.First);
            return Task.CompletedTask;
        }
    }

    private sealed class SecondMultiHandler(MultiHandlerTracker tracker) : IEventHandler<MultiHandlerEvent>
    {
        public Task HandleAsync(MultiHandlerEvent @event, CancellationToken cancellationToken = default)
        {
            tracker.Record(ref tracker.Second);
            return Task.CompletedTask;
        }
    }

    private sealed class ThirdMultiHandler(MultiHandlerTracker tracker) : IEventHandler<MultiHandlerEvent>
    {
        public Task HandleAsync(MultiHandlerEvent @event, CancellationToken cancellationToken = default)
        {
            tracker.Record(ref tracker.Third);
            return Task.CompletedTask;
        }
    }

    private sealed class SuccessCounter(int expectedCount = 1)
    {
        private int _count;
        public int Count => Volatile.Read(ref _count);
        public TaskCompletionSource ReachedExpectedCount { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);

        public void Increment()
        {
            if (Interlocked.Increment(ref _count) >= expectedCount) ReachedExpectedCount.TrySetResult();
        }
    }

    private sealed class FailureCounter(int expectedAttempts)
    {
        private int _count;
        public int Count => Volatile.Read(ref _count);
        public TaskCompletionSource ReachedExpectedAttempts { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);

        public void Increment()
        {
            if (Interlocked.Increment(ref _count) >= expectedAttempts) ReachedExpectedAttempts.TrySetResult();
        }
    }

    private sealed class RetrySuccessHandler(SuccessCounter counter) : IEventHandler<RetryEvent>
    {
        public Task HandleAsync(RetryEvent @event, CancellationToken cancellationToken = default)
        {
            counter.Increment();
            return Task.CompletedTask;
        }
    }

    private sealed class RetryFailureHandler(FailureCounter counter) : IEventHandler<RetryEvent>
    {
        public Task HandleAsync(RetryEvent @event, CancellationToken cancellationToken = default)
        {
            counter.Increment();
            throw new InvalidOperationException("用于验证有限重试的预期异常");
        }
    }

    private sealed class ConcurrentEventTracker(int expectedCount)
    {
        public ConcurrentDictionary<Guid, byte> EventIds { get; } = new();
        public TaskCompletionSource AllHandled { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);

        public void Record(Guid eventId)
        {
            EventIds.TryAdd(eventId, 0);
            if (EventIds.Count >= expectedCount) AllHandled.TrySetResult();
        }
    }

    private sealed class ConcurrentHandler(ConcurrentEventTracker tracker) : IEventHandler<ConcurrentEvent>
    {
        public Task HandleAsync(ConcurrentEvent @event, CancellationToken cancellationToken = default)
        {
            tracker.Record(@event.EventId);
            return Task.CompletedTask;
        }
    }

    private sealed class RestartHandler(SuccessCounter counter) : IEventHandler<RestartEvent>
    {
        public Task HandleAsync(RestartEvent @event, CancellationToken cancellationToken = default)
        {
            counter.Increment();
            return Task.CompletedTask;
        }
    }
}

/// <summary>
/// 禁止 RabbitMQ 集成测试并行操作共享 broker。
/// </summary>
[CollectionDefinition("RabbitMQ 串行集成测试", DisableParallelization = true)]
public sealed class RabbitMqIntegrationCollection;
