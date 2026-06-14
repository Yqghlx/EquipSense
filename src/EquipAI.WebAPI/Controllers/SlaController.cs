using EquipAI.Application.WorkOrders;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Middleware;
using EquipAI.WebAPI.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 工单 SLA 管理控制器（Phase 5 新增）
/// </summary>
[ApiController]
[Route("api/v1/work-orders/sla")]
[Authorize]
public class SlaController : ControllerBase
{
    private readonly SlaManagementService _slaService;
    private readonly ITenantContext _tenantContext;

    public SlaController(SlaManagementService slaService, ITenantContext tenantContext)
    {
        _slaService = slaService;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 获取工单 SLA 统计概览
    /// </summary>
    [HttpGet("summary")]
    [RequirePermission("workorder:read")]
    [ProducesResponseType(typeof(SlaSummary), StatusCodes.Status200OK)]
    public async Task<ActionResult<SlaSummary>> GetSummary(CancellationToken ct)
    {
        var summary = await _slaService.GetSummaryAsync(_tenantContext.TenantId, ct);
        return Ok(summary);
    }

    /// <summary>
    /// 手动触发 SLA 检查和升级（通常由定时任务调用）
    /// </summary>
    [HttpPost("check")]
    [RequirePermission("workorder:manage")]
    [Audit("SlaCheck", "WorkOrder")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckAndEscalate(CancellationToken ct)
    {
        var escalated = await _slaService.CheckAndEscalateAsync(_tenantContext.TenantId, ct);
        return Ok(new { escalatedCount = escalated });
    }
}
