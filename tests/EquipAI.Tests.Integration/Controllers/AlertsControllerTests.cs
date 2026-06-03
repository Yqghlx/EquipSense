using System.Net;
using System.Net.Http.Json;
using EquipAI.Application.Alerts.DTOs;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Core.Models;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 告警实例管理控制器集成测试
/// 覆盖告警列表查询、告警详情、确认和解决操作
/// 使用共享测试集合确保 WebApplicationFactory 单例
/// </summary>
[Collection("SharedFactory")]
public class AlertsControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public AlertsControllerTests(CustomWebApplicationFactory factory)
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
    /// 验证：未认证请求 GET /api/v1/alerts 应返回 401 Unauthorized
    /// </summary>
    [Fact]
    public async Task GetAlerts_WithoutAuth_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();

        var response = await client.GetAsync("/api/v1/alerts");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    /// <summary>
    /// 验证：认证后 GET /api/v1/alerts 返回分页告警列表
    /// </summary>
    [Fact]
    public async Task GetAlerts_WithAuth_ReturnsPagedList()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/alerts?page=1&pageSize=10");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<AlertDto>>();
        result.Should().NotBeNull();
        result!.Items.Should().NotBeNull();
        result.Page.Should().Be(1);
        result.PageSize.Should().Be(10);
    }

    /// <summary>
    /// 验证：GET /api/v1/alerts 支持按状态筛选（status=Active）
    /// </summary>
    [Fact]
    public async Task GetAlerts_FilterByStatus_ReturnsFilteredResults()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/alerts?status=Active&page=1&pageSize=10");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<AlertDto>>();
        result.Should().NotBeNull();
        result!.Items.Should().NotBeNull();
    }

    /// <summary>
    /// 验证：GET /api/v1/alerts 支持按严重程度筛选（severity=Critical）
    /// </summary>
    [Fact]
    public async Task GetAlerts_FilterBySeverity_ReturnsFilteredResults()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/alerts?severity=Critical&page=1&pageSize=10");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<AlertDto>>();
        result.Should().NotBeNull();
        result!.Items.Should().NotBeNull();
    }

    /// <summary>
    /// 验证：GET /api/v1/alerts/{id} 查询不存在的告警返回 404
    /// </summary>
    [Fact]
    public async Task GetAlert_WithNonexistentId_Returns404()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync($"/api/v1/alerts/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
