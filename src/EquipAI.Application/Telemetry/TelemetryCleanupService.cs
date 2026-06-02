using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Telemetry;

/// <summary>
/// 遥测数据清理后台服务
/// 定期清理超过数据保留期限的遥测数据
/// 默认每天凌晨 3 点执行一次
/// </summary>
public class TelemetryCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TelemetryCleanupService> _logger;

    public TelemetryCleanupService(IServiceScopeFactory scopeFactory, ILogger<TelemetryCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("遥测数据清理服务已启动");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var now = DateTime.UtcNow;
                var nextRun = now.Date.AddDays(1).AddHours(3);
                var delay = nextRun - now;

                _logger.LogInformation("下次清理执行时间: {NextRun}（{Delay} 后）", nextRun, delay);

                await Task.Delay(delay, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            await CleanupAsync(stoppingToken);
        }

        _logger.LogInformation("遥测数据清理服务已停止");
    }

    /// <summary>
    /// 按租户数据保留天数清理过期遥测数据
    /// 使用 UnfilteredSet 绕过租户过滤器获取所有活跃租户，逐租户执行清理
    /// </summary>
    private async Task CleanupAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        _logger.LogInformation("开始清理过期遥测数据...");

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
                    _logger.LogInformation("租户 {TenantId}: 清理 {Count} 条过期遥测数据（保留 {Days} 天）",
                        tenant.Id, deleted, tenant.DataRetentionDays);
                    totalDeleted += deleted;
                }
            }

            _logger.LogInformation("遥测数据清理完成，共清理 {Total} 条记录", totalDeleted);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "遥测数据清理失败");
        }
    }
}
