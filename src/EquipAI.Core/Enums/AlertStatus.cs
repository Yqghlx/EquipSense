namespace EquipAI.Core.Enums;

/// <summary>
/// 告警生命周期状态
/// </summary>
public enum AlertStatus
{
    /// <summary>
    /// 活跃 — 告警已触发，等待处理
    /// </summary>
    Active,

    /// <summary>
    /// 已确认 — 运维人员已确认告警
    /// </summary>
    Acknowledged,

    /// <summary>
    /// 已解决 — 问题已修复
    /// </summary>
    Resolved
}
