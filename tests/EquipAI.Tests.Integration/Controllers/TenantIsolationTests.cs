using System.Net;
using System.Net.Http.Json;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Application.DTOs.Devices;
using EquipAI.Application.DTOs.Tenants;
using EquipAI.Core.Constants;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Identity;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using AlertEntity = EquipAI.Core.Entities.Alert;
using WorkOrderEntity = EquipAI.Core.Entities.WorkOrder;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 多租户数据隔离集成测试
/// 验证 EF Core 全局租户过滤器、冻结租户限制、系统管理员跨租户访问等核心多租户机制
/// 使用共享测试集合确保 WebApplicationFactory 单例
/// </summary>
[Collection("SharedFactory")]
public class TenantIsolationTests
{
    private readonly CustomWebApplicationFactory _factory;

    public TenantIsolationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    /// <summary>
    /// 验证：租户 A 创建的设备，租户 B 无法看到
/// 这是多租户隔离的核心测试，确保 EF Core 全局查询过滤器在 API 层正确生效
/// 测试流程：
/// 1. 直接向数据库插入两个租户及各自关联的用户和设备
/// 2. 分别使用两个租户的用户 JWT 调用 GET /api/v1/devices
/// 3. 断言每个用户只能看到自己租户的设备
    /// </summary>
    [Fact]
    public async Task DeviceList_TenantA_CannotSee_TenantB_Devices()
    {
        // Arrange: 创建两个独立的租户，各自拥有用户和设备
        var tenantAId = Guid.NewGuid();
        var tenantBId = Guid.NewGuid();
        var userAId = Guid.NewGuid();
        var userBId = Guid.NewGuid();

        // 使用 Seed 初始化基础数据（系统租户、默认租户、admin 用户等）
        var seedClient = await _factory.CreateClientWithSeedAsync();

        // 通过独立作用域直接操作数据库，插入测试所需的租户和设备
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // 创建租户 A
            db.Tenants.Add(new Core.Entities.Tenant
            {
                Id = tenantAId,
                Name = "租户A-测试工厂",
                Slug = $"tenant-a-{tenantAId:N}",
                Plan = TenantPlan.Basic,
                Status = TenantStatus.Active,
                IsActive = true,
                MaxDevices = 50,
                MaxUsers = 20,
                DataRetentionDays = 90
            });

            // 创建租户 B
            db.Tenants.Add(new Core.Entities.Tenant
            {
                Id = tenantBId,
                Name = "租户B-测试工厂",
                Slug = $"tenant-b-{tenantBId:N}",
                Plan = TenantPlan.Basic,
                Status = TenantStatus.Active,
                IsActive = true,
                MaxDevices = 50,
                MaxUsers = 20,
                DataRetentionDays = 90
            });

            // 创建租户 A 的用户（Operator 角色，拥有 device:read 权限）
            db.Users.Add(new User
            {
                Id = userAId,
                TenantId = tenantAId,
                Username = $"user-a-{userAId:N}",
                PasswordHash = PasswordHasher.HashPassword("Test@123"),
                DisplayName = "租户A操作员",
                Role = UserRole.Operator,
                IsActive = true
            });

            // 创建租户 B 的用户（Operator 角色）
            db.Users.Add(new User
            {
                Id = userBId,
                TenantId = tenantBId,
                Username = $"user-b-{userBId:N}",
                PasswordHash = PasswordHasher.HashPassword("Test@123"),
                DisplayName = "租户B操作员",
                Role = UserRole.Operator,
                IsActive = true
            });

            // 租户 A 添加 2 台设备
            db.Devices.Add(new Device
            {
                Id = Guid.NewGuid(),
                TenantId = tenantAId,
                DeviceCode = $"DEV-A1-{Guid.NewGuid():N}".Substring(0, 20),
                Name = "租户A-电机-001",
                Type = "电机"
            });
            db.Devices.Add(new Device
            {
                Id = Guid.NewGuid(),
                TenantId = tenantAId,
                DeviceCode = $"DEV-A2-{Guid.NewGuid():N}".Substring(0, 20),
                Name = "租户A-泵-001",
                Type = "泵"
            });

            // 租户 B 添加 1 台设备
            db.Devices.Add(new Device
            {
                Id = Guid.NewGuid(),
                TenantId = tenantBId,
                DeviceCode = $"DEV-B1-{Guid.NewGuid():N}".Substring(0, 20),
                Name = "租户B-压缩机-001",
                Type = "压缩机"
            });

            await db.SaveChangesAsync();
        }

