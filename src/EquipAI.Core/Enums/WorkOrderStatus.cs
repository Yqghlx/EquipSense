namespace EquipAI.Core.Enums;

/// <summary>
/// 工单状态
/// </summary>
public enum WorkOrderStatus
{
    /// <summary>
    /// 待派工
    /// </summary>
    PendingDispatch,

    /// <summary>
    /// 已派工
    /// </summary>
    Assigned,

    /// <summary>
    /// 执行中
    /// </summary>
    InProgress,

    /// <summary>
    /// 已完成
    /// </summary>
    Completed,

    /// <summary>
    /// 已验收
    /// </summary>
    Accepted,

    /// <summary>
    /// 验收不通过（返工）
    /// </summary>
    Rejected,

    /// <summary>
    /// 已关闭
    /// </summary>
    Closed,

    /// <summary>
    /// 已取消
    /// </summary>
    Cancelled
}
