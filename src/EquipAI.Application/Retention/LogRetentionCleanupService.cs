using EquipAI.Core.Entities;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
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
/// </summary>
public class LogRetentionCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<LogRetentionCleanupService> _logger;

    public LogRetentionCleanupService(
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration,
        ILogger<LogRetentionCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _configuration = configuration;
        _logger = logger;
    }

    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("日志保留期清理服务已启动");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var now = DateTime.UtcNow;
                // 每天凌晨 4 点执行（错开遥测清理的 3 点，避免清理任务集中）
                var nextRun = now.Date.AddDays(1).AddHours(4);
                var delay = nextRun - now;
                _logger.LogInformation("下次日志清理时间: {NextRun}", nextRun);
                await Task.Delay(delay, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            await CleanupAsync(stoppingToken);
        }

        _logger.LogInformation("日志保留期清理服务已停止");
    }

    /// <summary>
    /// 清理超过保留期的 audit_logs 与 notifications。
    /// 用 IgnoreQueryFilters：后台清理所有租户的旧记录（这两类是全局日志，非租户业务数据，
    /// 保留期统一，不按租户套餐区分——区别于按租户 DataRetentionDays 的遥测清理）。
    /// 设为 public 以便单元测试直接验证清理逻辑。
    /// </summary>
    public async Task CleanupAsync(CancellationToken ct = default)
    {
        var auditDays = _configuration.GetValue("Retention:AuditLogDays", 365);
        var notificationDays = _configuration.GetValue("Retention:NotificationDays", 90);

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        try
        {
            var auditCutoff = DateTime.UtcNow.AddDays(-auditDays);
            var oldAuditLogs = await db.AuditLogs.IgnoreQueryFilters()
                .Where(a => a.CreatedAt < auditCutoff)
                .ToListAsync(ct);
            if (oldAuditLogs.Count > 0)
            {
                db.AuditLogs.RemoveRange(oldAuditLogs);
                _logger.LogInformation("清理 {Count} 条过期审计日志（保留 {Days} 天）", oldAuditLogs.Count, auditDays);
            }

            var notifCutoff = DateTime.UtcNow.AddDays(-notificationDays);
            var oldNotifications = await db.Notifications.IgnoreQueryFilters()
                .Where(n => n.CreatedAt < notifCutoff)
                .ToListAsync(ct);
            if (oldNotifications.Count > 0)
            {
                db.Notifications.RemoveRange(oldNotifications);
                _logger.LogInformation("清理 {Count} 条过期通知（保留 {Days} 天）", oldNotifications.Count, notificationDays);
            }

            await db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            // 清理失败不得影响服务运行（下一周期重试）
            _logger.LogError(ex, "日志保留期清理失败");
        }
    }
}
