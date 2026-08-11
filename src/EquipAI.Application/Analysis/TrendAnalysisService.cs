using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using InfrastructureDeviceTelemetry = EquipAI.Infrastructure.Data.Entities.DeviceTelemetry;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Analysis;

/// <summary>
/// 趋势预警分析服务（Phase 5 新增）
///
/// 基于已有遥测数据做趋势预测，输出"指标 X 天后超阈值"的预警。
/// 使用线性回归计算趋势斜率，结合告警阈值预测超阈值时间。
///
/// 优势（相比 RUL 寿命预测）：
/// - 不需要大量故障数据训练模型
/// - 基于线性回归即可实现
/// - 输出明确可执行
/// </summary>
public class TrendAnalysisService
{
    private readonly AppDbContext _db;
    private readonly ILogger<TrendAnalysisService> _logger;

    public TrendAnalysisService(AppDbContext db, ILogger<TrendAnalysisService> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// 分析指定设备的指定指标趋势，预测是否会在未来 N 天内超阈值
    /// </summary>
    public async Task<TrendAnalysisResult?> AnalyzeTrendAsync(
        Guid deviceId, string metric, CancellationToken ct = default)
    {
        // 取最近 7 天的遥测数据，按小时聚合
        var since = DateTime.UtcNow.AddDays(-7);
        var rawData = await _db.DeviceTelemetry
            .Where(t => t.DeviceId == deviceId && t.Metric == metric && t.Time >= since && t.Value != null)
            .Select(t => new TrendSample(t.Time, t.Value!.Value))
            .ToListAsync(ct);

        // 样本不足时无需再查询阈值；这条路径常见于新接入设备，避免无意义的第二次数据库往返。
        if (rawData.Count < 10)
        {
            _logger.LogDebug("趋势分析样本不足: Device={DeviceId}, Metric={Metric}, Count={Count}", deviceId, metric, rawData.Count);
            return null;
        }

        var threshold = await GetAlertThresholdAsync(deviceId, metric, ct);

        return BuildTrendAnalysis(deviceId, metric, rawData, threshold);
    }

    /// <summary>
    /// 批量分析租户内所有设备的趋势预警
    /// </summary>
    public async Task<List<TrendAnalysisResult>> AnalyzeAllTrendsAsync(Guid tenantId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        // 找出最近有遥测数据的设备+指标组合
        var since = now.AddDays(-1);
        var activeMetrics = await _db.DeviceTelemetry
            .Where(t => t.TenantId == tenantId && t.Time >= since && t.Value != null)
            .Select(t => new { t.DeviceId, t.Metric })
            .Distinct()
            .ToListAsync(ct);

        if (activeMetrics.Count == 0)
        {
            _logger.LogInformation("趋势分析完成: 共分析 0 个指标，发现 0 个预警");
            return [];
        }

        // 批量读取所有活动指标的 7 天数据，避免 AnalyzeTrendAsync 按设备+指标重复访问数据库。
        var trendSince = now.AddDays(-7);
        var activePairsQuery = _db.DeviceTelemetry
            .Where(t => t.TenantId == tenantId && t.Time >= since && t.Value != null)
            .Select(t => new { t.DeviceId, t.Metric })
            .Distinct();
        var rawData = await (
            from telemetry in _db.DeviceTelemetry
            join pair in activePairsQuery
                on new { telemetry.DeviceId, telemetry.Metric }
                equals new { pair.DeviceId, pair.Metric }
            where telemetry.TenantId == tenantId
                  && telemetry.Time >= trendSince
                  && telemetry.Value != null
            select new
            {
                telemetry.DeviceId,
                telemetry.Metric,
                telemetry.Time,
                Value = telemetry.Value!.Value,
            })
            .ToListAsync(ct);

        // 一次性读取活动设备的阈值，内存中按严重级别选择与单指标分析相同的最高优先级规则。
        var activeDeviceIds = activeMetrics.Select(m => m.DeviceId).Distinct().ToList();
        var activeMetricNames = activeMetrics.Select(m => m.Metric).Distinct().ToList();
        var thresholdRows = await _db.AlertRules
            .Where(r => r.TenantId == tenantId
                        && r.DeviceId.HasValue
                        && activeDeviceIds.Contains(r.DeviceId.Value)
                        && activeMetricNames.Contains(r.Metric)
                        && r.Enabled
                        && r.Threshold != null)
            .Select(r => new
            {
                DeviceId = r.DeviceId!.Value,
                r.Metric,
                r.Threshold,
                r.Severity,
            })
            .ToListAsync(ct);
        var thresholds = thresholdRows
            .GroupBy(r => (r.DeviceId, r.Metric))
            .ToDictionary(
                g => g.Key,
                g => (double?)g.OrderByDescending(r => r.Severity).First().Threshold!.Value);

        var samplesByPair = rawData
            .GroupBy(t => (t.DeviceId, t.Metric))
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyList<TrendSample>)g
                    .Select(t => new TrendSample(t.Time, t.Value))
                    .ToList());
        var results = new List<TrendAnalysisResult>();
        foreach (var metric in activeMetrics)
        {
            if (!samplesByPair.TryGetValue((metric.DeviceId, metric.Metric), out var samples))
                continue;

            thresholds.TryGetValue((metric.DeviceId, metric.Metric), out var threshold);
            var analysis = BuildTrendAnalysis(metric.DeviceId, metric.Metric, samples, threshold);
            if (analysis is not null)
                results.Add(analysis);
        }

