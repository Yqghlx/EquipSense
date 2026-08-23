using AutoMapper;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using EquipAI.Application.DTOs.Common;
using EquipAI.Application.DTOs.Devices;
using EquipAI.Application.Mapping;
using EquipAI.Application.Services;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Data;

namespace EquipAI.Tests.Unit.Services;

/// <summary>
/// 设备管理服务单元测试
/// 覆盖设备 CRUD、分页查询、状态/类型筛选、租户设备计数维护等核心场景
/// </summary>
public class DeviceServiceTests : IAsyncDisposable
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly string _databaseName = $"TestDevice_{Guid.NewGuid()}";
    private readonly AppDbContext _db;
    private readonly DeviceService _sut;
    private readonly StubAuditLogService _audit = new();

    public DeviceServiceTests()
    {
        // 使用唯一数据库名称避免测试间相互干扰
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(_databaseName)
            .Options;
        _db = new AppDbContext(options, new TestTenantContext(_tenantId));

        // 使用真实的 AutoMapper 和 MappingProfile，确保映射逻辑的测试真实性
        var mapperConfig = new MapperConfiguration(
            cfg => cfg.AddProfile<MappingProfile>(),
            Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        var mapper = mapperConfig.CreateMapper();
        var logger = LoggerFactory.Create(_ => { }).CreateLogger<DeviceService>();
        // 传入桩件审计服务：验证 DeviceService 是否正确触发审计调用契约
        // （AuditLogService 本身的 DB 写入由其自身测试覆盖）
        _sut = new DeviceService(_db, mapper, logger, _audit);
    }

    /// <summary>
    /// 辅助方法：创建并保存一个租户实体到数据库
    /// 用于需要验证 CurrentDeviceCount 变更的测试场景
    /// </summary>
    private async Task<Tenant> SeedTenantAsync(int currentDeviceCount = 0)
    {
        var tenant = new Tenant
        {
            Id = _tenantId,
            Name = "测试租户",
            Slug = "test-tenant",
            Plan = TenantPlan.Basic,
            CurrentDeviceCount = currentDeviceCount,
            MaxDevices = 50
        };
        _db.Add(tenant);
        await _db.SaveChangesAsync();
        return tenant;
    }

    /// <summary>
    /// 辅助方法：创建并保存一个设备实体到数据库
    /// </summary>
    private async Task<Device> SeedDeviceAsync(
        string code = "DEV-001",
        string name = "测试设备",
        string type = "电机",
        DeviceStatus status = DeviceStatus.Offline,
        DeviceCriticality criticality = DeviceCriticality.Normal,
        string? model = null)
    {
        var device = new Device
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantId,
            DeviceCode = code,
            Name = name,
            Type = type,
            Status = status,
            Criticality = criticality,
            Model = model
        };
        _db.Devices.Add(device);
        await _db.SaveChangesAsync();
        return device;
    }

    // ==================== GetDevicesAsync 测试 ====================

    [Fact]
    public async Task GetDevicesAsync_有设备_应返回分页结果()
    {
        // Arrange：创建 3 个设备
        await SeedDeviceAsync("DEV-001", "电机A", "电机");
        await SeedDeviceAsync("DEV-002", "泵B", "泵");
        await SeedDeviceAsync("DEV-003", "压缩机C", "压缩机");

        var query = new PagedQuery { Page = 1, PageSize = 20 };

        // Act
        var result = await _sut.GetDevicesAsync(query, _tenantId);

        // Assert
        result.Should().NotBeNull();
        result.Items.Should().HaveCount(3);
        result.Total.Should().Be(3);
    }

    [Fact]
    public async Task GetDevicesAsync_按状态过滤()
    {
        // Arrange：创建不同状态的设备
        await SeedDeviceAsync("DEV-ONLINE", "在线设备", "电机", DeviceStatus.Online);
        await SeedDeviceAsync("DEV-OFFLINE", "离线设备", "泵", DeviceStatus.Offline);
        await SeedDeviceAsync("DEV-MAINT", "维护设备", "压缩机", DeviceStatus.Maintenance);

        var query = new PagedQuery { Page = 1, PageSize = 20 };

        // Act：仅筛选 Online 状态
        var result = await _sut.GetDevicesAsync(query, _tenantId, status: "Online");

        // Assert
        result.Items.Should().HaveCount(1);
        result.Items[0].Status.Should().Be("Online");
        result.Items[0].Name.Should().Be("在线设备");
    }

    [Fact]
    public async Task GetDevicesAsync_按类型过滤()
    {
        // Arrange：创建不同类型的设备
        await SeedDeviceAsync("DEV-001", "电机A", "电机");
        await SeedDeviceAsync("DEV-002", "泵B", "泵");
        await SeedDeviceAsync("DEV-003", "电机C", "电机");

        var query = new PagedQuery { Page = 1, PageSize = 20 };

        // Act：仅筛选"电机"类型
        var result = await _sut.GetDevicesAsync(query, _tenantId, type: "电机");

        // Assert
        result.Items.Should().HaveCount(2);
        result.Items.Should().OnlyContain(d => d.Type == "电机");
    }

    [Fact]
    public async Task GetDevicesAsync_按关键词应匹配编码名称或型号且不区分大小写()
    {
        await SeedDeviceAsync("PUMP-001", "一号冷却水泵", "泵", model: "S200");
        await SeedDeviceAsync("FAN-002", "排风扇", "风机", model: "X11");
        await SeedDeviceAsync("MTR-003", "主电机", "电机", model: "S300");

        var byCode = await _sut.GetDevicesAsync(new PagedQuery { Page = 1, PageSize = 20, Keyword = "pump" }, _tenantId);
        byCode.Items.Should().ContainSingle(d => d.DeviceCode == "PUMP-001");
        byCode.Total.Should().Be(1);

        var byName = await _sut.GetDevicesAsync(new PagedQuery { Page = 1, PageSize = 20, Keyword = "冷却" }, _tenantId);
        byName.Items.Should().ContainSingle(d => d.DeviceCode == "PUMP-001");

        var byModel = await _sut.GetDevicesAsync(new PagedQuery { Page = 1, PageSize = 20, Keyword = "s200" }, _tenantId);
        byModel.Items.Should().ContainSingle(d => d.DeviceCode == "PUMP-001");
    }

    [Fact]
    public async Task GetDevicesAsync_关键词无匹配时应返回空列表()
    {
        await SeedDeviceAsync("PUMP-001", "一号冷却水泵", "泵");

        var result = await _sut.GetDevicesAsync(new PagedQuery { Page = 1, PageSize = 20, Keyword = "不存在的设备" }, _tenantId);

        result.Items.Should().BeEmpty();
        result.Total.Should().Be(0);
    }

    [Fact]
    public async Task GetDevicesAsync_空白关键词应等同于不筛选()
    {
        await SeedDeviceAsync("PUMP-001", "一号冷却水泵", "泵");
        await SeedDeviceAsync("FAN-002", "排风扇", "风机");

        var result = await _sut.GetDevicesAsync(new PagedQuery { Page = 1, PageSize = 20, Keyword = "   " }, _tenantId);

        result.Items.Should().HaveCount(2);
        result.Total.Should().Be(2);
    }

    [Fact]
    public async Task GetDevicesAsync_无设备_应返回空列表()
    {
        // Arrange：数据库中无任何设备
        var query = new PagedQuery { Page = 1, PageSize = 20 };

        // Act
        var result = await _sut.GetDevicesAsync(query, _tenantId);

        // Assert
        result.Should().NotBeNull();
        result.Items.Should().BeEmpty();
        result.Total.Should().Be(0);
    }

    // ==================== GetDeviceByIdAsync 测试 ====================

    [Fact]
    public async Task GetDeviceByIdAsync_存在_应返回DTO()
    {
        // Arrange
        var device = await SeedDeviceAsync("DEV-001", "目标设备", "电机");

        // Act
        var result = await _sut.GetDeviceByIdAsync(device.Id, _tenantId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(device.Id);
        result.Name.Should().Be("目标设备");
        result.DeviceCode.Should().Be("DEV-001");
        result.Type.Should().Be("电机");
    }

    [Fact]
    public async Task GetDeviceByIdAsync_不存在_应返回null()
    {
        // Arrange：使用一个不存在的 ID 查询
        var notExistId = Guid.NewGuid();

        // Act
        var result = await _sut.GetDeviceByIdAsync(notExistId, _tenantId);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetDeviceByIdAsync_租户不匹配_应返回null()
    {
        // Arrange：将其他租户设备写入当前上下文，模拟实体已被跟踪的路径。
        var otherTenantId = Guid.NewGuid();
        var device = new Device
        {
            Id = Guid.NewGuid(),
            TenantId = otherTenantId,
            DeviceCode = "DEV-OTHER-GET",
            Name = "其他租户设备",
            Type = "电机",
        };
        _db.Devices.Add(device);
        await _db.SaveChangesAsync();

        // Act
        var result = await _sut.GetDeviceByIdAsync(device.Id, _tenantId);

        // Assert：设备详情必须同时匹配设备 ID 和当前租户。
        result.Should().BeNull("当前租户不得读取其他租户的设备详情");
    }

    // ==================== CreateDeviceAsync 测试 ====================

    [Fact]
    public async Task CreateDeviceAsync_应创建设备()
    {
        // Arrange
        var request = new CreateDeviceRequest
        {
            DeviceCode = "DEV-NEW",
            Name = "新建设备",
            Type = "电机",
            Manufacturer = "西门子",
            Model = "1LE1501"
        };

        // Act
        var result = await _sut.CreateDeviceAsync(request, _tenantId);

        // Assert
        result.Should().NotBeNull();
        result.DeviceCode.Should().Be("DEV-NEW");
        result.Name.Should().Be("新建设备");

        // 验证数据库中确实存在该设备
        var dbCount = await _db.Devices.CountAsync();
        dbCount.Should().Be(1);
    }

    [Fact]
    public async Task CreateDeviceAsync_新设备默认Offline()
    {
        // Arrange
        var request = new CreateDeviceRequest
        {
            DeviceCode = "DEV-STATUS",
            Name = "状态测试设备",
            Type = "泵"
        };

        // Act
        var result = await _sut.CreateDeviceAsync(request, _tenantId);

        // Assert：新建设备状态应默认为 Offline
        result.Status.Should().Be("Offline");
    }

    [Fact]
    public async Task CreateDeviceAsync_应映射设备档案扩展字段()
    {
        // Arrange：回归 #260 —— CreateRequest 新增的序列号/安装日期/网关/停机成本字段须通过
        // AutoMapper 默认名称映射写入 Device 实体（MappingProfile 已移除对应 Ignore）。
        var request = new CreateDeviceRequest
        {
            DeviceCode = "DEV-PROFILE",
            Name = "档案测试设备",
            Type = "压缩机",
            SerialNumber = "SN-2026-001",
            InstallDate = new DateOnly(2026, 1, 15),
            GatewayId = "GW-001",
            DowntimeCostPerHour = 1500m,
        };

        // Act
        var result = await _sut.CreateDeviceAsync(request, _tenantId);

        // Assert：返回 DTO 应携带扩展字段
        result.SerialNumber.Should().Be("SN-2026-001");
        result.InstallDate.Should().Be(new DateOnly(2026, 1, 15));
        result.GatewayId.Should().Be("GW-001");
        result.DowntimeCostPerHour.Should().Be(1500m);

        // 验证数据库实体确实落库了扩展字段
        var dbDevice = await _db.Devices.FindAsync(result.Id);
        dbDevice.Should().NotBeNull();
        dbDevice!.SerialNumber.Should().Be("SN-2026-001");
        dbDevice.InstallDate.Should().Be(new DateOnly(2026, 1, 15));
        dbDevice.GatewayId.Should().Be("GW-001");
        dbDevice.DowntimeCostPerHour.Should().Be(1500m);
    }

    [Fact]
    public async Task CreateDeviceAsync_应递增租户设备计数()
    {
        // Arrange：预先创建一个租户，初始设备计数为 2
        await SeedTenantAsync(currentDeviceCount: 2);

        var request = new CreateDeviceRequest
        {
            DeviceCode = "DEV-COUNT",
            Name = "计数测试设备",
            Type = "压缩机"
        };

        // Act
        await _sut.CreateDeviceAsync(request, _tenantId);

        // Assert：租户的 CurrentDeviceCount 应从 2 递增到 3
        var tenant = await _db.UnfilteredSet<Tenant>()
            .AsNoTracking()
            .FirstAsync(t => t.Id == _tenantId);
        tenant.CurrentDeviceCount.Should().Be(3);
    }

    [Fact]
    public async Task CreateDeviceAsync_达到设备配额_应拒绝且不写入设备()
    {
        // 服务层必须独立兜底，避免绕过 HTTP 配额中间件的入口造成超卖。
        await SeedTenantAsync(currentDeviceCount: 1);
        var tenant = await _db.UnfilteredSet<Tenant>().SingleAsync(t => t.Id == _tenantId);
        tenant.MaxDevices = 1;
        await _db.SaveChangesAsync();

        var act = () => _sut.CreateDeviceAsync(new CreateDeviceRequest
        {
            DeviceCode = "DEV-OVER-LIMIT",
            Name = "超额设备",
            Type = "电机"
        }, _tenantId);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*设备*上限*");
        (await _db.Devices.IgnoreQueryFilters().CountAsync()).Should().Be(0,
            "配额拒绝不能留下超额设备");
        (await _db.UnfilteredSet<Tenant>().SingleAsync(t => t.Id == _tenantId))
            .CurrentDeviceCount.Should().Be(1);
    }

    [Fact]
    public async Task CreateDeviceAsync_显式租户与上下文不一致_唯一性检查应使用显式租户()
    {
        // Arrange：构造一个当前上下文属于其他租户的服务，验证服务层 tenantId 参数优先于上下文租户。
        // HTTP 层仍必须保证二者来自同一个已认证租户，测试只锁定服务契约的显式边界。
        var contextTenantId = Guid.NewGuid();
        await SeedTenantAsync();

        var contextOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(_databaseName)
            .Options;
        await using var contextDb = new AppDbContext(
            contextOptions,
            new TestTenantContext(contextTenantId));
        contextDb.Devices.Add(new Device
        {
            Id = Guid.NewGuid(),
            TenantId = contextTenantId,
            DeviceCode = "DEV-CROSS-CREATE",
            Name = "上下文租户设备",
            Type = "电机",
        });
        await contextDb.SaveChangesAsync();

        var mapperConfig = new MapperConfiguration(
            cfg => cfg.AddProfile<MappingProfile>(),
            Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        var contextService = new DeviceService(
            contextDb,
            mapperConfig.CreateMapper(),
            LoggerFactory.Create(_ => { }).CreateLogger<DeviceService>(),
            _audit);

        // Act：显式租户是 _tenantId；上下文租户故意设为其他租户。
        var result = await contextService.CreateDeviceAsync(new CreateDeviceRequest
        {
            DeviceCode = "DEV-CROSS-CREATE",
            Name = "显式租户新设备",
            Type = "泵",
        }, _tenantId);

        // Assert：唯一性检查必须按显式 tenantId 识别边界，而不是错误地复用上下文租户。
        result.DeviceCode.Should().Be("DEV-CROSS-CREATE");
        var persisted = await _db.Devices.IgnoreQueryFilters()
            .AsNoTracking()
            .SingleAsync(d => d.Id == result.Id);
        persisted.TenantId.Should().Be(_tenantId);
    }

    // ==================== UpdateDeviceAsync 测试 ====================

    [Fact]
    public async Task UpdateDeviceAsync_应更新设备属性()
    {
        // Arrange
        var device = await SeedDeviceAsync("DEV-UPD", "原始名称", "电机");

        var request = new UpdateDeviceRequest
        {
            Name = "更新后名称",
            Manufacturer = "ABB",
            Model = "M3BP-200"
        };

        // Act
        var result = await _sut.UpdateDeviceAsync(device.Id, _tenantId, request);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be("更新后名称");

        // 验证数据库中的值确实已更新
        var dbDevice = await _db.Devices.FindAsync(device.Id);
        dbDevice.Should().NotBeNull();
        dbDevice!.Name.Should().Be("更新后名称");
        dbDevice.Manufacturer.Should().Be("ABB");
        dbDevice.Model.Should().Be("M3BP-200");
    }

    [Fact]
    public async Task UpdateDeviceAsync_应更新设备档案扩展字段()
    {
        // Arrange：回归 #260 —— UpdateRequest 新增字段须经 ForAllMembers Condition（非空更新）生效。
        var device = await SeedDeviceAsync("DEV-UPD2", "待更新档案", "电机");

        var request = new UpdateDeviceRequest
        {
            SerialNumber = "SN-UPD-001",
            InstallDate = new DateOnly(2025, 6, 1),
            GatewayId = "GW-UPD",
            DowntimeCostPerHour = 800m,
        };

        // Act
        var result = await _sut.UpdateDeviceAsync(device.Id, _tenantId, request);

        // Assert：返回 DTO 应反映更新后的扩展字段
        result.SerialNumber.Should().Be("SN-UPD-001");
        result.InstallDate.Should().Be(new DateOnly(2025, 6, 1));
        result.GatewayId.Should().Be("GW-UPD");
        result.DowntimeCostPerHour.Should().Be(800m);

        // 验证数据库实体确实更新
        var dbDevice = await _db.Devices.FindAsync(device.Id);
        dbDevice.Should().NotBeNull();
        dbDevice!.SerialNumber.Should().Be("SN-UPD-001");
        dbDevice.GatewayId.Should().Be("GW-UPD");
        dbDevice.DowntimeCostPerHour.Should().Be(800m);
    }

    [Fact]
    public async Task UpdateDeviceAsync_不存在_应抛出KeyNotFoundException()
    {
        // Arrange：使用一个不存在的设备 ID
        var notExistId = Guid.NewGuid();
        var request = new UpdateDeviceRequest { Name = "不存在设备" };

        // Act & Assert：应抛出 KeyNotFoundException
        var act = () => _sut.UpdateDeviceAsync(notExistId, _tenantId, request);
        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage($"设备 {notExistId} 不存在");
    }

    [Fact]
    public async Task UpdateDeviceAsync_租户不匹配_应视为不存在且保持原数据()
    {
        // Arrange：将其他租户设备写入当前上下文，避免测试只覆盖数据库查询路径。
        var otherTenantId = Guid.NewGuid();
        var device = new Device
        {
            Id = Guid.NewGuid(),
            TenantId = otherTenantId,
            DeviceCode = "DEV-OTHER-UPDATE",
            Name = "不可被修改的设备",
            Type = "电机",
        };
        _db.Devices.Add(device);
        await _db.SaveChangesAsync();

        // Act
        var act = () => _sut.UpdateDeviceAsync(
            device.Id,
            _tenantId,
            new UpdateDeviceRequest { Name = "越权修改" });

        // Assert：越权资源必须按不存在处理，且原租户数据保持不变。
        await act.Should().ThrowAsync<KeyNotFoundException>();

        var persisted = await _db.Devices.IgnoreQueryFilters()
            .AsNoTracking()
            .SingleAsync(d => d.Id == device.Id);
        persisted.Name.Should().Be("不可被修改的设备");
    }

    // ==================== DeleteDeviceAsync 测试 ====================

    [Fact]
    public async Task DeleteDeviceAsync_应删除设备()
    {
        // Arrange
        var device = await SeedDeviceAsync("DEV-DEL", "待删除设备", "电机");

        // Act
        await _sut.DeleteDeviceAsync(device.Id, _tenantId);

        // Assert：数据库中不应再存在该设备
        var dbCount = await _db.Devices.CountAsync();
        dbCount.Should().Be(0);
    }

    [Fact]
    public async Task DeleteDeviceAsync_应递减租户设备计数()
    {
        // Arrange：预先创建一个租户，初始设备计数为 3
        await SeedTenantAsync(currentDeviceCount: 3);
        var device = await SeedDeviceAsync("DEV-DECCOUNT", "计数递减设备", "泵");

        // Act
        await _sut.DeleteDeviceAsync(device.Id, _tenantId);

        // Assert：租户的 CurrentDeviceCount 应从 3 递减到 2
        var tenant = await _db.UnfilteredSet<Tenant>()
            .AsNoTracking()
            .FirstAsync(t => t.Id == _tenantId);
        tenant.CurrentDeviceCount.Should().Be(2);
    }

    [Fact]
    public async Task DeleteDeviceAsync_不存在_应抛出KeyNotFoundException()
    {
        // Arrange：使用一个不存在的设备 ID
        var notExistId = Guid.NewGuid();

        // Act & Assert：应抛出 KeyNotFoundException
        var act = () => _sut.DeleteDeviceAsync(notExistId, _tenantId);
        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage($"设备 {notExistId} 不存在");
    }

    [Fact]
    public async Task DeleteDeviceAsync_租户不匹配_应视为不存在且保留原数据()
    {
        // Arrange：将其他租户设备写入当前上下文，验证删除路径不会信任实体跟踪状态。
        var otherTenantId = Guid.NewGuid();
        var device = new Device
        {
            Id = Guid.NewGuid(),
            TenantId = otherTenantId,
            DeviceCode = "DEV-OTHER-DELETE",
            Name = "不可被删除的设备",
            Type = "电机",
        };
        _db.Devices.Add(device);
        await _db.SaveChangesAsync();

        // Act
        var act = () => _sut.DeleteDeviceAsync(device.Id, _tenantId);

        // Assert：当前租户不得删除其他租户的设备。
        await act.Should().ThrowAsync<KeyNotFoundException>();

        var exists = await _db.Devices.IgnoreQueryFilters()
            .AsNoTracking()
            .AnyAsync(d => d.Id == device.Id && d.TenantId == otherTenantId);
        exists.Should().BeTrue();
    }

    // ==================== 孤儿数据清理测试（关键修复 v1.5） ====================

    /// <summary>
    /// 关键修复验证：删除设备时，该设备的活跃告警应自动归档（标记 Resolved）
    ///
    /// Why：alerts 表无外键约束指向 devices，删除设备后活跃告警会成为孤儿，
    /// 继续污染 Dashboard 的 activeAlerts 统计，且告警列表点击设备链接 404。
    /// 修复：删除设备时把该设备的活跃告警批量标记为 Resolved。
    /// </summary>
    [Fact]
    public async Task DeleteDeviceAsync_应归档该设备的活跃告警()
    {
        // Arrange
        await SeedTenantAsync();
        var device = await SeedDeviceAsync("DEV-ORPHAN-1", "孤儿告警测试设备", "电机");

        // 该设备有 2 条活跃告警 + 1 条已解决告警
        _db.Alerts.Add(new Alert
        {
            TenantId = _tenantId,
            DeviceId = device.Id,
            AlertCode = "ALT-ACTIVE-1",
            Metric = "temperature",
            Severity = AlertSeverity.High,
            Status = AlertStatus.Active,
            Value = 95.0m,
            OccurredAt = DateTime.UtcNow,
        });
        _db.Alerts.Add(new Alert
        {
            TenantId = _tenantId,
            DeviceId = device.Id,
            AlertCode = "ALT-ACTIVE-2",
            Metric = "vibration",
            Severity = AlertSeverity.Critical,
            Status = AlertStatus.Active,
            Value = 8.5m,
            OccurredAt = DateTime.UtcNow,
        });
        _db.Alerts.Add(new Alert
        {
            TenantId = _tenantId,
            DeviceId = device.Id,
            AlertCode = "ALT-RESOLVED",
            Metric = "pressure",
            Severity = AlertSeverity.Normal,
            Status = AlertStatus.Resolved,
            Value = 1.2m,
            OccurredAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();

        // Act
        await _sut.DeleteDeviceAsync(device.Id, _tenantId);

        // Assert：所有该设备的告警都应是 Resolved（活跃的被归档，已解决的保持）
        var remainingAlerts = await _db.Alerts
            .Where(a => a.DeviceId == device.Id)
            .ToListAsync();
        remainingAlerts.Should().HaveCount(3, "告警历史应保留，不硬删除");
        remainingAlerts.Should().OnlyContain(a => a.Status == AlertStatus.Resolved,
            "删除设备后所有相关告警都应是 Resolved 状态，无活跃孤儿");

        // 被归档的两条应有 Resolution 说明
        var archivedAlerts = remainingAlerts.Where(a => a.AlertCode.StartsWith("ALT-ACTIVE"));
        archivedAlerts.Should().OnlyContain(a => a.Resolution == "设备已删除，自动归档活跃告警");
        archivedAlerts.Should().OnlyContain(a => a.ResolvedAt != null);
    }

    /// <summary>
    /// 跨租户隔离：删除 A 租户的设备不应影响 B 租户的告警
    /// </summary>
    [Fact]
    public async Task DeleteDeviceAsync_不应影响其他设备的活跃告警()
    {
        // Arrange
        await SeedTenantAsync();
        var deviceA = await SeedDeviceAsync("DEV-A", "设备A", "电机");
        var deviceB = await SeedDeviceAsync("DEV-B", "设备B", "泵");

        _db.Alerts.Add(new Alert
        {
            TenantId = _tenantId, DeviceId = deviceA.Id, AlertCode = "ALT-A",
            Metric = "temp", Severity = AlertSeverity.High, Status = AlertStatus.Active,
            Value = 90m, OccurredAt = DateTime.UtcNow,
        });
        _db.Alerts.Add(new Alert
        {
            TenantId = _tenantId, DeviceId = deviceB.Id, AlertCode = "ALT-B",
            Metric = "temp", Severity = AlertSeverity.High, Status = AlertStatus.Active,
            Value = 95m, OccurredAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();

        // Act：只删除 deviceA
        await _sut.DeleteDeviceAsync(deviceA.Id, _tenantId);

        // Assert：deviceB 的告警应保持 Active（未被误归档）
        var alertB = await _db.Alerts.FirstAsync(a => a.DeviceId == deviceB.Id);
        alertB.Status.Should().Be(AlertStatus.Active, "其他设备的告警不应受影响");
    }

    /// <summary>
    /// 关键修复验证：删除设备时，该设备的网关关联应被移除
    ///
    /// Why：gateway_devices 无外键约束，删除设备后网关关联残留，
    /// 网关会继续向已删除的设备推送数据（幽灵设备），浪费资源且产生无效遥测。
    /// </summary>
    [Fact]
    public async Task DeleteDeviceAsync_应移除该设备的网关关联()
    {
        // Arrange
        await SeedTenantAsync();
        var device = await SeedDeviceAsync("DEV-GW", "网关关联测试设备", "电机");

        _db.GatewayDevices.Add(new GatewayDevice
        {
            TenantId = _tenantId,
            GatewayId = "GW-001",
            DeviceId = device.Id,
        });
        _db.GatewayDevices.Add(new GatewayDevice
        {
            TenantId = _tenantId,
            GatewayId = "GW-002",
            DeviceId = device.Id,
        });
        await _db.SaveChangesAsync();

        // Act
        await _sut.DeleteDeviceAsync(device.Id, _tenantId);

        // Assert：该设备的网关关联应全部移除
        var remainingLinks = await _db.GatewayDevices
            .Where(gd => gd.DeviceId == device.Id)
            .ToListAsync();
        remainingLinks.Should().BeEmpty("删除设备后网关关联必须移除，避免网关继续向幽灵设备推送");
    }

    /// <summary>
    /// 关键修复验证：删除设备时，该设备绑定的告警规则应被清理（避免孤儿规则残留）
    ///
    /// Why：alert_rules 表无外键约束指向 devices，删除设备后 DeviceId 绑定的规则成为孤儿。
    /// 告警评估按 r.DeviceId==当前遥测设备过滤（AlertEvaluationService），孤儿规则（DeviceId=已删设备）
    /// 永不匹配——不崩溃但静默失效。真实危害：工业设备返修/更换后，重建同 DeviceCode 设备得到新 ID，
    /// 旧规则仍绑旧 ID，新设备无告警保护（温度/振动超限不告警）；规则管理页也显示孤儿规则致困惑。
    /// 仅清理 DeviceId 绑定规则，保留 DeviceType/租户级规则（不绑定具体设备，仍适用于其他/同类型设备）。
    /// </summary>
    [Fact]
    public async Task DeleteDeviceAsync_应清理该设备绑定的告警规则()
    {
        // Arrange
        await SeedTenantAsync();
        var device = await SeedDeviceAsync("DEV-RULE", "规则清理测试设备", "电机");

        // 三种粒度的规则：DeviceId 绑定本设备 / DeviceId 绑定他设备 / DeviceType 绑定类型
        var boundRule = new AlertRule
        {
            TenantId = _tenantId, DeviceId = device.Id, Name = "本设备温度规则",
            Metric = "temperature", RuleType = RuleType.Threshold, Enabled = true,
        };
        var otherDeviceRule = new AlertRule
        {
            TenantId = _tenantId, DeviceId = Guid.NewGuid(), Name = "他设备温度规则",
            Metric = "temperature", RuleType = RuleType.Threshold, Enabled = true,
        };
        var typeRule = new AlertRule
        {
            TenantId = _tenantId, DeviceId = null, DeviceType = "电机", Name = "电机类型规则",
            Metric = "temperature", RuleType = RuleType.Threshold, Enabled = true,
        };
        _db.AlertRules.AddRange(boundRule, otherDeviceRule, typeRule);
        await _db.SaveChangesAsync();

        // Act
        await _sut.DeleteDeviceAsync(device.Id, _tenantId);

        // Assert：绑定本设备的规则被清理；他设备规则和类型规则保留（IgnoreQueryFilters 查全部）
        var remaining = await _db.AlertRules.IgnoreQueryFilters().ToListAsync();
        remaining.Should().NotContain(r => r.Id == boundRule.Id,
            "删除设备时必须清理该设备绑定的告警规则，否则重建设备后告警保护丢失");
        remaining.Should().Contain(r => r.Id == otherDeviceRule.Id, "其他设备绑定的规则不应被误删");
        remaining.Should().Contain(r => r.Id == typeRule.Id,
            "设备类型规则/租户级规则不绑定具体设备，应保留（仍适用于其他/同类型设备）");
    }

    /// <summary>
    /// 综合场景：删除一个有告警 + 网关关联 + 工单的设备，应正确清理且不报错
    /// </summary>
    [Fact]
    public async Task DeleteDeviceAsync_综合场景_告警网关全清理()
    {
        // Arrange
        await SeedTenantAsync(currentDeviceCount: 1);
        var device = await SeedDeviceAsync("DEV-FULL", "综合测试设备", "电机");

        _db.Alerts.Add(new Alert
        {
            TenantId = _tenantId, DeviceId = device.Id, AlertCode = "ALT-FULL",
            Metric = "temp", Severity = AlertSeverity.Critical, Status = AlertStatus.Active,
            Value = 100m, OccurredAt = DateTime.UtcNow,
        });
        _db.GatewayDevices.Add(new GatewayDevice
        {
            TenantId = _tenantId, GatewayId = "GW-FULL", DeviceId = device.Id,
        });
        _db.AlertRules.Add(new AlertRule
        {
            TenantId = _tenantId, DeviceId = device.Id, Name = "综合规则",
            Metric = "temperature", RuleType = RuleType.Threshold, Enabled = true,
        });
        await _db.SaveChangesAsync();

        // Act：不应抛异常
        var act = () => _sut.DeleteDeviceAsync(device.Id, _tenantId);
        await act.Should().NotThrowAsync();

        // Assert：设备已删，告警归档，网关关联移除，计数递减
        var deviceExists = await _db.Devices.AnyAsync(d => d.Id == device.Id);
        deviceExists.Should().BeFalse("设备应已删除");

        var alert = await _db.Alerts.FirstAsync(a => a.DeviceId == device.Id);
        alert.Status.Should().Be(AlertStatus.Resolved);

        var linkCount = await _db.GatewayDevices.CountAsync(gd => gd.DeviceId == device.Id);
        linkCount.Should().Be(0);

        var ruleCount = await _db.AlertRules.CountAsync(r => r.DeviceId == device.Id);
        ruleCount.Should().Be(0, "该设备绑定的告警规则应被清理");

        var tenant = await _db.UnfilteredSet<Tenant>().FirstAsync(t => t.Id == _tenantId);
        tenant.CurrentDeviceCount.Should().Be(0, "设备计数应递减");
    }

    // ==================== 审计日志测试（创建/更新/删除设备须留痕）====================

    /// <summary>
    /// 安全合规验证：创建设备必须记录审计日志
    ///
    /// Why：设备是工业资产，新增/变更/删除设备不可追溯则无法核对资产清单（ISO 55000 资产管理 /
    /// IEC 62443 安全合规）。原 DeviceService 全程零审计（全仓仅 UserService/AuthService 有审计），
    /// 设备写操作"谁在何时改了哪台设备"完全无记录——误删/恶意删设备无法溯源（内部威胁盲区）。
    /// </summary>
    [Fact]
    public async Task CreateDeviceAsync_应记录创建审计日志()
    {
        // Arrange
        await SeedTenantAsync();
        var request = new CreateDeviceRequest
        {
            DeviceCode = "DEV-AUDIT-C", Name = "审计测试设备", Type = "电机",
        };

        // Act
        await _sut.CreateDeviceAsync(request, _tenantId);

        // Assert：创建后应记录 DeviceCreate 审计（含租户/资源类型/资源 ID）
        _audit.Logged.Should().ContainSingle(a => a.Action == "DeviceCreate",
            "创建设备必须留痕审计，否则资产登记不可追溯");
        var entry = _audit.Logged.Single(a => a.Action == "DeviceCreate");
        entry.TenantId.Should().Be(_tenantId, "审计须归属正确租户");
        entry.ResourceType.Should().Be("Device");
        entry.ResourceId.Should().NotBeNullOrEmpty("审计须记录资源 ID 以定位具体设备");
        entry.Description.Should().Contain("DEV-AUDIT-C", "描述须含设备编码便于追溯");
    }

    [Fact]
    public async Task UpdateDeviceAsync_应记录更新审计日志()
    {
        // Arrange
        await SeedTenantAsync();
        var device = await SeedDeviceAsync("DEV-AUDIT-U", "待更新设备", "电机");

        // Act
        await _sut.UpdateDeviceAsync(device.Id, _tenantId, new UpdateDeviceRequest { Name = "更新后" });

        // Assert：更新后应记录 DeviceUpdate 审计
        _audit.Logged.Should().ContainSingle(a => a.Action == "DeviceUpdate",
            "更新设备信息必须留痕审计（影响告警规则匹配/SLA/派工优先级）");
        var entry = _audit.Logged.Single(a => a.Action == "DeviceUpdate");
        entry.ResourceId.Should().Be(device.Id.ToString(), "审计须记录被更新的设备 ID");
    }

    [Fact]
    public async Task DeleteDeviceAsync_应记录删除审计日志()
    {
        // Arrange：删除是不可逆资产处置，最须审计
        await SeedTenantAsync();
        var device = await SeedDeviceAsync("DEV-AUDIT-D", "待删除设备", "电机");

        // Act
        await _sut.DeleteDeviceAsync(device.Id, _tenantId);

        // Assert：删除后应记录 DeviceDelete 审计（含设备编码，即使设备已删审计仍可追溯）
        _audit.Logged.Should().ContainSingle(a => a.Action == "DeviceDelete",
            "删除设备（不可逆资产处置）必须留痕审计，否则误删/恶意删设备无法溯源");
        var entry = _audit.Logged.Single(a => a.Action == "DeviceDelete");
        entry.ResourceId.Should().Be(device.Id.ToString());
        entry.Description.Should().Contain("DEV-AUDIT-D", "描述须含设备编码，设备删除后仍可凭审计追溯");
    }

    /// <summary>
    /// 测试用租户上下文，模拟 ITenantContext 接口
    /// 使用指定的租户 ID 构造，用于 InMemory 数据库的多租户过滤器
    /// </summary>
    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode { get; } = "Shared";
        public bool IsSystemAdmin { get; } = false;
        public Guid UserId { get; } = Guid.Empty;
    }

    /// <summary>
    /// 桩件审计服务：记录 LogAsync 调用，验证 DeviceService 是否正确触发审计
    /// （AuditLogService 本身的 DB 写入正确性由其自身测试覆盖，此处只验证调用契约）
    /// </summary>
    private sealed class StubAuditLogService : IAuditLogService
    {
        public List<(Guid TenantId, string Action, string ResourceType, string? ResourceId, string? Description)> Logged { get; } = new();

        public Task LogAsync(Guid tenantId, string action, string resourceType,
            string? resourceId = null, string? description = null, CancellationToken ct = default)
        {
            Logged.Add((tenantId, action, resourceType, resourceId, description));
            return Task.CompletedTask;
        }

        public Task LogFromContextAsync(string action, string resourceType, string? resourceId = null,
            string? description = null, CancellationToken ct = default) => Task.CompletedTask;

        public Task<PagedResult<AuditLogDto>> GetAuditLogsAsync(Guid tenantId, int page = 1, int pageSize = 20,
            CancellationToken ct = default, string? action = null, string? resourceType = null) =>
            throw new NotSupportedException("桩件不支持查询");
    }

    public async ValueTask DisposeAsync()
    {
        await _db.DisposeAsync();
    }
}
