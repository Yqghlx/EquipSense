using System.Net;
using System.Net.Http.Json;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 智能派工控制器集成测试
/// 覆盖技术人员推荐、技术人员画像管理
/// 使用共享测试集合确保 WebApplicationFactory 单例
/// </summary>
[Collection("SharedFactory")]
public class DispatchControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public DispatchControllerTests(CustomWebApplicationFactory factory)
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
    /// 验证：未认证请求 GET /api/v1/dispatch/{workOrderId}/recommendations 应返回 401 Unauthorized
    /// </summary>
    [Fact]
    public async Task GetRecommendations_WithoutAuth_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();

        var response = await client.GetAsync($"/api/v1/dispatch/{Guid.NewGuid()}/recommendations");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    /// <summary>
    /// 验证：认证后 GET /api/v1/dispatch/{workOrderId}/recommendations 返回推荐列表
    /// 即使工单不存在，接口也应正常返回（推荐列表可能为空）
    /// </summary>
    [Fact]
    public async Task GetRecommendations_WithAuth_ReturnsList()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync($"/api/v1/dispatch/{Guid.NewGuid()}/recommendations");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();
    }

    /// <summary>
    /// 验证：GET /api/v1/dispatch/technicians 返回技术人员列表
    /// </summary>
    [Fact]
    public async Task GetTechnicians_WithAuth_ReturnsList()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/dispatch/technicians");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();
    }

    /// <summary>
    /// 验证：PUT /api/v1/dispatch/technicians/{userId} 创建或更新技术人员画像
    /// </summary>
    [Fact]
    public async Task UpsertTechnician_WithValidData_Returns200()
    {
        var client = await GetAuthenticatedClientAsync();

        var userId = Guid.NewGuid();
        var request = new
        {
            name = "张工",
            skills = "[\"电机\",\"空压机\",\"CNC\"]",
            isAvailable = true
        };

        var response = await client.PutAsJsonAsync($"/api/v1/dispatch/technicians/{userId}", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("张工");
    }
}
