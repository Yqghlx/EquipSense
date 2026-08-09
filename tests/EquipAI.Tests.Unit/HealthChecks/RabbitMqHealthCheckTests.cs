using EquipAI.Infrastructure.HealthChecks;
using EquipAI.Infrastructure.Messaging;
using FluentAssertions;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Moq;

namespace EquipAI.Tests.Unit.HealthChecks;

/// <summary>
/// RabbitMQ readiness 健康检查测试。
/// </summary>
public sealed class RabbitMqHealthCheckTests
{
    [Fact]
    public async Task CheckHealthAsync_事件总线已就绪_返回健康()
    {
        var state = new Mock<IRabbitMqConnectionState>();
        state.SetupGet(value => value.IsReady).Returns(true);
        state.SetupGet(value => value.StatusDescription).Returns("RabbitMQ 已就绪");
        var healthCheck = new RabbitMqHealthCheck(state.Object);

        var result = await healthCheck.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Description.Should().Be("RabbitMQ 已就绪");
    }

    [Fact]
    public async Task CheckHealthAsync_事件总线未就绪_返回不健康()
    {
        var state = new Mock<IRabbitMqConnectionState>();
        state.SetupGet(value => value.IsReady).Returns(false);
        state.SetupGet(value => value.StatusDescription).Returns("RabbitMQ 连接中断");
        var healthCheck = new RabbitMqHealthCheck(state.Object);

        var result = await healthCheck.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Unhealthy);
        result.Description.Should().Be("RabbitMQ 连接中断");
    }
}
