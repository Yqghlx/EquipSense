using EquipAI.Application.DTOs.Common;
using EquipAI.Application.Knowledge;
using EquipAI.Application.Knowledge.DTOs;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Controllers.Knowledge;

/// <summary>
/// 候选规则审核控制器
/// 提供候选规则列表、创建、删除、单条/批量批准驳回、编辑后批准
/// 路由前缀保持 api/v1/knowledge 以兼容前端
/// </summary>
[ApiController]
[Route("api/v1/knowledge")]
[Authorize]
public class PendingRulesController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly KnowledgeCaptureService _captureService;
    private readonly ITenantContext _tenantContext;

    /// <summary>
    /// 初始化候选规则审核控制器
    /// </summary>
    public PendingRulesController(
        AppDbContext dbContext,
        KnowledgeCaptureService captureService,
        ITenantContext tenantContext)
    {
        _dbContext = dbContext;
        _captureService = captureService;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 分页获取候选规则列表
    /// 支持按审核状态和关键词筛选
    /// </summary>
    /// <param name="query">分页查询参数</param>
    /// <param name="reviewStatus">可选：按审核状态筛选（Pending / Approved / Rejected）</param>
    /// <returns>分页候选规则结果</returns>
    [HttpGet("pending-rules")]
    [RequirePermission("knowledge:read")]
    [ProducesResponseType(typeof(PagedResult<PendingRuleResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<PendingRuleResponse>>> GetPendingRules(
        [FromQuery] PagedQuery query,
        [FromQuery] ReviewStatus? reviewStatus = null)
    {
        var pendingRules = _dbContext.PendingRules.AsQueryable();

        if (reviewStatus.HasValue)
            pendingRules = pendingRules.Where(r => r.ReviewStatus == reviewStatus.Value);

        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            var keyword = $"%{query.Keyword}%";
            pendingRules = pendingRules.Where(r => EF.Functions.ILike(r.Name, keyword));
        }

        var (items, total) = await pendingRules.ToPagedAsync(query);

        return Ok(new PagedResult<PendingRuleResponse>
        {
            Items = items.Select(KnowledgeMapper.MapToPendingRuleResponse).ToList(),
            Total = total,
            Page = query.Page,
            PageSize = query.PageSize
        });
    }

    /// <summary>
    /// 手动创建候选规则（E2E 测试用）
    /// </summary>
    [HttpPost("pending-rules")]
    [RequirePermission("knowledge:create")]
    [ProducesResponseType(typeof(PendingRuleResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<PendingRuleResponse>> CreatePendingRule(
        [FromBody] CreatePendingRuleRequest request)
    {
        var rule = new Core.Entities.PendingRule
        {
            TenantId = _tenantContext.TenantId,
            Name = request.Name,
            Conditions = request.Conditions != null
                ? System.Text.Json.JsonSerializer.Serialize(request.Conditions)
                : "{}",
            Conclusion = string.IsNullOrEmpty(request.Recommendation)
                ? "{}"
                : System.Text.Json.JsonSerializer.Serialize(new { recommendation = request.Recommendation }),
            RecommendedActions = request.Recommendation,
            Confidence = request.Confidence,
            ReviewStatus = ReviewStatus.Pending,
        };

        _dbContext.PendingRules.Add(rule);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPendingRules), new { id = rule.Id }, KnowledgeMapper.MapToPendingRuleResponse(rule));
    }

    /// <summary>
    /// 删除候选规则
    /// </summary>
    [HttpDelete("pending-rules/{id:guid}")]
    [RequirePermission("knowledge:update")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePendingRule(Guid id)
    {
        var rule = await _dbContext.PendingRules.FindAsync([id]);
        if (rule is null)
            return NotFound(new { code = 404, message = "候选规则不存在" });

        _dbContext.PendingRules.Remove(rule);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// 批准候选规则，将其转化为正式知识规则
    /// </summary>
    /// <param name="id">候选规则 ID</param>
    /// <param name="request">审核请求（可选审核意见）</param>
    /// <returns>操作结果</returns>
    [HttpPut("pending-rules/{id:guid}/approve")]
    [RequirePermission("knowledge:create")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ApprovePendingRule(
        Guid id, [FromBody] ReviewRequest? request = null)
    {
        try
        {
            await _captureService.ApproveRuleAsync(
                id, _tenantContext.UserId, request?.Comment, HttpContext.RequestAborted);
            return Ok(new { code = 200, message = "候选规则已批准并转为正式规则" });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { code = 404, message = "候选规则不存在" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { code = 400, message = ex.Message });
        }
    }

    /// <summary>
    /// 编辑后批准候选规则
    /// 允许审核人在批准前对规则的名称、条件和结论进行微调
    /// </summary>
    /// <param name="id">候选规则 ID</param>
    /// <param name="request">编辑后批准请求（可调整字段 + 审核意见）</param>
    /// <returns>操作结果</returns>
    [HttpPut("pending-rules/{id:guid}/approve-with-edit")]
    [RequirePermission("knowledge:create")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ApproveWithEdit(Guid id, [FromBody] ApproveWithEditRequest request)
    {
        try
        {
            var reviewerId = _tenantContext.UserId;

            var pending = await _dbContext.PendingRules.FindAsync([id]);
            if (pending is null)
                return NotFound(new { code = 404, message = "候选规则不存在" });

            if (pending.ReviewStatus != ReviewStatus.Pending)
                return BadRequest(new { code = 400, message = $"规则已审核，当前状态: {pending.ReviewStatus}" });

            // 应用编辑修改
            if (!string.IsNullOrWhiteSpace(request.AdjustedConditions))
                pending.Conditions = request.AdjustedConditions;
            if (!string.IsNullOrWhiteSpace(request.AdjustedConclusion))
                pending.Conclusion = request.AdjustedConclusion;
            if (!string.IsNullOrWhiteSpace(request.AdjustedName))
                pending.Name = request.AdjustedName;

            await _dbContext.SaveChangesAsync();

            await _captureService.ApproveRuleAsync(id, reviewerId, request.Comment, HttpContext.RequestAborted);

            return Ok(new { message = "规则已编辑并批准" });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { code = 404, message = "候选规则不存在" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { code = 400, message = ex.Message });
        }
    }

    /// <summary>
    /// 驳回候选规则
    /// </summary>
    /// <param name="id">候选规则 ID</param>
    /// <param name="request">驳回请求（建议填写驳回原因）</param>
    /// <returns>操作结果</returns>
    [HttpPut("pending-rules/{id:guid}/reject")]
    [RequirePermission("knowledge:create")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectPendingRule(
        Guid id, [FromBody] ReviewRequest? request = null)
    {
        try
        {
            await _captureService.RejectRuleAsync(
                id, _tenantContext.UserId, request?.Comment, HttpContext.RequestAborted);
            return Ok(new { code = 200, message = "候选规则已驳回" });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { code = 404, message = "候选规则不存在" });
        }
    }

    /// <summary>
    /// 批量批准候选规则
    /// 逐条处理，跳过已审核的规则，返回成功/失败统计
    /// </summary>
    /// <param name="request">批量审核请求</param>
    /// <returns>批量审核结果</returns>
    [HttpPost("pending-rules/batch-approve")]
    [RequirePermission("knowledge:create")]
    [ProducesResponseType(typeof(BatchReviewResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BatchReviewResult>> BatchApprovePendingRules(
        [FromBody] BatchReviewRequest request)
    {
        if (request.Ids == null || request.Ids.Count == 0)
            return BadRequest(new { code = 400, message = "请选择至少一条候选规则" });

        var result = await _captureService.BatchApproveAsync(
            request.Ids, _tenantContext.UserId, request.Comment, HttpContext.RequestAborted);

        return Ok(result);
    }

    /// <summary>
    /// 批量驳回候选规则
    /// 逐条处理，跳过不存在的规则，返回成功/失败统计
    /// </summary>
    /// <param name="request">批量审核请求</param>
    /// <returns>批量审核结果</returns>
    [HttpPost("pending-rules/batch-reject")]
    [RequirePermission("knowledge:create")]
    [ProducesResponseType(typeof(BatchReviewResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BatchReviewResult>> BatchRejectPendingRules(
        [FromBody] BatchReviewRequest request)
    {
        if (request.Ids == null || request.Ids.Count == 0)
            return BadRequest(new { code = 400, message = "请选择至少一条候选规则" });

        var result = await _captureService.BatchRejectAsync(
            request.Ids, _tenantContext.UserId, request.Comment, HttpContext.RequestAborted);

        return Ok(result);
    }
}
