using EquipAI.Core.Enums;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Analysis;

/// <summary>
/// OEE（设备综合效率）计算服务
///
/// OEE = Availability × Performance × Quality，三维度均为 0-1 比率
///
/// 重要说明（v1.3.0 修复）：
/// 这里的 OEE 是"简化版"，并非严格工业 OEE。
/// - Availability 用"瞬时在线设备比例"代理，不是真正的"运行时间 / 计划运行时间"
///   后续接入设备状态历史遥测后可改为基于时间窗口的真实可用率
/// - Performance 用最近 air_flow 遥测均值 / 标称产能
/// - Quality 用"无 Critical 告警设备比例"代理，不是真正的"良品率"
/// 命名保留是为了 API 兼容性，前端展示时需注明"基于实时状态的近似值"
/// </summary>
public class OeeService
{
    private readonly AppDbContext _db;
    private readonly ILogger<OeeService> _logger;

    /// <summary>空压机标称排气量（m³/min），作为 Performance 基准</summary>
    private const double NominalAirFlow = 20.0;

    /// <summary>性能评估取最近多少条 air_flow 遥测</summary>
    private const int PerformanceSampleSize = 50;

    public OeeService(AppDbContext db, ILogger<OeeService> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// 计算租户整体 OEE
    /// </summary>
    /// <param name="tenantId">租户 ID（EF 全局过滤器已自动附加 WHERE TenantId = @tenantId）</param>
    public virtual async Task<OeeResult> CalculateAsync(Guid tenantId, CancellationToken ct = default)
    {
        // 维度一：Availability — 瞬时在线设备占比（简化版，不是工业可用率）
        // 注意：依赖 EF Core 全局查询过滤器自动加 WHERE TenantId = @current
        var devices = await _db.Devices
            .Select(d => new { d.Status })
            .ToListAsync(ct);
        var totalDevices = devices.Count;
        var onlineDevices = devices.Count(d => d.Status == DeviceStatus.Online);
        var availability = totalDevices > 0 ? (double)onlineDevices / totalDevices : 0;

        // 维度二：Performance — 平均 air_flow 达标率
        var (performance, recentFlowCount) = await CalculatePerformanceAsync(tenantId, ct);

        // 维度三：Quality — 无 Critical 未解决告警的设备占比
        // 活跃告警定义 = Active（已触发未确认）+ Acknowledged（已确认未解决），与 DashboardStatsService 一致。
        //   修复历史：
        //     · v1.3.0：原代码用 IgnoreQueryFilters() 绕过租户过滤器，租户 A 的 Quality 被租户 B 污染 —
        //       多租户安全漏洞；现使用默认过滤器严格限制在当前租户内。
        //     · 本次：原代码只查 Active 漏算 Acknowledged，运维「确认」一条 Critical 告警后 Quality 立即虚高
        //       （误以为故障已解决，实际设备仍带病运行）——与 DashboardStatsService 活跃告警定义不对称。补齐 Active||Acknowledged。
        var devicesWithCriticalAlert = await _db.Alerts
            .Where(a => (a.Status == AlertStatus.Active || a.Status == AlertStatus.Acknowledged) && a.Severity == AlertSeverity.Critical)
            .Select(a => a.DeviceId)
            .Distinct()
            .CountAsync(ct);
        var quality = totalDevices > 0
            ? Math.Max(0, 1.0 - (double)devicesWithCriticalAlert / totalDevices)
            : 1.0;

        var oee = availability * performance * quality;

        return new OeeResult
        {
            Oee = Math.Round(oee * 100, 1),
            Availability = Math.Round(availability * 100, 1),
            Performance = Math.Round(performance * 100, 1),
            Quality = Math.Round(quality * 100, 1),
            TotalDevices = totalDevices,
            OnlineDevices = onlineDevices,
            EvaluatedAt = DateTime.UtcNow,
            // 关键修复：标记为近似值，避免客户误把简化版 OEE 当作严格工业指标用于 KPI 考核
            IsApproximate = true,
            ApproximationNotes = new()
            {
                ["availability"] = "瞬时在线设备比例（非真实计划运行时间）",
                ["performance"] = recentFlowCount > 0
                    ? $"最近 {recentFlowCount} 条 air_flow 均值 / 标称产能"
                    : "无 air_flow 遥测数据，Performance 显示为 0",
                ["quality"] = "无 Critical 活跃告警设备占比（非真实良品率）",
            },
            HasInsufficientData = recentFlowCount == 0 || totalDevices == 0,
        };
    }

    /// <summary>
    /// 计算性能指数：租户所有设备最近 air_flow 均值 / 标称产能，clamp 到 [0,1]
    /// 性能 = min(1, 实际产能 / 标称产能)
    ///
    /// 修复历史（v1.3.0）：
    ///   原代码无遥测时返回 1.0（满性能），这是误导性的"乐观假设"，
    ///   会让用户以为设备性能正常但其实根本没数据。
    ///   现在改为：无遥测时返回 0，让前端展示"数据不足"提示。
    ///
    /// 返回值元组：(性能比率, 用于计算的样本数量)。样本数量供上层判断是否数据不足。
    /// </summary>
    private async Task<(double performance, int sampleCount)> CalculatePerformanceAsync(Guid tenantId, CancellationToken ct)
    {
        try
        {
            // 取租户内所有 air_flow 遥测的最近 N 条均值
            var recentFlows = await _db.DeviceTelemetry
                .Where(t => t.TenantId == tenantId && t.Metric == "air_flow" && t.Value != null)
                .OrderByDescending(t => t.Time)
                .Take(PerformanceSampleSize)
                .Select(t => t.Value!.Value)
                .ToListAsync(ct);

            if (recentFlows.Count == 0)
            {
                _logger.LogDebug("租户 {TenantId} 无 air_flow 遥测，Performance 返回 0", tenantId);
                return (0, 0);
            }

            var avgFlow = recentFlows.Average();
            return (Math.Clamp(avgFlow / NominalAirFlow, 0, 1.0), recentFlows.Count);
        }
        catch (Exception ex)
        {
            // TimescaleDB 在测试环境可能不可用，降级为 0（保守值）
            _logger.LogWarning(ex, "air_flow 遥测查询失败，租户 {TenantId} Performance 降级为 0", tenantId);
            return (0, 0);
        }
    }
}

/// <summary>OEE 计算结果</summary>
public sealed class OeeResult
{
    /// <summary>综合 OEE（百分比，0-100）= A × P × Q</summary>
    public double Oee { get; set; }

