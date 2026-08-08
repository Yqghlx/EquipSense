using System.Net;
using System.Net.Http.Json;
using EquipAI.Application.Devices;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 设备配置向导控制器集成测试
/// 覆盖模板查询、快速注册（含重复编码校验）、认证拦截
/// </summary>
[Collection("SharedFactory")]
public class DeviceConfigControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public DeviceConfigControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

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

    [Fact]
    public async Task GetTemplates_WithoutAuth_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();
        var response = await client.GetAsync("/api/v1/device-config/templates");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetTemplates_WithAuth_ReturnsTemplateList()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/device-config/templates");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task QuickRegister_WithAuth_CreatesDevice()
    {
        var client = await GetAuthenticatedClientAsync();
        var code = $"QR-{Guid.NewGuid():N}".Substring(0, 16);

        var response = await client.PostAsJsonAsync("/api/v1/device-config/quick-register",
            new QuickRegisterRequest
            {
                DeviceCode = code,
                Name = "快速注册设备",
                DeviceType = "电机"
            });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task QuickRegister_DuplicateCode_Returns400()
    {
        var client = await GetAuthenticatedClientAsync();
        var code = $"DUP-{Guid.NewGuid():N}".Substring(0, 16);
        var request = new QuickRegisterRequest { DeviceCode = code, Name = "首次", DeviceType = "电机" };

        // 第一次创建成功
        var first = await client.PostAsJsonAsync("/api/v1/device-config/quick-register", request);
        first.StatusCode.Should().Be(HttpStatusCode.Created);

        // 相同编码再次注册应被拒绝
        var second = await client.PostAsJsonAsync("/api/v1/device-config/quick-register", request);
        second.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await second.Content.ReadAsStringAsync();
        body.Should().Contain("DUPLICATE_CODE");
    }
}
