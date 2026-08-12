using EquipAI.Application.WorkOrders.Integration;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using System.Net;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace EquipAI.Tests.Unit.WorkOrders;

public class WebhookIntegrationTests
{
    /// <summary>
    /// 通过反射注入 Mock HttpMessageHandler，创建可拦截 HTTP 请求的 WebhookIntegration 实例
    /// </summary>
    private static (WebhookIntegration integration, Mock<HttpMessageHandler> handler)
        CreateWithMockHttp(out Func<HttpRequestMessage?> requestCapture)
    {
        HttpRequestMessage? capturedRequest = null;
        var handler = new Mock<HttpMessageHandler>();
        handler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .Callback<HttpRequestMessage, CancellationToken>((req, _) =>
            {
                capturedRequest = req;
            })
            .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{\"success\":true}")
            });

        var httpClient = new HttpClient(handler.Object) { Timeout = TimeSpan.FromSeconds(10) };
        var httpClientFactory = new Mock<IHttpClientFactory>();
        httpClientFactory.Setup(f => f.CreateClient("WorkOrderIntegration")).Returns(httpClient);

        var logger = new Mock<ILogger<WebhookIntegration>>();
        var integration = new WebhookIntegration(httpClientFactory.Object, logger.Object);

        requestCapture = () => capturedRequest;
        return (integration, handler);
    }

    /// <summary>
    /// 从捕获的请求中读取 body 字符串
    /// </summary>
    private static async Task<string> ReadBodyAsync(HttpRequestMessage? request)
    {
        request.Should().NotBeNull();
        return await request!.Content!.ReadAsStringAsync();
    }

    /// <summary>
    /// 从捕获的请求中解析 JSON body
    /// </summary>
    private static async Task<JsonElement> ParseBodyAsync(HttpRequestMessage? request)
    {
        var body = await ReadBodyAsync(request);
        return JsonSerializer.Deserialize<JsonElement>(body);
    }

    /// <summary>
    /// 获取 internal static 方法 InterpolateVariables 的引用
    /// </summary>
    private static readonly MethodInfo? InterpolateMethod =
        typeof(WebhookIntegration).GetMethod("InterpolateVariables",
            BindingFlags.Static | BindingFlags.NonPublic);

    /// <summary>
    /// 获取 internal static 方法 ComputeSignature 的引用
    /// </summary>
    private static readonly MethodInfo? ComputeSignatureMethod =
        typeof(WebhookIntegration).GetMethod("ComputeSignature",
            BindingFlags.Static | BindingFlags.NonPublic);

    [Fact]
    public void IntegrationType_应返回_webhook()
    {
        var logger = new Mock<ILogger<WebhookIntegration>>();
        var integration = new WebhookIntegration(new Mock<IHttpClientFactory>().Object, logger.Object);
        integration.IntegrationType.Should().Be("webhook");
    }

    [Fact]
    public async Task PushCreatedAsync_无BodyTemplate时_应使用默认JSON()
    {
        // Arrange
        var (integration, _) = CreateWithMockHttp(out var capture);
        var tenantId = Guid.NewGuid();
        var workOrderId = Guid.NewGuid();

        var config = JsonSerializer.Serialize(new WebhookConfig
        {
            Url = "https://example.com/webhook"
        });

        // Act
        await integration.PushCreatedAsync(tenantId, workOrderId, "泵站异常", "High", config);

        // Assert — 验证默认 JSON payload 包含基本字段
        var bodyJson = await ParseBodyAsync(capture());
        bodyJson.GetProperty("workOrderId").GetGuid().Should().Be(workOrderId);
        bodyJson.GetProperty("title").GetString().Should().Be("泵站异常");
        bodyJson.GetProperty("priority").GetString().Should().Be("High");
        bodyJson.GetProperty("status").GetString().Should().Be("created");
        bodyJson.GetProperty("tenantId").GetGuid().Should().Be(tenantId);
    }

    [Fact]
    public async Task PushCreatedAsync_有BodyTemplate时_应进行变量插值()
    {
        // Arrange
        var (integration, _) = CreateWithMockHttp(out var capture);
        var tenantId = Guid.NewGuid();
        var workOrderId = Guid.NewGuid();

        var template = "{\"code\":\"{{workOrder.code}}\",\"title\":\"{{workOrder.title}}\",\"priority\":\"{{workOrder.priority}}\",\"status\":\"{{workOrder.status}}\"}";

        var config = JsonSerializer.Serialize(new WebhookConfig
        {
            Url = "https://example.com/webhook",
            BodyTemplate = template
        });

        // Act
        await integration.PushCreatedAsync(tenantId, workOrderId, "电机过热", "Medium", config);

        // Assert — 验证变量被正确替换
        var body = await ReadBodyAsync(capture());
        body.Should().Contain(workOrderId.ToString());
        body.Should().Contain("电机过热");
        body.Should().Contain("Medium");
        body.Should().Contain("created");

        // 不应包含未替换的占位符
        body.Should().NotContain("{{workOrder.code}}");
        body.Should().NotContain("{{workOrder.title}}");
        body.Should().NotContain("{{workOrder.priority}}");
        body.Should().NotContain("{{workOrder.status}}");
    }

    [Fact]
    public async Task PushCreatedAsync_有SignatureSecret时_应添加XEquipSenseSignature头()
    {
        // Arrange
        var (integration, _) = CreateWithMockHttp(out var capture);
        var secret = "my-signing-secret";
        var config = JsonSerializer.Serialize(new WebhookConfig
        {
            Url = "https://example.com/webhook",
            SignatureSecret = secret
        });

        // Act
        await integration.PushCreatedAsync(Guid.NewGuid(), Guid.NewGuid(), "签名测试", "Low", config);

        // Assert
        var request = capture();
        request.Should().NotBeNull();
        request!.Headers.Contains("X-EquipSense-Signature").Should().BeTrue();

        var signatureHeader = request.Headers.GetValues("X-EquipSense-Signature").First();
        signatureHeader.Should().StartWith("sha256=");

        // 验证签名内容正确：用相同算法重新计算
        var body = await ReadBodyAsync(request);
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var expectedHash = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(body))).ToLowerInvariant();
        var expectedSignature = $"sha256={expectedHash}";
        signatureHeader.Should().Be(expectedSignature);
    }

    [Fact]
    public async Task PushCreatedAsync_无SignatureSecret时_不应添加签名头()
    {
        // Arrange
        var (integration, _) = CreateWithMockHttp(out var capture);
        var config = JsonSerializer.Serialize(new WebhookConfig
        {
            Url = "https://example.com/webhook"
        });

        // Act
        await integration.PushCreatedAsync(Guid.NewGuid(), Guid.NewGuid(), "测试", "Low", config);

        // Assert
        var request = capture();
        request.Should().NotBeNull();
        request!.Headers.Contains("X-EquipSense-Signature").Should().BeFalse();
    }

    [Fact]
    public void VariableInterpolation_变量不存在时_应保留原始占位符()
    {
        // Arrange
        var template = "Hello {{user.name}}, your {{workOrder.unknownField}} is ready";
        var variables = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["user.name"] = "张三"
        };

        // Act
        var result = (string)InterpolateMethod!.Invoke(null, [template, variables])!;

        // Assert — 已匹配的变量被替换，未匹配的保留原始占位符
        result.Should().Contain("张三");
        result.Should().Contain("{{workOrder.unknownField}}");
    }

    [Fact]
    public void VariableInterpolation_大小写不敏感_应正确替换()
    {
        // Arrange
        var template = "{{WorkOrder.Title}} - {{WORKORDER.PRIORITY}}";
        var variables = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["workOrder.title"] = "测试工单",
            ["workOrder.priority"] = "High"
        };

        // Act
        var result = (string)InterpolateMethod!.Invoke(null, [template, variables])!;

        // Assert
        result.Should().Be("测试工单 - High");
    }

    [Fact]
    public void ComputeSignature_应生成正确的HmacSha256签名字符串()
    {
        // Arrange
        var body = "{\"test\":true}";
        var secret = "secret123";

        // Act
        var signature = (string)ComputeSignatureMethod!.Invoke(null, [body, secret])!;

        // Assert
        signature.Should().StartWith("sha256=");

        // 独立验证 HMAC-SHA256 计算
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(body));
        var expectedHex = Convert.ToHexString(hashBytes).ToLowerInvariant();
        signature.Should().Be($"sha256={expectedHex}");
    }

    [Fact]
    public async Task PushCreatedAsync_无效配置应返回Null()
    {
        var logger = new Mock<ILogger<WebhookIntegration>>();
        var integration = new WebhookIntegration(new Mock<IHttpClientFactory>().Object, logger.Object);

        var result = await integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "测试", "High", "{}");

        result.Should().BeNull();
    }

    [Fact]
    public async Task PushCreatedAsync_无效URL应不抛出异常()
    {
        var logger = new Mock<ILogger<WebhookIntegration>>();
        var integration = new WebhookIntegration(new Mock<IHttpClientFactory>().Object, logger.Object);

        var config = JsonSerializer.Serialize(new WebhookConfig
        {
            Url = "https://invalid-url-that-does-not-exist.local/hook"
        });

        var act = () => integration.PushCreatedAsync(Guid.NewGuid(), Guid.NewGuid(), "测试", "Low", config);
        await act.Should().NotThrowAsync();
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
        var integration = new WebhookIntegration(
            httpClientFactory.Object,
            Mock.Of<ILogger<WebhookIntegration>>());
        var config = JsonSerializer.Serialize(new WebhookConfig
        {
            Url = "https://example.test/webhook"
        });

        var act = () => integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "测试工单", "High", config, cts.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [Fact]
    public async Task PushCreatedAsync_Secret和SignatureSecret同时配置时_应同时添加两个头()
    {
        // Arrange
        var (integration, _) = CreateWithMockHttp(out var capture);
        var config = JsonSerializer.Serialize(new WebhookConfig
        {
            Url = "https://example.com/webhook",
            Secret = "my-webhook-secret",
            SignatureSecret = "my-signing-secret"
        });

        // Act
        await integration.PushCreatedAsync(Guid.NewGuid(), Guid.NewGuid(), "双重验证", "High", config);

        // Assert — 两种头都应存在
        var request = capture();
        request.Should().NotBeNull();
        request!.Headers.Contains("X-Webhook-Secret").Should().BeTrue();
        request.Headers.GetValues("X-Webhook-Secret").First().Should().Be("my-webhook-secret");
        request.Headers.Contains("X-EquipSense-Signature").Should().BeTrue();
        request.Headers.GetValues("X-EquipSense-Signature").First().Should().StartWith("sha256=");
    }
}
