namespace EquipAI.Application.Approvals.DTOs;

/// <summary>
/// 更新审批链请求
/// </summary>
public record UpdateApprovalChainRequest(
    string? Name,
    bool? Enabled,
    List<CreateApprovalStepRequest>? Steps);
