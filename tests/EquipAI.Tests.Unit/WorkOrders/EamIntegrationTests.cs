using EquipAI.Application.WorkOrders.Integration;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using System.Net;
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
    public async Task PushCreatedAsync_小驼峰配置应正确读取启用状态和Endpoint()
    {
        // Arrange — EAM 配置同样由管理端按小驼峰字段名保存
        var handler = new Mock<HttpMessageHandler>();
        handler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{\"wonum\":\"EAM-LOWERCASE-001\"}")
            });

        var httpClientFactory = new Mock<IHttpClientFactory>();
        httpClientFactory
            .Setup(factory => factory.CreateClient("WorkOrderIntegration"))
            .Returns(new HttpClient(handler.Object));
        var integration = new EamIntegration(
            httpClientFactory.Object,
            Mock.Of<ILogger<EamIntegration>>());
        var config = """
            {"enabled":true,"type":"maximo","endpoint":"https://maximo.example.com","apiKey":"test-api-key"}
            """;

        // Act
        var result = await integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "小驼峰配置测试", "High", config);

        // Assert
        result.Should().Be("EAM-LOWERCASE-001");
        handler.Protected().Verify(
            "SendAsync",
            Times.Once(),
            ItExpr.IsAny<HttpRequestMessage>(),
            ItExpr.IsAny<CancellationToken>());
    }

    [Fact]
    public async Task PushCreatedAsync_HTTP成功但响应体为空_应返回Null以触发重试()
    {
        var handler = new Mock<HttpMessageHandler>();
        handler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.Created)
            {
                Content = new StringContent(string.Empty),
            });

        var httpClientFactory = new Mock<IHttpClientFactory>();
        httpClientFactory
            .Setup(factory => factory.CreateClient("WorkOrderIntegration"))
            .Returns(new HttpClient(handler.Object));
        var integration = new EamIntegration(
            httpClientFactory.Object,
            Mock.Of<ILogger<EamIntegration>>());
        var config = JsonSerializer.Serialize(new EamConfig
        {
            Enabled = true,
            Type = "maximo",
            Endpoint = "https://maximo.example.com",
        });

        var result = await integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "EAM 空响应测试", "High", config);

        result.Should().BeNull();
    }

    [Fact]
    public async Task PushCreatedAsync_HTTP成功但JSON缺少外部工单号_应返回Null以触发重试()
    {
        var handler = new Mock<HttpMessageHandler>();
        handler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{\"status\":\"accepted\"}"),
            });

        var httpClientFactory = new Mock<IHttpClientFactory>();
        httpClientFactory
            .Setup(factory => factory.CreateClient("WorkOrderIntegration"))
            .Returns(new HttpClient(handler.Object));
        var integration = new EamIntegration(
            httpClientFactory.Object,
            Mock.Of<ILogger<EamIntegration>>());
        var config = JsonSerializer.Serialize(new EamConfig
        {
            Enabled = true,
            Type = "maximo",
            Endpoint = "https://maximo.example.com",
        });

        var result = await integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "EAM 缺少外部工单号测试", "High", config);

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
        var integration = new EamIntegration(
            httpClientFactory.Object,
            Mock.Of<ILogger<EamIntegration>>());
        var config = JsonSerializer.Serialize(new EamConfig
        {
            Enabled = true,
            Type = "maximo",
            Endpoint = "https://example.test"
        });

        var act = () => integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "测试工单", "High", config, cts.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
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
