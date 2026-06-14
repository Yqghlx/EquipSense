using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Analysis;

/// <summary>
/// 设备对比分析服务（Phase 5 新增）
///
/// 同类设备横向对比，发现偏离群体均值的劣化设备。
/// 基于 Z-Score 异常检测：某设备指标偏离群体均值 > 2 个标准差时标记为异常。
/// </summary>
public class DeviceComparisonService
{
    private readonly AppDbContext _db;
    private readonly ILogger<DeviceComparisonService> _logger;

    public DeviceComparisonService(AppDbContext db, ILogger<DeviceComparisonService> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// 对比指定设备类型的多个设备的关键指标
    /// </summary>
    /// <param name="deviceType">设备类型（如"空压机"）</param>
    /// <param name="metric">指标名称（如"temperature"）</param>
    /// <param name="hours">时间窗口（小时，默认 24h）</param>
    public async Task<DeviceComparisonResult> CompareAsync(
        Guid tenantId, string deviceType, string metric, int hours = 24, CancellationToken ct = default)
    {
        var since = DateTime.UtcNow.AddHours(-hours);

        // 查询该类型所有设备最近 N 小时的遥测数据
        var deviceIds = await _db.Devices
            .Where(d => d.TenantId == tenantId && d.Type == deviceType)
            .Select(d => new { d.Id, d.DeviceCode, d.Name })
            .ToListAsync(ct);

        if (deviceIds.Count < 2)
        {
            return new DeviceComparisonResult
            {
                DeviceType = deviceType,
                Metric = metric,
                Devices = [],
                Message = "同类设备不足 2 台，无法对比"
            };
        }

        var deviceMetrics = new List<DeviceMetricSummary>();

        foreach (var device in deviceIds)
        {
            var telemetry = await _db.DeviceTelemetry
                .Where(t => t.DeviceId == device.Id && t.Metric == metric && t.Time >= since && t.Value != null)
                .Select(t => t.Value!.Value)
                .ToListAsync(ct);

            if (telemetry.Count == 0)
                continue;

            deviceMetrics.Add(new DeviceMetricSummary
            {
                DeviceId = device.Id,
                DeviceCode = device.DeviceCode,
                DeviceName = device.Name ?? device.DeviceCode,
                AverageValue = Math.Round(telemetry.Average(), 2),
                MinValue = Math.Round(telemetry.Min(), 2),
                MaxValue = Math.Round(telemetry.Max(), 2),
                LatestValue = Math.Round(telemetry[^1], 2),
                DataPointCount = telemetry.Count,
            });
        }

        if (deviceMetrics.Count < 2)
        {
            return new DeviceComparisonResult
            {
                DeviceType = deviceType,
                Metric = metric,
                Devices = deviceMetrics,
                Message = "有遥测数据的设备不足 2 台"
            };
        }

        // 计算群体统计
        var allAverages = deviceMetrics.Select(d => d.AverageValue).ToList();
        var groupMean = allAverages.Average();
        var groupStdDev = Math.Sqrt(allAverages.Average(v => Math.Pow(v - groupMean, 2)));

        // Z-Score 异常检测：偏离均值 > 2σ 标记为异常
        foreach (var dm in deviceMetrics)
        {
            dm.ZScore = groupStdDev > 0.0001
                ? Math.Round((dm.AverageValue - groupMean) / groupStdDev, 2)
                : 0;
            dm.IsOutlier = Math.Abs(dm.ZScore) > 2;
        }

        // 按偏离程度排序（异常的排前面）
        deviceMetrics = deviceMetrics.OrderByDescending(d => Math.Abs(d.ZScore)).ToList();

        return new DeviceComparisonResult
        {
            DeviceType = deviceType,
            Metric = metric,
            Hours = hours,
            GroupMean = Math.Round(groupMean, 2),
            GroupStdDev = Math.Round(groupStdDev, 2),
            Devices = deviceMetrics,
            Message = null,
        };
    }
}

/// <summary>设备对比结果</summary>
public sealed class DeviceComparisonResult
{
    public string DeviceType { get; set; } = string.Empty;
    public string Metric { get; set; } = string.Empty;
    public int Hours { get; set; }
    public double GroupMean { get; set; }
    public double GroupStdDev { get; set; }
    public List<DeviceMetricSummary> Devices { get; set; } = [];
    public string? Message { get; set; }
}

/// <summary>单个设备的指标摘要</summary>
public sealed class DeviceMetricSummary
{
    public Guid DeviceId { get; set; }
    public string DeviceCode { get; set; } = string.Empty;
    public string DeviceName { get; set; } = string.Empty;
    public double AverageValue { get; set; }
    public double MinValue { get; set; }
    public double MaxValue { get; set; }
    public double LatestValue { get; set; }
    public int DataPointCount { get; set; }
    /// <summary>Z-Score（偏离群体均值的标准差倍数）</summary>
    public double ZScore { get; set; }
    /// <summary>是否为异常值（|Z| > 2）</summary>
    public bool IsOutlier { get; set; }
}
