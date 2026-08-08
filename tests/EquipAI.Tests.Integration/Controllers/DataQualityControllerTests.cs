using System.Net;
using System.Net.Http.Json;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 数据质量控制器集成测试
/// 覆盖设备数据质量评分查询、概览、参数校验、认证拦截
/// </summary>
[Collection("SharedFactory")]
public class DataQualityControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public DataQualityControllerTests(CustomWebApplicationFactory factory)
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
    public async Task GetQualityScore_WithoutAuth_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();
        var response = await client.GetAsync($"/api/v1/data-quality/{Guid.NewGuid()}?metric=temperature");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetQualityScore_MissingMetric_Returns400()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync($"/api/v1/data-quality/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest,
            "必须指定 metric 参数，缺失应返回 400");
    }

    [Fact]
    public async Task GetQualityOverview_WithAuth_ReturnsResult()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync($"/api/v1/data-quality/{Guid.NewGuid()}/overview");

        // 不存在的设备返回 404 或空概览，但不应 500
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
    }
}
