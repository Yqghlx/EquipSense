namespace EquipAI.Core.Interfaces;

/// <summary>
/// 告警聚合状态存储，负责跨实例原子递增窗口计数。
/// </summary>
public interface IAlertAggregationStateStore
{
    /// <summary>
    /// 递增指定窗口的计数，并在首次写入时设置窗口过期时间。
    /// </summary>
    /// <param name="key">聚合窗口键。</param>
    /// <param name="window">窗口有效期。</param>
    /// <param name="cancellationToken">取消令牌。</param>
    /// <returns>递增后的窗口计数。</returns>
    Task<long> IncrementAsync(
        string key,
        TimeSpan window,
        CancellationToken cancellationToken = default);
}
