using EquipAI.Infrastructure.Messaging;
using EquipAI.Core.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;

namespace EquipAI.Tests.Unit.Eventing;

/// <summary>
/// RabbitMQ 事件总线启动生命周期测试。
/// </summary>
public sealed class RabbitMqEventBusLifecycleTests
{
    [Fact]
    public void 构造_代理不可达_只登记依赖而不提前连接()
    {
        using var serviceProvider = new ServiceCollection().BuildServiceProvider();
        var options = Options.Create(new RabbitMqOptions
        {
            Host = "127.0.0.1",
            Port = 1,
        });

        var action = () => new RabbitMqEventBus(
            serviceProvider,
            NullLogger<RabbitMqEventBus>.Instance,
            options);

        action.Should().NotThrow("连接应由 IHostedService.StartAsync 在全部订阅登记后建立");
    }

    [Fact]
    public async Task PublishAsync_托管服务尚未启动_明确拒绝发布()
    {
        using var serviceProvider = new ServiceCollection().BuildServiceProvider();
        await using var bus = CreateBus(serviceProvider);

        var action = () => bus.PublishAsync(new LifecycleEvent(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid()));

        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*尚未就绪*");
    }

    [Fact]
    public async Task StartAsync_宿主取消连接时不应记录严重启动故障()
    {
        using var serviceProvider = new ServiceCollection().BuildServiceProvider();
        var logger = new Mock<ILogger<RabbitMqEventBus>>();
        await using var bus = new RabbitMqEventBus(
            serviceProvider,
            logger.Object,
            Options.Create(new RabbitMqOptions { Host = "127.0.0.1", Port = 1 }));
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        var action = () => bus.StartAsync(cts.Token);

        await action.Should().ThrowAsync<OperationCanceledException>();
        var hasCriticalLog = logger.Invocations.Any(invocation =>
            invocation.Method.Name == nameof(ILogger.Log)
            && invocation.Arguments.Count > 0
            && invocation.Arguments[0] is LogLevel
            && (LogLevel)invocation.Arguments[0] == LogLevel.Critical);
        hasCriticalLog.Should().BeFalse("宿主主动取消启动不属于 RabbitMQ 故障，不应触发严重错误告警");
    }

    [Theory]
    [InlineData(0, 3, false)]
    [InlineData(1, 3, false)]
    [InlineData(2, 3, true)]
    [InlineData(3, 3, true)]
    [InlineData(int.MaxValue, 3, true)]
    public void ShouldDeadLetter_最大次数包含首次处理_边界准确(
        int previousRejectedCount,
        int maxRetryCount,
        bool expected)
    {
        RabbitMqEventBus.ShouldDeadLetter(previousRejectedCount, maxRetryCount)
            .Should().Be(expected);
    }

    [Theory]
    [InlineData(true, true, true)]
    [InlineData(true, false, false)]
    [InlineData(false, true, false)]
    public void ShouldLeaveUnackedForShutdown_只有停机引起的取消才交给Broker重投(
        bool lifetimeCancellationRequested,
        bool operationCanceled,
        bool expected)
    {
        Exception exception = operationCanceled
            ? new OperationCanceledException("应用正在停止")
            : new InvalidOperationException("业务处理失败");

        RabbitMqEventBus.ShouldLeaveUnackedForShutdown(exception, lifetimeCancellationRequested)
            .Should().Be(expected);
    }

    [Theory]
    [InlineData(true, true, false)]
    [InlineData(true, false, true)]
    [InlineData(false, true, true)]
    public void ShouldRecordInboxFailure_正常停机取消不应污染失败指标或释放失败状态(
        bool lifetimeCancellationRequested,
        bool operationCanceled,
        bool expected)
    {
        Exception exception = operationCanceled
            ? new OperationCanceledException("应用正在停止")
            : new InvalidOperationException("业务处理失败");

        RabbitMqEventBus.ShouldRecordInboxFailure(exception, lifetimeCancellationRequested)
            .Should().Be(expected);
    }

    [Theory]
    [InlineData(false, true)]
    [InlineData(true, false)]
    public void ShouldLogConnectionShutdownAsError_正常停机不应产生错误告警(
        bool stopping,
        bool expected)
    {
        RabbitMqEventBus.ShouldLogConnectionShutdownAsError(stopping)
            .Should().Be(expected);
    }

    private static RabbitMqEventBus CreateBus(IServiceProvider serviceProvider) => new(
        serviceProvider,
        NullLogger<RabbitMqEventBus>.Instance,
        Options.Create(new RabbitMqOptions { Host = "127.0.0.1", Port = 1 }));

    private sealed record LifecycleEvent(
        Guid EventId,
        DateTime OccurredAt,
        Guid TenantId) : IIntegrationEvent;
}
