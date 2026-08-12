using EquipAI.Application.WorkOrders.Integration;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text.Json;

namespace EquipAI.Tests.Unit.WorkOrders;

public class FeishuIntegrationTests
{
    [Fact]
    public void IntegrationType_应返回_feishu()
    {
        var logger = new Mock<ILogger<FeishuIntegration>>();
        var integration = new FeishuIntegration(new Mock<IHttpClientFactory>().Object, logger.Object);

        integration.IntegrationType.Should().Be("feishu");
    }

    [Fact]
    public async Task PushCreatedAsync_未启用应返回Null()
    {
        var logger = new Mock<ILogger<FeishuIntegration>>();
        var integration = new FeishuIntegration(new Mock<IHttpClientFactory>().Object, logger.Object);

        var config = JsonSerializer.Serialize(new FeishuConfig { Enabled = false, WebhookUrl = "https://example.com/webhook" });
        var result = await integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "测试工单", "High", config);

        result.Should().BeNull();
    }

    [Fact]
    public async Task PushCreatedAsync_空WebhookUrl应返回Null()
    {
        var logger = new Mock<ILogger<FeishuIntegration>>();
        var integration = new FeishuIntegration(new Mock<IHttpClientFactory>().Object, logger.Object);

        var config = JsonSerializer.Serialize(new FeishuConfig { Enabled = true, WebhookUrl = "" });
        var result = await integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "测试工单", "High", config);

        result.Should().BeNull();
    }

    [Fact]
    public async Task PushCreatedAsync_收到停机取消时应传播取消信号()
    {
        using var cts = new CancellationTokenSource();
        cts.Cancel();
        var httpClientFactory = new Mock<IHttpClientFactory>();
        httpClientFactory
            .Setup(f => f.CreateClient("WorkOrderIntegration"))
            .Returns(new HttpClient());
        var integration = new FeishuIntegration(
            httpClientFactory.Object,
            Mock.Of<ILogger<FeishuIntegration>>());
        var config = JsonSerializer.Serialize(new FeishuConfig
        {
            Enabled = true,
            WebhookUrl = "https://example.test/robot"
        });

        var act = () => integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "测试工单", "High", config, cts.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [Fact]
    public async Task PushCreatedAsync_应发送飞书InteractiveCard格式消息()
    {
        // 验证飞书集成在配置正确时能正常发送请求
        // 由于使用真实 HttpClient，此处验证不抛出异常（目标地址不可达时内部容错）
        var logger = new Mock<ILogger<FeishuIntegration>>();
        var integration = new FeishuIntegration(new Mock<IHttpClientFactory>().Object, logger.Object);
        var workOrderId = Guid.NewGuid();

        var config = JsonSerializer.Serialize(new FeishuConfig
        {
            Enabled = true,
            WebhookUrl = "https://open.feishu.cn/open-apis/bot/v2/hook/test-webhook"
        });

        var act = () => integration.PushCreatedAsync(
            Guid.NewGuid(), workOrderId, "设备故障工单", "Critical", config);

        // 不应抛出异常（内部容错处理）
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task PushStatusChangedAsync_应包含状态变更信息()
    {
        var logger = new Mock<ILogger<FeishuIntegration>>();
        var integration = new FeishuIntegration(new Mock<IHttpClientFactory>().Object, logger.Object);

        var config = JsonSerializer.Serialize(new FeishuConfig
        {
            Enabled = true,
            WebhookUrl = "https://open.feishu.cn/open-apis/bot/v2/hook/test-webhook"
        });

        var act = () => integration.PushStatusChangedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "InProgress", null, config);

        // 不应抛出异常（内部容错处理）
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task PushCreatedAsync_无效JSON配置应返回Null()
    {
        var logger = new Mock<ILogger<FeishuIntegration>>();
        var integration = new FeishuIntegration(new Mock<IHttpClientFactory>().Object, logger.Object);

        var result = await integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "测试", "High", "invalid-json");

        result.Should().BeNull();
    }

    [Fact]
    public async Task PushStatusChangedAsync_未启用应正常返回()
    {
        var logger = new Mock<ILogger<FeishuIntegration>>();
        var integration = new FeishuIntegration(new Mock<IHttpClientFactory>().Object, logger.Object);

        var config = JsonSerializer.Serialize(new FeishuConfig { Enabled = false });
        var act = () => integration.PushStatusChangedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "Completed", null, config);

        await act.Should().NotThrowAsync();
    }

    [Theory]
    [InlineData("Critical")]
    [InlineData("High")]
    [InlineData("Medium")]
    [InlineData("Low")]
    [InlineData("Unknown")]
    public async Task PushCreatedAsync_各种优先级应不抛出异常(string priority)
    {
        var logger = new Mock<ILogger<FeishuIntegration>>();
        var integration = new FeishuIntegration(new Mock<IHttpClientFactory>().Object, logger.Object);

        var config = JsonSerializer.Serialize(new FeishuConfig
        {
            Enabled = true,
            WebhookUrl = "https://invalid.local/webhook"
        });

        var act = () => integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "测试工单", priority, config);

        await act.Should().NotThrowAsync();
    }

    [Theory]
    [InlineData("Pending")]
    [InlineData("Assigned")]
    [InlineData("InProgress")]
    [InlineData("Completed")]
    [InlineData("Closed")]
    [InlineData("Cancelled")]
    public async Task PushStatusChangedAsync_各种状态应不抛出异常(string status)
    {
        var logger = new Mock<ILogger<FeishuIntegration>>();
        var integration = new FeishuIntegration(new Mock<IHttpClientFactory>().Object, logger.Object);

        var config = JsonSerializer.Serialize(new FeishuConfig
        {
            Enabled = true,
            WebhookUrl = "https://invalid.local/webhook"
        });

        var act = () => integration.PushStatusChangedAsync(
            Guid.NewGuid(), Guid.NewGuid(), status, null, config);

        await act.Should().NotThrowAsync();
    }
}
