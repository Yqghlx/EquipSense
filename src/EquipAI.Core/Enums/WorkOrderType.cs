namespace EquipAI.Core.Enums;

/// <summary>
/// 工单类型
/// </summary>
public enum WorkOrderType
{
    /// <summary>
    /// 纠正性 — 故障发生后修复
    /// </summary>
    Corrective,

    /// <summary>
    /// 预防性 — 定期维护保养
    /// </summary>
    Preventive,

    /// <summary>
    /// 预测性 — 基于预测分析提前干预
    /// </summary>
    Predictive
}
