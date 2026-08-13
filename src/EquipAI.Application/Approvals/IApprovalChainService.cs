using EquipAI.Application.Approvals.DTOs;
using EquipAI.Core.Enums;

namespace EquipAI.Application.Approvals;

/// <summary>
/// 审批链服务接口
/// </summary>
public interface IApprovalChainService
{
    /// <summary>
    /// 获取租户下所有审批链模板
    /// </summary>
    Task<List<ApprovalChainTemplateDto>> ListTemplatesAsync(Guid tenantId, CancellationToken ct = default);

    /// <summary>
    /// 创建审批链模板
    /// </summary>
    Task<ApprovalChainTemplateDto> CreateTemplateAsync(Guid tenantId, CreateApprovalChainRequest request, CancellationToken ct = default);

    /// <summary>
    /// 更新审批链模板
    /// </summary>
    Task<ApprovalChainTemplateDto> UpdateTemplateAsync(Guid tenantId, Guid templateId, UpdateApprovalChainRequest request, CancellationToken ct = default);

    /// <summary>
    /// 删除审批链模板
    /// </summary>
    Task DeleteTemplateAsync(Guid tenantId, Guid templateId, CancellationToken ct = default);

    /// <summary>
    /// 根据工单类型和优先级匹配审批链模板，为指定工单创建审批记录
    /// 匹配优先级：精确匹配 (Type, Priority) > Type 默认链 > 全局默认链
    /// </summary>
    Task CreateApprovalRecordsAsync(Guid tenantId, Guid workOrderId, WorkOrderType type, WorkOrderPriority priority, CancellationToken ct = default);

    /// <summary>
    /// 审批通过 — 当前步骤标记 Approved，所有步骤通过后工单状态变为 Accepted
    /// </summary>
    /// <param name="tenantId">调用方租户 ID。</param>
    /// <param name="workOrderId">工单 ID。</param>
    /// <param name="approverId">当前审批人的用户 ID。</param>
    /// <param name="approverRole">当前用户 JWT 中的角色。</param>
    /// <param name="comment">审批意见。</param>
    Task ApproveAsync(
        Guid tenantId, Guid workOrderId, Guid approverId, string? approverRole,
        string? comment, CancellationToken ct = default);

    /// <summary>
    /// 审批驳回 — 当前步骤标记 Rejected，工单状态回到 InProgress
    /// </summary>
    /// <param name="tenantId">调用方租户 ID。</param>
    /// <param name="workOrderId">工单 ID。</param>
    /// <param name="approverId">当前审批人的用户 ID。</param>
    /// <param name="approverRole">当前用户 JWT 中的角色。</param>
    /// <param name="comment">驳回意见。</param>
    Task RejectAsync(
        Guid tenantId, Guid workOrderId, Guid approverId, string? approverRole,
        string? comment, CancellationToken ct = default);

    /// <summary>
    /// 获取指定工单的所有审批记录
    /// </summary>
    Task<List<WorkOrderApprovalDto>> GetApprovalsAsync(Guid tenantId, Guid workOrderId, CancellationToken ct = default);

    /// <summary>
    /// 获取指定租户内指定审批人待审批的工单列表
    /// </summary>
    /// <param name="tenantId">调用方租户 ID。</param>
    /// <param name="approverId">当前用户 ID，用于匹配指定审批人步骤。</param>
    /// <param name="role">当前用户角色。</param>
    Task<List<WorkOrderApprovalDto>> GetPendingApprovalsAsync(
        Guid tenantId, Guid approverId, string? role, CancellationToken ct = default);
}
