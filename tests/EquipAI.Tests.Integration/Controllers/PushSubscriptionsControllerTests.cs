using System.Net;
using System.Net.Http.Json;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Application.Notifications.DTOs;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 推送订阅管理控制器集成测试
/// 覆盖 VAPID 公钥获取、订阅注册和注销
/// 使用共享测试集合确保 WebApplicationFactory 单例
/// </summary>
[Collection("SharedFactory")]
public class PushSubscriptionsControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public PushSubscriptionsControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    /// <summary>
    /// 获取已认证的 HttpClient（使用 admin 账户登录获取 JWT 令牌）
    /// </summary>
    private async Task<HttpClient> GetAuthenticatedClientAsync()
    {
        var client = await _factory.CreateClientWithSeedAsync();

        var loginResponse = await client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest { Username = "admin", Password = "Admin@123" });
        loginResponse.EnsureSuccessStatusCode();

        var loginData = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();
        loginData.Should().NotBeNull();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", loginData!.AccessToken);

        return client;
    }

    /// <summary>
    /// 验证：GET /api/v1/push/vapid-public-key 无需认证
    /// 该接口标记了 AllowAnonymous，返回 VAPID 公钥或错误状态码（未配置时）
    /// </summary>
    [Fact]
    public async Task GetVapidPublicKey_WithoutAuth_ReturnsExpectedStatus()
    {
        var client = await _factory.CreateClientWithSeedAsync();

        var response = await client.GetAsync("/api/v1/push/vapid-public-key");

        // 200（已配置）、503（未配置）或 409（配置冲突）
        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.OK,
            HttpStatusCode.ServiceUnavailable,
            HttpStatusCode.Conflict);
    }

    /// <summary>
    /// 验证：POST /api/v1/push/subscribe 未认证请求返回 401 Unauthorized
    /// </summary>
    [Fact]
    public async Task Subscribe_WithoutAuth_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();

        var request = new RegisterPushSubscriptionRequest
        {
            Endpoint = "https://push.example.com/subscribe/123",
            P256dh = "test-key",
            Auth = "test-auth"
        };

        var response = await client.PostAsJsonAsync("/api/v1/push/subscribe", request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    /// <summary>
    /// 验证：认证后 POST /api/v1/push/subscribe 注册推送订阅
    /// 测试环境可能未配置 VAPID 密钥，因此接受多种状态码
    /// </summary>
    [Fact]
    public async Task Subscribe_WithAuth_ReturnsExpectedStatus()
    {
        var client = await GetAuthenticatedClientAsync();

        var request = new RegisterPushSubscriptionRequest
        {
            Endpoint = "https://push.example.com/subscribe/456",
            P256dh = "BG3xJhIYqZ2ZcGFLbMOYp-NCnVGNaE8prMpodSQJKLU",
            Auth = "dGhpcyBpcyBhIHRlc3Q"
        };

        var response = await client.PostAsJsonAsync("/api/v1/push/subscribe", request);

        // 200（成功）或 409（VAPID 未配置/冲突）
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Conflict);
    }

    /// <summary>
    /// 验证：DELETE /api/v1/push/subscribe 未认证请求返回 401 Unauthorized
    /// HttpClient 没有内置 DeleteAsJsonAsync，使用 HttpRequestMessage 手动构造
    /// </summary>
    [Fact]
    public async Task Unsubscribe_WithoutAuth_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();

        var request = new HttpRequestMessage(HttpMethod.Delete, "/api/v1/push/subscribe")
        {
            Content = JsonContent.Create(new { endpoint = "https://push.example.com/subscribe/123" })
        };

        var response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
