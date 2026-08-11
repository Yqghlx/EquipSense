using System.Net;
using System.Net.Http.Json;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Application.DTOs.Common;
using EquipAI.Application.DTOs.Devices;
using EquipAI.Core.Models;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 集成测试集合定义，所有控制器测试共享同一个 WebApplicationFactory
/// 解决 Serilog Logger 只能初始化一次的问题，避免并行创建多个 Host 导致冻结异常
/// </summary>
[Collection("SharedFactory")]
public class DevicesControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public DevicesControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    /// <summary>
    /// 获取已认证的 HttpClient（使用 admin 账户登录获取 JWT 令牌）
    /// 每个测试方法创建独立的 client，保证数据隔离
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
    /// 验证：未认证请求应返回 401 Unauthorized
    /// </summary>
    [Fact]
    public async Task GetDevices_WithoutAuth_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();

        var response = await client.GetAsync("/api/v1/devices");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    /// <summary>
    /// 验证：GET /api/v1/devices 返回分页列表
    /// </summary>
    [Fact]
    public async Task GetDevices_ReturnsPagedList()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/devices?page=1&pageSize=10");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<DeviceDto>>();
        result.Should().NotBeNull();
        result!.Items.Should().NotBeNull();
        result.Page.Should().Be(1);
        result.PageSize.Should().Be(10);
    }

    /// <summary>
    /// 验证：排序字段不存在时应返回 400，而不是把 EF 查询异常暴露为 500。
    /// </summary>
    [Fact]
    public async Task GetDevices_WithUnknownSort_Returns400()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync(
            "/api/v1/devices?page=1&pageSize=10&sort=field_that_does_not_exist");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    /// <summary>
    /// 验证：POST /api/v1/devices 创建新设备并返回 201 Created
    /// </summary>
    [Fact]
    public async Task CreateDevice_WithValidData_Returns201()
    {
        var client = await GetAuthenticatedClientAsync();

        var request = new CreateDeviceRequest
        {
            DeviceCode = $"DEV-NEW-{Guid.NewGuid():N}".Substring(0, 20),
            Name = "测试电机",
            Type = "电机",
            Manufacturer = "西门子",
            Model = "1LE1501",
            Criticality = "normal"
        };

        var response = await client.PostAsJsonAsync("/api/v1/devices", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var device = await response.Content.ReadFromJsonAsync<DeviceDto>();
        device.Should().NotBeNull();
        device!.DeviceCode.Should().Be(request.DeviceCode);
        device.Name.Should().Be("测试电机");
        device.Type.Should().Be("电机");
        device.Status.Should().Be("Offline"); // 新建设备默认状态为 Offline
        device.Id.Should().NotBe(Guid.Empty);
    }

    /// <summary>
    /// 验证：创建设备后，GET /api/v1/devices/{id} 能查询到该设备详情
    /// </summary>
    [Fact]
    public async Task GetDeviceById_AfterCreate_ReturnsDevice()
    {
        var client = await GetAuthenticatedClientAsync();

        // 先创建设备
        var createRequest = new CreateDeviceRequest
        {
            DeviceCode = $"DEV-GET-{Guid.NewGuid():N}".Substring(0, 20),
            Name = "测试泵",
            Type = "泵"
        };
        var createResponse = await client.PostAsJsonAsync("/api/v1/devices", createRequest);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await createResponse.Content.ReadFromJsonAsync<DeviceDto>();

        // 查询设备详情
        var getResponse = await client.GetAsync($"/api/v1/devices/{created!.Id}");

        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var device = await getResponse.Content.ReadFromJsonAsync<DeviceDto>();
        device.Should().NotBeNull();
        device!.Id.Should().Be(created.Id);
        device.Name.Should().Be("测试泵");
    }

    /// <summary>
    /// 验证：GET /api/v1/devices/{id} 查询不存在的设备返回 404
    /// </summary>
    [Fact]
    public async Task GetDeviceById_WithNonexistentId_Returns404()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync($"/api/v1/devices/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    /// <summary>
    /// 验证：PUT /api/v1/devices/{id} 更新设备信息
    /// </summary>
    [Fact]
    public async Task UpdateDevice_WithValidData_ReturnsUpdatedDevice()
    {
        var client = await GetAuthenticatedClientAsync();

        // 先创建设备
        var createRequest = new CreateDeviceRequest
        {
            DeviceCode = $"DEV-UPD-{Guid.NewGuid():N}".Substring(0, 20),
            Name = "测试压缩机",
            Type = "压缩机"
        };
        var createResponse = await client.PostAsJsonAsync("/api/v1/devices", createRequest);
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<DeviceDto>();

        // 更新设备
        var updateRequest = new UpdateDeviceRequest
        {
            Name = "更新后的压缩机",
            Manufacturer = "阿特拉斯"
        };

        var updateResponse = await client.PutAsJsonAsync($"/api/v1/devices/{created!.Id}", updateRequest);

        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated = await updateResponse.Content.ReadFromJsonAsync<DeviceDto>();
        updated.Should().NotBeNull();
        updated!.Name.Should().Be("更新后的压缩机");
        updated.Manufacturer.Should().Be("阿特拉斯");
    }

    /// <summary>
    /// 验证：DELETE /api/v1/devices/{id} 删除设备后返回 204 No Content
    /// </summary>
    [Fact]
    public async Task DeleteDevice_WithExistingId_Returns204()
    {
        var client = await GetAuthenticatedClientAsync();

        // 先创建设备
        var createRequest = new CreateDeviceRequest
        {
            DeviceCode = $"DEV-DEL-{Guid.NewGuid():N}".Substring(0, 20),
            Name = "待删除设备",
            Type = "电机"
        };
        var createResponse = await client.PostAsJsonAsync("/api/v1/devices", createRequest);
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<DeviceDto>();

        // 删除设备
        var deleteResponse = await client.DeleteAsync($"/api/v1/devices/{created!.Id}");

        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // 验证删除后再查询返回 404
        var getResponse = await client.GetAsync($"/api/v1/devices/{created.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    /// <summary>
    /// 验证：创建重复设备编码应返回 409 Conflict（租户内唯一性校验）
    /// </summary>
    [Fact]
    public async Task CreateDevice_WithDuplicateCode_Returns409()
    {
        var client = await GetAuthenticatedClientAsync();

        var deviceCode = $"DEV-DUP-{Guid.NewGuid():N}".Substring(0, 20);
        var request = new CreateDeviceRequest
        {
            DeviceCode = deviceCode,
            Name = "第一台设备",
            Type = "电机"
        };

        // 第一次创建应成功
        var firstResponse = await client.PostAsJsonAsync("/api/v1/devices", request);
        firstResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        // 第二次创建相同编码应返回 409 Conflict（InvalidOperationException）
        var secondResponse = await client.PostAsJsonAsync("/api/v1/devices", request);
        secondResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    /// <summary>
    /// 验证：按设备类型筛选返回正确结果
    /// </summary>
    [Fact]
    public async Task GetDevices_FilterByType_ReturnsFilteredResults()
    {
        var client = await GetAuthenticatedClientAsync();

        // 创建两种不同类型的设备
        await client.PostAsJsonAsync("/api/v1/devices", new CreateDeviceRequest
        {
            DeviceCode = $"DEV-FT1-{Guid.NewGuid():N}".Substring(0, 20),
            Name = "筛选测试电机",
            Type = "电机"
        });
        await client.PostAsJsonAsync("/api/v1/devices", new CreateDeviceRequest
        {
            DeviceCode = $"DEV-FT2-{Guid.NewGuid():N}".Substring(0, 20),
            Name = "筛选测试泵",
            Type = "泵"
        });

        // 按类型筛选
        var response = await client.GetAsync("/api/v1/devices?type=电机&page=1&pageSize=20");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<DeviceDto>>();
        result.Should().NotBeNull();
        result!.Items.Should().NotBeEmpty();
        result.Items.Should().OnlyContain(d => d.Type == "电机");
    }
}