    /// <summary>可用率（百分比）</summary>
    public double Availability { get; set; }

    /// <summary>性能指数（百分比）</summary>
    public double Performance { get; set; }

    /// <summary>质量指数（百分比）</summary>
    public double Quality { get; set; }

    /// <summary>设备总数</summary>
    public int TotalDevices { get; set; }

    /// <summary>在线设备数</summary>
    public int OnlineDevices { get; set; }

    /// <summary>评估时间（UTC）</summary>
    public DateTime EvaluatedAt { get; set; }

    /// <summary>
    /// 是否为近似估算值
    ///
    /// 关键修复：本系统的 OEE 是"简化版"，三维度均用代理指标（不是严格工业 OEE）：
    /// - Availability：瞬时在线设备比例（非真实计划运行时间）
    /// - Performance：最近 air_flow 均值 / 标称产能（非真实节拍）
    /// - Quality：无 Critical 告警设备占比（非真实良品率）
    ///
    /// 前端展示时必须基于此字段提示"近似估算"，避免客户把它当作严格 KPI 用于考核。
    /// </summary>
    public bool IsApproximate { get; set; }

    /// <summary>
    /// 是否数据不足（Performance 无遥测或无设备）
    /// 数据不足时 OEE 各维度会降级为 0，客户应理解为"未接入完整数据"而非"效率极低"。
    /// </summary>
    public bool HasInsufficientData { get; set; }

    /// <summary>
    /// 各维度的近似说明（key: availability/performance/quality, value: 中文说明）
    /// 供前端 tooltip 展示，让客户理解每个维度的算法局限性。
    /// </summary>
    public Dictionary<string, string> ApproximationNotes { get; set; } = new();
}
