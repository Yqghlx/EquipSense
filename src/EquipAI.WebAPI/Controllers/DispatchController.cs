using EquipAI.Application.WorkOrders;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 智能派工 API — 提供技术人员推荐、技术人员画像管理能力
/// </summary>
[ApiController]
[Route("api/v1/dispatch")]
[Authorize]
public class DispatchController : ControllerBase
{
    private readonly ISmartDispatchService _dispatchService;
    private readonly ITenantContext _tenantContext;
    private readonly TechnicianProfileService _technicianService;

    public DispatchController(
        ISmartDispatchService dispatchService,
        ITenantContext tenantContext,
        TechnicianProfileService technicianService)
    {
        _dispatchService = dispatchService;
        _tenantContext = tenantContext;
        _technicianService = technicianService;
    }

    /// <summary>
    /// 为工单推荐技术人员 — 基于技能匹配 + 负载均衡综合评分
    /// </summary>
    /// <param name="workOrderId">工单 ID</param>
    /// <param name="topN">返回前 N 名推荐（默认 5）</param>
    [HttpGet("{workOrderId:guid}/recommendations")]
    [ProducesResponseType(typeof(List<DispatchRecommendationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<DispatchRecommendationDto>>> GetRecommendations(
        Guid workOrderId, [FromQuery] int topN = 5, CancellationToken ct = default)
    {
        var recommendations = await _dispatchService.RecommendAsync(
            _tenantContext.TenantId, workOrderId, topN, ct);
        return Ok(recommendations);
    }

    /// <summary>
    /// 获取技术人员列表 — 全局过滤器自动按租户隔离
    /// </summary>
    /// <param name="availableOnly">是否只返回可派工人员</param>
    [HttpGet("technicians")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> GetTechnicians([FromQuery] bool? availableOnly, CancellationToken ct = default)
        => Ok(await _technicianService.ListAsync(availableOnly, ct));

    /// <summary>
    /// 创建或更新技术人员画像 — 全局过滤器确保只能操作当前租户的数据
    /// </summary>
    /// <param name="userId">用户 ID</param>
    /// <param name="request">技术人员画像数据</param>
    [RequirePermission("workorder:dispatch")]
    [HttpPut("technicians/{userId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> UpsertTechnician(
        Guid userId, [FromBody] UpsertTechnicianRequest request, CancellationToken ct = default)
    {
        var (id, name, skills) = await _technicianService.UpsertAsync(userId, request, ct);
        return Ok(new { Id = id, Name = name, Skills = skills });
    }
}
