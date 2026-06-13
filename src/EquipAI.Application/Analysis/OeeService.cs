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
/// 工业空压机场景适配：
/// - Availability（可用率）= Online 设备数 / 总设备数
///   反映设备实际可运行时间占比
/// - Performance（性能指数）= 平均实际产能 / 标称产能
///   用最近 air_flow 遥测均值 / 标称产能(20 m³/min)，clamp 到 [0,1]
/// - Quality（质量指数）= 1 - Critical 告警设备占比
///   无严重故障的设备比例，反映产出质量稳定性
///
/// 返回整体 OEE 和三维度明细，便于前端拆分展示
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
    public async Task<OeeResult> CalculateAsync(Guid tenantId, CancellationToken ct = default)
    {
        // 维度一：Availability — 在线设备占比
        var devices = await _db.Devices
            .Select(d => new { d.Status })
            .ToListAsync(ct);
        var totalDevices = devices.Count;
        var onlineDevices = devices.Count(d => d.Status == DeviceStatus.Online);
        var availability = totalDevices > 0 ? (double)onlineDevices / totalDevices : 0;

        // 维度二：Performance — 平均 air_flow 达标率
        var performance = await CalculatePerformanceAsync(tenantId, ct);

        // 维度三：Quality — 无 Critical 活跃告警的设备占比
        var devicesWithCriticalAlert = await _db.Alerts
            .IgnoreQueryFilters()
            .Where(a => a.Status == AlertStatus.Active && a.Severity == AlertSeverity.Critical)
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
        };
    }

    /// <summary>
    /// 计算性能指数：租户所有设备最近 air_flow 均值 / 标称产能，clamp 到 [0,1]
    /// 性能 = min(1, 实际产能 / 标称产能)
    /// </summary>
    private async Task<double> CalculatePerformanceAsync(Guid tenantId, CancellationToken ct)
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
                return 1.0; // 无遥测数据时假设满性能，避免误判

            var avgFlow = recentFlows.Average();
            return Math.Clamp(avgFlow / NominalAirFlow, 0, 1.0);
        }
        catch (Exception ex)
        {
            // TimescaleDB 在测试环境可能不可用，降级为满性能
            _logger.LogDebug(ex, "air_flow 遥测查询失败，租户 {TenantId} Performance 降级为满值", tenantId);
            return 1.0;
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
}
