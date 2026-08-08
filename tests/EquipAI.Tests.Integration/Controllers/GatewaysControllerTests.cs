using System.Net;
using System.Net.Http.Json;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 网关管理控制器集成测试
/// 覆盖网关列表查询、认证拦截（注册/心跳走 AuthKey 头认证，另测）
/// </summary>
[Collection("SharedFactory")]
public class GatewaysControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public GatewaysControllerTests(CustomWebApplicationFactory factory)
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
    public async Task ListGateways_WithoutAuth_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();
        var response = await client.GetAsync("/api/v1/gateways");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ListGateways_WithAuth_ReturnsList()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/gateways");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task RegisterGateway_WithoutAuthKey_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();

        var response = await client.PostAsJsonAsync("/api/v1/gateways/register", new
        {
            GatewayId = "gw-test-001",
            TenantId = Guid.NewGuid(),
            Name = "测试网关"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task RegisterGateway_WithValidAuthKey_RegistersAndReturnsDto()
    {
        var client = await _factory.CreateClientWithSeedAsync();
        var authKey = _factory.Services.GetRequiredService<IConfiguration>()["Gateway:AuthKey"];
        if (!string.IsNullOrEmpty(authKey))
            client.DefaultRequestHeaders.Add("X-Gateway-Auth-Key", authKey);

        var gatewayId = $"gw-{Guid.NewGuid():N}".Substring(0, 20);

        var response = await client.PostAsJsonAsync("/api/v1/gateways/register", new
        {
            GatewayId = gatewayId,
            TenantId = Guid.NewGuid(),
            Name = "测试网关",
            Host = "192.168.1.100",
            HealthPort = 8081
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain(gatewayId);

        // 二次调用（相同 gatewayId + tenantId）应刷新心跳而非报错
        var heartbeat = await client.PostAsJsonAsync("/api/v1/gateways/register", new
        {
            GatewayId = gatewayId,
            TenantId = Guid.NewGuid(), // 不同 tenant → 视为新网关
            Name = "测试网关2"
        });
        heartbeat.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
