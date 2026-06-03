using System.Net;
using System.Net.Http.Json;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 集成配置管理控制器集成测试
/// 覆盖集成配置的查询、更新和连接测试
/// 注意：控制器类名为 IntegrationController，路由前缀为 /api/v1/settings/integrations
/// 使用共享测试集合确保 WebApplicationFactory 单例
/// </summary>
[Collection("SharedFactory")]
public class IntegrationControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public IntegrationControllerTests(CustomWebApplicationFactory factory)
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
    /// 验证：未认证请求 GET /api/v1/settings/integrations 应返回 401 Unauthorized
    /// </summary>
    [Fact]
    public async Task GetIntegrations_WithoutAuth_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();

        var response = await client.GetAsync("/api/v1/settings/integrations");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    /// <summary>
    /// 验证：认证后 GET /api/v1/settings/integrations 返回当前租户的集成配置
    /// </summary>
    [Fact]
    public async Task GetIntegrations_WithAuth_ReturnsConfig()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/settings/integrations");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();
    }

    /// <summary>
    /// 验证：PUT /api/v1/settings/integrations/{type} 更新集成配置
    /// 更新 webhook 集成类型，设置为启用
    /// </summary>
    [Fact]
    public async Task UpdateIntegration_WithValidType_Returns200()
    {
        var client = await GetAuthenticatedClientAsync();

        var request = new
        {
            enabled = true,
            config = "{\"url\":\"https://example.com/webhook\"}"
        };

        var response = await client.PutAsJsonAsync("/api/v1/settings/integrations/webhook", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("webhook");
    }

    /// <summary>
    /// 验证：PUT /api/v1/settings/integrations/{type} 使用不支持的类型返回 400
    /// </summary>
    [Fact]
    public async Task UpdateIntegration_WithUnsupportedType_Returns400()
    {
        var client = await GetAuthenticatedClientAsync();

        var request = new
        {
            enabled = true,
            config = "{}"
        };

        var response = await client.PutAsJsonAsync("/api/v1/settings/integrations/unsupported_type", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    /// <summary>
    /// 验证：POST /api/v1/settings/integrations/{type}/test 测试集成连接
    /// 对 webhook 类型进行连接测试
    /// </summary>
    [Fact]
    public async Task TestIntegration_WithWebhookType_ReturnsResult()
    {
        var client = await GetAuthenticatedClientAsync();

        // 先更新配置
        var updateRequest = new
        {
            enabled = true,
            config = "{\"url\":\"https://httpbin.org/post\"}"
        };
        await client.PutAsJsonAsync("/api/v1/settings/integrations/webhook", updateRequest);

        // 测试连接
        var response = await client.PostAsync("/api/v1/settings/integrations/webhook/test", null);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();
    }
}
