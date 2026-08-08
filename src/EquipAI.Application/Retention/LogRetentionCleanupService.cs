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
        var oldAuditLogs = await db.AuditLogs.IgnoreQueryFilters()
            .Where(a => a.CreatedAt < auditCutoff)
            .ToListAsync(ct);
        if (oldAuditLogs.Count > 0)
        {
            db.AuditLogs.RemoveRange(oldAuditLogs);
            Logger.LogInformation("清理 {Count} 条过期审计日志（保留 {Days} 天）", oldAuditLogs.Count, auditDays);
        }

        var notifCutoff = DateTime.UtcNow.AddDays(-notificationDays);
        var oldNotifications = await db.Notifications.IgnoreQueryFilters()
            .Where(n => n.CreatedAt < notifCutoff)
            .ToListAsync(ct);
        if (oldNotifications.Count > 0)
        {
            db.Notifications.RemoveRange(oldNotifications);
            Logger.LogInformation("清理 {Count} 条过期通知（保留 {Days} 天）", oldNotifications.Count, notificationDays);
        }

        await db.SaveChangesAsync(ct);
    }
}


