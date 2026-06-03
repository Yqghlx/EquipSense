using System.Net;
using System.Net.Http.Json;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Application.DTOs.Tenants;
using EquipAI.Core.Models;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 租户管理控制器集成测试
/// 覆盖租户列表查询、租户详情查询和用量统计
/// 注意：TenantsController 路由前缀为 /api/v1/admin/tenants，需 tenant:read 权限
/// 使用共享测试集合确保 WebApplicationFactory 单例
/// </summary>
[Collection("SharedFactory")]
public class TenantsControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public TenantsControllerTests(CustomWebApplicationFactory factory)
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
    /// 验证：未认证请求 GET /api/v1/admin/tenants 应返回 401 Unauthorized
    /// </summary>
    [Fact]
    public async Task GetTenants_WithoutAuth_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();

        var response = await client.GetAsync("/api/v1/admin/tenants");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    /// <summary>
    /// 验证：认证后 GET /api/v1/admin/tenants 返回分页租户列表
    /// 种子数据包含系统租户和默认租户
    /// </summary>
    [Fact]
    public async Task GetTenants_WithAuth_ReturnsPagedList()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/admin/tenants?page=1&pageSize=10");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<TenantDto>>();
        result.Should().NotBeNull();
        result!.Items.Should().NotBeNull();
        result.Page.Should().Be(1);
        result.PageSize.Should().Be(10);
    }

    /// <summary>
    /// 验证：GET /api/v1/admin/tenants/{id} 查询不存在的租户返回 404
    /// </summary>
    [Fact]
    public async Task GetTenant_WithNonexistentId_Returns404()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync($"/api/v1/admin/tenants/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    /// <summary>
    /// 验证：GET /api/v1/admin/tenants/stats 返回全局统计数据
    /// </summary>
    [Fact]
    public async Task GetGlobalStats_ReturnsStatsDictionary()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/admin/tenants/stats");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();
    }

    /// <summary>
    /// 验证：POST /api/v1/admin/tenants 创建新租户并返回 201 Created
    /// </summary>
    [Fact]
    public async Task CreateTenant_WithValidData_Returns201()
    {
        var client = await GetAuthenticatedClientAsync();

        var request = new CreateTenantRequest
        {
            Name = $"测试租户-{Guid.NewGuid():N}".Substring(0, 15),
            Slug = $"test-{Guid.NewGuid():N}".Substring(0, 15),
            Plan = "Trial",
            MaxDevices = 50,
            MaxUsers = 10
        };

        var response = await client.PostAsJsonAsync("/api/v1/admin/tenants", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var tenant = await response.Content.ReadFromJsonAsync<TenantDto>();
        tenant.Should().NotBeNull();
        tenant!.Name.Should().StartWith("测试租户");
        tenant.Slug.Should().StartWith("test-");
        tenant.Id.Should().NotBe(Guid.Empty);
    }
}
