using EquipAI.Application.Hosting;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Telemetry;

/// <summary>
/// 遥测数据清理后台服务
/// 定期清理超过数据保留期限的遥测数据
/// 默认每天凌晨 3 点执行一次
/// 多实例部署下通过分布式锁保证仅一个实例执行清理（避免重复删除 + 重复 DB 负载）。
/// </summary>
public class TelemetryCleanupService : LockedTimerService
{
    private readonly IServiceScopeFactory _scopeFactory;

    public TelemetryCleanupService(
        IServiceScopeFactory scopeFactory,
        IDistributedLockProvider lockProvider,
        ILogger<TelemetryCleanupService> logger)
        : base(lockProvider, logger, lockResource: "telemetry-cleanup", lockExpiry: TimeSpan.FromMinutes(10))
    {
        _scopeFactory = scopeFactory;
    }

    /// <summary>
    /// 调度：每天凌晨 3 点执行（错开日志清理的 4 点，避免清理任务集中）。
    /// 首次也等到下一个 3 点；启动当日若已过 3 点则等到次日。
    /// </summary>
    protected override Task<TimeSpan> ComputeNextDelayAsync(bool isFirst, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var nextRun = now.Date.AddDays(1).AddHours(3);
        var delay = nextRun - now;
        Logger.LogInformation("下次清理执行时间: {NextRun}（{Delay} 后）", nextRun, delay);
        return Task.FromResult(delay);
    }

    /// <summary>
    /// 基类回调：持锁后执行清理。委托给 <see cref="CleanupAsync"/> 以便单元测试直接验证清理逻辑。
    /// </summary>
    protected override Task ExecuteWorkAsync(CancellationToken ct) => CleanupAsync(ct);

    /// <summary>
    /// 按租户数据保留天数清理过期遥测数据
    /// 使用 UnfilteredSet 绕过租户过滤器获取所有活跃租户，逐租户执行清理
    /// 设为 public 以便单元测试直接验证清理逻辑（基类保证仅持锁实例经 ExecuteWorkAsync 调用）。
    /// </summary>
    public async Task CleanupAsync(CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        Logger.LogInformation("开始清理过期遥测数据...");

        try
        {
            // 绕过租户过滤器，获取所有活跃租户及其数据保留天数
            var tenants = await db.UnfilteredSet<Core.Entities.Tenant>()
                .Where(t => t.IsActive)
                .Select(t => new { t.Id, t.DataRetentionDays })
                .ToListAsync(ct);

            var totalDeleted = 0;

            foreach (var tenant in tenants)
            {
                var cutoff = DateTime.UtcNow.AddDays(-tenant.DataRetentionDays);

                var deleted = await db.Database.ExecuteSqlRawAsync(
                    @"DELETE FROM device_telemetry
                      WHERE device_id IN (
                        SELECT id FROM devices WHERE tenant_id = {0}
                      ) AND time < {1}",
                    ct, tenant.Id, cutoff);

                if (deleted > 0)
                {
                    Logger.LogInformation("租户 {TenantId}: 清理 {Count} 条过期遥测数据（保留 {Days} 天）",
                        tenant.Id, deleted, tenant.DataRetentionDays);
                    totalDeleted += deleted;
                }
            }

            Logger.LogInformation("遥测数据清理完成，共清理 {Total} 条记录", totalDeleted);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "遥测数据清理失败");
        }
    }
}
