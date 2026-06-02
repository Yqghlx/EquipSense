namespace EquipAI.Core.Interfaces;

/// <summary>
/// L4 ML.NET 异常检测服务
/// 使用 SrCnn 算法对时序数据进行异常检测
/// </summary>
public interface IMlAnomalyDetectionService
{
    /// <summary>
    /// 检测指定设备指标是否存在异常
    /// 从数据库获取最近 7 天的历史数据作为训练样本，将当前值附加到序列末尾进行检测
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="deviceId">设备 ID</param>
    /// <param name="metric">指标名称</param>
    /// <param name="currentValue">当前指标值</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>异常检测结果；样本不足或检测失败时返回 null</returns>
    Task<MlAnomalyResult?> DetectAsync(
        Guid tenantId, Guid deviceId, string metric, double currentValue, CancellationToken ct = default);
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