        // 只返回有预警的（将在 7 天内超阈值的）
        var warnings = results.Where(r => r.WillExceedThreshold).ToList();
        _logger.LogInformation("趋势分析完成: 共分析 {Total} 个指标，发现 {Warnings} 个预警", results.Count, warnings.Count);
        return warnings;
    }

    /// <summary>
    /// 使用已加载的遥测样本计算趋势，供单指标和批量分析共用，确保两条路径的业务语义一致。
    /// </summary>
    private TrendAnalysisResult? BuildTrendAnalysis(
        Guid deviceId,
        string metric,
        IReadOnlyCollection<TrendSample> rawData,
        double? threshold)
    {
        if (rawData.Count < 10)
        {
            _logger.LogDebug("趋势分析样本不足: Device={DeviceId}, Metric={Metric}, Count={Count}", deviceId, metric, rawData.Count);
            return null;
        }

        // 按小时聚合（取每小时均值），减少噪声
        var hourlyData = rawData
            .GroupBy(d => new DateTime(d.Time.Year, d.Time.Month, d.Time.Day, d.Time.Hour, 0, 0))
            .Select(g => new TrendPoint(g.Key, g.Average(d => d.Value)))
            .OrderBy(p => p.Timestamp)
            .ToList();

        if (hourlyData.Count < 5)
            return null;

        // 线性回归计算趋势
        var (slope, intercept) = LinearRegression(hourlyData);
        var currentValue = hourlyData[^1].Value;
        var avgValue = hourlyData.Average(p => p.Value);
        var minValue = hourlyData.Min(p => p.Value);
        var maxValue = hourlyData.Max(p => p.Value);

        // 预测超阈值时间（如果斜率 > 0 且有阈值）
        var daysToThreshold = (double?)null;
        var willExceedThreshold = false;
        if (threshold.HasValue && slope > 0.0001)
        {
            // y = slope * x + intercept，x 以小时为单位
            // 求解 y = threshold 时的 x（相对于最后一个数据点的小时偏移）
            var hoursSinceStart = (hourlyData[^1].Timestamp - hourlyData[0].Timestamp).TotalHours;
            var currentValueAtEnd = slope * hoursSinceStart + intercept;
            if (currentValueAtEnd < threshold.Value)
            {
                var hoursToThreshold = (threshold.Value - intercept) / slope - hoursSinceStart;
                if (hoursToThreshold > 0)
                {
                    daysToThreshold = hoursToThreshold / 24.0;
                    willExceedThreshold = daysToThreshold <= 7; // 7 天内会超阈值才算预警
                }
            }
        }

        // 计算变化率（百分比）
        var changeRate = avgValue != 0 ? (slope * 24 / avgValue) * 100 : 0; // 每天变化百分比

        return new TrendAnalysisResult
        {
            DeviceId = deviceId,
            Metric = metric,
            CurrentValue = Math.Round(currentValue, 2),
            AverageValue = Math.Round(avgValue, 2),
            MinValue = Math.Round(minValue, 2),
            MaxValue = Math.Round(maxValue, 2),
            TrendSlope = Math.Round(slope * 24, 4), // 转为每天的变化量
            ChangeRatePercent = Math.Round(changeRate, 2),
            Threshold = threshold,
            DaysToThreshold = daysToThreshold.HasValue ? Math.Round(daysToThreshold.Value, 1) : null,
            WillExceedThreshold = willExceedThreshold,
            TrendDirection = slope > 0.0001 ? "上升" : slope < -0.0001 ? "下降" : "平稳",
            DataPoints = hourlyData.Count,
            AnalyzedAt = DateTime.UtcNow,
        };
    }

    /// <summary>
    /// 获取设备指标的告警阈值（取该设备或该类型的最高优先级告警规则的阈值）
    /// </summary>
    private async Task<double?> GetAlertThresholdAsync(Guid deviceId, string metric, CancellationToken ct)
    {
        var rule = await _db.AlertRules
            .Where(r => r.DeviceId == deviceId && r.Metric == metric && r.Enabled && r.Threshold != null)
            .OrderByDescending(r => r.Severity)
            .Select(r => r.Threshold)
            .FirstOrDefaultAsync(ct);

        return rule.HasValue ? (double)rule.Value : null;
    }

    /// <summary>
    /// 简单线性回归（最小二乘法）
    /// 返回 (slope, intercept)，x 为时间索引（小时），y 为指标值
    /// </summary>
    private static (double Slope, double Intercept) LinearRegression(List<TrendPoint> points)
    {
        var n = points.Count;
        var baseTime = points[0].Timestamp;

        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

        for (var i = 0; i < n; i++)
        {
            var x = (points[i].Timestamp - baseTime).TotalHours;
            var y = points[i].Value;
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
        }

        var denominator = n * sumX2 - sumX * sumX;
        if (Math.Abs(denominator) < 0.0001)
            return (0, sumY / n); // 无趋势

        var slope = (n * sumXY - sumX * sumY) / denominator;
        var intercept = (sumY - slope * sumX) / n;

        return (slope, intercept);
    }

    /// <summary>线性回归使用的单条遥测样本。</summary>
    private record TrendSample(DateTime Time, double Value);

    private record TrendPoint(DateTime Timestamp, double Value);
}

/// <summary>趋势分析结果</summary>
public sealed class TrendAnalysisResult
{
    public Guid DeviceId { get; set; }
    public string Metric { get; set; } = string.Empty;
    public double CurrentValue { get; set; }
    public double AverageValue { get; set; }
    public double MinValue { get; set; }
    public double MaxValue { get; set; }
    /// <summary>每天的变化量（斜率 × 24）</summary>
    public double TrendSlope { get; set; }
    /// <summary>每天变化百分比</summary>
    public double ChangeRatePercent { get; set; }
    public double? Threshold { get; set; }
    /// <summary>预计多少天后超阈值（null 表示不会超或无阈值）</summary>
    public double? DaysToThreshold { get; set; }
    /// <summary>是否会在 7 天内超阈值</summary>
    public bool WillExceedThreshold { get; set; }
    public string TrendDirection { get; set; } = "平稳";
    public int DataPoints { get; set; }
    public DateTime AnalyzedAt { get; set; }
}
