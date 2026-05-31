using EquipAI.Core.Enums;

namespace EquipAI.Core.Entities;

/// <summary>
/// 工单日志实体，记录工单的所有状态变更和操作（审计追踪）
/// </summary>
public class WorkOrderLog : BaseEntity
{
    /// <summary>
    /// 关联工单 ID
    /// </summary>
    public Guid WorkOrderId { get; set; }

    /// <summary>
    /// 操作类型
    /// </summary>
    public WorkOrderLogAction Action { get; set; }

    /// <summary>
    /// 变更前状态
    /// </summary>
    public string? OldStatus { get; set; }

    /// <summary>
    /// 变更后状态
    /// </summary>
    public string? NewStatus { get; set; }

    /// <summary>
    /// 操作人 ID
    /// </summary>
    public Guid? OperatorId { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    public string? Note { get; set; }
}
