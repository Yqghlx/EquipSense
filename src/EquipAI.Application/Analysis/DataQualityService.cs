using System.Runtime.CompilerServices;
using EquipAI.Core.Interfaces;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Analysis;

/// <summary>
/// 数据质量评估服务
/// 从 device_telemetry 查询最近 1 小时的数据，按 5 维度计算加权评分：
/// 完整性 30%、准确性 25%、时效性 15%、一致性 15%、有效性 15%
/// </summary>
public class DataQualityService : IDataQualityService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IMemoryCache _cache;
    private readonly ILogger<DataQualityService> _logger;

    /// <summary>
    /// 评估时间窗口：最近 1 小时的数据
    /// </summary>
    private static readonly TimeSpan EvaluationWindow = TimeSpan.FromHours(1);

    /// <summary>
    /// 最少样本数：低于此阈值无法计算可靠的统计指标，返回 null
    /// </summary>
    private const int MinSampleCount = 5;

    /// <summary>
    /// 单次质量统计最多加载的样本数；完整性仍使用时间窗口内的完整计数计算。
    /// </summary>
    private const int MaxEvaluationSamples = 10_000;

    /// <summary>
    /// 默认上报间隔（秒）：设备未配置上报间隔时使用此默认值
    /// </summary>
    private const int DefaultReportingIntervalSeconds = 10;

    /// <summary>
    /// 缓存有效期：5 分钟内重复查询直接返回缓存结果
    /// </summary>
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

    /// <summary>
    /// 已知指标的物理合理范围，用于有效性检查
    /// 键为指标名称（小写），值为 (最小值, 最大值) 元组
    /// </summary>
    private static readonly Dictionary<string, (double Min, double Max)> MetricPhysicalLimits = new(StringComparer.OrdinalIgnoreCase)
    {
        ["temperature"] = (-50, 500),
        ["pressure"] = (0, 100),
        ["vibration"] = (0, 100),
        ["humidity"] = (0, 100),
        ["voltage"] = (-1000, 1000),
        ["current"] = (-1000, 1000),
        ["power"] = (0, 100000),
        ["speed"] = (0, 100000),
        ["flow_rate"] = (0, 100000),
        ["load"] = (0, 200),
    };

    /// <summary>
    /// 禁止为负值的指标集合（温度、电压、电流允许负值）
    /// </summary>
    private static readonly HashSet<string> PositiveOnlyMetrics = new(StringComparer.OrdinalIgnoreCase)
    {
        "pressure", "vibration", "humidity", "power", "speed", "flow_rate", "load"
    };

    public DataQualityService(
        IServiceScopeFactory scopeFactory,
        IMemoryCache cache,
        ILogger<DataQualityService> logger)
    {
        _scopeFactory = scopeFactory;
        _cache = cache;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<double?> CalculateScoreAsync(Guid tenantId, Guid deviceId, string metric, CancellationToken ct = default)
    {
        var report = await CalculateReportAsync(tenantId, deviceId, metric, ct);
        return report?.Score;
    }

    /// <inheritdoc />
    public async Task<DataQualityReport?> CalculateReportAsync(Guid tenantId, Guid deviceId, string metric, CancellationToken ct = default)
    {
        // 缓存键：包含租户、设备和指标，确保隔离
        var cacheKey = $"dq:{tenantId}:{deviceId}:{metric}";

        if (_cache.TryGetValue(cacheKey, out DataQualityReport? cached))
        {
            _logger.LogDebug("数据质量评分（缓存命中）：设备={DeviceId}, 指标={Metric}, 评分={Score}",
                deviceId, metric, cached!.Score);
            return cached;
        }

        var report = await ComputeReportAsync(tenantId, deviceId, metric, ct);

        if (report != null)
        {
            _cache.Set(cacheKey, report, CacheDuration);
        }

        return report;
    }

    /// <inheritdoc />
    public async Task<List<DataQualityReport>> CalculateOverviewAsync(Guid tenantId, Guid deviceId, CancellationToken ct = default)
    {
        // 查询设备最近 1 小时内有哪些指标
        var endTime = DateTime.UtcNow;
        var startTime = endTime - EvaluationWindow;

        await using var scope = _scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 本服务注册为 Singleton，可由后台事件处理器（RootCauseAnalysisEngine）调用，运行在独立 scope 中、
        // 无 HttpContext，ITenantContext 走回退 → TenantId == Guid.Empty。DeviceTelemetry 若沿用默认全局租户
        // 过滤器会恒查不到真实租户数据（HasNoKey 实体同样被过滤器作用）→ 数据质量评分恒为 null → 在
        // AnalyzeAsync 中被强制为 0，导致 L3 统计分析分支（要求 dataQuality>=0.6）永远不成立，且 Analysis
        // 记录的 DataQualityScore 永久存 0。故 IgnoreQueryFilters + 显式按 tenantId 限定（参数由服务端透传）。
        var metrics = await dbContext.DeviceTelemetry
            .IgnoreQueryFilters()
            .Where(t => t.TenantId == tenantId && t.DeviceId == deviceId && t.Time >= startTime && t.Time <= endTime)
            .Select(t => t.Metric)
            .Distinct()
            .ToListAsync(ct);

        // 并行计算所有指标的质量报告，避免 N+1 串行查询
        var reportTasks = metrics.Select(metric => CalculateReportAsync(tenantId, deviceId, metric, ct));
        var reports = (await Task.WhenAll(reportTasks))
            .Where(r => r != null)
            .Cast<DataQualityReport>()
            .ToList();

        return reports;
    }

    /// <summary>
    /// 核心计算逻辑：从数据库查询遥测数据，按 5 维度计算评分
    /// </summary>
    private async Task<DataQualityReport?> ComputeReportAsync(Guid tenantId, Guid deviceId, string metric, CancellationToken ct)
    {
        var endTime = DateTime.UtcNow;
        var startTime = endTime - EvaluationWindow;

        await using var scope = _scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 同上：后台 scope 下默认过滤器会吞掉真实租户遥测，IgnoreQueryFilters + 显式 tenantId。
        var telemetryQuery = dbContext.DeviceTelemetry
            .IgnoreQueryFilters()
            .Where(t => t.TenantId == tenantId && t.DeviceId == deviceId && t.Metric == metric && t.Time >= startTime && t.Time <= endTime);

        // 先取完整计数，保证完整性评分和报告中的 SampleCount 不因限流而失真；
        // 统计维度只需最近一万条样本，避免高频设备把整个小时窗口实体化到应用内存。
        var sampleCount = await telemetryQuery.CountAsync(ct);
        if (sampleCount < MinSampleCount)
        {
            _logger.LogDebug("数据质量评估跳过：设备={DeviceId}, 指标={Metric}, 样本数={Count}（不足 {Min}）",
                deviceId, metric, sampleCount, MinSampleCount);
            return null;
        }

        var telemetryData = await telemetryQuery
            .OrderByDescending(t => t.Time)
            .Take(MaxEvaluationSamples)
            .OrderBy(t => t.Time)
            .Select(t => new { t.Time, t.Value })
            .ToListAsync(ct);

        // 计算预期的数据点数（基于默认上报间隔）
        var expectedPoints = (int)(EvaluationWindow.TotalSeconds / DefaultReportingIntervalSeconds);

        // 提取有效数值（排除 null 值）
        var validValues = telemetryData
            .Where(t => t.Value.HasValue)
            .Select(t => t.Value!.Value)
            .ToList();

        // 计算五个维度
        var completeness = CalculateCompleteness(sampleCount, expectedPoints);
        var accuracy = CalculateAccuracy(validValues);
        var timeliness = CalculateTimeliness(telemetryData.Select(t => t.Time).ToList(), DefaultReportingIntervalSeconds);
        var consistency = CalculateConsistency(validValues);
        var validity = CalculateValidity(validValues, metric);

        // 加权平均：完整性 30%、准确性 25%、时效性 15%、一致性 15%、有效性 15%
        var score = completeness * 0.30
                  + accuracy * 0.25
                  + timeliness * 0.15
                  + consistency * 0.15
                  + validity * 0.15;

        var report = new DataQualityReport
        {
            DeviceId = deviceId,
            Metric = metric,
            Score = Math.Round(score, 4),
            Dimensions = new DataQualityDimensions
            {
                Completeness = Math.Round(completeness, 4),
                Accuracy = Math.Round(accuracy, 4),
                Timeliness = Math.Round(timeliness, 4),
                Consistency = Math.Round(consistency, 4),
                Validity = Math.Round(validity, 4)
            },
            SampleCount = sampleCount,
            CalculatedAt = DateTime.UtcNow
        };

        _logger.LogDebug("数据质量评估完成：设备={DeviceId}, 指标={Metric}, 评分={Score:F4}, " +
            "完整性={C:F2}, 准确性={A:F2}, 时效性={T:F2}, 一致性={Co:F2}, 有效性={V:F2}, 样本数={N}",
            deviceId, metric, report.Score,
            completeness, accuracy, timeliness, consistency, validity, sampleCount);

        return report;
    }

    /// <summary>
    /// 计算完整性（权重 30%）：实际数据点数 / 预期数据点数
    /// 预期数据点数 = 时间窗口（秒） / 上报间隔（秒）
    /// 结果限制在 [0, 1] 范围内（实际点数可能超过预期）
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private static double CalculateCompleteness(int actualCount, int expectedCount)
    {
        if (expectedCount <= 0) return 1.0;
        return Math.Min(1.0, (double)actualCount / expectedCount);
    }

    /// <summary>
    /// 计算准确性（权重 25%）：合理值占比
    /// 使用 3σ 原则——计算均值和标准差，统计落在 [mean - 3σ, mean + 3σ] 范围内的数据点比例
    /// 至少需要 10 个有效样本才进行统计，否则返回保守值 0.5
    /// </summary>
    private static double CalculateAccuracy(List<double> values)
    {
        if (values.Count < 10) return 0.5;

        var mean = values.Average();
        var stdDev = StandardDeviation(values, mean);

        // 标准差为 0 表示所有值相同，数据完全准确
        if (stdDev < double.Epsilon) return 1.0;

        var lower = mean - 3 * stdDev;
        var upper = mean + 3 * stdDev;
        var withinRange = values.Count(v => v >= lower && v <= upper);

        return (double)withinRange / values.Count;
    }

    /// <summary>
    /// 计算时效性（权重 15%）：在预期上报间隔 × 容差系数内到达的数据点比例
    /// 比较相邻数据点的实际时间差与预期上报间隔
    /// 容差系数 1.5：允许 50% 的延迟波动
    /// </summary>
    private static double CalculateTimeliness(List<DateTime> timestamps, int expectedIntervalSeconds)
    {
        if (timestamps.Count < 2) return 1.0;

        // 容差系数：间隔超过预期的 1.5 倍视为不及时
        var maxAllowedGap = expectedIntervalSeconds * 1.5;
        var timelyCount = 0;

        for (var i = 1; i < timestamps.Count; i++)
        {
            var gap = (timestamps[i] - timestamps[i - 1]).TotalSeconds;
            if (gap <= maxAllowedGap)
            {
                timelyCount++;
            }
        }

        return (double)timelyCount / (timestamps.Count - 1);
    }

    /// <summary>
    /// 计算一致性（权重 15%）：变异系数的逆
    /// 变异系数 = 标准差 / |均值|，越低表示越一致
    /// 一致性 = 1 - min(1.0, CV)
    /// 当均值为 0 时返回保守值 0.5
    /// </summary>
    private static double CalculateConsistency(List<double> values)
    {
        if (values.Count < 2) return 1.0;

        var mean = Math.Abs(values.Average());

        // 均值接近 0 时变异系数无意义，返回保守值
        if (mean < double.Epsilon) return 0.5;

        var stdDev = StandardDeviation(values, mean);
        var cv = stdDev / mean;

        return 1.0 - Math.Min(1.0, cv);
    }

    /// <summary>
    /// 计算有效性（权重 15%）：通过基本合理性检查的数据点比例
    /// 检查规则：
    /// 1. 值不能为 NaN 或无穷大
    /// 2. 对于正值指标（如压力、功率），值不能为负
    /// 3. 值应在已知物理极限范围内
    /// </summary>
    private static double CalculateValidity(List<double> values, string metric)
    {
        if (values.Count == 0) return 0.0;

        var validCount = 0;
        var isPositiveOnly = PositiveOnlyMetrics.Contains(metric);
        var hasPhysicalLimits = MetricPhysicalLimits.TryGetValue(metric, out var limits);

        foreach (var value in values)
        {
            // 检查 1：非 NaN 且非无穷大
            if (double.IsNaN(value) || double.IsInfinity(value))
                continue;

            // 检查 2：正值指标不允许负值
            if (isPositiveOnly && value < 0)
                continue;

            // 检查 3：在物理极限范围内
            if (hasPhysicalLimits && (value < limits.Min || value > limits.Max))
                continue;

            validCount++;
        }

        return (double)validCount / values.Count;
    }

    /// <summary>
    /// 计算样本标准差（总体标准差除以 N，非 N-1）
    /// </summary>
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private static double StandardDeviation(List<double> values, double mean)
    {
        var sumSquares = 0.0;
        foreach (var v in values)
        {
            var diff = v - mean;
            sumSquares += diff * diff;
        }

        return Math.Sqrt(sumSquares / values.Count);
    }
}
