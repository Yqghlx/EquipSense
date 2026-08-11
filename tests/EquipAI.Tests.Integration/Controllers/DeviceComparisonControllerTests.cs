using System.Net;
using System.Net.Http.Json;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 设备对比控制器集成测试
/// 覆盖多设备指标对比查询、认证拦截
/// </summary>
[Collection("SharedFactory")]
public class DeviceComparisonControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public DeviceComparisonControllerTests(CustomWebApplicationFactory factory)
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
    public async Task CompareDevices_WithoutAuth_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();
        var response = await client.GetAsync("/api/v1/device-comparison?deviceType=电机&metric=temperature");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CompareDevices_WithAuth_ReturnsComparison()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/device-comparison?deviceType=电机&metric=temperature");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CompareDevices_MissingDeviceType_Returns400()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/device-comparison?metric=temperature");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest,
            "deviceType 和 metric 均必填，缺失应返回 400");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(8761)]
    public async Task CompareDevices_InvalidHours_Returns400(int hours)
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync(
            $"/api/v1/device-comparison?deviceType=电机&metric=temperature&hours={hours}");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest,
            "设备对比时间窗口必须限制在 1 年以内，避免无界查询");
    }
}
