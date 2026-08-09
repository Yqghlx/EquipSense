using System.Collections.Concurrent;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Messaging;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Exceptions;

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
        await using var topology = await RabbitMqTopologyLease.CreateAsync(
            options,
            (typeof(MultiHandlerEvent), typeof(FirstMultiHandler)),
            (typeof(MultiHandlerEvent), typeof(SecondMultiHandler)),
            (typeof(MultiHandlerEvent), typeof(ThirdMultiHandler)));
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
        await using var topology = await RabbitMqTopologyLease.CreateAsync(
            options,
            (typeof(RetryEvent), typeof(RetrySuccessHandler)),
            (typeof(RetryEvent), typeof(RetryFailureHandler)));
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
        await using var topology = await RabbitMqTopologyLease.CreateAsync(
            options,
            (typeof(ConcurrentEvent), typeof(ConcurrentHandler)));
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
        await using var topology = await RabbitMqTopologyLease.CreateAsync(
            options,
            (typeof(RestartEvent), typeof(RestartHandler)));
        var blockingTracker = RestartTracker.CreateBlocking();
        var pendingEvent = new RestartEvent(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid());
        var firstServices = BaseServices().AddSingleton(new RestartHandler(blockingTracker));
        await using (var firstProvider = firstServices.BuildServiceProvider())
        {
            await using var firstBus = CreateBus(firstProvider, options);
            firstBus.Subscribe<RestartEvent, RestartHandler>();
            await firstBus.StartAsync(CancellationToken.None);
            await firstBus.PublishAsync(pendingEvent);
            await blockingTracker.Started.Task.WaitAsync(TimeSpan.FromSeconds(20));
            await firstBus.StopAsync(CancellationToken.None);
        }

        var resumedTracker = RestartTracker.CreateCompleting();
        var secondServices = BaseServices().AddSingleton(new RestartHandler(resumedTracker));
        await using var secondProvider = secondServices.BuildServiceProvider();
        await using var secondBus = CreateBus(secondProvider, options);
        secondBus.Subscribe<RestartEvent, RestartHandler>();
        await secondBus.StartAsync(CancellationToken.None);
        await resumedTracker.Completed.Task.WaitAsync(TimeSpan.FromSeconds(20));

        resumedTracker.Count.Should().Be(1);
    }

    [RabbitMqFact]
    public async Task 事件交换机没有任何绑定_发布向调用方报告路由失败()
    {
        var options = CreateOptions();
        await using var topology = await RabbitMqTopologyLease.CreateAsync(
            options,
            (typeof(UnroutableEvent), typeof(UnroutableHandler)));
        var services = BaseServices().AddSingleton(new UnroutableHandler());
        await using var provider = services.BuildServiceProvider();
        await using var bus = CreateBus(provider, options);
        bus.Subscribe<UnroutableEvent, UnroutableHandler>();
        await bus.StartAsync(CancellationToken.None);
        var mainQueue = RabbitMqTopologyNames.GetMainQueueName(
            typeof(UnroutableEvent),
            typeof(UnroutableHandler));
        await UnbindQueueAsync(
            options,
            mainQueue,
            RabbitMqTopologyNames.GetExchangeName(typeof(UnroutableEvent)));

        var action = () => bus.PublishAsync(
            new UnroutableEvent(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid()));

        await action.Should().ThrowAsync<PublishException>();
    }

    [RabbitMqFact]
    public async Task Broker强制断开连接_就绪状态转为失败且发布不会假成功()
    {
        var options = CreateOptions();
        await using var topology = await RabbitMqTopologyLease.CreateAsync(
            options,
            (typeof(DisconnectEvent), typeof(DisconnectHandler)));
        var services = BaseServices().AddSingleton(new DisconnectHandler());
        await using var provider = services.BuildServiceProvider();
        await using var bus = CreateBus(provider, options);
        bus.Subscribe<DisconnectEvent, DisconnectHandler>();
        await bus.StartAsync(CancellationToken.None);

        await CloseEventBusConnectionThroughManagementApiAsync(options);
        await WaitUntilAsync(() => !bus.IsReady, TimeSpan.FromSeconds(10));
        var action = () => bus.PublishAsync(
            new DisconnectEvent(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid()));

        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*尚未就绪*");
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

    private static async Task UnbindQueueAsync(
        RabbitMqOptions options,
        string queueName,
        string exchangeName)
    {
        await using var connection = await CreateFactory(options).CreateConnectionAsync();
        await using var channel = await connection.CreateChannelAsync();
        await channel.QueueUnbindAsync(queueName, exchangeName, string.Empty);
    }

    private static async Task CloseEventBusConnectionThroughManagementApiAsync(RabbitMqOptions options)
    {
        var managementPort = int.TryParse(
            Environment.GetEnvironmentVariable("RABBITMQ_TEST_MANAGEMENT_PORT"),
            out var configuredPort)
            ? configuredPort
            : 15672;
        using var client = new HttpClient { BaseAddress = new Uri($"http://{options.Host}:{managementPort}/api/") };
        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{options.Username}:{options.Password}"));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);
        string? connectionName = null;
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(10));
        while (connectionName is null)
        {
            using var response = await client.GetAsync("connections", timeout.Token);
            response.EnsureSuccessStatusCode();
            await using var body = await response.Content.ReadAsStreamAsync(timeout.Token);
            using var document = await JsonDocument.ParseAsync(body, cancellationToken: timeout.Token);
            connectionName = document.RootElement.EnumerateArray()
                .Where(item => item.TryGetProperty("client_properties", out var properties)
                    && properties.TryGetProperty("connection_name", out var name)
                    && name.ValueKind == JsonValueKind.String
                    && name.GetString() == "EquipSense.EventBus")
                .Select(item => item.GetProperty("name").GetString())
                .FirstOrDefault(name => !string.IsNullOrWhiteSpace(name));

            if (connectionName is null)
            {
                await Task.Delay(50, timeout.Token);
            }
        }

        using var deleteResponse = await client.DeleteAsync($"connections/{Uri.EscapeDataString(connectionName)}");
        deleteResponse.EnsureSuccessStatusCode();
    }

    private static async Task WaitUntilAsync(Func<bool> predicate, TimeSpan timeout)
    {
        using var cancellation = new CancellationTokenSource(timeout);
        while (!predicate())
        {
            await Task.Delay(50, cancellation.Token);
        }
    }

    private static MultiHandlerEvent NewMultiHandlerEvent() =>
        new(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid());

    private static RetryEvent NewRetryEvent() =>
        new(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid());

    private sealed record MultiHandlerEvent(Guid EventId, DateTime OccurredAt, Guid TenantId) : IIntegrationEvent;
    private sealed record RetryEvent(Guid EventId, DateTime OccurredAt, Guid TenantId) : IIntegrationEvent;
    private sealed record ConcurrentEvent(Guid EventId, DateTime OccurredAt, Guid TenantId) : IIntegrationEvent;
    private sealed record RestartEvent(Guid EventId, DateTime OccurredAt, Guid TenantId) : IIntegrationEvent;
    private sealed record UnroutableEvent(Guid EventId, DateTime OccurredAt, Guid TenantId) : IIntegrationEvent;
    private sealed record DisconnectEvent(Guid EventId, DateTime OccurredAt, Guid TenantId) : IIntegrationEvent;

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

    private sealed class RestartTracker(bool blockUntilCanceled)
    {
        private int _count;
        public int Count => Volatile.Read(ref _count);
        public TaskCompletionSource Started { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public TaskCompletionSource Completed { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);

        public static RestartTracker CreateBlocking() => new(blockUntilCanceled: true);
        public static RestartTracker CreateCompleting() => new(blockUntilCanceled: false);

        public async Task HandleAsync(CancellationToken cancellationToken)
        {
            Interlocked.Increment(ref _count);
            Started.TrySetResult();
            if (blockUntilCanceled)
            {
                await Task.Delay(Timeout.InfiniteTimeSpan, cancellationToken);
                return;
            }
            Completed.TrySetResult();
        }
    }

    private sealed class RestartHandler(RestartTracker tracker) : IEventHandler<RestartEvent>
    {
        public Task HandleAsync(RestartEvent @event, CancellationToken cancellationToken = default) =>
            tracker.HandleAsync(cancellationToken);
    }

    private sealed class UnroutableHandler : IEventHandler<UnroutableEvent>
    {
        public Task HandleAsync(UnroutableEvent @event, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;
    }

    private sealed class DisconnectHandler : IEventHandler<DisconnectEvent>
    {
        public Task HandleAsync(DisconnectEvent @event, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;
    }

    private sealed class RabbitMqTopologyLease : IAsyncDisposable
    {
        private readonly RabbitMqOptions _options;
        private readonly (Type EventType, Type HandlerType)[] _registrations;

        private RabbitMqTopologyLease(
            RabbitMqOptions options,
            (Type EventType, Type HandlerType)[] registrations)
        {
            _options = options;
            _registrations = registrations;
        }

        public static async Task<RabbitMqTopologyLease> CreateAsync(
            RabbitMqOptions options,
            params (Type EventType, Type HandlerType)[] registrations)
        {
            var lease = new RabbitMqTopologyLease(options, registrations);
            await lease.CleanupAsync();
            return lease;
        }

        public async ValueTask DisposeAsync() => await CleanupAsync();

        private async Task CleanupAsync()
        {
            await using var connection = await CreateFactory(_options).CreateConnectionAsync();
            foreach (var registration in _registrations)
            {
                await DeleteQueueIfExistsAsync(
                    connection,
                    RabbitMqTopologyNames.GetMainQueueName(registration.EventType, registration.HandlerType));
                await DeleteQueueIfExistsAsync(
                    connection,
                    RabbitMqTopologyNames.GetRetryQueueName(registration.EventType, registration.HandlerType));
                await DeleteQueueIfExistsAsync(
                    connection,
                    RabbitMqTopologyNames.GetDeadQueueName(registration.EventType, registration.HandlerType));
            }

            foreach (var eventType in _registrations.Select(item => item.EventType).Distinct())
            {
                await DeleteExchangeIfExistsAsync(
                    connection,
                    RabbitMqTopologyNames.GetExchangeName(eventType));
            }
        }

        private static async Task DeleteQueueIfExistsAsync(IConnection connection, string queueName)
        {
            await using var channel = await connection.CreateChannelAsync();
            try
            {
                await channel.QueueDeleteAsync(queueName, ifUnused: false, ifEmpty: false);
            }
            catch (OperationInterruptedException exception) when (exception.ShutdownReason?.ReplyCode == 404)
            {
                // 队列不存在说明环境已干净；RabbitMQ 会关闭当前临时通道，因此每个删除使用独立通道。
            }
        }

        private static async Task DeleteExchangeIfExistsAsync(IConnection connection, string exchangeName)
        {
            await using var channel = await connection.CreateChannelAsync();
            try
            {
                await channel.ExchangeDeleteAsync(exchangeName, ifUnused: false);
            }
            catch (OperationInterruptedException exception) when (exception.ShutdownReason?.ReplyCode == 404)
            {
                // 交换机不存在说明环境已干净。
            }
        }
    }
}

/// <summary>
/// 禁止 RabbitMQ 集成测试并行操作共享 broker。
/// </summary>
[CollectionDefinition("RabbitMQ 串行集成测试", DisableParallelization = true)]
public sealed class RabbitMqIntegrationCollection;
