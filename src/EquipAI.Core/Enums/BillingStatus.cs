namespace EquipAI.Core.Enums;

/// <summary>
/// 账单状态枚举
/// </summary>
public enum BillingStatus
{
    /// <summary>待支付</summary>
    Pending = 0,
    /// <summary>已支付</summary>
    Paid = 1,
    /// <summary>已取消</summary>
    Cancelled = 2,
}
