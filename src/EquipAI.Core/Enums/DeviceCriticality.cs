namespace EquipAI.Core.Enums;

/// <summary>
/// 设备关键等级枚举，用于标识设备对生产流程的重要程度
/// </summary>
public enum DeviceCriticality
{
    /// <summary>关键 — 故障将导致产线停产</summary>
    Critical,

    /// <summary>高 — 故障将严重影响生产效率</summary>
    High,

    /// <summary>普通 — 故障有一定影响但可控</summary>
    Normal,

    /// <summary>低 — 故障影响较小</summary>
    Low
}
