namespace EquipAI.Core.Interfaces;

/// <summary>
/// 告警聚合器接口，实现防风暴机制
/// 30 分钟窗口内，同设备同指标同规则：第 1 次立即告警、2-3 次更新已有、超过 3 次静默
/// </summary>
/// <remarks>
/// 窗口维度必须含 ruleId：同设备同指标常配置多条分层阈值规则（如 温度&gt;80 告警 + 温度&gt;90 严重），
/// 若不按 ruleId 区分，这些规则会共享一个窗口互相吞并——严重规则的触发被合并进告警规则的告警，
/// 导致漏报关键预警。
/// </remarks>
public interface IAlertAggregator
{
    /// <summary>
    /// 评估告警是否应该创建、更新或静默
    /// </summary>
    /// <param name="deviceId">设备 ID</param>
    /// <param name="ruleId">告警规则 ID（窗口维度之一，隔离同指标的不同规则）</param>
    /// <param name="metric">指标名称</param>
    /// <returns>三元组：(是否创建新告警, 是否更新已有告警, 是否静默)</returns>
    (bool ShouldCreate, bool ShouldUpdate, bool Silenced) Evaluate(Guid deviceId, Guid ruleId, string metric);
}
