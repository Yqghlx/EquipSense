using System.Net;
using System.Net.Http.Json;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Application.DTOs.Common;
using EquipAI.Application.DTOs.Devices;
using EquipAI.Application.WorkOrders.DTOs;
using EquipAI.Core.Models;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 工单管理控制器集成测试
/// 覆盖工单完整生命周期：创建 -> 派工 -> 开始执行 -> 完成
/// 同时验证列表查询和未认证请求的拒绝
/// 使用共享测试集合确保 WebApplicationFactory 单例
/// </summary>
[Collection("SharedFactory")]
public class WorkOrdersControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public WorkOrdersControllerTests(CustomWebApplicationFactory factory)
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
    /// 辅助方法：创建一个测试设备并返回其 ID（工单创建需要关联设备）
    /// 每次使用唯一的设备编码，避免 InMemory DB 中的唯一约束冲突
    /// </summary>
    private async Task<Guid> CreateTestDeviceAsync(HttpClient client)
    {
        var request = new CreateDeviceRequest
        {
            DeviceCode = $"DEV-WO-{Guid.NewGuid():N}".Substring(0, 20),
            Name = "工单测试设备",
            Type = "电机"
        };

        var response = await client.PostAsJsonAsync("/api/v1/devices", request);
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var device = await response.Content.ReadFromJsonAsync<DeviceDto>();
        return device!.Id;
    }

    /// <summary>
    /// 验证：未认证请求应返回 401 Unauthorized
    /// </summary>
    [Fact]
    public async Task GetWorkOrders_WithoutAuth_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();

        var response = await client.GetAsync("/api/v1/work-orders");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    /// <summary>
    /// 验证：GET /api/v1/work-orders 返回分页列表
    /// </summary>
    [Fact]
    public async Task GetWorkOrders_ReturnsPagedList()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/work-orders?page=1&pageSize=10");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<WorkOrderDto>>();
        result.Should().NotBeNull();
        result!.Items.Should().NotBeNull();
        result.Page.Should().Be(1);
        result.PageSize.Should().Be(10);
    }

    /// <summary>
    /// 验证：POST /api/v1/work-orders 创建工单并返回 201 Created
    /// 工单初始状态应为 PendingDispatch
    /// </summary>
    [Fact]
    public async Task CreateWorkOrder_WithValidData_Returns201()
    {
        var client = await GetAuthenticatedClientAsync();
        var deviceId = await CreateTestDeviceAsync(client);

        var request = new CreateWorkOrderRequest
        {
            Title = "电机异常维修工单",
            Type = "corrective",
            Priority = "high",
            DeviceId = deviceId,
            Description = "电机运行时出现异常振动"
        };

        var response = await client.PostAsJsonAsync("/api/v1/work-orders", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var wo = await response.Content.ReadFromJsonAsync<WorkOrderDto>();
        wo.Should().NotBeNull();
        wo!.Title.Should().Be("电机异常维修工单");
        wo.Status.Should().Be("PendingDispatch");
        wo.Priority.Should().Be("High"); // 枚举序列化为 PascalCase
        wo.Type.Should().Be("Corrective"); // 枚举序列化为 PascalCase
        wo.DeviceId.Should().Be(deviceId);
        wo.WorkOrderCode.Should().NotBeEmpty();
        wo.Id.Should().NotBe(Guid.Empty);
    }

    /// <summary>
    /// 验证：创建工单后可通过 ID 获取详情
    /// </summary>
    [Fact]
    public async Task GetWorkOrder_AfterCreate_ReturnsWorkOrder()
    {
        var client = await GetAuthenticatedClientAsync();
        var deviceId = await CreateTestDeviceAsync(client);

        // 创建工单
        var createRequest = new CreateWorkOrderRequest
        {
            Title = "查询测试工单",
            DeviceId = deviceId
        };
        var createResponse = await client.PostAsJsonAsync("/api/v1/work-orders", createRequest);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await createResponse.Content.ReadFromJsonAsync<WorkOrderDto>();

        // 查询工单详情
        var getResponse = await client.GetAsync($"/api/v1/work-orders/{created!.Id}");

        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var wo = await getResponse.Content.ReadFromJsonAsync<WorkOrderDto>();
        wo.Should().NotBeNull();
        wo!.Id.Should().Be(created.Id);
        wo.Title.Should().Be("查询测试工单");
        wo.Status.Should().Be("PendingDispatch");
    }

    /// <summary>
    /// 验证：PUT /api/v1/work-orders/{id}/assign 派工操作
    /// 状态从 PendingDispatch 变为 Assigned
    /// </summary>
    [Fact]
    public async Task AssignWorkOrder_WithValidData_ReturnsAssigned()
    {
        var client = await GetAuthenticatedClientAsync();
        var deviceId = await CreateTestDeviceAsync(client);

        // 创建工单
        var createRequest = new CreateWorkOrderRequest
        {
            Title = "派工测试工单",
            DeviceId = deviceId
        };
        var createResponse = await client.PostAsJsonAsync("/api/v1/work-orders", createRequest);
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<WorkOrderDto>();

        // 派工
        var assignRequest = new AssignWorkOrderRequest
        {
            AssignedTo = Guid.NewGuid(), // 模拟指派给某技术人员
            Note = "请尽快处理"
        };
        var assignResponse = await client.PutAsJsonAsync(
            $"/api/v1/work-orders/{created!.Id}/assign", assignRequest);

        assignResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var assigned = await assignResponse.Content.ReadFromJsonAsync<WorkOrderDto>();
        assigned.Should().NotBeNull();
        assigned!.Status.Should().Be("Assigned");
        assigned.AssignedTo.Should().Be(assignRequest.AssignedTo);
    }

    /// <summary>
    /// 验证：PUT /api/v1/work-orders/{id}/start 开始执行
    /// 状态从 Assigned 变为 InProgress
    /// </summary>
    [Fact]
    public async Task StartWorkOrder_WhenAssigned_ReturnsInProgress()
    {
        var client = await GetAuthenticatedClientAsync();
        var deviceId = await CreateTestDeviceAsync(client);

        // 创建工单
        var createRequest = new CreateWorkOrderRequest
        {
            Title = "开始执行测试工单",
            DeviceId = deviceId
        };
        var createResponse = await client.PostAsJsonAsync("/api/v1/work-orders", createRequest);
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<WorkOrderDto>();

        // 先派工
        var assignRequest = new AssignWorkOrderRequest
        {
            AssignedTo = Guid.NewGuid()
        };
        var assignResponse = await client.PutAsJsonAsync(
            $"/api/v1/work-orders/{created!.Id}/assign", assignRequest);
        assignResponse.EnsureSuccessStatusCode();

        // 开始执行
        var startResponse = await client.PutAsJsonAsync(
            $"/api/v1/work-orders/{created.Id}/start", new { });

        startResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var started = await startResponse.Content.ReadFromJsonAsync<WorkOrderDto>();
        started.Should().NotBeNull();
        started!.Status.Should().Be("InProgress");
    }

    /// <summary>
    /// 验证：PUT /api/v1/work-orders/{id}/complete 完成工单
    /// 完整流程：创建 -> 派工 -> 开始 -> 完成
    /// 状态最终变为 Completed，并记录解决措施
    /// </summary>
    [Fact]
    public async Task CompleteWorkOrder_FullFlow_ReturnsCompleted()
    {
        var client = await GetAuthenticatedClientAsync();
        var deviceId = await CreateTestDeviceAsync(client);

        // 1. 创建工单
        var createRequest = new CreateWorkOrderRequest
        {
            Title = "完整流程测试工单",
            DeviceId = deviceId
        };
        var createResponse = await client.PostAsJsonAsync("/api/v1/work-orders", createRequest);
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<WorkOrderDto>();

        // 2. 派工
        var assignRequest = new AssignWorkOrderRequest
        {
            AssignedTo = Guid.NewGuid()
        };
        var assignResponse = await client.PutAsJsonAsync(
            $"/api/v1/work-orders/{created!.Id}/assign", assignRequest);
        assignResponse.EnsureSuccessStatusCode();

        // 3. 开始执行
        var startResponse = await client.PutAsJsonAsync(
            $"/api/v1/work-orders/{created.Id}/start", new { });
        startResponse.EnsureSuccessStatusCode();

        // 4. 完成工单
        var completeRequest = new CompleteWorkOrderRequest
        {
            Resolution = "更换轴承，设备恢复正常运行"
        };
        var completeResponse = await client.PutAsJsonAsync(
            $"/api/v1/work-orders/{created.Id}/complete", completeRequest);

        completeResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var completed = await completeResponse.Content.ReadFromJsonAsync<WorkOrderDto>();
        completed.Should().NotBeNull();
        completed!.Status.Should().Be("Completed");
        completed.Resolution.Should().Be("更换轴承，设备恢复正常运行");
        completed.CompletedAt.Should().NotBeNull();
    }

    /// <summary>
    /// 验证：查询不存在的工单返回 404
    /// </summary>
    [Fact]
    public async Task GetWorkOrder_WithNonexistentId_Returns404()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync($"/api/v1/work-orders/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    /// <summary>
    /// 验证：非法状态流转（从 PendingDispatch 直接到 InProgress）应返回 409 Conflict
    /// 工单状态流转必须按顺序：PendingDispatch -> Assigned -> InProgress -> Completed
    /// </summary>
    [Fact]
    public async Task StartWorkOrder_WhenPendingDispatch_Returns409()
    {
        var client = await GetAuthenticatedClientAsync();
        var deviceId = await CreateTestDeviceAsync(client);

        // 创建工单（状态为 PendingDispatch）
        var createRequest = new CreateWorkOrderRequest
        {
            Title = "非法状态流转测试工单",
            DeviceId = deviceId
        };
        var createResponse = await client.PostAsJsonAsync("/api/v1/work-orders", createRequest);
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<WorkOrderDto>();

        // 尝试直接开始（跳过派工步骤），应返回 409 Conflict
        var startResponse = await client.PutAsJsonAsync(
            $"/api/v1/work-orders/{created!.Id}/start", new { });

        startResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    /// <summary>
    /// 验证：按状态筛选工单列表返回正确结果
    /// </summary>
    [Fact]
    public async Task GetWorkOrders_FilterByStatus_ReturnsFilteredResults()
    {
        var client = await GetAuthenticatedClientAsync();
        var deviceId = await CreateTestDeviceAsync(client);

        // 创建一个工单（状态为 PendingDispatch）
        var createResponse = await client.PostAsJsonAsync("/api/v1/work-orders", new CreateWorkOrderRequest
        {
            Title = "筛选测试工单",
            DeviceId = deviceId
        });
        createResponse.EnsureSuccessStatusCode();

        // 按状态筛选
        var response = await client.GetAsync("/api/v1/work-orders?status=PendingDispatch&page=1&pageSize=20");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<WorkOrderDto>>();
        result.Should().NotBeNull();
        result!.Items.Should().NotBeEmpty();
        result.Items.Should().OnlyContain(wo => wo.Status == "PendingDispatch");
    }
}
