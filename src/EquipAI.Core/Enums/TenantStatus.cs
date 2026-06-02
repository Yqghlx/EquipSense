namespace EquipAI.Core.Enums;

/// <summary>
/// 租户状态枚举，用于 SaaS 订阅生命周期管理
/// </summary>
public enum TenantStatus
{
    /// <summary>试用中</summary>
    Trial,

    /// <summary>活跃（已订阅）</summary>
    Active,

    /// <summary>已过期（试用结束或订阅到期未续费）</summary>
    Expired,

    /// <summary>被冻结（system_admin 操作，通常因违规或欠费）</summary>
    Frozen,

    /// <summary>已注销</summary>
    Closed
}
