using System.Net;
using System.Net.Http.Json;
using EquipAI.Application.Analysis.DTOs;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Core.Models;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// AI 分析结果控制器集成测试
/// 覆盖分析结果列表查询、详情查询和认证拦截
/// 使用共享测试集合确保 WebApplicationFactory 单例
/// </summary>
[Collection("SharedFactory")]
public class AnalysesControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public AnalysesControllerTests(CustomWebApplicationFactory factory)
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
    /// 验证：未认证请求 GET /api/v1/analyses 应返回 401 Unauthorized
    /// </summary>
    [Fact]
    public async Task GetAnalyses_WithoutAuth_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();

        var response = await client.GetAsync("/api/v1/analyses");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    /// <summary>
    /// 验证：认证后 GET /api/v1/analyses 返回分页分析结果列表
    /// </summary>
    [Fact]
    public async Task GetAnalyses_WithAuth_ReturnsPagedList()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/analyses?page=1&pageSize=10");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<AnalysisDto>>();
        result.Should().NotBeNull();
        result!.Items.Should().NotBeNull();
        result.Page.Should().Be(1);
        result.PageSize.Should().Be(10);
    }

    /// <summary>
    /// 验证：GET /api/v1/analyses 支持按设备 ID 筛选
    /// </summary>
    [Fact]
    public async Task GetAnalyses_FilterByDeviceId_ReturnsFilteredResults()
    {
        var client = await GetAuthenticatedClientAsync();

        var deviceId = Guid.NewGuid();
        var response = await client.GetAsync($"/api/v1/analyses?deviceId={deviceId}&page=1&pageSize=10");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<AnalysisDto>>();
        result.Should().NotBeNull();
        result!.Items.Should().NotBeNull();
    }

    /// <summary>
    /// 验证：GET /api/v1/analyses/{id} 查询不存在的分析记录返回 404
    /// </summary>
    [Fact]
    public async Task GetAnalysis_WithNonexistentId_Returns404()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync($"/api/v1/analyses/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
