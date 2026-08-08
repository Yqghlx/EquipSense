using EquipAI.Application.Interfaces;
using EquipAI.Application.Services;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Tests.Unit.TestHelpers;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Tests.Unit.Services;

/// <summary>
/// SubscriptionExpiryService 单元测试 — 验证订阅/试用到期处理逻辑。
///
/// 关键不变量：付费订阅到期应降级为【可用】Trial（5 设备免费版，SaaS 留存策略），
/// 而非 Expired。CanCreateResourceAsync 对 Expired/Frozen/Closed 直接拒绝创建，
/// 且 DeviceHealthRecalculation / SlaEscalation 等 HostedService 都 Where(Status != Expired) 跳过——
/// 原代码降级时误设 Status=Expired，导致降级配额 MaxDevices=5 永不生效（锁死创建）+ 监控失效。
///
/// 用 SQLite 而非 InMemory：InMemory 不强制 EF Core 全局查询过滤器，行为不稳定（见 #209）。
/// SQLite 共享 connection，跨 scope 的 DbContext 实例共享同一 db，复刻生产过滤行为。
/// </summary>
public class SubscriptionExpiryServiceTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private ServiceProvider _sp = null!;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseSqlite(_connection));
        // 后台服务的 scope 无 HTTP 上下文，ITenantContext 退化为 Guid.Empty（复刻生产 DI 回退分支）
        services.AddScoped<ITenantContext>(_ => new BackgroundTenantContext());
        services.AddScoped<ISubscriptionService, SubscriptionService>();
        services.AddLogging();
        _sp = services.BuildServiceProvider();

        using (var scope = _sp.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.Database.EnsureCreatedAsync();
        }
    }

    public async Task DisposeAsync()
    {
        await _sp.DisposeAsync();
        await _connection.DisposeAsync();
    }

    private SubscriptionExpiryService CreateService()
        => new(
            _sp.GetRequiredService<IServiceScopeFactory>(),
            new AlwaysAcquireLockProvider(),
            _sp.GetRequiredService<ILogger<SubscriptionExpiryService>>());

    [Fact]
    public async Task 到期付费订阅_应降级为可用Trial_配额生效可创建设备()
    {
        var expiredTenantId = Guid.NewGuid();
        var activeTenantId = Guid.NewGuid();

        using (var scope = _sp.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            // 到期付费租户：Professional，订阅已过期，当前 2 台设备（< 降级配额 5）
            db.Tenants.Add(new Tenant
            {
                Id = expiredTenantId,
                Name = "到期客户",
                Slug = "expired",
                Plan = TenantPlan.Professional,
                Status = TenantStatus.Active,
                SubscriptionEndsAt = DateTime.UtcNow.AddDays(-1),
                CurrentDeviceCount = 2,
                MaxDevices = 200,
                MaxUsers = 50,
                DataRetentionDays = 180,
            });
            // 对照：未到期付费租户，不应被处理
            db.Tenants.Add(new Tenant
            {
                Id = activeTenantId,
                Name = "活跃客户",
                Slug = "active",
                Plan = TenantPlan.Professional,
                Status = TenantStatus.Active,
                SubscriptionEndsAt = DateTime.UtcNow.AddDays(30),
                CurrentDeviceCount = 0,
                MaxDevices = 200,
            });
            await db.SaveChangesAsync();
        }

        var svc = CreateService();
        await svc.CheckAndProcessExpirationsAsync();

        // 到期租户降级为可用 Trial，对照租户不变
        using (var scope = _sp.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var expired = await db.Tenants.FirstAsync(t => t.Id == expiredTenantId);
            expired.Plan.Should().Be(TenantPlan.Trial);
            expired.Status.Should().Be(TenantStatus.Trial, "降级应保持可用；原 Expired 会锁死创建 + 跳过 HostedService 监控");
            expired.TrialEndsAt.Should().BeNull("降级是长期免费版非限时试用，避免 CanCreateResourceAsync 试用过期检查误锁");
            expired.MaxDevices.Should().Be(5);

            var active = await db.Tenants.FirstAsync(t => t.Id == activeTenantId);
            active.Status.Should().Be(TenantStatus.Active);
            active.Plan.Should().Be(TenantPlan.Professional);
        }

        // 关键不变量：降级后应可创建设备（配额 5 > 当前 2），原 Status=Expired 会让此返回 false（锁死）
        var subscriptionService = _sp.GetRequiredService<ISubscriptionService>();
        var canCreate = await subscriptionService.CanCreateResourceAsync(expiredTenantId, "device");
        canCreate.Should().BeTrue("降级为可用 Trial 后，配额 5 > 当前 2 台，应允许创建（原 Expired 锁死）");
    }

    [Fact]
    public async Task 试用期到期_应标记Expired_不允许创建资源()
    {
        var trialTenantId = Guid.NewGuid();

        using (var scope = _sp.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Tenants.Add(new Tenant
            {
                Id = trialTenantId,
                Name = "试用到期客户",
                Slug = "trial-expired",
                Plan = TenantPlan.Trial,
                Status = TenantStatus.Trial,
                TrialEndsAt = DateTime.UtcNow.AddDays(-1),  // 试用期已过
                CurrentDeviceCount = 0,
                MaxDevices = 5,
            });
            await db.SaveChangesAsync();
        }

        var svc = CreateService();
        await svc.CheckAndProcessExpirationsAsync();

        using var scope2 = _sp.CreateScope();
        var db2 = scope2.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenant = await db2.Tenants.FirstAsync(t => t.Id == trialTenantId);
        tenant.Status.Should().Be(TenantStatus.Expired, "试用到期应标记 Expired 冻结创建");

        // Expired 状态不允许创建资源（试用到期冻结，鼓励付费）
        var subscriptionService = _sp.GetRequiredService<ISubscriptionService>();
        var canCreate = await subscriptionService.CanCreateResourceAsync(trialTenantId, "device");
        canCreate.Should().BeFalse("试用到期 Expired 状态不允许创建资源");
    }

    /// <summary>
    /// 后台 scope 的租户上下文 — 无 HTTP 上下文时 DI 回退分支，TenantId=Guid.Empty
    /// </summary>
    private class BackgroundTenantContext : ITenantContext
    {
        public Guid TenantId => Guid.Empty;
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
