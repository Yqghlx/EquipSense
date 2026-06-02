namespace EquipAI.Application.Approvals.DTOs;

/// <summary>
/// 创建审批链请求
/// </summary>
public record CreateApprovalChainRequest(
    string? WorkOrderType,
    string? Priority,
    string Name,
    bool IsDefault,
    List<CreateApprovalStepRequest> Steps);

/// <summary>
/// 创建审批步骤请求
/// </summary>
public record CreateApprovalStepRequest(
    int StepOrder,
    string Role,
    Guid? SpecificApproverId = null,
    bool IsRequired = true);
