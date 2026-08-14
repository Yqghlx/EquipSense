using System.Runtime.CompilerServices;
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
        // 直接在数据库侧按小时聚合，避免高频采集时把 7 天原始点全部加载到应用内存。
        var since = DateTime.UtcNow.AddDays(-7);
        var hourlyRows = await _db.DeviceTelemetry
            .Where(t => t.DeviceId == deviceId && t.Metric == metric && t.Time >= since && t.Value != null)
            .GroupBy(t => new { Day = t.Time.Date, Hour = t.Time.Hour })
            .Select(g => new
            {
                g.Key.Day,
                g.Key.Hour,
                AverageValue = g.Average(t => t.Value!.Value),
                SampleCount = g.Count(),
            })
            .ToListAsync(ct);

        // 样本不足时无需再查询阈值；这条路径常见于新接入设备，避免无意义的第二次数据库往返。
        var rawSampleCount = hourlyRows.Sum(row => row.SampleCount);
        if (rawSampleCount < 10)
        {
            _logger.LogDebug("趋势分析样本不足: Device={DeviceId}, Metric={Metric}, Count={Count}", deviceId, metric, rawSampleCount);
            return null;
        }

        var threshold = await GetAlertThresholdAsync(deviceId, metric, ct);
        var hourlyData = hourlyRows
            .OrderBy(row => row.Day)
            .ThenBy(row => row.Hour)
            .Select(row => CreateTrendPoint(row.Day, row.Hour, row.AverageValue))
            .ToList();

        return BuildTrendAnalysis(deviceId, metric, hourlyData, rawSampleCount, threshold);
    }

    /// <summary>
    /// 批量分析租户内所有设备的趋势预警
    /// </summary>
    public async Task<List<TrendAnalysisResult>> AnalyzeAllTrendsAsync(Guid tenantId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        // 找出最近有遥测数据的设备+指标组合。该查询只作为数据库子查询使用，
        // 不把租户所有设备指标组合先实体化到应用内存。
        var since = now.AddDays(-1);
        var activePairsQuery = _db.DeviceTelemetry
            .Where(t => t.TenantId == tenantId && t.Time >= since && t.Value != null)
            .Select(t => new { t.DeviceId, t.Metric })
            .Distinct();

        // 批量读取所有活动指标的 7 天小时聚合数据，避免 AnalyzeTrendAsync 按设备+指标重复访问数据库，
        // 也避免将高频原始遥测集中加载到应用内存。
        var trendSince = now.AddDays(-7);
        var hourlyRows = (
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
            .GroupBy(t => new
            {
                t.DeviceId,
                t.Metric,
                Day = t.Time.Date,
                Hour = t.Time.Hour,
            })
            .Select(g => new
            {
                g.Key.DeviceId,
                g.Key.Metric,
                g.Key.Day,
                g.Key.Hour,
                AverageValue = g.Average(t => t.Value),
                SampleCount = g.Count(),
            })
            .OrderBy(row => row.DeviceId)
            .ThenBy(row => row.Metric)
            .ThenBy(row => row.Day)
            .ThenBy(row => row.Hour);

        // 每个设备+指标只保留一条最高严重级别阈值，选择工作在数据库侧完成，
        // 避免规则条数增长时把同一组合的所有规则复制到应用内存。
        var thresholdRows = await _db.AlertRules
            .Where(r => r.TenantId == tenantId
                        && r.DeviceId.HasValue
                        && r.Enabled
                        && r.Threshold != null
                        && activePairsQuery.Any(pair =>
                            pair.DeviceId == r.DeviceId!.Value && pair.Metric == r.Metric))
            .GroupBy(r => new { DeviceId = r.DeviceId!.Value, r.Metric })
            .Select(group => new
            {
                group.Key.DeviceId,
                group.Key.Metric,
                Threshold = group
                    .OrderByDescending(r => r.Severity)
                    .ThenBy(r => r.Id)
                    .Select(r => r.Threshold)
                    .FirstOrDefault(),
            })
            .ToListAsync(ct);
        var thresholds = thresholdRows
            .ToDictionary(
                row => (row.DeviceId, row.Metric),
                row => (double?)row.Threshold);

        // 聚合结果按设备+指标排序后流式消费。每次只保留当前组合的小时序列（最多 7×24 个点），
        // 避免“设备数 × 指标数 × 168 小时”同时驻留内存。
        var warnings = new List<TrendAnalysisResult>();
        var analyzedCount = 0;
        var hasCurrentPair = false;
        var currentDeviceId = Guid.Empty;
        var currentMetric = string.Empty;
        var currentHourlyData = new List<TrendPoint>();
        var currentRawSampleCount = 0;

        void AnalyzeCurrentPair()
        {
            if (!hasCurrentPair)
                return;

            analyzedCount++;
            thresholds.TryGetValue((currentDeviceId, currentMetric), out var threshold);
            var analysis = BuildTrendAnalysis(
                currentDeviceId,
                currentMetric,
                currentHourlyData,
                currentRawSampleCount,
                threshold);
            if (analysis?.WillExceedThreshold == true)
                warnings.Add(analysis);
        }

        await foreach (var row in hourlyRows.AsAsyncEnumerable().WithCancellation(ct))
        {
            if (!hasCurrentPair
                || row.DeviceId != currentDeviceId
                || !string.Equals(row.Metric, currentMetric, StringComparison.Ordinal))
            {
                AnalyzeCurrentPair();
                hasCurrentPair = true;
                currentDeviceId = row.DeviceId;
                currentMetric = row.Metric;
                currentHourlyData = [];
                currentRawSampleCount = 0;
            }

            currentHourlyData.Add(CreateTrendPoint(row.Day, row.Hour, row.AverageValue));
            currentRawSampleCount += row.SampleCount;
        }

        AnalyzeCurrentPair();

        _logger.LogInformation("趋势分析完成: 共分析 {Total} 个指标，发现 {Warnings} 个预警",
            analyzedCount, warnings.Count);
        return warnings;
    }

    /// <summary>
    /// 使用数据库侧已聚合的小时样本计算趋势，供单指标和批量分析共用，确保两条路径的业务语义一致。
    /// </summary>
    private TrendAnalysisResult? BuildTrendAnalysis(
        Guid deviceId,
        string metric,
        IReadOnlyList<TrendPoint> hourlyData,
        int rawSampleCount,
        double? threshold)
    {
        if (rawSampleCount < 10)
        {
            _logger.LogDebug("趋势分析样本不足: Device={DeviceId}, Metric={Metric}, Count={Count}", deviceId, metric, rawSampleCount);
            return null;
        }

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
    private static (double Slope, double Intercept) LinearRegression(IReadOnlyList<TrendPoint> points)
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

    /// <summary>将数据库中的日期和小时聚合键转换为 UTC 小时点。</summary>
    private static TrendPoint CreateTrendPoint(DateTime day, int hour, double value)
    {
        var timestamp = new DateTime(day.Year, day.Month, day.Day, hour, 0, 0, DateTimeKind.Utc);
        return new TrendPoint(timestamp, value);
    }

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
