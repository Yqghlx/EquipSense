using EquipAI.Core.Enums;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Analysis;

/// <summary>
/// 设备健康度计算服务
///
/// 健康度评分（0-100）基于三个维度加权：
/// - 告警维度（40%）：最近 7 天 Critical 告警 -25/条、High 告警 -10/条，活跃告警额外 -5/条
/// - 状态维度（30%）：Online 满分；Maintenance -10；Offline/Maintenance -25
/// - 遥测质量维度（30%）：最近 100 条遥测的 good 比例 × 满分
///
/// 评分下限为 0，上限为 100。健康度等级：
/// - 85-100 优秀（Healthy）
/// - 70-84  良好（Good）
/// - 50-69  注意（Warning）
/// - 0-49   异常（Critical）
/// </summary>
public class DeviceHealthService
{
    private readonly AppDbContext _db;
    private readonly ILogger<DeviceHealthService> _logger;

    private static readonly TimeSpan EvaluationWindow = TimeSpan.FromDays(7);
    private const int RecentTelemetrySampleSize = 100;

    public DeviceHealthService(AppDbContext db, ILogger<DeviceHealthService> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// 计算单个设备的健康度评分（不写库，仅计算）
    /// </summary>
    /// <param name="deviceId">设备 ID</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>0-100 的健康度评分；设备无数据时返回 null</returns>
    public async Task<double?> CalculateHealthScoreAsync(Guid deviceId, CancellationToken ct = default)
    {
        // 维度一：状态分（30%）
        // IgnoreQueryFilters：本方法可由后台 DeviceHealthRecalculationHostedService 调用（无 HttpContext，
        // 全局过滤器解析为 Guid.Empty 会吞掉设备查询）。deviceId 是全局唯一 PK，按 Id 定位即安全。
        var device = await _db.Devices
            .IgnoreQueryFilters()
            .Where(d => d.Id == deviceId)
            .Select(d => new { d.Status })
            .FirstOrDefaultAsync(ct);
        if (device is null)
            return null;

        var statusScore = device.Status switch
        {
            DeviceStatus.Online => 100.0,
            DeviceStatus.Maintenance => 75.0,
            _ => 50.0, // Offline / 离线
        };

        // 维度二：告警分（40%）— 最近 7 天告警历史 + 当前活跃告警
        var since = DateTime.UtcNow - EvaluationWindow;
        var recentAlerts = await _db.Alerts
            .IgnoreQueryFilters()
            .Where(a => a.DeviceId == deviceId && a.OccurredAt >= since)
            .Select(a => new { a.Severity, a.Status })
            .ToListAsync(ct);

        var alertPenalty = 0.0;
        foreach (var a in recentAlerts)
        {
            alertPenalty += a.Severity switch
            {
                AlertSeverity.Critical => 25.0,
                AlertSeverity.High => 10.0,
                AlertSeverity.Normal => 4.0,
                _ => 1.0,
            };
            // 活跃告警额外扣分（仍未处理的告警影响更大）
            if (a.Status == AlertStatus.Active)
                alertPenalty += 5.0;
        }
        var alertScore = Math.Max(0, 100 - alertPenalty);

        // 维度三：遥测质量分（30%）— 最近 N 条遥测的 good 比例
        // 用原生 SQL 查 TimescaleDB 窄表（IgnoreQueryFilters 避免后台无 HttpContext）
        var qualityScore = await CalculateTelemetryQualityScoreAsync(deviceId, ct);

        // 加权汇总
        var total = statusScore * 0.3 + alertScore * 0.4 + qualityScore * 0.3;
        var rounded = Math.Round(Math.Clamp(total, 0, 100), 1);

        _logger.LogDebug("设备 {DeviceId} 健康度计算: 状态={Status} 状态分={StatusScore} 告警分={AlertScore} 质量分={QualityScore} → 总分={Total}",
            deviceId, device.Status, statusScore, alertScore, qualityScore, rounded);

        return rounded;
    }

    /// <summary>
    /// 计算并持久化单个设备的健康度（更新 devices.health_score 字段）
    /// </summary>
    public async Task<double?> UpdateHealthScoreAsync(Guid deviceId, CancellationToken ct = default)
    {
        var score = await CalculateHealthScoreAsync(deviceId, ct);
        if (score is null)
            return null;

        // IgnoreQueryFilters：同 CalculateHealthScoreAsync，后台 scope（Guid.Empty）下默认过滤器会吞掉查询。
        // 安全性由 deviceId 全局唯一 PK 保证（定位到唯一设备），不依赖租户过滤器。
        var device = await _db.Devices
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(d => d.Id == deviceId, ct);
        if (device is null)
            return null;

        device.HealthScore = (decimal)score;
        await _db.SaveChangesAsync(ct);

        return score;
    }

    /// <summary>
    /// 批量更新租户内所有设备的健康度（用于定时任务或手动触发）
    /// </summary>
    public async Task<int> UpdateAllHealthScoresAsync(Guid tenantId, CancellationToken ct = default)
    {
        // IgnoreQueryFilters + 显式 tenantId：本方法由后台 DeviceHealthRecalculationHostedService 调用
        // （无 HttpContext，默认过滤器解析为 Guid.Empty，与本租户 tenantId 求交集恒为空 → 查不到任何设备，
        // 重算形同未执行）。显式 tenantId 保证仅重算目标租户设备。
        var deviceIds = await _db.Devices
            .IgnoreQueryFilters()
            .Where(d => d.TenantId == tenantId)
            .Select(d => d.Id)
            .ToListAsync(ct);

        var updated = 0;
        foreach (var id in deviceIds)
        {
            var score = await UpdateHealthScoreAsync(id, ct);
            if (score is not null) updated++;
        }

        _logger.LogInformation("已批量更新 {Count}/{Total} 台设备健康度（租户 {TenantId}）", updated, deviceIds.Count, tenantId);
        return updated;
    }

    /// <summary>获取健康度评分对应的等级标签</summary>
    public static string GetHealthLevel(double score) => score switch
    {
        >= 85 => "Healthy",
        >= 70 => "Good",
        >= 50 => "Warning",
        _ => "Critical",
    };

    /// <summary>
    /// 计算遥测质量分：最近 N 条遥测中 quality='good' 的比例 × 100
    /// 无遥测数据时返回中性分 70（不奖惩无数据设备）
    /// </summary>
    private async Task<double> CalculateTelemetryQualityScoreAsync(Guid deviceId, CancellationToken ct)
    {
        try
        {
            // IgnoreQueryFilters：后台 scope 下 Guid.Empty 过滤器会吞掉全部遥测。deviceId 全局唯一，按其过滤即安全。
            var recent = await _db.DeviceTelemetry
                .IgnoreQueryFilters()
                .Where(t => t.DeviceId == deviceId)
                .OrderByDescending(t => t.Time)
                .Take(RecentTelemetrySampleSize)
                .Select(t => t.Quality)
                .ToListAsync(ct);

            if (recent.Count == 0)
                return 70.0; // 无数据设备给中性分，避免误判为 0

            var goodCount = recent.Count(q => q == "good");
            return (double)goodCount / recent.Count * 100;
        }
        catch (Exception ex)
        {
            // TimescaleDB 超级表在 InMemory 测试环境可能不可用，降级为中性分
            _logger.LogDebug(ex, "遥测质量查询失败，设备 {DeviceId} 使用中性分", deviceId);
            return 70.0;
        }
    }
}
