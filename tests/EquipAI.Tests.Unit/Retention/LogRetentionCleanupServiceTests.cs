using EquipAI.Application.Retention;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Tests.Unit.TestHelpers;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Data.Common;

namespace EquipAI.Tests.Unit.Retention;

/// <summary>
/// LogRetentionCleanupService 单元测试 — 验证 audit_logs 与 notifications 的保留期清理逻辑。
///
/// 关键不变量：用 IgnoreQueryFilters 跨租户清理。后台清理服务的 scope 无 HttpContext，
/// ITenantContext 退化为 Guid.Empty；若漏掉 IgnoreQueryFilters，全局租户过滤器（TenantId==Guid.Empty）
/// 会吞掉所有真实租户的记录，清理沦为空操作 → 长期运行磁盘满。
///
/// 必须用 SQLite 而非 InMemory：InMemory provider 不强制 EF Core 全局查询过滤器（见 #209 回归测试
/// <c>RootCauseAnalysisHandlerBackgroundScopeTests</c>），IgnoreQueryFilters 行为不稳定，会误绿。
/// SQLite 共享 connection，跨 scope 的 DbContext 实例共享同一 db，真实执行过滤器与 IgnoreQueryFilters。
/// </summary>
public class LogRetentionCleanupServiceTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private ServiceProvider _sp = null!;
    private readonly SelectCommandCounter _selectCommandCounter = new();

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();

        // 保留期：审计 365 天、通知 90 天（与 appsettings.json 默认值一致）
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Retention:AuditLogDays"] = "365",
                ["Retention:NotificationDays"] = "90",
            })
            .Build();

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o
            .UseSqlite(_connection)
            .AddInterceptors(_selectCommandCounter));
        // 后台清理服务的 scope 无 HTTP 上下文，ITenantContext 退化为 Guid.Empty（复刻生产 DI 回退分支）
        services.AddScoped<ITenantContext>(_ => new BackgroundTenantContext());
        services.AddLogging();
        services.AddSingleton<IConfiguration>(config);
        _sp = services.BuildServiceProvider();

        // 建表（audit_logs / notifications 等全部实体表）
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

    private LogRetentionCleanupService CreateService()
    {
        // 单元测试直接验证清理逻辑，用始终获取锁成功的 mock（生产由 Redis 锁互斥）
        var lockProvider = new AlwaysAcquireLockProvider();
        return new LogRetentionCleanupService(
            _sp.GetRequiredService<IServiceScopeFactory>(),
            _sp.GetRequiredService<IConfiguration>(),
            lockProvider,
            _sp.GetRequiredService<ILogger<LogRetentionCleanupService>>());
    }

    [Fact]
    public async Task CleanupAsync_清理超过保留期的审计日志_保留近期日志()
    {
        var svc = CreateService();

        // 播种：2 条超期（400 天）+ 1 条近期（10 天）
        using (var scope = _sp.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.AuditLogs.Add(new AuditLog { TenantId = Guid.NewGuid(), Action = "Create", ResourceType = "Device", CreatedAt = DateTime.UtcNow.AddDays(-400) });
            db.AuditLogs.Add(new AuditLog { TenantId = Guid.NewGuid(), Action = "Update", ResourceType = "Device", CreatedAt = DateTime.UtcNow.AddDays(-400) });
            db.AuditLogs.Add(new AuditLog { TenantId = Guid.NewGuid(), Action = "Delete", ResourceType = "Device", CreatedAt = DateTime.UtcNow.AddDays(-10) });
            await db.SaveChangesAsync();
        }

        await svc.CleanupAsync();

        using var assertScope = _sp.CreateScope();
        var db2 = assertScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var remaining = await db2.UnfilteredSet<AuditLog>().ToListAsync();
        remaining.Should().HaveCount(1, "超期记录应被清理，近期记录应保留");
        remaining[0].Action.Should().Be("Delete");
    }

    [Fact]
    public async Task CleanupAsync_清理超过保留期的通知_保留近期通知()
    {
        var svc = CreateService();

        using (var scope = _sp.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Notifications.Add(new Notification { TenantId = Guid.NewGuid(), UserId = Guid.NewGuid(), Title = "旧告警", Type = "alert", CreatedAt = DateTime.UtcNow.AddDays(-120) });
            db.Notifications.Add(new Notification { TenantId = Guid.NewGuid(), UserId = Guid.NewGuid(), Title = "新工单", Type = "workorder", CreatedAt = DateTime.UtcNow.AddDays(-5) });
            await db.SaveChangesAsync();
        }

        await svc.CleanupAsync();

        using var assertScope = _sp.CreateScope();
        var db2 = assertScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var remaining = await db2.UnfilteredSet<Notification>().ToListAsync();
        remaining.Should().HaveCount(1, "通知保留期 90 天，120 天前的应被清理");
        remaining[0].Title.Should().Be("新工单");
    }

    [Fact]
    public async Task CleanupAsync_应跨租户清理所有过期记录_不受全局过滤器影响()
    {
        var svc = CreateService();
        var tenantA = Guid.NewGuid();
        var tenantB = Guid.NewGuid();

        // 两个租户各一条超期审计 — 验证 IgnoreQueryFilters 跨租户清理
        using (var scope = _sp.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.AuditLogs.Add(new AuditLog { TenantId = tenantA, Action = "Create", ResourceType = "Device", CreatedAt = DateTime.UtcNow.AddDays(-400) });
            db.AuditLogs.Add(new AuditLog { TenantId = tenantB, Action = "Update", ResourceType = "Device", CreatedAt = DateTime.UtcNow.AddDays(-400) });
            await db.SaveChangesAsync();
        }

        await svc.CleanupAsync();

        using var assertScope = _sp.CreateScope();
        var db2 = assertScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var remaining = await db2.UnfilteredSet<AuditLog>().ToListAsync();
        // 若漏掉 IgnoreQueryFilters，后台 scope 的 TenantId=Guid.Empty 过滤器会吞掉两个租户的记录，
        // oldAuditLogs.Count=0 不删任何记录 → remaining 仍有 2 条 → 断言失败，捕获回归。
        remaining.Should().BeEmpty("IgnoreQueryFilters 应绕过租户过滤器，清理所有租户的过期记录");
    }

    [Fact]
    public async Task CleanupAsync_关系型数据库应使用集合删除而不是加载过期记录()
    {
        var svc = CreateService();

        using (var scope = _sp.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.AuditLogs.AddRange(
                Enumerable.Range(1, 20).Select(_ => new AuditLog
                {
                    TenantId = Guid.NewGuid(),
                    Action = "Create",
                    ResourceType = "Device",
                    CreatedAt = DateTime.UtcNow.AddDays(-400),
                }));
            db.Notifications.AddRange(
                Enumerable.Range(1, 20).Select(_ => new Notification
                {
                    TenantId = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    Title = "旧通知",
                    Type = "alert",
                    CreatedAt = DateTime.UtcNow.AddDays(-120),
                }));
            await db.SaveChangesAsync();
        }

        _selectCommandCounter.Reset();
        await svc.CleanupAsync();

        _selectCommandCounter.Count.Should().Be(0,
            "关系型数据库应在数据库侧集合删除过期记录，不能先把所有旧日志加载到应用内存");
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

    /// <summary>统计清理过程是否执行了读取旧记录的 SELECT。</summary>
    private sealed class SelectCommandCounter : DbCommandInterceptor
    {
        private int _count;

        public int Count => Volatile.Read(ref _count);

        public void Reset() => Interlocked.Exchange(ref _count, 0);

        public override InterceptionResult<DbDataReader> ReaderExecuting(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result)
        {
            CountSelect(command);
            return result;
        }

        public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result,
            CancellationToken cancellationToken = default)
        {
            CountSelect(command);
            return ValueTask.FromResult(result);
        }

        private void CountSelect(DbCommand command)
        {
            if (command.CommandText.TrimStart().StartsWith("SELECT", StringComparison.OrdinalIgnoreCase))
                Interlocked.Increment(ref _count);
        }
    }
}
