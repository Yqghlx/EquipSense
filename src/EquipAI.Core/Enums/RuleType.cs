namespace EquipAI.Core.Enums;

/// <summary>
/// 告警规则类型
/// </summary>
public enum RuleType
{
    /// <summary>
    /// 静态阈值 — 单指标超过固定阈值时触发
    /// </summary>
    Threshold,

    /// <summary>
    /// 组合条件 — 多个指标同时满足条件时触发
    /// </summary>
    Combined,

    /// <summary>
    /// 动态基线 — 基于历史统计数据的均值±N倍标准差触发
    /// 需要 100+ 样本才启用
    /// </summary>
    Baseline
}
