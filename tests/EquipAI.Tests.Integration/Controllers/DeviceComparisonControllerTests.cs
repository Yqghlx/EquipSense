using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using EquipAI.Application.Analysis;
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

    [Fact]
    public async Task CompareDevices_仅传1个DeviceId_Returns400()
    {
        var client = await GetAuthenticatedClientAsync();
        var deviceId = Guid.NewGuid();

        var response = await client.GetAsync(
            $"/api/v1/device-comparison?deviceType=电机&metric=temperature&deviceIds={deviceId}");

        await AssertSafeDeviceIdsErrorAsync(response, ["2 到 5"], deviceId.ToString());
    }

    [Fact]
    public async Task CompareDevices_传入6个DeviceIds_Returns400()
    {
        var client = await GetAuthenticatedClientAsync();
        var deviceIds = Enumerable.Range(0, 6).Select(_ => Guid.NewGuid()).ToArray();
        var query = string.Join("&", deviceIds.Select(deviceId => $"deviceIds={deviceId}"));

        var response = await client.GetAsync(
            $"/api/v1/device-comparison?deviceType=电机&metric=temperature&{query}");

        await AssertSafeDeviceIdsErrorAsync(response, ["2 到 5"], deviceIds.Select(deviceId => deviceId.ToString()).ToArray());
    }

    [Fact]
    public async Task CompareDevices_DeviceIds包含非法Guid_Returns400()
    {
        var client = await GetAuthenticatedClientAsync();
        var validDeviceId = Guid.NewGuid();

        var response = await client.GetAsync(
            $"/api/v1/device-comparison?deviceType=电机&metric=temperature&deviceIds=not-a-guid&deviceIds={validDeviceId}");

        await AssertSafeDeviceIdsErrorAsync(
            response,
            ["有效 GUID", "2 到 5"],
            "not-a-guid",
            validDeviceId.ToString());
    }

    /// <summary>空数组查询值应返回统一的数量边界错误，而不是进入默认模型绑定文案。</summary>
    [Fact]
    public async Task CompareDevices_DeviceIds为空数组_Returns400并说明数量范围()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync(
            "/api/v1/device-comparison?deviceType=电机&metric=temperature&deviceIds=");

        await AssertSafeDeviceIdsErrorAsync(response, ["2 到 5"]);
    }

    /// <summary>重复参数去重后为两台设备时应允许请求。</summary>
    [Fact]
    public async Task CompareDevices_重复DeviceIds去重后为两台_Returns200()
    {
        var client = await GetAuthenticatedClientAsync();
        var firstDeviceId = Guid.NewGuid();
        var secondDeviceId = Guid.NewGuid();

        var response = await client.GetAsync(
            $"/api/v1/device-comparison?deviceType=电机&metric=temperature" +
            $"&deviceIds={firstDeviceId}&deviceIds={firstDeviceId}&deviceIds={secondDeviceId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<DeviceComparisonResult>();
        result.Should().NotBeNull();
        result!.Message.Should().Be("同类设备不足 2 台，无法对比");
    }

    /// <summary>重复参数去重后不足两台时应返回数量范围错误。</summary>
    [Fact]
    public async Task CompareDevices_重复DeviceIds去重后不足两台_Returns400()
    {
        var client = await GetAuthenticatedClientAsync();
        var deviceId = Guid.NewGuid();

        var response = await client.GetAsync(
            $"/api/v1/device-comparison?deviceType=电机&metric=temperature" +
            $"&deviceIds={deviceId}&deviceIds={deviceId}");

        await AssertSafeDeviceIdsErrorAsync(response, ["2 到 5"], deviceId.ToString());
    }

    /// <summary>空 GUID 应返回明确的安全错误，不使用“不能为空”这种歧义文案。</summary>
    [Fact]
    public async Task CompareDevices_DeviceIds包含空Guid_Returns400并说明空Guid()
    {
        var client = await GetAuthenticatedClientAsync();
        var validDeviceId = Guid.NewGuid();

        var response = await client.GetAsync(
            $"/api/v1/device-comparison?deviceType=电机&metric=temperature" +
            $"&deviceIds={Guid.Empty}&deviceIds={validDeviceId}");

        await AssertSafeDeviceIdsErrorAsync(
            response,
            ["空 GUID", "2 到 5"],
            Guid.Empty.ToString(),
            validDeviceId.ToString());
    }

    private static async Task AssertSafeDeviceIdsErrorAsync(
        HttpResponseMessage response,
        IReadOnlyCollection<string> expectedTerms,
        params string[] forbiddenTerms)
    {
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadAsStringAsync();
        using var payload = JsonDocument.Parse(body);

        payload.RootElement.EnumerateObject().Select(property => property.Name)
            .Should()
            .BeEquivalentTo(["code", "message"], "设备筛选错误只返回统一错误字段");
        payload.RootElement.GetProperty("code").GetInt32().Should().Be(400);
        var message = payload.RootElement.GetProperty("message").GetString();
        message.Should().NotBeNull();
        message.Should().Contain("deviceIds");
        message.Should().ContainAll(expectedTerms);
        message.Should().NotContain("tenantId");
        message.Should().NotContain("不存在");

        foreach (var forbiddenTerm in forbiddenTerms)
        {
            body.Should().NotContain(forbiddenTerm, "错误响应不应回显请求值或设备存在性信息");
        }
    }
}
