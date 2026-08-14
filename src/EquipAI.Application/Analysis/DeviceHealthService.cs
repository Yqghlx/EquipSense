using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
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
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<DeviceHealthService> _logger;

    private static readonly TimeSpan EvaluationWindow = TimeSpan.FromDays(7);
    private const int RecentTelemetrySampleSize = 100;
    private const int HealthRecalculationBatchSize = 500;

    public DeviceHealthService(
        AppDbContext db,
        ITenantContext tenantContext,
        ILogger<DeviceHealthService> logger)
    {
        _db = db;
        _tenantContext = tenantContext;
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
        var tenantId = _tenantContext.TenantId;

        // 维度一：状态分（30%）
        // 后台重算场景没有 HttpContext，需要绕过全局租户过滤器；但单设备入口仍必须绑定当前租户，
        // 不能因为设备 ID 全局唯一就允许当前用户读取其他租户设备。
        var device = await _db.Devices
            .IgnoreQueryFilters()
            .Where(d => d.Id == deviceId && d.TenantId == tenantId)
            .Select(d => new { d.Status })
            .FirstOrDefaultAsync(ct);
        if (device is null)
            return null;

        var statusScore = CalculateStatusScore(device.Status);

        // 维度二：告警分（40%）— 最近 7 天告警历史 + 当前活跃告警
        var since = DateTime.UtcNow - EvaluationWindow;
        var recentAlerts = await _db.Alerts
            .IgnoreQueryFilters()
            .Where(a => a.TenantId == tenantId
                     && a.DeviceId == deviceId
                     && a.OccurredAt >= since)
            .Select(a => new { a.Severity, a.Status })
            .ToListAsync(ct);

        var alertScore = CalculateAlertScore(recentAlerts.Select(a => new HealthAlertSample(
            deviceId, a.Severity, a.Status)));

        // 维度三：遥测质量分（30%）— 最近 N 条遥测的 good 比例
        // 用原生 SQL 查 TimescaleDB 窄表（IgnoreQueryFilters 避免后台无 HttpContext）
        var qualityScore = await CalculateTelemetryQualityScoreAsync(tenantId, deviceId, ct);

        // 加权汇总
        var rounded = CalculateTotalScore(statusScore, alertScore, qualityScore);

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

        // 与计算路径使用同一租户边界：后台 scope 需要 IgnoreQueryFilters，但单设备更新不能越过当前租户。
        var device = await _db.Devices
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(
                d => d.Id == deviceId && d.TenantId == _tenantContext.TenantId,
                ct);
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
        //
        // 按稳定主键排序分页而不是一次性 ToList：健康度重算是后台慢任务，租户设备数可能持续增长；
        // 每批独立查询、提交并清理跟踪器，避免设备实体和近期告警随租户规模线性堆积在应用内存中。
        var totalUpdated = 0;
        var page = 0;
        while (true)
        {
            ct.ThrowIfCancellationRequested();

            var devices = await _db.Devices
                .IgnoreQueryFilters()
                .Where(d => d.TenantId == tenantId)
                .OrderBy(d => d.Id)
                .Skip(checked(page * HealthRecalculationBatchSize))
                .Take(HealthRecalculationBatchSize)
                .ToListAsync(ct);

            if (devices.Count == 0)
                break;

            var deviceIds = devices.Select(d => d.Id).ToList();
            var since = DateTime.UtcNow - EvaluationWindow;

            // 按设备、严重级别和状态在数据库聚合告警，只把有限的分组行带回应用；否则一个大租户的
            // 七天告警历史会随告警量增长而占用不受控的内存。聚合结果仍保留原有每条告警的扣分语义。
            var recentAlertGroups = await _db.Alerts
                .IgnoreQueryFilters()
                .Where(a => a.TenantId == tenantId
                         && deviceIds.Contains(a.DeviceId)
                         && a.OccurredAt >= since)
                .GroupBy(a => new { a.DeviceId, a.Severity, a.Status })
                .Select(g => new HealthAlertAggregate(
                    g.Key.DeviceId,
                    g.Key.Severity,
                    g.Key.Status,
                    g.Count()))
                .ToListAsync(ct);

            var alertScores = recentAlertGroups
                .GroupBy(a => a.DeviceId)
                .ToDictionary(group => group.Key, group => CalculateAlertScore(group));

            // 每个设备只取最近 100 条遥测，再在内存中计算 good 比例；相关子查询由关系型数据库执行，
            // 保持单次查询且不会把租户数天的全部时序数据加载到应用内存。使用相关子查询而不是
            // GroupBy().SelectMany()，是因为 SQLite 与部分旧版 PostgreSQL 提供程序对后者的窗口函数翻译不一致。
            var qualityScores = await CalculateTelemetryQualityScoresAsync(tenantId, deviceIds, ct);

            foreach (var device in devices)
            {
                var alertScore = alertScores.GetValueOrDefault(device.Id, 100.0);
                var qualityScore = qualityScores.GetValueOrDefault(device.Id, 70.0);
                var score = CalculateTotalScore(
                    CalculateStatusScore(device.Status),
                    alertScore,
                    qualityScore);
                device.HealthScore = (decimal)score;
            }

            // 每批使用一个 SaveChanges 事务，避免每台设备一次事务；提交后清理跟踪器，保证下一批不继承
            // 已完成设备的实体状态。任务中途取消时允许已完成批次保留，下次重算会幂等地覆盖结果。
            await _db.SaveChangesAsync(ct);
            totalUpdated += devices.Count;
            _db.ChangeTracker.Clear();

            if (devices.Count < HealthRecalculationBatchSize)
                break;

            page++;
        }

        if (totalUpdated == 0)
            _logger.LogInformation("租户 {TenantId} 没有设备需要更新健康度", tenantId);
        else
            _logger.LogInformation("已批量更新 {Count} 台设备健康度（租户 {TenantId}）", totalUpdated, tenantId);

        return totalUpdated;
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
    private async Task<double> CalculateTelemetryQualityScoreAsync(
        Guid tenantId,
        Guid deviceId,
        CancellationToken ct)
    {
        try
        {
            // 后台 scope 下需绕过全局过滤器，但遥测仍按租户和设备双重限定，避免质量分跨租户串线。
            var recent = await _db.DeviceTelemetry
                .IgnoreQueryFilters()
                .Where(t => t.TenantId == tenantId && t.DeviceId == deviceId)
                .OrderByDescending(t => t.Time)
                .Take(RecentTelemetrySampleSize)
                .Select(t => t.Quality)
                .ToListAsync(ct);

            if (recent.Count == 0)
                return 70.0; // 无数据设备给中性分，避免误判为 0

            var goodCount = recent.Count(q => q == "good");
            return (double)goodCount / recent.Count * 100;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // 请求/宿主已取消时必须保留取消语义，不能把取消误降级为中性健康分。
            throw;
        }
        catch (Exception ex)
        {
            // TimescaleDB 超级表在 InMemory 测试环境可能不可用，降级为中性分
            _logger.LogDebug(ex, "遥测质量查询失败，设备 {DeviceId} 使用中性分", deviceId);
            return 70.0;
        }
    }

    /// <summary>按设备状态计算状态维度分数。</summary>
    private static double CalculateStatusScore(DeviceStatus status) => status switch
    {
        DeviceStatus.Online => 100.0,
        DeviceStatus.Maintenance => 75.0,
        _ => 50.0,
    };

    /// <summary>按告警严重级别和处理状态计算告警维度分数。</summary>
    private static double CalculateAlertScore(IEnumerable<HealthAlertSample> alerts)
    {
        var penalty = 0.0;
        foreach (var alert in alerts)
        {
            penalty += alert.Severity switch
            {
                AlertSeverity.Critical => 25.0,
                AlertSeverity.High => 10.0,
                AlertSeverity.Normal => 4.0,
                _ => 1.0,
            };

            // 活跃告警额外扣分（仍未处理的告警影响更大）
            if (alert.Status == AlertStatus.Active)
                penalty += 5.0;
        }

        return Math.Max(0, 100 - penalty);
    }

    /// <summary>
    /// 按数据库聚合后的告警分组计算告警维度分数。
    /// 每组的扣分乘以组内数量，保持与逐条扫描完全相同的评分规则。
    /// </summary>
    private static double CalculateAlertScore(IEnumerable<HealthAlertAggregate> alertGroups)
    {
        var penalty = 0.0;
        foreach (var alertGroup in alertGroups)
        {
            var perAlertPenalty = alertGroup.Severity switch
            {
                AlertSeverity.Critical => 25.0,
                AlertSeverity.High => 10.0,
                AlertSeverity.Normal => 4.0,
                _ => 1.0,
            };

            if (alertGroup.Status == AlertStatus.Active)
                perAlertPenalty += 5.0;

            penalty += perAlertPenalty * alertGroup.Count;
        }

        return Math.Max(0, 100 - penalty);
    }

    /// <summary>按三维权重计算并四舍五入最终健康度。</summary>
    private static double CalculateTotalScore(double statusScore, double alertScore, double qualityScore)
    {
        var total = statusScore * 0.3 + alertScore * 0.4 + qualityScore * 0.3;
        return Math.Round(Math.Clamp(total, 0, 100), 1);
    }

    /// <summary>
    /// 批量计算每台设备的遥测质量分。
    /// 每个设备最多返回最近 100 条，避免健康度定时任务随着历史遥测量无限增长。
    /// </summary>
    private async Task<Dictionary<Guid, double>> CalculateTelemetryQualityScoresAsync(
        Guid tenantId,
        IReadOnlyCollection<Guid> deviceIds,
        CancellationToken ct)
    {
        try
        {
            var recent = await _db.DeviceTelemetry
                .IgnoreQueryFilters()
                .Where(t => t.TenantId == tenantId
                         && deviceIds.Contains(t.DeviceId)
                         && _db.DeviceTelemetry
                             .IgnoreQueryFilters()
                             .Count(newer => newer.TenantId == tenantId
                                          && newer.DeviceId == t.DeviceId
                                          && newer.Time > t.Time) < RecentTelemetrySampleSize)
                .Select(t => new { t.DeviceId, t.Quality })
                .ToListAsync(ct);

            return recent
                .GroupBy(item => item.DeviceId)
                .ToDictionary(
                    group => group.Key,
                    group => (double)group.Count(item => item.Quality == "good") / group.Count() * 100);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // 后台服务关闭时传播取消，避免把已取消的数据库查询伪装成成功降级。
            throw;
        }
        catch (Exception ex)
        {
            // 与单设备计算一致：时序存储短暂不可用时使用中性分，不阻断状态/告警维度更新。
            _logger.LogDebug(ex, "批量遥测质量查询失败，租户 {TenantId} 使用中性分", tenantId);
            return [];
        }
    }

    /// <summary>批量健康度计算使用的告警最小投影。</summary>
    private readonly record struct HealthAlertSample(
        Guid DeviceId,
        AlertSeverity Severity,
        AlertStatus Status);

    /// <summary>数据库按设备、严重级别和状态聚合后的告警计数。</summary>
    private readonly record struct HealthAlertAggregate(
        Guid DeviceId,
        AlertSeverity Severity,
        AlertStatus Status,
        int Count);
}