        // Act & Assert: 租户 A 用户只能看到自己的 2 台设备
        var clientA = await CreateAuthenticatedClientAsync(userAId, tenantAId, UserRole.Operator);
        var responseA = await clientA.GetAsync("/api/v1/devices?page=1&pageSize=100");
        responseA.StatusCode.Should().Be(HttpStatusCode.OK);

        var resultA = await responseA.Content.ReadFromJsonAsync<PagedResult<DeviceDto>>();
        resultA.Should().NotBeNull();
        resultA!.Items.Should().HaveCount(2, "租户 A 应该只能看到自己的 2 台设备");
        resultA.Items.Should().OnlyContain(d => d.Name.StartsWith("租户A"), "租户 A 不应看到其他租户的设备");

        // Act & Assert: 租户 B 用户只能看到自己的 1 台设备
        var clientB = await CreateAuthenticatedClientAsync(userBId, tenantBId, UserRole.Operator);
        var responseB = await clientB.GetAsync("/api/v1/devices?page=1&pageSize=100");
        responseB.StatusCode.Should().Be(HttpStatusCode.OK);

        var resultB = await responseB.Content.ReadFromJsonAsync<PagedResult<DeviceDto>>();
        resultB.Should().NotBeNull();
        resultB!.Items.Should().HaveCount(1, "租户 B 应该只能看到自己的 1 台设备");
        resultB.Items.Should().OnlyContain(d => d.Name.StartsWith("租户B"), "租户 B 不应看到其他租户的设备");
    }

    /// <summary>
    /// 验证：冻结状态的租户无法通过 POST /api/v1/devices 创建设备，应返回 403 Forbidden
/// 完整链路：UsageLimitMiddleware -> SubscriptionService.CanCreateResourceAsync
/// 当租户状态为 Frozen 时，CanCreateResourceAsync 返回 false，中间件拦截并返回 403
    /// </summary>
    [Fact]
    public async Task FrozenTenant_CannotCreateDevice_Returns403()
    {
        // Arrange: 创建一个冻结状态的租户及其用户
        var frozenTenantId = Guid.NewGuid();
        var frozenUserId = Guid.NewGuid();

        // 使用 Seed 初始化基础数据
        await _factory.CreateClientWithSeedAsync();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // 创建冻结租户
            db.Tenants.Add(new Core.Entities.Tenant
            {
                Id = frozenTenantId,
                Name = "冻结租户-测试",
                Slug = $"frozen-{frozenTenantId:N}",
                Plan = TenantPlan.Basic,
                Status = TenantStatus.Frozen,   // 关键：冻结状态
                IsActive = false,               // 冻结时 IsActive 也会被设为 false
                MaxDevices = 50,
                MaxUsers = 20,
                DataRetentionDays = 90
            });

            // 创建 SystemAdmin 角色用户（拥有 device:create 权限，可绕过权限检查）
            db.Users.Add(new User
            {
                Id = frozenUserId,
                TenantId = frozenTenantId,
                Username = $"frozen-user-{frozenUserId:N}",
                PasswordHash = PasswordHasher.HashPassword("Test@123"),
                DisplayName = "冻结租户管理员",
                Role = UserRole.MaintenanceLead, // 拥有 device:read 但不拥有 device:create
                IsActive = true
            });

            await db.SaveChangesAsync();
        }

        // 使用 MaintenanceLead 用户（无 device:create 权限）会先被权限中间件拦截返回 403
        // 但我们想验证的是冻结拦截而非权限拦截，所以使用有 device:create 权限的角色
        // 重新创建用户为 SystemAdmin
        using (var scope2 = _factory.Services.CreateScope())
        {
            var db2 = scope2.ServiceProvider.GetRequiredService<AppDbContext>();
            var user = await db2.Users.IgnoreQueryFilters()
                .FirstAsync(u => u.Id == frozenUserId);
            user.Role = UserRole.SystemAdmin; // 赋予全部权限，确保能通过权限中间件
            await db2.SaveChangesAsync();
        }

        var client = await CreateAuthenticatedClientAsync(frozenUserId, frozenTenantId, UserRole.SystemAdmin);

        var createRequest = new CreateDeviceRequest
        {
            DeviceCode = $"DEV-FROZEN-{Guid.NewGuid():N}".Substring(0, 20),
            Name = "冻结租户尝试创建设备",
            Type = "电机"
        };

        // Act: 冻结租户尝试创建设备
        var response = await client.PostAsJsonAsync("/api/v1/devices", createRequest);

        // Assert: 应返回 403 Forbidden（由 UsageLimitMiddleware 拦截）
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden,
            "冻结租户应被 UsageLimitMiddleware 拦截，返回 403");
    }

    /// <summary>
    /// 验证：system_admin 角色可以调用 GET /api/v1/admin/tenants 查看所有租户列表
