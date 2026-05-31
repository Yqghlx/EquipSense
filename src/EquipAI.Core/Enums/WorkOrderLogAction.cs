namespace EquipAI.Core.Enums;

/// <summary>
/// 工单日志操作类型
/// </summary>
public enum WorkOrderLogAction
{
    /// <summary>
    /// 创建工单
    /// </summary>
    Created,

    /// <summary>
    /// 状态变更
    /// </summary>
    StatusChanged,

    /// <summary>
    /// 添加备注
    /// </summary>
    CommentAdded
}
