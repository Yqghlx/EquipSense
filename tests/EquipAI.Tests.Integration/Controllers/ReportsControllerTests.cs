using System.Net;
using System.Net.Http.Json;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 报表控制器集成测试
/// 覆盖运营报表查询、当月报表、认证拦截
/// </summary>
[Collection("SharedFactory")]
public class ReportsControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public ReportsControllerTests(CustomWebApplicationFactory factory)
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
    public async Task GetOperationsReport_WithoutAuth_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();
        var response = await client.GetAsync("/api/v1/reports/operations");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetOperationsReport_WithAuth_ReturnsReport()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/reports/operations?startDate=2026-01-01&endDate=2026-12-31");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCurrentMonthReport_WithAuth_ReturnsReport()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/reports/operations/current-month");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetOperationsReport_WithInvalidDateRange_ReturnsBadRequest()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync(
            "/api/v1/reports/operations?startDate=2026-02-01&endDate=2026-01-01");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetOperationsReport_WithExcessiveDateRange_ReturnsBadRequest()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync(
            "/api/v1/reports/operations?startDate=2020-01-01&endDate=2026-01-01");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
