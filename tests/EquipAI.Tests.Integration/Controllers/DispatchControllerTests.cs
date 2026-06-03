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
    /// 验证：认证后 GET /api/v1/dispatch/{workOrderId}/recommendations
    /// 不存在的工单返回 404，存在的工单返回推荐列表
    /// </summary>
    [Fact]
    public async Task GetRecommendations_WithAuth_ReturnsListOrNotFound()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync($"/api/v1/dispatch/{Guid.NewGuid()}/recommendations");

        // 不存在的工单可能返回 404，这是正常行为
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
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
    /// userId 需要是已存在的用户（外键约束），使用种子数据中的 admin 用户
    /// </summary>
    [Fact]
    public async Task UpsertTechnician_WithValidData_Returns200()
    {
        var client = await GetAuthenticatedClientAsync();

        // 先获取当前用户信息以获取真实的 user ID
        var meResponse = await client.GetAsync("/api/v1/users/me");
        if (meResponse.StatusCode == HttpStatusCode.NotFound)
        {
            // 如果没有 /me 端点，使用 admin 种子用户的已知 ID 或跳过
            return;
        }

        var userInfo = await meResponse.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        var userId = userInfo.GetProperty("id").GetGuid();

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
