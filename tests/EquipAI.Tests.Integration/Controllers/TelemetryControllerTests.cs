using System.Net;
using System.Net.Http.Json;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Application.DTOs.Devices;
using EquipAI.Application.Telemetry.DTOs;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 遥测数据控制器集成测试
/// 覆盖遥测数据上报和查询接口
/// 使用共享测试集合确保 WebApplicationFactory 单例
/// </summary>
[Collection("SharedFactory")]
public class TelemetryControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public TelemetryControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    /// <summary>
    /// 获取已认证的 HttpClient（使用 admin 账户登录获取 JWT 令牌）
    /// </summary>
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

    /// <summary>
    /// 辅助方法：创建测试设备并返回其 ID（遥测上报需要关联设备）
    /// </summary>
    private async Task<Guid> CreateTestDeviceAsync(HttpClient client)
    {
        var request = new CreateDeviceRequest
        {
            DeviceCode = $"DEV-TLM-{Guid.NewGuid():N}".Substring(0, 20),
            Name = "遥测测试设备",
            Type = "空压机"
        };

        var response = await client.PostAsJsonAsync("/api/v1/devices", request);
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var device = await response.Content.ReadFromJsonAsync<DeviceDto>();
        return device!.Id;
    }

    /// <summary>
    /// 验证：未认证请求 GET /api/v1/telemetry/{deviceId} 应返回 401 Unauthorized
    /// </summary>
    [Fact]
    public async Task GetTelemetry_WithoutAuth_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();

        var response = await client.GetAsync($"/api/v1/telemetry/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    /// <summary>
    /// 验证：POST /api/v1/telemetry 上报遥测数据返回 202 Accepted
    /// </summary>
    [Fact]
    public async Task UploadTelemetry_WithValidData_Returns202()
    {
        var client = await GetAuthenticatedClientAsync();
        var deviceId = await CreateTestDeviceAsync(client);

        var request = new TelemetryUploadRequest
        {
            DeviceId = deviceId.ToString(),
            Metrics = new Dictionary<string, double>
            {
                ["temperature"] = 75.5,
                ["pressure"] = 0.8,
                ["vibration"] = 3.2
            },
            Quality = "good"
        };

        var response = await client.PostAsJsonAsync("/api/v1/telemetry", request);

        response.StatusCode.Should().Be(HttpStatusCode.Accepted);
    }

    /// <summary>
    /// 验证：JSON 明确传入 metrics=null 时应返回 400，而不是在控制器枚举字典时触发 500
    /// </summary>
    [Fact]
    public async Task UploadTelemetry_WithNullMetrics_Returns400()
    {
        var client = await GetAuthenticatedClientAsync();
        var deviceId = await CreateTestDeviceAsync(client);

        var request = new TelemetryUploadRequest
        {
            DeviceId = deviceId.ToString(),
            Metrics = null!,
        };

        var response = await client.PostAsJsonAsync("/api/v1/telemetry", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    /// <summary>
    /// 验证：GET /api/v1/telemetry/{deviceId} 查询设备遥测数据返回 200
    /// 未指定 metric 时返回所有指标的最新值
    /// </summary>
    [Fact]
    public async Task GetTelemetry_WithValidDevice_Returns200()
    {
        var client = await GetAuthenticatedClientAsync();
        var deviceId = await CreateTestDeviceAsync(client);

        // 先上报数据
        var uploadRequest = new TelemetryUploadRequest
        {
            DeviceId = deviceId.ToString(),
            Metrics = new Dictionary<string, double>
            {
                ["temperature"] = 42.0
            }
        };
        await client.PostAsJsonAsync("/api/v1/telemetry", uploadRequest);

        // 查询遥测数据
        var response = await client.GetAsync($"/api/v1/telemetry/{deviceId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    /// <summary>
    /// 验证：GET /api/v1/telemetry/{deviceId}?metric=temperature 查询指定指标历史数据返回 200
    /// </summary>
    [Fact]
    public async Task GetTelemetry_WithMetricParam_ReturnsHistoryData()
    {
        var client = await GetAuthenticatedClientAsync();
        var deviceId = await CreateTestDeviceAsync(client);

        // 先上报数据
        var uploadRequest = new TelemetryUploadRequest
        {
            DeviceId = deviceId.ToString(),
            Metrics = new Dictionary<string, double>
            {
                ["temperature"] = 55.0
            }
        };
        await client.PostAsJsonAsync("/api/v1/telemetry", uploadRequest);

        // 查询指定指标的历史数据
        var response = await client.GetAsync($"/api/v1/telemetry/{deviceId}?metric=temperature");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    /// <summary>
    /// 验证：使用不存在的设备编码上报遥测数据返回 400 Bad Request
    /// </summary>
    [Fact]
    public async Task UploadTelemetry_WithInvalidDeviceCode_Returns400()
    {
        var client = await GetAuthenticatedClientAsync();

        var request = new TelemetryUploadRequest
        {
            DeviceId = "NONEXISTENT-CODE",
            Metrics = new Dictionary<string, double>
            {
                ["temperature"] = 50.0
            }
        };

        var response = await client.PostAsJsonAsync("/api/v1/telemetry", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
