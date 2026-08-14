using EquipAI.Application.Hosting;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Retention;

/// <summary>
/// 日志保留期清理后台服务
///
/// 定期清理超过保留期的 audit_logs（审计日志）与 notifications（站内通知）。这两类是高频增长的
/// 全局日志型表：audit_logs 由全局 AuditActionFilter 对每个写操作记录，notifications 由每个告警/
/// 工单/设备事件产生。与 device_telemetry（已有 TelemetryCleanupService）不同，这两类此前**无任何
/// 清理任务**——7×24 工业系统长期运行必然磁盘满 → PostgreSQL 崩溃 → 整个系统不可用。
///
/// 保留期从配置读取（Retention:AuditLogDays 默认 365 天满足 ISO 27001 / IEC 62443 合规留存要求；
/// Retention:NotificationDays 默认 90 天，通知是瞬态信息，短期保留即可）。每天凌晨 4 点执行
/// （错开 TelemetryCleanupService 的 3 点，避免清理任务集中争用数据库）。
/// 多实例部署下通过分布式锁保证仅一个实例执行清理（避免重复删除 + 重复 DB 负载）。
/// </summary>
public class LogRetentionCleanupService : LockedTimerService
{
    /// <summary>
    /// 非关系型测试提供程序的删除批次大小。
    /// 生产数据库走 ExecuteDeleteAsync，不会把过期日志加载到应用内存；批量回退只用于不支持集合删除的提供程序。
    /// </summary>
    private const int FallbackDeleteBatchSize = 1000;

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _configuration;

    public LogRetentionCleanupService(
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration,
        IDistributedLockProvider lockProvider,
        ILogger<LogRetentionCleanupService> logger)
        : base(lockProvider, logger, lockResource: "log-retention-cleanup", lockExpiry: TimeSpan.FromMinutes(10))
    {
        _scopeFactory = scopeFactory;
        _configuration = configuration;
    }

    /// <summary>
    /// 调度：每天凌晨 4 点执行（错开遥测清理的 3 点，避免清理任务集中）。
    /// 首次也等到下一个 4 点；启动当日若已过 4 点则等到次日。
    /// </summary>
    protected override Task<TimeSpan> ComputeNextDelayAsync(bool isFirst, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var nextRun = now.Date.AddDays(1).AddHours(4);
        var delay = nextRun - now;
        Logger.LogInformation("下次日志清理时间: {NextRun}", nextRun);
        return Task.FromResult(delay);
    }

    /// <summary>
    /// 基类回调：持锁后执行清理。委托给 <see cref="CleanupAsync"/> 以便单元测试直接验证清理逻辑。
    /// </summary>
    protected override Task ExecuteWorkAsync(CancellationToken ct) => CleanupAsync(ct);

    /// <summary>
    /// 清理超过保留期的 audit_logs 与 notifications。
    /// 用 IgnoreQueryFilters：后台清理所有租户的旧记录（这两类是全局日志，非租户业务数据，
    /// 保留期统一，不按租户套餐区分——区别于按租户 DataRetentionDays 的遥测清理）。
    /// 设为 public 以便单元测试直接验证清理逻辑（基类保证仅持锁实例经 ExecuteWorkAsync 调用）。
    /// </summary>
    public async Task CleanupAsync(CancellationToken ct = default)
    {
        var auditDays = _configuration.GetValue("Retention:AuditLogDays", 365);
        var notificationDays = _configuration.GetValue("Retention:NotificationDays", 90);

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var auditCutoff = DateTime.UtcNow.AddDays(-auditDays);
        var deletedAuditLogs = await DeleteExpiredAsync(
            db,
            db.AuditLogs.IgnoreQueryFilters().Where(a => a.CreatedAt < auditCutoff),
            db.AuditLogs,
            ct);
        if (deletedAuditLogs > 0)
        {
            Logger.LogInformation("清理 {Count} 条过期审计日志（保留 {Days} 天）", deletedAuditLogs, auditDays);
        }

        var notifCutoff = DateTime.UtcNow.AddDays(-notificationDays);
        var deletedNotifications = await DeleteExpiredAsync(
            db,
            db.Notifications.IgnoreQueryFilters().Where(n => n.CreatedAt < notifCutoff),
            db.Notifications,
            ct);
        if (deletedNotifications > 0)
        {
            Logger.LogInformation("清理 {Count} 条过期通知（保留 {Days} 天）", deletedNotifications, notificationDays);
        }

        // 关系型数据库的 ExecuteDeleteAsync 已经直接提交删除；非关系型回退在批次内部保存。
    }

    /// <summary>
    /// 删除满足条件的旧记录。
    ///
    /// 关系型数据库必须使用服务端集合删除：日志表可能远大于应用内存，先 ToList 再 RemoveRange
    /// 会把清理任务本身变成 OOM 风险。非关系型提供程序仅为单元测试保留有限批次回退，避免测试
    /// 适配器为了实现删除而改变生产路径。
    /// </summary>
    private static async Task<int> DeleteExpiredAsync<TEntity>(
        AppDbContext db,
        IQueryable<TEntity> expiredQuery,
        DbSet<TEntity> entitySet,
        CancellationToken ct)
        where TEntity : class
    {
        if (db.Database.IsRelational())
            return await expiredQuery.ExecuteDeleteAsync(ct);

        var totalDeleted = 0;
        while (true)
        {
            var batch = await expiredQuery
                .Take(FallbackDeleteBatchSize)
                .ToListAsync(ct);
            if (batch.Count == 0)
                break;

            entitySet.RemoveRange(batch);
            await db.SaveChangesAsync(ct);
            totalDeleted += batch.Count;
        }

        return totalDeleted;
    }
}

