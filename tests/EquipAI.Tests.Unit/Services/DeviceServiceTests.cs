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
using EquipAI.Infrastructure.Data;

namespace EquipAI.Tests.Unit.Services;

/// <summary>
/// 设备管理服务单元测试
/// 覆盖设备 CRUD、分页查询、状态/类型筛选、租户设备计数维护等核心场景
/// </summary>
public class DeviceServiceTests : IAsyncDisposable
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly AppDbContext _db;
    private readonly DeviceService _sut;

    public DeviceServiceTests()
    {
        // 使用唯一数据库名称避免测试间相互干扰
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestDevice_{Guid.NewGuid()}")
            .Options;
        _db = new AppDbContext(options, new TestTenantContext(_tenantId));

        // 使用真实的 AutoMapper 和 MappingProfile，确保映射逻辑的测试真实性
        var mapperConfig = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        var mapper = mapperConfig.CreateMapper();
        var logger = LoggerFactory.Create(_ => { }).CreateLogger<DeviceService>();
        _sut = new DeviceService(_db, mapper, logger);
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
        DeviceCriticality criticality = DeviceCriticality.Normal)
    {
        var device = new Device
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantId,
            DeviceCode = code,
            Name = name,
            Type = type,
            Status = status,
            Criticality = criticality
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

    public async ValueTask DisposeAsync()
    {
        await _db.DisposeAsync();
    }
}
