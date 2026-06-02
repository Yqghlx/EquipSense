using EquipAI.Core.Enums;

namespace EquipAI.Core.Entities;

/// <summary>
/// 工单审批记录 — 记录多级审批链中每一步的审批状态
/// </summary>
public class WorkOrderApproval : BaseEntity
{
    /// <summary>所属租户 ID</summary>
    public Guid TenantId { get; set; }

    /// <summary>关联工单 ID</summary>
    public Guid WorkOrderId { get; set; }

    /// <summary>步骤顺序（从 1 开始）</summary>
    public int StepOrder { get; set; }

    /// <summary>期望审批角色</summary>
    public string ExpectedRole { get; set; } = string.Empty;

    /// <summary>实际审批人 ID</summary>
    public Guid? ApproverId { get; set; }

    /// <summary>审批动作</summary>
    public ApprovalAction Action { get; set; } = ApprovalAction.Pending;

    /// <summary>审批意见</summary>
    public string? Comment { get; set; }

    /// <summary>审批时间</summary>
    public DateTime? ActedAt { get; set; }
}
