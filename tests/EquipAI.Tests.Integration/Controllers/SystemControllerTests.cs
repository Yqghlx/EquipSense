using System.Net;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 系统信息控制器集成测试
/// 验证系统版本、环境信息等公开接口（AllowAnonymous）
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
    /// 验证：GET /api/v1/system/info 无需认证，返回 200 和系统版本信息
    /// 该接口标记了 AllowAnonymous，应包含 version、environment 等字段
    /// </summary>
    [Fact]
    public async Task GetInfo_WithoutAuth_Returns200WithSystemInfo()
    {
        var client = await _factory.CreateClientWithSeedAsync();

        var response = await client.GetAsync("/api/v1/system/info");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();

        // 验证响应包含版本号和运行时信息
        content.Should().Contain("version");
        content.Should().Contain("runtime");
        content.Should().Contain(".NET");
    }

    /// <summary>
    /// 验证：GET /api/v1/system/info 返回的 environment 字段在测试环境中为 "Testing"
    /// </summary>
    [Fact]
    public async Task GetInfo_InTestingEnvironment_ReturnsTestingEnv()
    {
        var client = await _factory.CreateClientWithSeedAsync();

        var response = await client.GetAsync("/api/v1/system/info");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Testing");
    }
}
