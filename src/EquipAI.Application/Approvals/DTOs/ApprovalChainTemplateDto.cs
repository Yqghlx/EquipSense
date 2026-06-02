namespace EquipAI.Application.Approvals.DTOs;

/// <summary>
/// 审批链模板 DTO
/// </summary>
public record ApprovalChainTemplateDto(
    Guid Id,
    string? WorkOrderType,
    string? Priority,
    string Name,
    bool IsDefault,
    bool Enabled,
    List<ApprovalStepDto> Steps,
    DateTime CreatedAt);

/// <summary>
/// 审批步骤 DTO
/// </summary>
public record ApprovalStepDto(
    Guid Id,
    int StepOrder,
    string Role,
    Guid? SpecificApproverId,
    bool IsRequired);
