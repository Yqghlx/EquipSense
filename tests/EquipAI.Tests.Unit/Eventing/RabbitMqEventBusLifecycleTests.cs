using EquipAI.Infrastructure.Messaging;
using EquipAI.Core.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

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

    [Theory]
    [InlineData(0, 3, false)]
    [InlineData(1, 3, false)]
    [InlineData(2, 3, true)]
    [InlineData(3, 3, true)]
    public void ShouldDeadLetter_最大次数包含首次处理_边界准确(
        int previousRejectedCount,
        int maxRetryCount,
        bool expected)
    {
        RabbitMqEventBus.ShouldDeadLetter(previousRejectedCount, maxRetryCount)
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
