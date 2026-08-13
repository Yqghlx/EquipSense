namespace EquipAI.Application.Approvals.DTOs;

/// <summary>
/// 工单审批记录 DTO
/// </summary>
public record WorkOrderApprovalDto(
    Guid Id,
    Guid WorkOrderId,
    int StepOrder,
    string ExpectedRole,
    Guid? SpecificApproverId,
    Guid? ApproverId,
    string Action,
    string? Comment,
    DateTime? ActedAt);
