namespace EquipAI.Core.Interfaces;

/// <summary>
/// 告警聚合器接口，实现防风暴机制
/// 30 分钟窗口内，同设备同指标：第 1 次立即告警、2-3 次更新已有、超过 3 次静默
/// </summary>
public interface IAlertAggregator
{
    /// <summary>
    /// 评估告警是否应该创建、更新或静默
    /// </summary>
    /// <param name="deviceId">设备 ID</param>
    /// <param name="metric">指标名称</param>
    /// <returns>三元组：(是否创建新告警, 是否更新已有告警, 是否静默)</returns>
    (bool ShouldCreate, bool ShouldUpdate, bool Silenced) Evaluate(Guid deviceId, string metric);
}
