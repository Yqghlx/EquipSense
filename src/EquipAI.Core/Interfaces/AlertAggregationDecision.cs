namespace EquipAI.Core.Interfaces;

/// <summary>
/// 告警聚合器根据窗口计数返回的处理决策。
/// </summary>
/// <param name="ShouldCreate">是否创建新的告警。</param>
/// <param name="ShouldUpdate">是否更新已有告警。</param>
/// <param name="Silenced">是否因超过窗口阈值而静默。</param>
public readonly record struct AlertAggregationDecision(
    bool ShouldCreate,
    bool ShouldUpdate,
    bool Silenced);
