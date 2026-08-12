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
    /// <summary>允许对比的最大时间窗口，避免请求触发无界遥测扫描。</summary>
    public const int MaxComparisonHours = 24 * 365;

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
    /// <param name="deviceIds">可选设备 ID 列表；为空时保持同类型全量对比</param>
    public async Task<DeviceComparisonResult> CompareAsync(
        Guid tenantId,
        string deviceType,
        string metric,
        int hours = 24,
        IReadOnlyCollection<Guid>? deviceIds = null,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(deviceType) || deviceType.Length > 50)
            throw new ArgumentException("设备类型不能为空且长度不能超过 50 个字符", nameof(deviceType));
        if (string.IsNullOrWhiteSpace(metric) || metric.Length > 100)
            throw new ArgumentException("指标名称不能为空且长度不能超过 100 个字符", nameof(metric));
        if (hours is < 1 or > MaxComparisonHours)
            throw new ArgumentOutOfRangeException(
                nameof(hours), hours, $"时间窗口必须在 1 到 {MaxComparisonHours} 小时之间");
        deviceType = deviceType.Trim();
        metric = metric.Trim();
        var since = DateTime.UtcNow.AddHours(-hours);
        Guid[]? normalizedDeviceIds = null;

        if (deviceIds != null)
        {
            if (deviceIds.Count == 0)
                throw new ArgumentException("deviceIds 去重后数量必须在 2 到 5 之间", nameof(deviceIds));
            if (deviceIds.Any(id => id == Guid.Empty))
                throw new ArgumentException("deviceIds 不能包含空 GUID", nameof(deviceIds));

            normalizedDeviceIds = deviceIds.Distinct().ToArray();
            if (normalizedDeviceIds.Length is < 2 or > 5)
                throw new ArgumentException("deviceIds 去重后数量必须在 2 到 5 之间", nameof(deviceIds));
        }

        // 查询该类型所有设备最近 N 小时的遥测数据
        var visibleDevices = await _db.Devices
            .Where(d => d.TenantId == tenantId
                        && d.Type == deviceType
                        && (normalizedDeviceIds == null || normalizedDeviceIds.Contains(d.Id)))
            .Select(d => new { d.Id, d.DeviceCode, d.Name })
            .ToListAsync(ct);

        if (visibleDevices.Count < 2)
        {
            return new DeviceComparisonResult
            {
                DeviceType = deviceType,
                Metric = metric,
                Devices = [],
                Message = "同类设备不足 2 台，无法对比"
            };
        }

        // 一次性拉取当前租户、目标指标和时间窗口内的遥测，再在内存中按设备聚合。
        // 设备数量由租户规模决定，逐设备查询会产生 N+1 往返并放大数据库连接池压力。
        var deviceLookup = visibleDevices.ToDictionary(d => d.Id);
        var telemetry = await _db.DeviceTelemetry
            .Where(t => t.TenantId == tenantId
                        && deviceLookup.Keys.Contains(t.DeviceId)
                        && t.Metric == metric
                        && t.Time >= since
                        && t.Value != null)
            .Select(t => new
            {
                t.DeviceId,
                t.Time,
                Value = t.Value!.Value,
            })
            .ToListAsync(ct);

        var deviceMetrics = telemetry
            .GroupBy(t => t.DeviceId)
            .Select(group =>
            {
                var device = deviceLookup[group.Key];
                var latest = group.MaxBy(t => t.Time)!;
                return new DeviceMetricSummary
                {
                    DeviceId = device.Id,
                    DeviceCode = device.DeviceCode,
                    DeviceName = device.Name ?? device.DeviceCode,
                    AverageValue = Math.Round(group.Average(t => t.Value), 2),
                    MinValue = Math.Round(group.Min(t => t.Value), 2),
                    MaxValue = Math.Round(group.Max(t => t.Value), 2),
                    LatestValue = Math.Round(latest.Value, 2),
                    DataPointCount = group.Count(),
                };
            })
            .ToList();

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
