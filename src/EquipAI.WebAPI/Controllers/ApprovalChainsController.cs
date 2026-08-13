using EquipAI.Application.Approvals;
using EquipAI.Application.Approvals.DTOs;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 审批链模板管理控制器
/// 提供审批链模板的 CRUD 操作和待审批查询
/// 审批链模板属于系统配置，仅 SystemAdmin 可管理
/// </summary>
[ApiController]
[Route("api/v1/approval-chains")]
[Authorize]
public class ApprovalChainsController : ControllerBase
{
    private readonly IApprovalChainService _approvalChainService;
    private readonly ITenantContext _tenantContext;

    public ApprovalChainsController(
        IApprovalChainService approvalChainService,
        ITenantContext tenantContext)
    {
        _approvalChainService = approvalChainService;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 列出审批链模板
    /// 返回当前租户下所有审批链模板及其步骤
    /// </summary>
    [HttpGet]
    [RequirePermission("workorder:read")]
    [ProducesResponseType(typeof(List<ApprovalChainTemplateDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ApprovalChainTemplateDto>>> List()
    {
        return Ok(await _approvalChainService.ListTemplatesAsync(_tenantContext.TenantId));
    }

    /// <summary>
    /// 创建审批链模板
    /// </summary>
    [HttpPost]
    [RequirePermission("workorder:update")]
    [ProducesResponseType(typeof(ApprovalChainTemplateDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<ApprovalChainTemplateDto>> Create([FromBody] CreateApprovalChainRequest request)
    {
        var result = await _approvalChainService.CreateTemplateAsync(_tenantContext.TenantId, request);
        return CreatedAtAction(nameof(List), new { }, result);
    }

    /// <summary>
    /// 更新审批链模板
    /// </summary>
    [HttpPut("{id:guid}")]
    [RequirePermission("workorder:update")]
    [ProducesResponseType(typeof(ApprovalChainTemplateDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApprovalChainTemplateDto>> Update(Guid id, [FromBody] UpdateApprovalChainRequest request)
    {
        return Ok(await _approvalChainService.UpdateTemplateAsync(_tenantContext.TenantId, id, request));
    }

    /// <summary>
    /// 删除审批链模板
    /// </summary>
    [HttpDelete("{id:guid}")]
    [RequirePermission("workorder:update")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<ActionResult> Delete(Guid id)
    {
        await _approvalChainService.DeleteTemplateAsync(_tenantContext.TenantId, id);
        return NoContent();
    }

    /// <summary>
    /// 获取待我审批的工单列表
    /// 根据当前用户的租户、角色和指定审批人匹配待审批记录
    /// </summary>
    [HttpGet("pending")]
    [RequirePermission("workorder:accept")]
    [ProducesResponseType(typeof(List<WorkOrderApprovalDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<WorkOrderApprovalDto>>> PendingApprovals()
    {
        // 从用户上下文获取角色信息
        var role = User.FindFirst("role")?.Value;
        return Ok(await _approvalChainService.GetPendingApprovalsAsync(
            _tenantContext.TenantId, _tenantContext.UserId, role));
    }
}
