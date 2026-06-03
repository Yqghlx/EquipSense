using System.Net;
using System.Net.Http.Json;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Application.DTOs.Users;
using EquipAI.Core.Models;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 用户管理控制器集成测试
/// 覆盖用户列表查询、用户详情查询和认证拦截
/// 注意：UsersController 路由前缀为 /api/v1/admin/users
/// 使用共享测试集合确保 WebApplicationFactory 单例
/// </summary>
[Collection("SharedFactory")]
public class UsersControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public UsersControllerTests(CustomWebApplicationFactory factory)
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
    /// 验证：未认证请求 GET /api/v1/admin/users 应返回 401 Unauthorized
    /// </summary>
    [Fact]
    public async Task GetUsers_WithoutAuth_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();

        var response = await client.GetAsync("/api/v1/admin/users");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    /// <summary>
    /// 验证：认证后 GET /api/v1/admin/users 返回分页用户列表
    /// 种子数据包含一个 admin 用户，列表中至少有一条记录
    /// </summary>
    [Fact]
    public async Task GetUsers_WithAuth_ReturnsPagedUserList()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/admin/users?page=1&pageSize=10");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<UserDto>>();
        result.Should().NotBeNull();
        result!.Items.Should().NotBeNull();
        result.Page.Should().Be(1);
        result.PageSize.Should().Be(10);
    }

    /// <summary>
    /// 验证：GET /api/v1/admin/users 返回的用户列表中包含种子数据的 admin 用户
    /// </summary>
    [Fact]
    public async Task GetUsers_ContainsSeededAdmin()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/admin/users?page=1&pageSize=20");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<UserDto>>();
        result.Should().NotBeNull();
        result!.Items.Should().ContainSingle(u => u.Username == "admin");
    }

    /// <summary>
    /// 验证：GET /api/v1/admin/users/{id} 查询不存在的用户返回 404
    /// </summary>
    [Fact]
    public async Task GetUser_WithNonexistentId_Returns404()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync($"/api/v1/admin/users/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    /// <summary>
    /// 验证：POST /api/v1/admin/users 创建新用户并返回 201 Created
    /// </summary>
    [Fact]
    public async Task CreateUser_WithValidData_Returns201()
    {
        var client = await GetAuthenticatedClientAsync();

        var request = new CreateUserRequest
        {
            Username = $"testuser-{Guid.NewGuid():N}".Substring(0, 20),
            Password = "Test@123456",
            DisplayName = "测试用户",
            Role = "Technician",
            Email = "test@example.com"
        };

        var response = await client.PostAsJsonAsync("/api/v1/admin/users", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var user = await response.Content.ReadFromJsonAsync<UserDto>();
        user.Should().NotBeNull();
        user!.Username.Should().Be(request.Username);
        user.DisplayName.Should().Be("测试用户");
        user.Id.Should().NotBe(Guid.Empty);
    }

    /// <summary>
    /// 验证：创建用户后可通过 ID 获取用户详情
    /// </summary>
    [Fact]
    public async Task GetUser_AfterCreate_ReturnsUser()
    {
        var client = await GetAuthenticatedClientAsync();

        // 先创建用户
        var createRequest = new CreateUserRequest
        {
            Username = $"queryuser-{Guid.NewGuid():N}".Substring(0, 20),
            Password = "Test@123456",
            DisplayName = "查询测试用户",
            Role = "Viewer"
        };
        var createResponse = await client.PostAsJsonAsync("/api/v1/admin/users", createRequest);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await createResponse.Content.ReadFromJsonAsync<UserDto>();

        // 查询用户详情
        var getResponse = await client.GetAsync($"/api/v1/admin/users/{created!.Id}");

        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var user = await getResponse.Content.ReadFromJsonAsync<UserDto>();
        user.Should().NotBeNull();
        user!.Id.Should().Be(created.Id);
        user.DisplayName.Should().Be("查询测试用户");
    }
}
