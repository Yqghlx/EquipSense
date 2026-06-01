using System.Net;
using System.Net.Http.Json;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 认证控制器集成测试，验证登录接口在各种输入条件下的行为
/// 使用 WebApplicationFactory 启动完整的应用管线，包括中间件、DI 和数据库
/// 使用共享测试集合确保 WebApplicationFactory 单例
/// </summary>
[Collection("SharedFactory")]
public class AuthControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public AuthControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    /// <summary>
    /// 验证：使用正确的用户名和密码登录，应返回 200 和有效的 JWT 令牌
    /// </summary>
    [Fact]
    public async Task Login_WithValidCredentials_ReturnsTokens()
    {
        var client = await _factory.CreateClientWithSeedAsync();
        var request = new LoginRequest { Username = "admin", Password = "Admin@123" };

        var response = await client.PostAsJsonAsync("/api/v1/auth/login", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<AuthResponse>();
        result.Should().NotBeNull();
        result!.AccessToken.Should().NotBeEmpty();
        result.RefreshToken.Should().NotBeEmpty();
        result.UserInfo.Username.Should().Be("admin");
    }

    /// <summary>
    /// 验证：使用正确用户名但错误密码登录，应返回 401 Unauthorized
    /// </summary>
    [Fact]
    public async Task Login_WithInvalidCredentials_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();
        var request = new LoginRequest { Username = "admin", Password = "wrong-password" };

        var response = await client.PostAsJsonAsync("/api/v1/auth/login", request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    /// <summary>
    /// 验证：使用不存在的用户名登录，应返回 401 Unauthorized
    /// </summary>
    [Fact]
    public async Task Login_WithNonexistentUser_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();
        var request = new LoginRequest { Username = "nonexistent", Password = "password" };

        var response = await client.PostAsJsonAsync("/api/v1/auth/login", request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
