namespace EquipAI.Core.Enums;

/// <summary>
/// 告警严重级别，用于标识告警的紧急程度和处理优先级
/// </summary>
public enum AlertSeverity
{
    /// <summary>
    /// 低级别 — 信息性通知
    /// </summary>
    Low,

    /// <summary>
    /// 一般 — 需要关注但不紧急
    /// </summary>
    Normal,

    /// <summary>
    /// 高 — 需要尽快处理
    /// </summary>
    High,

    /// <summary>
    /// 严重 — 需要立即响应
    /// </summary>
    Critical
}
