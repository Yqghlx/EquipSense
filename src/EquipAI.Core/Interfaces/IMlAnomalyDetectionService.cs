namespace EquipAI.Core.Interfaces;

/// <summary>
/// L4 ML.NET 异常检测服务
/// 使用 SrCnn 算法对时序数据进行异常检测
/// </summary>
public interface IMlAnomalyDetectionService
{
    /// <summary>
    /// 检测指定设备指标是否存在异常
    /// </summary>
    Task<MlAnomalyResult?> DetectAsync(
        Guid tenantId, Guid deviceId, string metric, double currentValue, CancellationToken ct = default);

    /// <summary>
    /// 获取指定设备指标的基线统计信息（均值、标准差、样本数）
    /// </summary>
    Task<BaselineStats?> GetBaselineStatsAsync(Guid deviceId, string metric, CancellationToken ct = default);
}

/// <summary>
/// ML 异常检测结果
/// </summary>
/// <param name="IsAnomaly">是否检测到异常</param>
/// <param name="AnomalyScore">异常概率（0-1）</param>
/// <param name="ExpectedValue">预期值（历史均值）</param>
/// <param name="Description">检测描述文本</param>
/// <param name="SampleCount">用于检测的样本数量</param>
/// <param name="WindowSize">SrCnn 窗口大小</param>
public record MlAnomalyResult(
    bool IsAnomaly,
    double AnomalyScore,
    double ExpectedValue,
    string Description,
    int SampleCount = 0,
    int WindowSize = 0);

/// <summary>
/// 基线统计信息 — 设备指标的历史统计摘要
/// </summary>
/// <param name="Metric">指标名称</param>
/// <param name="Mean">历史均值</param>
/// <param name="StdDev">历史标准差</param>
/// <param name="Min">最小值</param>
/// <param name="Max">最大值</param>
/// <param name="SampleCount">样本数量</param>
/// <param name="LastTrainingTime">最后训练时间</param>
public record BaselineStats(
    string Metric,
    double Mean,
    double StdDev,
    double Min,
    double Max,
    int SampleCount,
    DateTime LastTrainingTime);
