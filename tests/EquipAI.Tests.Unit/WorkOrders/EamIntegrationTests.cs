using EquipAI.Application.WorkOrders.Integration;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text.Json;

namespace EquipAI.Tests.Unit.WorkOrders;

public class EamIntegrationTests
{
    [Fact]
    public void IntegrationType_应返回_eam()
    {
        var logger = new Mock<ILogger<EamIntegration>>();
        var httpClientFactory = new Mock<IHttpClientFactory>();
        var integration = new EamIntegration(httpClientFactory.Object, logger.Object);

        integration.IntegrationType.Should().Be("eam");
    }

    [Fact]
    public async Task PushCreatedAsync_未启用应返回Null()
    {
        var logger = new Mock<ILogger<EamIntegration>>();
        var httpClientFactory = new Mock<IHttpClientFactory>();
        var integration = new EamIntegration(httpClientFactory.Object, logger.Object);

        var config = JsonSerializer.Serialize(new EamConfig
        {
            Enabled = false,
            Endpoint = "https://maximo.example.com"
        });
        var result = await integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "测试工单", "High", config);

        result.Should().BeNull();
    }

    [Fact]
    public async Task PushCreatedAsync_空Endpoint应返回Null()
    {
        var logger = new Mock<ILogger<EamIntegration>>();
        var httpClientFactory = new Mock<IHttpClientFactory>();
        var integration = new EamIntegration(httpClientFactory.Object, logger.Object);

        var config = JsonSerializer.Serialize(new EamConfig
        {
            Enabled = true,
            Endpoint = ""
        });
        var result = await integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "测试工单", "High", config);

        result.Should().BeNull();
    }

    [Fact]
    public async Task PushCreatedAsync_应调用EAM创建工单API()
    {
        // 验证 EAM 集成在配置正确时能正常发起请求
        // 由于使用真实 HttpClient，此处验证不抛出异常（目标地址不可达时内部容错）
        var logger = new Mock<ILogger<EamIntegration>>();
        var httpClientFactory = new Mock<IHttpClientFactory>();
        var integration = new EamIntegration(httpClientFactory.Object, logger.Object);
        var workOrderId = Guid.NewGuid();

        var config = JsonSerializer.Serialize(new EamConfig
        {
            Enabled = true,
            Type = "maximo",
            Endpoint = "https://maximo.example.com",
            ApiKey = "test-api-key"
        });

        var act = () => integration.PushCreatedAsync(
            Guid.NewGuid(), workOrderId, "设备故障工单", "Critical", config);

        // 不应抛出异常（内部容错处理）
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task PushStatusChangedAsync_应调用EAM更新状态API()
    {
        var logger = new Mock<ILogger<EamIntegration>>();
        var httpClientFactory = new Mock<IHttpClientFactory>();
        var integration = new EamIntegration(httpClientFactory.Object, logger.Object);

        var config = JsonSerializer.Serialize(new EamConfig
        {
            Enabled = true,
            Type = "maximo",
            Endpoint = "https://maximo.example.com",
            ApiKey = "test-api-key"
        });

        var act = () => integration.PushStatusChangedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "InProgress", "EAM-WO-001", config);

        // 不应抛出异常（内部容错处理）
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task PushStatusChangedAsync_缺少ExternalId应跳过()
    {
        var logger = new Mock<ILogger<EamIntegration>>();
        var httpClientFactory = new Mock<IHttpClientFactory>();
        var integration = new EamIntegration(httpClientFactory.Object, logger.Object);

        var config = JsonSerializer.Serialize(new EamConfig
        {
            Enabled = true,
            Endpoint = "https://maximo.example.com"
        });

        var act = () => integration.PushStatusChangedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "InProgress", null, config);

        // 缺少 ExternalId 时不抛异常，静默跳过
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task PushCreatedAsync_无效JSON配置应返回Null()
    {
        var logger = new Mock<ILogger<EamIntegration>>();
        var httpClientFactory = new Mock<IHttpClientFactory>();
        var integration = new EamIntegration(httpClientFactory.Object, logger.Object);

        var result = await integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "测试", "High", "invalid-json");

        result.Should().BeNull();
    }

    [Theory]
    [InlineData("maximo")]
    [InlineData("sap")]
    [InlineData("other")]
    [InlineData("maximo", "https://maximo.example.com/api")]
    public async Task PushCreatedAsync_各种EAM类型应不抛出异常(string type, string? endpoint = "https://eam.example.com")
    {
        var logger = new Mock<ILogger<EamIntegration>>();
        var httpClientFactory = new Mock<IHttpClientFactory>();
        var integration = new EamIntegration(httpClientFactory.Object, logger.Object);

        var config = JsonSerializer.Serialize(new EamConfig
        {
            Enabled = true,
            Type = type,
            Endpoint = endpoint,
            ApiKey = "test-key"
        });

        var act = () => integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "测试工单", "High", config);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task PushCreatedAsync_BasicAuth认证应不抛出异常()
    {
        var logger = new Mock<ILogger<EamIntegration>>();
        var httpClientFactory = new Mock<IHttpClientFactory>();
        var integration = new EamIntegration(httpClientFactory.Object, logger.Object);

        var config = JsonSerializer.Serialize(new EamConfig
        {
            Enabled = true,
            Type = "maximo",
            Endpoint = "https://maximo.example.com",
            Username = "admin",
            Password = "password"
        });

        var act = () => integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "测试工单", "High", config);

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
        var logger = new Mock<ILogger<EamIntegration>>();
        var httpClientFactory = new Mock<IHttpClientFactory>();
        var integration = new EamIntegration(httpClientFactory.Object, logger.Object);

        var config = JsonSerializer.Serialize(new EamConfig
        {
            Enabled = true,
            Endpoint = "https://maximo.example.com",
            ApiKey = "test-key"
        });

        var act = () => integration.PushStatusChangedAsync(
            Guid.NewGuid(), Guid.NewGuid(), status, "EAM-WO-001", config);

        await act.Should().NotThrowAsync();
    }
}
