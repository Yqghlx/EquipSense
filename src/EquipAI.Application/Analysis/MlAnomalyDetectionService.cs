using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.ML;
using Microsoft.ML.Data;

namespace EquipAI.Application.Analysis;

/// <summary>
/// L4 ML.NET SrCnn 异常检测服务
/// 使用 SrCnn（Spectral Residual + CNN）算法检测时序数据异常
/// 最低样本要求：50 个数据点，训练窗口：7 天
/// 注册为 Singleton — MLContext 内部线程安全，通过 IServiceScopeFactory 创建独立的 Scoped DbContext
/// </summary>
public class MlAnomalyDetectionService : IMlAnomalyDetectionService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<MlAnomalyDetectionService> _logger;

    /// <summary>
    /// 最低样本数量阈值：低于此值时统计结论不可靠，跳过检测
    /// </summary>
    private const int MinSampleCount = 50;

    /// <summary>
    /// SrCnn 异常判定阈值：概率高于此值视为异常
    /// </summary>
    private const double AnomalyThreshold = 0.5;

    /// <summary>
    /// 训练数据时间窗口（天）：只取最近 N 天的历史数据
    /// </summary>
    private const int TrainingWindowDays = 7;

    /// <summary>
    /// MLContext 使用固定种子确保结果可复现，声明为 static 避免重复创建
    /// </summary>
    private static readonly MLContext _mlContext = new(seed: 42);

    public MlAnomalyDetectionService(
        IServiceScopeFactory scopeFactory,
        ILogger<MlAnomalyDetectionService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<MlAnomalyResult?> DetectAsync(
        Guid tenantId, Guid deviceId, string metric, double currentValue, CancellationToken ct = default)
    {
        // Singleton 服务不能直接注入 Scoped 的 DbContext，通过 ScopeFactory 创建独立作用域
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var cutoff = DateTime.UtcNow.AddDays(-TrainingWindowDays);

        // 查询历史遥测数据，按时间升序排列，最多取 500 条
        var historyData = await db.DeviceTelemetry
            .Where(t => t.DeviceId == deviceId && t.Metric == metric && t.Time >= cutoff)
            .OrderBy(t => t.Time)
            .Select(t => new { t.Value, t.Time })
            .Take(500)
            .ToListAsync(ct);

        // 过滤掉 Value 为 null 的记录
        var validData = historyData.Where(h => h.Value.HasValue).ToList();

        if (validData.Count < MinSampleCount)
        {
            _logger.LogDebug("ML 异常检测样本不足: Device={DeviceId}, Metric={Metric}, Count={Count}",
                deviceId, metric, validData.Count);
            return null;
        }

        try
        {
            // 构建时序数据点序列，将当前值附加到末尾作为待检测点
            var dataPoints = validData
                .Select(h => new TimeSeriesData(h.Value!.Value))
                .ToList();

            dataPoints.Add(new TimeSeriesData(currentValue));

            var dataView = _mlContext.Data.LoadFromEnumerable(dataPoints);

            // SrCnn 参数：窗口大小自适应，最小 16，最大 64，不超过样本量的一半
            var windowSize = Math.Max(16, Math.Min(64, dataPoints.Count / 2));
            var pipeline = _mlContext.Transforms.DetectAnomalyBySrCnn(
                outputColumnName: nameof(PredictionResult.Prediction),
                inputColumnName: nameof(TimeSeriesData.Value),
                windowSize: windowSize,
                backAddWindowSize: Math.Max(8, windowSize / 2),
                lookaheadWindowSize: Math.Max(4, windowSize / 4),
                averagingWindowSize: Math.Max(4, windowSize / 4),
                judgementWindowSize: Math.Max(4, windowSize / 4),
                threshold: AnomalyThreshold);

            var model = pipeline.Fit(dataView);
            var transformed = model.Transform(dataView);
            var predictions = _mlContext.Data
                .CreateEnumerable<PredictionResult>(transformed, reuseRowObject: false)
                .ToList();

            // 取序列最后一个点（即当前值）的预测结果
            var lastPrediction = predictions.LastOrDefault();
            if (lastPrediction?.Prediction == null || lastPrediction.Prediction.Length < 3)
            {
                return null;
            }

            // SrCnn 输出格式：[0]=是否异常标记, [1]=异常标志, [2]=异常概率
            var isAnomaly = lastPrediction.Prediction[1] > 0;
            var probability = lastPrediction.Prediction[2];
            var expectedValue = validData.Average(h => h.Value!.Value);

            var description = isAnomaly
                ? $"ML 检测到异常：当前值 {currentValue:F2} 偏离预期 {expectedValue:F2}，异常概率 {probability:P}"
                : $"ML 检测正常：当前值 {currentValue:F2}，预期 {expectedValue:F2}，异常概率 {probability:P}";

            return new MlAnomalyResult(isAnomaly, probability, expectedValue, description, validData.Count, windowSize);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "ML 异常检测执行失败: Device={DeviceId}, Metric={Metric}", deviceId, metric);
            return null;
        }
    }

    /// <summary>
    /// ML.NET 时序数据输入格式
    /// </summary>
    private record TimeSeriesData(double Value);

    /// <summary>
    /// SrCnn 预测输出格式
    /// Prediction 数组：[0]=异常标记, [1]=异常标志(>0 为异常), [2]=异常概率(0-1)
    /// </summary>
    private class PredictionResult
    {
        public float[] Prediction { get; set; } = [];
    }

    /// <inheritdoc />
    public async Task<BaselineStats?> GetBaselineStatsAsync(Guid deviceId, string metric, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var cutoff = DateTime.UtcNow.AddDays(-TrainingWindowDays);
        var values = await db.DeviceTelemetry
            .Where(t => t.DeviceId == deviceId && t.Metric == metric && t.Time >= cutoff)
            .Where(t => t.Value != null)
            .Select(t => t.Value!.Value)
            .ToListAsync(ct);

        if (values.Count < MinSampleCount)
            return null;

        var mean = values.Average();
        var stdDev = Math.Sqrt(values.Sum(v => Math.Pow(v - mean, 2)) / values.Count);

        return new BaselineStats(
            Metric: metric,
            Mean: mean,
            StdDev: stdDev,
            Min: values.Min(),
            Max: values.Max(),
            SampleCount: values.Count,
            LastTrainingTime: DateTime.UtcNow);
    }
}
