using System.Net;
using System.Net.Http.Json;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 网关配置控制器集成测试
/// 覆盖网关设备配置列表查询、状态代理、认证拦截、AuthKey 校验
/// </summary>
[Collection("SharedFactory")]
public class GatewayConfigControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public GatewayConfigControllerTests(CustomWebApplicationFactory factory)
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
    public async Task GetGatewayDevices_WithoutAuth_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();
        var response = await client.GetAsync("/api/v1/gateway/devices");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetGatewayDevices_WithAuth_ReturnsList()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/gateway/devices");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task PullConfig_WithoutAuthKey_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();

        var response = await client.GetAsync($"/api/v1/gateway/config?gatewayId=gateway-001&tenantId={Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task PullConfig_MissingTenantId_Returns400()
    {
        var client = await _factory.CreateClientWithSeedAsync();
        var authKey = _factory.Services.GetRequiredService<IConfiguration>()["Gateway:AuthKey"];
        if (!string.IsNullOrEmpty(authKey))
            client.DefaultRequestHeaders.Add("X-Gateway-Auth-Key", authKey);

        // 缺 tenantId → 400（防跨租户泄漏，强制携带租户标识）
        var response = await client.GetAsync("/api/v1/gateway/config?gatewayId=gateway-001");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task PullConfig_WithAuthKeyAndTenantId_ReturnsDeviceList()
    {
        var client = await _factory.CreateClientWithSeedAsync();
        var authKey = _factory.Services.GetRequiredService<IConfiguration>()["Gateway:AuthKey"];
        if (!string.IsNullOrEmpty(authKey))
            client.DefaultRequestHeaders.Add("X-Gateway-Auth-Key", authKey);

        var response = await client.GetAsync($"/api/v1/gateway/config?gatewayId=gateway-001&tenantId={Guid.NewGuid()}");

        // 无设备配置时返回空列表 200；有则返回配置列表
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
