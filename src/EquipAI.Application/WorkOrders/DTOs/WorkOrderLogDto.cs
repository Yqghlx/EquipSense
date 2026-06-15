namespace EquipAI.Application.WorkOrders.DTOs;

/// <summary>
/// 工单流转日志 DTO
///
/// 记录工单的一次状态变更或操作，用于详情页「操作记录」时间线展示。
/// </summary>
public class WorkOrderLogDto
{
    /// <summary>日志唯一标识（UUID）</summary>
    public Guid Id { get; set; }

    /// <summary>关联工单 ID</summary>
    public Guid WorkOrderId { get; set; }

    /// <summary>操作类型（Created / Assigned / Started / Completed / Accepted / Rejected / Closed / Cancelled / Submitted）</summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>变更前状态</summary>
    public string? OldStatus { get; set; }

    /// <summary>变更后状态</summary>
    public string? NewStatus { get; set; }

    /// <summary>操作人 ID</summary>
    public Guid? OperatorId { get; set; }

    /// <summary>备注（如驳回原因、解决措施等）</summary>
    public string? Note { get; set; }

    /// <summary>操作时间（UTC）</summary>
    public DateTime CreatedAt { get; set; }
}
