using EquipAI.Application.WorkOrders.Integration;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text.Json;

namespace EquipAI.Tests.Unit.WorkOrders;

public class DingTalkIntegrationTests
{
    [Fact]
    public void IntegrationType_应返回_dingtalk()
    {
        var logger = new Mock<ILogger<DingTalkIntegration>>();
        var integration = new DingTalkIntegration(logger.Object);
        integration.IntegrationType.Should().Be("dingtalk");
    }

    [Fact]
    public async Task PushCreatedAsync_无效配置应返回Null()
    {
        var logger = new Mock<ILogger<DingTalkIntegration>>();
        var integration = new DingTalkIntegration(logger.Object);

        var result = await integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "测试", "High", "{}");

        result.Should().BeNull();
    }

    [Fact]
    public async Task PushCreatedAsync_空WebhookUrl应返回Null()
    {
        var logger = new Mock<ILogger<DingTalkIntegration>>();
        var integration = new DingTalkIntegration(logger.Object);

        var config = JsonSerializer.Serialize(new DingTalkConfig { WebhookUrl = "" });
        var result = await integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "测试", "High", config);

        result.Should().BeNull();
    }

    [Fact]
    public async Task PushStatusChangedAsync_应不抛出异常()
    {
        var logger = new Mock<ILogger<DingTalkIntegration>>();
        var integration = new DingTalkIntegration(logger.Object);

        var config = JsonSerializer.Serialize(new DingTalkConfig
        {
            WebhookUrl = "https://invalid.local/webhook"
        });

        var act = () => integration.PushStatusChangedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "InProgress", null, config);
        await act.Should().NotThrowAsync();
    }
}
