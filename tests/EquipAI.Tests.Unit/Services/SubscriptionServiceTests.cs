using EquipAI.Application.Interfaces;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Tests.Unit.Services;

/// <summary>
/// 订阅管理服务单元测试
/// </summary>
public class SubscriptionServiceTests : IAsyncDisposable
{
    private readonly ServiceProvider _sp;

    public SubscriptionServiceTests()
    {
        var dbName = $"SubscriptionTest_{Guid.NewGuid()}";
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(dbName));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(Guid.Empty));
        services.AddLogging();
        services.AddScoped<ISubscriptionService, SubscriptionService>();
        _sp = services.BuildServiceProvider();
    }

    [Fact]
    public async Task GetSubscriptionAsync_应返回正确的计划信息()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        db.Add(new Tenant
        {
            Id = tenantId,
            Name = "测试租户",
            Slug = "test",
            Plan = TenantPlan.Professional,
            MaxDevices = 200,
            MaxUsers = 50,
        });
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<ISubscriptionService>();
        var sub = await service.GetSubscriptionAsync(tenantId);

        sub.Should().NotBeNull();
        sub.Plan.Should().Be("Professional");
        sub.MaxDevices.Should().Be(200);
        sub.MaxUsers.Should().Be(50);
        sub.PlanDisplayName.Should().Be("专业版");
    }

    [Fact]
    public async Task ChangePlanAsync_应更新计划并调整配额()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        db.Add(new Tenant
        {
            Id = tenantId,
            Name = "测试租户",
            Slug = "test2",
            Plan = TenantPlan.Basic,
            MaxDevices = 50,
            MaxUsers = 20,
        });
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<ISubscriptionService>();
        await service.ChangePlanAsync(tenantId, "Enterprise");

        // 使用 AsNoTracking 避免旧 change tracker 缓存干扰
        var updated = await db.UnfilteredSet<Tenant>()
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == tenantId);
        updated.Should().NotBeNull();
        updated!.Plan.Should().Be(TenantPlan.Enterprise);
        updated.MaxDevices.Should().Be(500);
        updated.MaxUsers.Should().Be(200);
        updated.DataRetentionDays.Should().Be(365);
    }

    [Fact]
    public async Task CanCreateResourceAsync_未超限应返回true()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        db.Add(new Tenant
        {
            Id = tenantId,
            Name = "测试租户",
            Slug = "test3",
            Plan = TenantPlan.Basic,
            MaxDevices = 50,
        });
        for (int i = 0; i < 5; i++)
        {
            db.Devices.Add(new Device
            {
                TenantId = tenantId,
                DeviceCode = $"DEV-{i}",
                Name = $"设备{i}",
                Type = "电机"
            });
        }
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<ISubscriptionService>();
        var canCreate = await service.CanCreateResourceAsync(tenantId, "device");

        canCreate.Should().BeTrue();
    }

    [Fact]
    public async Task CanCreateResourceAsync_已超限应返回false()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        db.Add(new Tenant
        {
            Id = tenantId,
            Name = "测试租户",
            Slug = "test4",
            Plan = TenantPlan.Basic,
            MaxDevices = 3,
            CurrentDeviceCount = 3,
        });
        for (var i = 0; i < 3; i++)
        {
            db.Devices.Add(new Device
            {
                TenantId = tenantId,
                DeviceCode = $"LIMIT-{i}",
                Name = $"已满设备{i}",
                Type = "电机"
            });
        }
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<ISubscriptionService>();
        var canCreate = await service.CanCreateResourceAsync(tenantId, "device");

        canCreate.Should().BeFalse();
    }

    [Fact]
    public async Task CanCreateResourceAsync_计数器偏大但真实数量未满_不应误拦截()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        db.Add(new Tenant
        {
            Id = tenantId,
            Name = "计数漂移租户",
            Slug = $"drift-high-{tenantId:N}",
            Plan = TenantPlan.Basic,
            MaxDevices = 2,
            CurrentDeviceCount = 2,
        });
        db.Devices.Add(new Device
        {
            TenantId = tenantId,
            DeviceCode = "DRIFT-001",
            Name = "真实设备",
            Type = "电机"
        });
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<ISubscriptionService>();
        var canCreate = await service.CanCreateResourceAsync(tenantId, "device");

        canCreate.Should().BeTrue("真实设备数只有 1 台，历史偏大的计数器不能阻断创建");
    }

    [Fact]
    public async Task CanCreateResourceAsync_计数器偏小但真实数量已满_不应放行()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        db.Add(new Tenant
        {
            Id = tenantId,
            Name = "计数偏小租户",
            Slug = $"drift-low-{tenantId:N}",
            Plan = TenantPlan.Basic,
            MaxDevices = 2,
            CurrentDeviceCount = 0,
        });
        for (var i = 0; i < 2; i++)
        {
            db.Devices.Add(new Device
            {
                TenantId = tenantId,
                DeviceCode = $"DRIFT-FULL-{i}",
                Name = $"满额设备{i}",
                Type = "电机"
            });
        }
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<ISubscriptionService>();
        var canCreate = await service.CanCreateResourceAsync(tenantId, "device");

        canCreate.Should().BeFalse("真实设备数已达到上限，偏小计数器不能放行创建");
    }

    [Fact]
    public async Task CanCreateResourceAsync_用户配额只统计启用用户()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        db.Add(new Tenant
        {
            Id = tenantId,
            Name = "用户席位租户",
            Slug = $"active-users-{tenantId:N}",
            Plan = TenantPlan.Basic,
            MaxUsers = 1,
            CurrentUserCount = 1,
        });
        db.Users.Add(new User
        {
            TenantId = tenantId,
            Username = "inactive-seat",
            PasswordHash = "test-hash",
            IsActive = false,
        });
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<ISubscriptionService>();
        var canCreate = await service.CanCreateResourceAsync(tenantId, "user");

        canCreate.Should().BeTrue("停用用户不再占用可用席位");
    }

    [Theory]
    [InlineData("device")]
    [InlineData("user")]
    public async Task CanCreateResourceAsync_零配额表示不限(string resourceType)
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        db.Add(new Tenant
        {
            Id = tenantId,
            Name = "不限配额租户",
            Slug = $"unlimited-{tenantId:N}",
            Plan = TenantPlan.Enterprise,
            MaxDevices = 0,
            MaxUsers = 0,
            CurrentDeviceCount = int.MaxValue,
            CurrentUserCount = int.MaxValue,
        });
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<ISubscriptionService>();
        var canCreate = await service.CanCreateResourceAsync(tenantId, resourceType);

        canCreate.Should().BeTrue("PlanDto 约定 0 表示不限，不能被误判为已用尽");
    }

    /// <summary>
    /// 测试用租户上下文，模拟 ITenantContext 接口
    /// </summary>
    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }

    public async ValueTask DisposeAsync() => await _sp.DisposeAsync();
}
