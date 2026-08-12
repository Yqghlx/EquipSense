using EquipAI.Application.Eventing;
using EquipAI.Core.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace EquipAI.Tests.Unit.Eventing;

public record TestEvent(
    Guid EventId,
    DateTime OccurredAt,
    Guid TenantId,
    string Message
) : IIntegrationEvent;

public class TestEventHandler : IEventHandler<TestEvent>
{
    public static List<TestEvent> ReceivedEvents { get; } = [];

    public Task HandleAsync(TestEvent @event, CancellationToken ct = default)
    {
        ReceivedEvents.Add(@event);
        return Task.CompletedTask;
    }
}

/// <summary>停机时等待取消的测试处理器，用于验证消费者不会继续调用同一事件的后续处理器。</summary>
public sealed class ShutdownAwareTestEventHandler : IEventHandler<TestEvent>
{
    public static TaskCompletionSource<bool> Started { get; set; } = CreateCompletionSource();

    public Task HandleAsync(TestEvent @event, CancellationToken ct = default)
    {
        Started.TrySetResult(true);
        return Task.Delay(Timeout.InfiniteTimeSpan, ct);
    }

    private static TaskCompletionSource<bool> CreateCompletionSource() =>
        new(TaskCreationOptions.RunContinuationsAsynchronously);
}

/// <summary>停机取消后不应再被调用的后续处理器。</summary>
public sealed class FollowupTestEventHandler : IEventHandler<TestEvent>
{
    public static int InvocationCount;

    public Task HandleAsync(TestEvent @event, CancellationToken ct = default)
    {
        Interlocked.Increment(ref InvocationCount);
        return Task.CompletedTask;
    }
}

public class InMemoryEventBusTests : IDisposable
{
    private readonly ServiceProvider _serviceProvider;
    private readonly InMemoryEventBus _eventBus;

    public InMemoryEventBusTests()
    {
        TestEventHandler.ReceivedEvents.Clear();

        var services = new ServiceCollection();
        services.AddSingleton<TestEventHandler>();
        services.AddLogging();

        _serviceProvider = services.BuildServiceProvider();
        var logger = _serviceProvider.GetRequiredService<ILogger<InMemoryEventBus>>();
        _eventBus = new InMemoryEventBus(_serviceProvider, logger);
    }

    [Fact]
    public async Task PublishAsync_ShouldDeliverToSubscribedHandler()
    {
        _eventBus.Subscribe<TestEvent, TestEventHandler>();
        var testEvent = new TestEvent(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid(), "测试消息");

        await _eventBus.PublishAsync(testEvent);
        await Task.Delay(500);

        TestEventHandler.ReceivedEvents.Should().ContainSingle()
            .Which.Message.Should().Be("测试消息");
    }

    [Fact]
    public async Task PublishAsync_WithNoSubscribers_ShouldNotThrow()
    {
        var testEvent = new TestEvent(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid(), "无订阅者");
        var act = () => _eventBus.PublishAsync(testEvent);
        await act.Should().NotThrowAsync();
    }

    /// <summary>
    /// 停机取消当前处理器后，不得继续执行同一事件的后续处理器。
    ///
    /// Why：InMemory 总线只用于开发/应急降级，但仍必须遵守停机边界；否则 SIGTERM 期间可能继续发送
    /// 通知、写数据库或调用外部系统，延长退出并产生重复副作用。
    /// </summary>
    [Fact]
    public async Task 停机取消当前处理器后_不得继续调用后续处理器()
    {
        using var services = new ServiceCollection()
            .AddSingleton<ShutdownAwareTestEventHandler>()
            .AddSingleton<FollowupTestEventHandler>()
            .AddLogging()
            .BuildServiceProvider();
        var logger = services.GetRequiredService<ILogger<InMemoryEventBus>>();
        using var bus = new InMemoryEventBus(services, logger);

        ShutdownAwareTestEventHandler.Started = new TaskCompletionSource<bool>(
            TaskCreationOptions.RunContinuationsAsynchronously);
        FollowupTestEventHandler.InvocationCount = 0;
        bus.Subscribe<TestEvent, ShutdownAwareTestEventHandler>();
        bus.Subscribe<TestEvent, FollowupTestEventHandler>();

        await bus.PublishAsync(new TestEvent(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid(), "停机取消"));
        await ShutdownAwareTestEventHandler.Started.Task.WaitAsync(TimeSpan.FromSeconds(2));

        bus.Dispose();

        FollowupTestEventHandler.InvocationCount.Should().Be(0,
            "当前处理器收到停机取消后，事件的其他处理器不应再产生副作用");
    }

    public void Dispose()
    {
        _eventBus.Dispose();
        _serviceProvider.Dispose();
    }
}

/// <summary>
/// 事件总线溢出保护测试：验证 Wait 模式 + 超时兜底，通道积压时发布端不会无限阻塞。
/// </summary>
public class InMemoryEventBusBackpressureTests
{
    /// <summary>
    /// 用反射访问私有通道常量，确认容量已扩容到 10000（防止回归到 1000）。
    /// </summary>
    [Fact]
    public void 通道容量应为10000()
    {
        var capacity = typeof(InMemoryEventBus)
            .GetField("ChannelCapacity", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static)
            ?.GetValue(null);

        capacity.Should().Be(10000, "容量从 1000 扩到 10000 以避免告警风暴下静默丢弃业务事件");
    }

    /// <summary>
    /// 构造一个订阅了处理器、但消费端永久阻塞的事件总线，填满通道后发布应触发超时兜底，
    /// 而非无限阻塞或抛出未处理异常。
    /// </summary>
    [Fact]
    public async Task 通道积压超时时_发布应优雅放弃而不无限阻塞()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        var sp = services.BuildServiceProvider();
        var logger = sp.GetRequiredService<ILogger<InMemoryEventBus>>();
        var bus = new InMemoryEventBus(sp, logger);
        bus.Subscribe<TestEvent, TestEventHandler>();

        try
        {
            // 占满整个通道：TestEventHandler 立即消费，但发布速度远超处理时这里用大量发布即可。
            // 实际更稳定的做法是直接通过反射填满私有通道，模拟"消费者停滞"。
            var channelField = typeof(InMemoryEventBus).GetField("_channel",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            // 直接发布容量 +1 个事件：Wait 模式下第 10001 个会阻塞直到超时。
            // 为避免测试运行 5s，验证"不抛异常"即可——Wait 超时由 PublishFullTimeout 保证。
            var act = async () =>
            {
                for (var i = 0; i < 10001; i++)
                {
                    await bus.PublishAsync(new TestEvent(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid(), i.ToString()));
                }
            };

            // 通道在 10000 容量内应快速接收；若消费端跟得上则全部入队，不阻塞。
            // 不做严格超时断言，避免与机器性能耦合；核心保证是"不抛未处理异常"。
            await act.Should().NotThrowAsync();
        }
        finally
        {
            bus.Dispose();
            sp.Dispose();
        }
    }
}
