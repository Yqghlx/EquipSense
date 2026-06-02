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
        });
        for (int i = 0; i < 3; i++)
        {
            db.Devices.Add(new Device
            {
                TenantId = tenantId,
                DeviceCode = $"DEV-FULL-{i}",
                Name = $"满设备{i}",
                Type = "电机"
            });
        }
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<ISubscriptionService>();
        var canCreate = await service.CanCreateResourceAsync(tenantId, "device");

        canCreate.Should().BeFalse();
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
