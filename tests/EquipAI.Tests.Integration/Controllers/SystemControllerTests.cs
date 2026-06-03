using System.Net;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Infrastructure.Identity;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 系统信息控制器集成测试
/// 验证系统版本接口需要认证，返回版本号和运行时间
/// 使用共享测试集合确保 WebApplicationFactory 单例
/// </summary>
[Collection("SharedFactory")]
public class SystemControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public SystemControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    /// <summary>
    /// 创建已认证的 HttpClient（使用 admin 种子用户的 JWT）
    /// </summary>
    private async Task<HttpClient> CreateAuthenticatedClientAsync()
    {
        var client = await _factory.CreateClientWithSeedAsync();

        using var scope = _factory.Services.CreateScope();
        var jwtService = scope.ServiceProvider.GetRequiredService<JwtTokenService>();

        var defaultTenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var adminUserId = Guid.Parse("00000000-0000-0000-0000-000000000001");

        var user = new User
        {
            Id = adminUserId,
            TenantId = defaultTenantId,
            Role = UserRole.SystemAdmin,
            Username = "admin",
            TokenVersion = 0
        };

        var token = jwtService.GenerateAccessToken(user);
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        return client;
    }

    /// <summary>
    /// 验证：GET /api/v1/system/info 未认证时返回 401
    /// </summary>
    [Fact]
    public async Task GetInfo_WithoutAuth_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();

        var response = await client.GetAsync("/api/v1/system/info");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    /// <summary>
    /// 验证：GET /api/v1/system/info 认证后返回 200 和系统版本信息
    /// </summary>
    [Fact]
    public async Task GetInfo_WithAuth_Returns200WithSystemInfo()
    {
        var client = await CreateAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/system/info");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();
        content.Should().Contain("version");
        content.Should().Contain("environment");
        // 不应包含指纹信息（runtime、machineName 等）
        content.Should().NotContain("machineName");
    }

    /// <summary>
    /// 验证：GET /api/v1/system/info 返回的 environment 字段在测试环境中为 "Testing"
    /// </summary>
    [Fact]
    public async Task GetInfo_InTestingEnvironment_ReturnsTestingEnv()
    {
        var client = await CreateAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/system/info");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Testing");
    }
}
