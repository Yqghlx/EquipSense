using AutoMapper;
using EquipAI.Application.DTOs.Devices;
using EquipAI.Application.DTOs.Users;
using EquipAI.Application.Mapping;
using EquipAI.Application.Services;
using EquipAI.Core.Entities;
using EquipAI.Core.Exceptions;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace EquipAI.Tests.Unit.Services;

/// <summary>
/// 使用 SQLite 关系型提供程序验证配额原子更新路径。
/// InMemory 无法执行 ExecuteUpdateAsync，也不能代表生产数据库的事务行为。
/// </summary>
public sealed class ResourceQuotaRelationalTests : IAsyncLifetime
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private SqliteConnection _connection = null!;
    private AppDbContext _db = null!;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        await _connection.OpenAsync();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;
        _db = new AppDbContext(options, new FixedTenantContext(_tenantId));
        await _db.Database.EnsureCreatedAsync();

        _db.Tenants.Add(new Tenant
        {
            Id = _tenantId,
            Name = "关系型配额测试租户",
            Slug = $"quota-{_tenantId:N}",
            Plan = Core.Enums.TenantPlan.Basic,
            Status = Core.Enums.TenantStatus.Active,
            MaxDevices = 1,
            MaxUsers = 1,
        });
        await _db.SaveChangesAsync();
    }

    [Fact]
    public async Task 关系型数据库_创建用户达到配额_应回滚并返回403语义异常()
    {
        var mapper = CreateMapper();
        var audit = new Mock<IAuditLogService>();
        var service = new UserService(
            _db,
            mapper,
            LoggerFactory.Create(_ => { }).CreateLogger<UserService>(),
            audit.Object);

        await service.CreateUserAsync(
            new CreateUserRequest { Username = "quota-user-1", Password = "Password123" },
            _tenantId);

        var act = () => service.CreateUserAsync(
            new CreateUserRequest { Username = "quota-user-2", Password = "Password123" },
            _tenantId);

        await act.Should().ThrowAsync<ResourceQuotaExceededException>();
        (await _db.UnfilteredSet<User>().CountAsync()).Should().Be(1);
        (await _db.UnfilteredSet<Tenant>().SingleAsync(t => t.Id == _tenantId))
            .CurrentUserCount.Should().Be(1);
    }

    [Fact]
    public async Task 关系型数据库_创建设备达到配额_应回滚并返回403语义异常()
    {
        var mapper = CreateMapper();
        var audit = new Mock<IAuditLogService>();
        var service = new DeviceService(
            _db,
            mapper,
            LoggerFactory.Create(_ => { }).CreateLogger<DeviceService>(),
            audit.Object);

        await service.CreateDeviceAsync(
            new CreateDeviceRequest { DeviceCode = "quota-device-1", Name = "设备一", Type = "电机" },
            _tenantId);

        var act = () => service.CreateDeviceAsync(
            new CreateDeviceRequest { DeviceCode = "quota-device-2", Name = "设备二", Type = "电机" },
            _tenantId);

        await act.Should().ThrowAsync<ResourceQuotaExceededException>();
        (await _db.UnfilteredSet<Device>().CountAsync()).Should().Be(1);
        (await _db.UnfilteredSet<Tenant>().SingleAsync(t => t.Id == _tenantId))
            .CurrentDeviceCount.Should().Be(1);
    }

    [Fact]
    public async Task 关系型数据库_用户计数器偏小但真实用户已满_仍应拒绝创建()
    {
        var tenant = await _db.UnfilteredSet<Tenant>().SingleAsync(t => t.Id == _tenantId);
        tenant.CurrentUserCount = 0;
        _db.Users.Add(new User
        {
            TenantId = _tenantId,
            Username = "existing-active-user",
            PasswordHash = "test-hash",
            IsActive = true,
        });
        await _db.SaveChangesAsync();

        var service = new UserService(
            _db,
            CreateMapper(),
            LoggerFactory.Create(_ => { }).CreateLogger<UserService>(),
            new Mock<IAuditLogService>().Object);

        var act = () => service.CreateUserAsync(
            new CreateUserRequest { Username = "blocked-by-real-count", Password = "Password123" },
            _tenantId);

        await act.Should().ThrowAsync<ResourceQuotaExceededException>();
        (await _db.UnfilteredSet<User>().CountAsync()).Should().Be(1);
        (await _db.UnfilteredSet<Tenant>().SingleAsync(t => t.Id == _tenantId))
            .CurrentUserCount.Should().Be(0,
                "拒绝创建时应回滚预留，漂移计数保持原值而不产生额外占用");
    }

    [Fact]
    public async Task 关系型数据库_设备计数器偏小但真实设备已满_仍应拒绝创建()
    {
        var tenant = await _db.UnfilteredSet<Tenant>().SingleAsync(t => t.Id == _tenantId);
        tenant.CurrentDeviceCount = 0;
        _db.Devices.Add(new Device
        {
            TenantId = _tenantId,
            DeviceCode = "existing-real-device",
            Name = "真实设备",
            Type = "电机",
        });
        await _db.SaveChangesAsync();

        var service = new DeviceService(
            _db,
            CreateMapper(),
            LoggerFactory.Create(_ => { }).CreateLogger<DeviceService>(),
            new Mock<IAuditLogService>().Object);

        var act = () => service.CreateDeviceAsync(
            new CreateDeviceRequest
            {
                DeviceCode = "blocked-by-real-count",
                Name = "不应创建",
                Type = "电机",
            },
            _tenantId);

        await act.Should().ThrowAsync<ResourceQuotaExceededException>();
        (await _db.UnfilteredSet<Device>().CountAsync()).Should().Be(1);
        (await _db.UnfilteredSet<Tenant>().SingleAsync(t => t.Id == _tenantId))
            .CurrentDeviceCount.Should().Be(0,
                "拒绝创建时应回滚预留，漂移计数保持原值而不产生额外占用");
    }

    [Fact]
    public async Task 关系型数据库_设备导入应按真实数量修正漂移并预留配额()
    {
        var tenant = await _db.UnfilteredSet<Tenant>().SingleAsync(t => t.Id == _tenantId);
        tenant.MaxDevices = 2;
        tenant.CurrentDeviceCount = 0;
        _db.Devices.Add(new Device
        {
            TenantId = _tenantId,
            DeviceCode = "existing-device",
            Name = "已有设备",
            Type = "电机"
        });
        await _db.SaveChangesAsync();

        var service = new DeviceImportService(
            _db,
            new Mock<IAuditLogService>().Object,
            LoggerFactory.Create(_ => { }).CreateLogger<DeviceImportService>());

        var result = await service.ExecuteImportAsync(
            "device_code,name,type\nimported-device,导入设备,电机\n",
            "devices.csv", _tenantId, Guid.NewGuid(), default);

        result.Imported.Should().Be(1);
        (await _db.UnfilteredSet<Device>().CountAsync()).Should().Be(2);
        (await _db.UnfilteredSet<Tenant>().AsNoTracking().SingleAsync(t => t.Id == _tenantId))
            .CurrentDeviceCount.Should().Be(2,
                "导入后计数应按真实设备数修正，而不是延续漂移前的旧值");
    }

    [Fact]
    public async Task 关系型数据库_设备计数器偏大但真实容量未满_导入不应误拒绝()
    {
        var tenant = await _db.UnfilteredSet<Tenant>().SingleAsync(t => t.Id == _tenantId);
        tenant.MaxDevices = 2;
        tenant.CurrentDeviceCount = 2;
        _db.Devices.Add(new Device
        {
            TenantId = _tenantId,
            DeviceCode = "existing-device",
            Name = "已有设备",
            Type = "电机"
        });
        await _db.SaveChangesAsync();

        var service = new DeviceImportService(
            _db,
            new Mock<IAuditLogService>().Object,
            LoggerFactory.Create(_ => { }).CreateLogger<DeviceImportService>());

        var result = await service.ExecuteImportAsync(
            "device_code,name,type\nimported-after-drift,漂移后导入,电机\n",
            "devices.csv", _tenantId, Guid.NewGuid(), default);

        result.Imported.Should().Be(1,
            "偏大的展示计数器不应阻止真实设备数量未达到上限的导入");
        result.Errors.Should().NotContain(e => e.Message.Contains("配额"));
        (await _db.UnfilteredSet<Device>().CountAsync()).Should().Be(2);
        (await _db.UnfilteredSet<Tenant>().AsNoTracking().SingleAsync(t => t.Id == _tenantId))
            .CurrentDeviceCount.Should().Be(2);
    }

    [Fact]
    public async Task 关系型数据库_设备导入真实数量已满时_应拒绝而不是依据漂移计数超卖()
    {
        var tenant = await _db.UnfilteredSet<Tenant>().SingleAsync(t => t.Id == _tenantId);
        tenant.MaxDevices = 1;
        tenant.CurrentDeviceCount = 0;
        _db.Devices.Add(new Device
        {
            TenantId = _tenantId,
            DeviceCode = "existing-device",
            Name = "已有设备",
            Type = "电机"
        });
        await _db.SaveChangesAsync();

        var service = new DeviceImportService(
            _db,
            new Mock<IAuditLogService>().Object,
            LoggerFactory.Create(_ => { }).CreateLogger<DeviceImportService>());

        var result = await service.ExecuteImportAsync(
            "device_code,name,type\nblocked-device,不应导入,电机\n",
            "devices.csv", _tenantId, Guid.NewGuid(), default);

        result.Imported.Should().Be(0);
        result.Errors.Should().Contain(e => e.Message.Contains("配额"));
        (await _db.UnfilteredSet<Device>().CountAsync()).Should().Be(1);
        (await _db.UnfilteredSet<Tenant>().AsNoTracking().SingleAsync(t => t.Id == _tenantId))
            .CurrentDeviceCount.Should().Be(0,
                "拒绝导入时不得提前修改计数器");
    }

    private static IMapper CreateMapper()
    {
        var configuration = new MapperConfiguration(
            cfg => cfg.AddProfile<MappingProfile>(),
            Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        return configuration.CreateMapper();
    }

    public async Task DisposeAsync()
    {
        await _db.DisposeAsync();
        await _connection.DisposeAsync();
    }

    /// <summary>
    /// 固定租户上下文，模拟已认证请求的租户边界。
    /// </summary>
    private sealed class FixedTenantContext(Guid tenantId) : ITenantContext
    {
        public Guid TenantId { get; } = tenantId;
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.NewGuid();
    }
}