/// 完整链路：
/// 1. TenantResolutionMiddleware 解析 JWT 设置 TenantContext（IsSystemAdmin=true）
/// 2. PermissionMiddleware 校验 tenant:read 权限（SystemAdmin 拥有全部权限）
/// 3. TenantService.GetTenantsAsync 使用 UnfilteredSet 跨租户查询
    /// </summary>
    [Fact]
    public async Task SystemAdmin_CanListAllTenants()
    {
        // Arrange: 初始化种子数据（包含系统租户和默认租户）
        var client = await _factory.CreateClientWithSeedAsync();

        // 额外插入一个租户，确保列表中不止种子数据
        var extraTenantId = Guid.NewGuid();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Tenants.Add(new Core.Entities.Tenant
            {
                Id = extraTenantId,
                Name = "额外测试租户",
                Slug = $"extra-{extraTenantId:N}",
                Plan = TenantPlan.Professional,
                Status = TenantStatus.Active,
                IsActive = true,
                MaxDevices = 200,
                MaxUsers = 50,
                DataRetentionDays = 180
            });
            await db.SaveChangesAsync();
        }

        // 使用 admin 用户登录获取 JWT（种子数据中的 admin 是 SystemAdmin 角色）
        var loginResponse = await client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest { Username = "admin", Password = "Admin@123" });
        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var loginData = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();
        loginData.Should().NotBeNull();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", loginData!.AccessToken);

        // Act: system_admin 查询所有租户
        var response = await client.GetAsync("/api/v1/admin/tenants?page=1&pageSize=100");

        // Assert: 应返回 200 OK 且包含所有租户
        response.StatusCode.Should().Be(HttpStatusCode.OK,
            "system_admin 应有权限访问租户列表");

        var result = await response.Content.ReadFromJsonAsync<PagedResult<TenantDto>>();
        result.Should().NotBeNull();
        result!.Items.Should().NotBeEmpty("应该至少包含种子数据中的租户");

        // 验证至少包含：系统租户、默认租户、额外测试租户
        result.Total.Should().BeGreaterOrEqualTo(3,
            "租户列表应包含系统租户、默认租户和额外测试租户");

        // 验证能看到其他租户（跨租户可见性）
        result.Items.Should().Contain(t => t.Name == "额外测试租户",
            "system_admin 应能看到所有租户，包括新创建的租户");
    }

    /// <summary>
    /// v1.4 安全回归：跨租户 IDOR（Insecure Direct Object Reference）防护
    ///
    /// 攻击场景：租户 A 用户通过 GET /api/v1/devices/{tenant_B_device_id} 直接访问
    ///           其他租户的资源。EF Core 全局查询过滤器必须拦截此类请求。
    ///
    /// 期望：返回 404 Not Found（而不是 403，避免泄漏资源存在性）
    /// </summary>
    [Fact]
    public async Task CrossTenant_DirectAccess_ToOtherTenantDevice_Returns404()
    {
        // Arrange: 创建两个租户，租户 B 拥有 1 个设备
        var tenantAId = Guid.NewGuid();
        var tenantBId = Guid.NewGuid();
        var userAId = Guid.NewGuid();
        var tenantBDeviceId = Guid.NewGuid();

        await _factory.CreateClientWithSeedAsync();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            db.Tenants.Add(new Core.Entities.Tenant
            {
                Id = tenantAId, Name = "租户A-IDOR", Slug = $"t-a-{tenantAId:N}",
                Plan = TenantPlan.Basic, Status = TenantStatus.Active, IsActive = true,
                MaxDevices = 50, MaxUsers = 20, DataRetentionDays = 90
            });
            db.Tenants.Add(new Core.Entities.Tenant
            {
                Id = tenantBId, Name = "租户B-IDOR", Slug = $"t-b-{tenantBId:N}",
                Plan = TenantPlan.Basic, Status = TenantStatus.Active, IsActive = true,
                MaxDevices = 50, MaxUsers = 20, DataRetentionDays = 90
            });
            db.Users.Add(new User
            {
                Id = userAId, TenantId = tenantAId,
                Username = $"idor-a-{userAId:N}",
                PasswordHash = PasswordHasher.HashPassword("Test@123"),
                DisplayName = "IDOR-租户A", Role = UserRole.Operator, IsActive = true
            });
            db.Devices.Add(new Device
            {
                Id = tenantBDeviceId, TenantId = tenantBId,
                DeviceCode = $"B-SECRET-{tenantBDeviceId:N}".Substring(0, 20),
                Name = "租户B-机密设备", Type = "电机"
            });
            await db.SaveChangesAsync();
        }

        // Act: 租户 A 用户直接访问租户 B 的设备 ID
        var clientA = await CreateAuthenticatedClientAsync(userAId, tenantAId, UserRole.Operator);
        var response = await clientA.GetAsync($"/api/v1/devices/{tenantBDeviceId}");

        // Assert: 必须返回 404（不能 200，也不能 403 泄漏存在性）
        response.StatusCode.Should().Be(HttpStatusCode.NotFound,
            "跨租户访问资源必须返回 404，不能泄漏资源存在性（防 IDOR）");
    }

    /// <summary>
    /// v1.4 安全回归：告警列表跨租户隔离
    ///
    /// 攻击场景：租户 A 拥有 0 个告警，租户 B 拥有 N 个告警。
    ///           租户 A 调用 GET /api/v1/alerts 应只看到自己租户的告警（0 条）。
    ///
    /// 这与 DeviceList 测试互补：验证告警表（alerts）的 EF Core 过滤器也正确生效。
    /// </summary>
    [Fact]
    public async Task AlertsList_TenantA_CannotSee_TenantB_Alerts()
    {
        // Arrange
        var tenantAId = Guid.NewGuid();
        var tenantBId = Guid.NewGuid();
        var userAId = Guid.NewGuid();
        var tenantBDeviceId = Guid.NewGuid();

        await _factory.CreateClientWithSeedAsync();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Tenants.Add(new Core.Entities.Tenant
            {
                Id = tenantAId, Name = "租户A-告警", Slug = $"t-a-{tenantAId:N}",
                Plan = TenantPlan.Basic, Status = TenantStatus.Active, IsActive = true,
                MaxDevices = 50, MaxUsers = 20, DataRetentionDays = 90
            });
            db.Tenants.Add(new Core.Entities.Tenant
            {
                Id = tenantBId, Name = "租户B-告警", Slug = $"t-b-{tenantBId:N}",
                Plan = TenantPlan.Basic, Status = TenantStatus.Active, IsActive = true,
                MaxDevices = 50, MaxUsers = 20, DataRetentionDays = 90
            });
            db.Users.Add(new User
            {
                Id = userAId, TenantId = tenantAId,
                Username = $"alert-a-{userAId:N}",
                PasswordHash = PasswordHasher.HashPassword("Test@123"),
                DisplayName = "告警-租户A", Role = UserRole.Operator, IsActive = true
            });
            db.Devices.Add(new Device
            {
                Id = tenantBDeviceId, TenantId = tenantBId,
                DeviceCode = $"B-ALERT-{tenantBDeviceId:N}".Substring(0, 20),
                Name = "租户B-告警源设备", Type = "电机"
            });
            // 租户 B 拥有 3 条活跃告警
            for (var i = 0; i < 3; i++)
            {
                db.Alerts.Add(new AlertEntity
                {
                    Id = Guid.NewGuid(),
                    AlertCode = $"ALT-B-{Guid.NewGuid():N}".Substring(0, 20),
                    TenantId = tenantBId,
                    DeviceId = tenantBDeviceId,
                    RuleId = Guid.NewGuid(),
                    Metric = "temperature",
                    Severity = AlertSeverity.High,
                    Status = AlertStatus.Active,
                    Message = $"租户B-告警-{i}",
                    Value = 95,
                    Threshold = 90,
                    OccurredAt = DateTime.UtcNow
                });
            }
            await db.SaveChangesAsync();
        }

        // Act: 租户 A 查询告警列表
        var clientA = await CreateAuthenticatedClientAsync(userAId, tenantAId, UserRole.Operator);
        var response = await clientA.GetAsync("/api/v1/alerts?page=1&pageSize=100");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<object>>();
        result.Should().NotBeNull();
        result!.Items.Should().BeEmpty("租户 A 不应看到租户 B 的告警（EF Core 全局过滤器必须生效）");
    }

    /// <summary>
    /// v1.4 安全回归：工单列表跨租户隔离
    ///
    /// 与告警/设备测试互补：覆盖工单表（work_orders）的隔离。
    /// 工单含敏感信息（负责人、维修记录、成本），跨租户泄漏会引发合规问题。
    /// </summary>
    [Fact]
    public async Task WorkOrdersList_TenantA_CannotSee_TenantB_WorkOrders()
    {
        // Arrange
        var tenantAId = Guid.NewGuid();
        var tenantBId = Guid.NewGuid();
        var userAId = Guid.NewGuid();
        var tenantBDeviceId = Guid.NewGuid();
        var tenantBUserId = Guid.NewGuid();

        await _factory.CreateClientWithSeedAsync();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Tenants.Add(new Core.Entities.Tenant
            {
                Id = tenantAId, Name = "租户A-工单", Slug = $"t-a-{tenantAId:N}",
                Plan = TenantPlan.Basic, Status = TenantStatus.Active, IsActive = true,
                MaxDevices = 50, MaxUsers = 20, DataRetentionDays = 90
            });
            db.Tenants.Add(new Core.Entities.Tenant
            {
                Id = tenantBId, Name = "租户B-工单", Slug = $"t-b-{tenantBId:N}",
                Plan = TenantPlan.Basic, Status = TenantStatus.Active, IsActive = true,
                MaxDevices = 50, MaxUsers = 20, DataRetentionDays = 90
            });
            db.Users.Add(new User
            {
                Id = userAId, TenantId = tenantAId,
                Username = $"wo-a-{userAId:N}",
                PasswordHash = PasswordHasher.HashPassword("Test@123"),
                DisplayName = "工单-租户A", Role = UserRole.Operator, IsActive = true
            });
            db.Users.Add(new User
            {
                Id = tenantBUserId, TenantId = tenantBId,
                Username = $"wo-b-{tenantBUserId:N}",
                PasswordHash = PasswordHasher.HashPassword("Test@123"),
                DisplayName = "工单-租户B-工程师", Role = UserRole.Technician, IsActive = true
            });
            db.Devices.Add(new Device
            {
                Id = tenantBDeviceId, TenantId = tenantBId,
                DeviceCode = $"B-WO-{tenantBDeviceId:N}".Substring(0, 20),
                Name = "租户B-工单关联设备", Type = "电机"
            });
            // 租户 B 拥有 2 条工单
            db.WorkOrders.Add(new WorkOrderEntity
            {
                Id = Guid.NewGuid(), TenantId = tenantBId,
                WorkOrderCode = $"WO-B-{Guid.NewGuid():N}".Substring(0, 20),
                DeviceId = tenantBDeviceId, CreatedBy = tenantBUserId,
                AssignedTo = tenantBUserId,
                Title = "租户B-机密工单-001",
                RootCause = "包含维修成本和 SLA 信息",
                Type = WorkOrderType.Corrective,
                Priority = WorkOrderPriority.High,
                Status = WorkOrderStatus.PendingDispatch
            });
            db.WorkOrders.Add(new WorkOrderEntity
            {
                Id = Guid.NewGuid(), TenantId = tenantBId,
                WorkOrderCode = $"WO-B-{Guid.NewGuid():N}".Substring(0, 20),
                DeviceId = tenantBDeviceId, CreatedBy = tenantBUserId,
                AssignedTo = tenantBUserId,
                Title = "租户B-机密工单-002",
                RootCause = "包含维修成本和 SLA 信息",
                Type = WorkOrderType.Corrective,
                Priority = WorkOrderPriority.Medium,
                Status = WorkOrderStatus.InProgress
            });
            await db.SaveChangesAsync();
        }

        // Act: 租户 A 查询工单列表
        var clientA = await CreateAuthenticatedClientAsync(userAId, tenantAId, UserRole.Operator);
        var response = await clientA.GetAsync("/api/v1/work-orders?page=1&pageSize=100");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<object>>();
        result.Should().NotBeNull();
        result!.Items.Should().BeEmpty("租户 A 不应看到租户 B 的工单（工单含维修成本/SLA 等敏感数据）");
    }

    /// <summary>
    /// v1.5 安全探针：验证设备列表在真实 HTTP 管线中始终按租户隔离，且未认证请求不会得到数据。
    /// 租户 A 有 3 台设备，租户 B 有 0 台；两边使用相同查询参数，B 不得看到 A 的设备。
    /// </summary>
    [Fact]
    public async Task DeviceList_TenantIsolation_DoesNotLeakAcrossTenants()
    {
        // Arrange
        var tenantAId = Guid.NewGuid();
        var tenantBId = Guid.NewGuid();
        var userAId = Guid.NewGuid();
        var userBId = Guid.NewGuid();

        await _factory.CreateClientWithSeedAsync();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Tenants.Add(new Core.Entities.Tenant
            {
                Id = tenantAId, Name = "缓存泄漏-租户A", Slug = $"cache-a-{tenantAId:N}",
                Plan = TenantPlan.Basic, Status = TenantStatus.Active, IsActive = true,
                MaxDevices = 50, MaxUsers = 20, DataRetentionDays = 90
            });
            db.Tenants.Add(new Core.Entities.Tenant
            {
                Id = tenantBId, Name = "缓存泄漏-租户B", Slug = $"cache-b-{tenantBId:N}",
                Plan = TenantPlan.Basic, Status = TenantStatus.Active, IsActive = true,
                MaxDevices = 50, MaxUsers = 20, DataRetentionDays = 90
            });
            db.Users.Add(new User
            {
                Id = userAId, TenantId = tenantAId,
                Username = $"cache-a-{userAId:N}",
                PasswordHash = PasswordHasher.HashPassword("Test@123"),
                DisplayName = "缓存A操作员", Role = UserRole.Operator, IsActive = true
            });
            db.Users.Add(new User
            {
                Id = userBId, TenantId = tenantBId,
                Username = $"cache-b-{userBId:N}",
                PasswordHash = PasswordHasher.HashPassword("Test@123"),
                DisplayName = "缓存B操作员", Role = UserRole.Operator, IsActive = true
            });
            // 租户 A：3 台带醒目前缀的设备
            for (var i = 1; i <= 3; i++)
            {
                db.Devices.Add(new Device
                {
                    Id = Guid.NewGuid(), TenantId = tenantAId,
                    DeviceCode = $"CACHELEAK-A{i}-{Guid.NewGuid():N}".Substring(0, 20),
                    Name = $"CACHE-LEAK-A-{i}", Type = "电机"
                });
            }
            // 租户 B：0 台设备（任何 B 响应中出现设备即泄漏）
            await db.SaveChangesAsync();
        }

        // 统一查询串（缓存键相同的前提）
        const string url = "/api/v1/devices?page=1&pageSize=50";

        // Act 1：租户 A 请求
        var clientA = await CreateAuthenticatedClientAsync(userAId, tenantAId, UserRole.Operator);
        var respA = await clientA.GetAsync(url);
        respA.StatusCode.Should().Be(HttpStatusCode.OK);
        var resultA = await respA.Content.ReadFromJsonAsync<PagedResult<DeviceDto>>();
        resultA!.Items.Should().HaveCount(3, "租户 A 应看到自己的 3 台设备");

        // Act 2：租户 B 用相同 URL 请求，B 应看到 0 台
        var clientB = await CreateAuthenticatedClientAsync(userBId, tenantBId, UserRole.Operator);
        var respB = await clientB.GetAsync(url);
        respB.StatusCode.Should().Be(HttpStatusCode.OK);
        var resultB = await respB.Content.ReadFromJsonAsync<PagedResult<DeviceDto>>();

        // Assert：租户 B 绝不能看到租户 A 的任何设备（跨租户数据泄漏是 P0）
        resultB!.Items.Should().BeEmpty(
            "租户 B 无设备，若看到任何设备（尤其 CACHE-LEAK-A-*），即为跨租户数据泄漏");
        resultB.Items.Should().NotContain(d => d.Name.StartsWith("CACHE-LEAK-A"),
            "租户 B 的响应绝不可包含租户 A 的设备");

        // Act 3：未认证请求用相同 URL，必须返回 401，绝不能返回 A 的设备。
        using var anonClient = _factory.CreateClient();
        var respAnon = await anonClient.GetAsync(url);
        respAnon.StatusCode.Should().Be(HttpStatusCode.Unauthorized,
            "未认证请求必须被认证中间件拦截为 401，构成未认证数据泄漏");
    }

    /// <summary>
    /// 创建带有 JWT 认证头的 HttpClient
/// 通过 JwtTokenService 直接生成令牌，绕过登录流程，适合测试不同租户/角色场景
/// 生成的 JWT 包含 tenant_id、role、username 等 Claims，
/// TenantResolutionMiddleware 会从 JWT 中解析这些信息设置租户上下文
    /// </summary>
    /// <param name="userId">用户 ID</param>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="role">用户角色</param>
    /// <returns>已设置 Authorization 头的 HttpClient</returns>
    private async Task<HttpClient> CreateAuthenticatedClientAsync(Guid userId, Guid tenantId, UserRole role)
    {
        // 使用 Seed 初始化基础数据（确保数据库已创建且包含基础种子数据）
        var client = await _factory.CreateClientWithSeedAsync();

        using var scope = _factory.Services.CreateScope();
        var jwtService = scope.ServiceProvider.GetRequiredService<JwtTokenService>();

        // 构造 User 实体供 JwtTokenService 生成令牌
        // 只需填充 GenerateAccessToken 方法中用到的字段
        var user = new User
        {
            Id = userId,
            TenantId = tenantId,
            Role = role,
            Username = $"test-{userId:N}",
            TokenVersion = 0
        };

        var token = jwtService.GenerateAccessToken(user);
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        return client;
    }
}
