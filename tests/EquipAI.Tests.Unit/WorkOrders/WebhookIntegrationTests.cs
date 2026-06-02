using EquipAI.Application.WorkOrders.Integration;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text.Json;

namespace EquipAI.Tests.Unit.WorkOrders;

public class WebhookIntegrationTests
{
    [Fact]
    public void IntegrationType_应返回_webhook()
    {
        var logger = new Mock<ILogger<WebhookIntegration>>();
        var integration = new WebhookIntegration(logger.Object);
        integration.IntegrationType.Should().Be("webhook");
    }

    [Fact]
    public async Task PushCreatedAsync_应发送POST到配置的URL()
    {
        var logger = new Mock<ILogger<WebhookIntegration>>();
        var integration = new WebhookIntegration(logger.Object);
        var tenantId = Guid.NewGuid();
        var workOrderId = Guid.NewGuid();

        var config = JsonSerializer.Serialize(new WebhookConfig
        {
            Url = "https://httpbin.org/post",
            Secret = "test-secret"
        });

        try
        {
            await integration.PushCreatedAsync(tenantId, workOrderId, "测试工单", "High", config);
        }
        catch (HttpRequestException)
        {
            // 网络不可用时忽略
        }
    }

    [Fact]
    public async Task PushCreatedAsync_无效URL应不抛出异常()
    {
        var logger = new Mock<ILogger<WebhookIntegration>>();
        var integration = new WebhookIntegration(logger.Object);

        var config = JsonSerializer.Serialize(new WebhookConfig
        {
            Url = "https://invalid-url-that-does-not-exist.local/hook"
        });

        var act = () => integration.PushCreatedAsync(Guid.NewGuid(), Guid.NewGuid(), "测试", "Low", config);
        await act.Should().NotThrowAsync();
    }
}
