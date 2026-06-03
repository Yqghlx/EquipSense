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

public class DingTalkIntegrationTests
{
    /// <summary>
    /// 通过反射注入 Mock HttpMessageHandler，创建可拦截 HTTP 请求的 DingTalkIntegration 实例
    /// </summary>
    private static (DingTalkIntegration integration, Mock<HttpMessageHandler> handler)
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
                Content = new StringContent("{\"errcode\":0,\"errmsg\":\"ok\"}")
            });

        var httpClient = new HttpClient(handler.Object) { Timeout = TimeSpan.FromSeconds(10) };
        var httpClientFactory = new Mock<IHttpClientFactory>();
        httpClientFactory.Setup(f => f.CreateClient("WorkOrderIntegration")).Returns(httpClient);

        var logger = new Mock<ILogger<DingTalkIntegration>>();
        var integration = new DingTalkIntegration(httpClientFactory.Object, logger.Object);

        requestCapture = () => capturedRequest;
        return (integration, handler);
    }

    /// <summary>
    /// 从捕获的请求中解析 JSON body
    /// </summary>
    private static async Task<JsonElement> ParseBodyAsync(HttpRequestMessage? request)
    {
        request.Should().NotBeNull();
        var body = await request!.Content!.ReadAsStringAsync();
        return JsonSerializer.Deserialize<JsonElement>(body);
    }

    [Fact]
    public void IntegrationType_应返回_dingtalk()
    {
        var logger = new Mock<ILogger<DingTalkIntegration>>();
        var integration = new DingTalkIntegration(new Mock<IHttpClientFactory>().Object, logger.Object);
        integration.IntegrationType.Should().Be("dingtalk");
    }

    [Fact]
    public async Task PushCreatedAsync_无效配置应返回Null()
    {
        var logger = new Mock<ILogger<DingTalkIntegration>>();
        var integration = new DingTalkIntegration(new Mock<IHttpClientFactory>().Object, logger.Object);

        var result = await integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "测试", "High", "{}");

        result.Should().BeNull();
    }

    [Fact]
    public async Task PushCreatedAsync_空WebhookUrl应返回Null()
    {
        var logger = new Mock<ILogger<DingTalkIntegration>>();
        var integration = new DingTalkIntegration(new Mock<IHttpClientFactory>().Object, logger.Object);

        var config = JsonSerializer.Serialize(new DingTalkConfig { WebhookUrl = "" });
        var result = await integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "测试", "High", config);

        result.Should().BeNull();
    }

    [Fact]
    public async Task PushStatusChangedAsync_应不抛出异常()
    {
        var logger = new Mock<ILogger<DingTalkIntegration>>();
        var integration = new DingTalkIntegration(new Mock<IHttpClientFactory>().Object, logger.Object);

        var config = JsonSerializer.Serialize(new DingTalkConfig
        {
            WebhookUrl = "https://invalid.local/webhook"
        });

        var act = () => integration.PushStatusChangedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "InProgress", null, config);
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task PushCreatedAsync_应发送ActionCard格式消息()
    {
        // Arrange
        var (integration, _) = CreateWithMockHttp(out var capture);
        var workOrderId = Guid.NewGuid();
        var config = JsonSerializer.Serialize(new DingTalkConfig
        {
            WebhookUrl = "https://oapi.dingtalk.com/robot/send?access_token=test123",
            BaseUrl = "https://equip.example.com"
        });

        // Act
        await integration.PushCreatedAsync(Guid.NewGuid(), workOrderId, "泵站异常", "High", config);

        // Assert
        var bodyJson = await ParseBodyAsync(capture());

        // 验证 msgtype 为 actionCard
        bodyJson.GetProperty("msgtype").GetString().Should().Be("actionCard");

        // 验证 ActionCard 标题包含"新工单"
        var actionCard = bodyJson.GetProperty("actionCard");
        actionCard.GetProperty("title").GetString().Should().Contain("新工单");

        // 验证正文包含关键信息
        var text = actionCard.GetProperty("text").GetString()!;
        text.Should().Contain("泵站异常");
        text.Should().Contain("High");
        text.Should().Contain(workOrderId.ToString());

        // 验证按钮包含查看详情链接
        var btns = actionCard.GetProperty("btns");
        btns.GetArrayLength().Should().Be(1);
        btns[0].GetProperty("title").GetString().Should().Be("查看详情");
        btns[0].GetProperty("actionURL").GetString().Should()
            .Be($"https://equip.example.com/work-orders/{workOrderId}");
    }

    [Fact]
    public async Task PushCreatedAsync_BaseUrl未配置不应包含按钮()
    {
        // Arrange
        var (integration, _) = CreateWithMockHttp(out var capture);
        var workOrderId = Guid.NewGuid();

        // Act — 不配置 BaseUrl
        await integration.PushCreatedAsync(
            Guid.NewGuid(), workOrderId, "测试工单", "Medium",
            JsonSerializer.Serialize(new DingTalkConfig
            {
                WebhookUrl = "https://oapi.dingtalk.com/robot/send?access_token=test123"
            }));

        // Assert — btns 应为 null
        var bodyJson = await ParseBodyAsync(capture());
        var actionCard = bodyJson.GetProperty("actionCard");
        var btnsProperty = actionCard.GetProperty("btns");
        btnsProperty.ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task PushStatusChangedAsync_应包含状态变更信息()
    {
        // Arrange
        var (integration, _) = CreateWithMockHttp(out var capture);
        var workOrderId = Guid.NewGuid();
        var config = JsonSerializer.Serialize(new DingTalkConfig
        {
            WebhookUrl = "https://oapi.dingtalk.com/robot/send?access_token=test123",
            BaseUrl = "https://equip.example.com"
        });

        // Act
        await integration.PushStatusChangedAsync(
            Guid.NewGuid(), workOrderId, "InProgress", null, config);

        // Assert
        var bodyJson = await ParseBodyAsync(capture());
        bodyJson.GetProperty("msgtype").GetString().Should().Be("actionCard");

        var actionCard = bodyJson.GetProperty("actionCard");
        actionCard.GetProperty("title").GetString().Should().Contain("工单状态变更");

        var text = actionCard.GetProperty("text").GetString()!;
        text.Should().Contain("执行中");
        text.Should().Contain(workOrderId.ToString());

        // 状态变更也应包含查看详情按钮
        var btns = actionCard.GetProperty("btns");
        btns.GetArrayLength().Should().Be(1);
        btns[0].GetProperty("actionURL").GetString().Should()
            .Contain(workOrderId.ToString());
    }

    [Fact]
    public async Task PushCreatedAsync_应正确签名HmacSHA256()
    {
        // Arrange
        var (integration, _) = CreateWithMockHttp(out var capture);
        var secret = "test_secret_key";
        var webhookUrl = "https://oapi.dingtalk.com/robot/send?access_token=test123";
        var config = JsonSerializer.Serialize(new DingTalkConfig
        {
            WebhookUrl = webhookUrl,
            Secret = secret
        });

        // Act
        await integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "签名测试", "Low", config);

        // Assert — 验证请求 URL 包含签名参数
        var requestUrl = capture()!.RequestUri!;
        var query = requestUrl.Query;
        query.Should().Contain("timestamp=");
        query.Should().Contain("sign=");

        // 从 URL 中提取 timestamp 和 sign
        var queryParts = query.TrimStart('?').Split('&');
        var timestampValue = queryParts.First(p => p.StartsWith("timestamp="))[10..];
        var signValue = Uri.UnescapeDataString(queryParts.First(p => p.StartsWith("sign="))[5..]);

        // 使用相同算法验证签名
        var timestamp = long.Parse(timestampValue);
        var stringToSign = $"{timestamp}\n{secret}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var signBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(stringToSign));
        var expectedSign = Convert.ToBase64String(signBytes);

        signValue.Should().Be(expectedSign);
    }
}
