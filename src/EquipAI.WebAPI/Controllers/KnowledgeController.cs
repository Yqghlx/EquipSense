using EquipAI.Application.DTOs.Common;
using EquipAI.Application.Knowledge;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 知识库管理控制器
/// 提供正式规则 CRUD、候选规则审核、故障案例查询和批量导入等接口
/// </summary>
[ApiController]
[Route("api/v1/knowledge")]
[Authorize]
public class KnowledgeController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly KnowledgeCaptureService _captureService;
    private readonly ITenantContext _tenantContext;

    /// <summary>
    /// 初始化知识库管理控制器
    /// </summary>
    /// <param name="dbContext">数据库上下文</param>
    /// <param name="captureService">知识沉淀服务，用于候选规则审核</param>
    /// <param name="tenantContext">租户上下文，用于获取当前请求的租户 ID</param>
    public KnowledgeController(
        AppDbContext dbContext,
        KnowledgeCaptureService captureService,
        ITenantContext tenantContext)
    {
        _dbContext = dbContext;
        _captureService = captureService;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 分页获取正式知识规则列表
    /// 支持按设备类型和关键词筛选
    /// </summary>
    /// <param name="query">分页查询参数</param>
    /// <param name="deviceType">可选：按设备类型筛选</param>
    /// <returns>分页正式规则结果</returns>
    [HttpGet("rules")]
    [RequirePermission("knowledge:read")]
    [ProducesResponseType(typeof(PagedResult<KnowledgeRuleResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<KnowledgeRuleResponse>>> GetRules(
        [FromQuery] PagedQuery query,
        [FromQuery] string? deviceType = null)
    {
        var rules = _dbContext.KnowledgeRules.AsQueryable();

        if (!string.IsNullOrWhiteSpace(deviceType))
            rules = rules.Where(r => r.DeviceType == deviceType);

        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            var keyword = $"%{query.Keyword}%";
            rules = rules.Where(r => EF.Functions.ILike(r.Name, keyword));
        }

        var (items, total) = await rules.ToPagedAsync(query);

        return Ok(new PagedResult<KnowledgeRuleResponse>
        {
            Items = items.Select(MapToRuleResponse).ToList(),
            Total = total,
            Page = query.Page,
            PageSize = query.PageSize
        });
    }

    /// <summary>
    /// 手动创建正式知识规则
    /// </summary>
    /// <param name="request">创建规则请求</param>
    /// <returns>创建后的规则信息</returns>
    [HttpPost("rules")]
    [RequirePermission("knowledge:create")]
    [ProducesResponseType(typeof(KnowledgeRuleResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<KnowledgeRuleResponse>> CreateRule([FromBody] CreateKnowledgeRuleRequest request)
    {
        var rule = new Core.Entities.KnowledgeRule
        {
            TenantId = _tenantContext.TenantId,
            DeviceType = request.DeviceType,
            Name = request.Name,
            Conditions = request.Conditions,
            Conclusion = request.Conclusion,
            RecommendedActions = request.RecommendedActions,
            CheckSteps = request.CheckSteps,
            ConfidenceWeight = request.ConfidenceWeight ?? 0.5m,
            Source = "expert",
            CreatedBy = _tenantContext.UserId.ToString()
        };

        _dbContext.KnowledgeRules.Add(rule);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetRules), new { id = rule.Id }, MapToRuleResponse(rule));
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
            Items = items.Select(MapToPendingRuleResponse).ToList(),
            Total = total,
            Page = query.Page,
            PageSize = query.PageSize
        });
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
    /// 分页获取故障案例列表
    /// 支持按设备类型和关键词筛选
    /// </summary>
    /// <param name="query">分页查询参数</param>
    /// <param name="deviceType">可选：按设备类型筛选</param>
    /// <returns>分页故障案例结果</returns>
    [HttpGet("cases")]
    [RequirePermission("knowledge:read")]
    [ProducesResponseType(typeof(PagedResult<FaultCaseResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<FaultCaseResponse>>> GetCases(
        [FromQuery] PagedQuery query,
        [FromQuery] string? deviceType = null)
    {
        var cases = _dbContext.FaultCases.AsQueryable();

        if (!string.IsNullOrWhiteSpace(deviceType))
            cases = cases.Where(c => c.DeviceType == deviceType);

        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            var keyword = $"%{query.Keyword}%";
            cases = cases.Where(c =>
                EF.Functions.ILike(c.FaultDescription, keyword) ||
                EF.Functions.ILike(c.RootCause, keyword));
        }

        var (items, total) = await cases.ToPagedAsync(query);

        return Ok(new PagedResult<FaultCaseResponse>
        {
            Items = items.Select(MapToFaultCaseResponse).ToList(),
            Total = total,
            Page = query.Page,
            PageSize = query.PageSize
        });
    }

    /// <summary>
    /// 批量导入行业知识库规则
    /// 将一批预定义的行业规则批量写入正式知识规则表
    /// </summary>
    /// <param name="rules">待导入的规则列表</param>
    /// <returns>导入结果</returns>
    [HttpPost("import")]
    [RequirePermission("knowledge:create")]
    [ProducesResponseType(typeof(BatchImportResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BatchImportResponse>> ImportRules(
        [FromBody] List<CreateKnowledgeRuleRequest> rules)
    {
        if (rules == null || rules.Count == 0)
            return BadRequest(new { code = 400, message = "导入列表不能为空" });

        var imported = 0;
        var failed = 0;
        var errors = new List<string>();

        for (var i = 0; i < rules.Count; i++)
        {
            var r = rules[i];

            // 基本参数校验
            if (string.IsNullOrWhiteSpace(r.DeviceType) || string.IsNullOrWhiteSpace(r.Name))
            {
                failed++;
                errors.Add($"第 {i + 1} 条规则缺少必填字段（DeviceType 或 Name）");
                continue;
            }

            var rule = new Core.Entities.KnowledgeRule
            {
                TenantId = _tenantContext.TenantId,
                DeviceType = r.DeviceType,
                Name = r.Name,
                Conditions = r.Conditions,
                Conclusion = r.Conclusion,
                RecommendedActions = r.RecommendedActions,
                CheckSteps = r.CheckSteps,
                ConfidenceWeight = r.ConfidenceWeight ?? 0.5m,
                Source = "imported",
                CreatedBy = _tenantContext.UserId.ToString()
            };

            _dbContext.KnowledgeRules.Add(rule);
            imported++;
        }

        if (imported > 0)
            await _dbContext.SaveChangesAsync();

        return Ok(new BatchImportResponse
        {
            Imported = imported,
            Failed = failed,
            Errors = errors
        });
    }

    #region 请求/响应 DTO

    /// <summary>
    /// 创建知识规则请求
    /// </summary>
    public class CreateKnowledgeRuleRequest
    {
        /// <summary>适用设备类型</summary>
        public string DeviceType { get; set; } = string.Empty;

        /// <summary>规则名称</summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>触发条件（JSONB 格式）</summary>
        public string Conditions { get; set; } = "[]";

        /// <summary>结论描述</summary>
        public string Conclusion { get; set; } = string.Empty;

        /// <summary>推荐处理措施（可选）</summary>
        public string? RecommendedActions { get; set; }

        /// <summary>检查步骤（可选）</summary>
        public string? CheckSteps { get; set; }

        /// <summary>置信度权重（可选，默认 0.5）</summary>
        public decimal? ConfidenceWeight { get; set; }
    }

    /// <summary>
    /// 审核请求（批准/驳回时使用）
    /// </summary>
    public class ReviewRequest
    {
        /// <summary>审核意见</summary>
        public string? Comment { get; set; }
    }

    /// <summary>
    /// 正式知识规则响应
    /// </summary>
    public class KnowledgeRuleResponse
    {
        public Guid Id { get; set; }
        public string DeviceType { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Conditions { get; set; } = string.Empty;
        public string Conclusion { get; set; } = string.Empty;
        public string? RecommendedActions { get; set; }
        public string? CheckSteps { get; set; }
        public decimal ConfidenceWeight { get; set; }
        public string Source { get; set; } = string.Empty;
        public decimal? AccuracyRate { get; set; }
        public int SuccessCount { get; set; }
        public bool Enabled { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// 候选规则响应
    /// </summary>
    public class PendingRuleResponse
    {
        public Guid Id { get; set; }
        public string DeviceType { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Conditions { get; set; } = string.Empty;
        public string Conclusion { get; set; } = string.Empty;
        public string? RecommendedActions { get; set; }
        public string? CheckSteps { get; set; }
        public Guid? SourceWorkorderId { get; set; }
        public Guid? SourceCaseId { get; set; }
        public decimal? Confidence { get; set; }
        public string ReviewStatus { get; set; } = string.Empty;
        public Guid? ReviewedBy { get; set; }
        public string? ReviewComment { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// 故障案例响应
    /// </summary>
    public class FaultCaseResponse
    {
        public Guid Id { get; set; }
        public Guid? DeviceId { get; set; }
        public string DeviceType { get; set; } = string.Empty;
        public DateTime? FaultOccurredAt { get; set; }
        public string FaultDescription { get; set; } = string.Empty;
        public string? Symptoms { get; set; }
        public string RootCause { get; set; } = string.Empty;
        public string Solution { get; set; } = string.Empty;
        public int? RepairDurationMinutes { get; set; }
        public string? PartsUsed { get; set; }
        public string? FaultData { get; set; }
        public string? Operator { get; set; }
        public bool IsVerified { get; set; }
        public Guid? SourceWorkorderId { get; set; }
        public string? Tags { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// 批量导入响应
    /// </summary>
    public class BatchImportResponse
    {
        /// <summary>成功导入数量</summary>
        public int Imported { get; set; }

        /// <summary>失败数量</summary>
        public int Failed { get; set; }

        /// <summary>失败详情</summary>
        public List<string> Errors { get; set; } = [];
    }

    #endregion

    #region 实体映射方法

    private static KnowledgeRuleResponse MapToRuleResponse(Core.Entities.KnowledgeRule rule) => new()
    {
        Id = rule.Id,
        DeviceType = rule.DeviceType,
        Name = rule.Name,
        Conditions = rule.Conditions,
        Conclusion = rule.Conclusion,
        RecommendedActions = rule.RecommendedActions,
        CheckSteps = rule.CheckSteps,
        ConfidenceWeight = rule.ConfidenceWeight,
        Source = rule.Source,
        AccuracyRate = rule.AccuracyRate,
        SuccessCount = rule.SuccessCount,
        Enabled = rule.Enabled,
        CreatedBy = rule.CreatedBy,
        CreatedAt = rule.CreatedAt
    };

    private static PendingRuleResponse MapToPendingRuleResponse(Core.Entities.PendingRule rule) => new()
    {
        Id = rule.Id,
        DeviceType = rule.DeviceType,
        Name = rule.Name,
        Conditions = rule.Conditions,
        Conclusion = rule.Conclusion,
        RecommendedActions = rule.RecommendedActions,
        CheckSteps = rule.CheckSteps,
        SourceWorkorderId = rule.SourceWorkorderId,
        SourceCaseId = rule.SourceCaseId,
        Confidence = rule.Confidence,
        ReviewStatus = rule.ReviewStatus.ToString(),
        ReviewedBy = rule.ReviewedBy,
        ReviewComment = rule.ReviewComment,
        ReviewedAt = rule.ReviewedAt,
        CreatedAt = rule.CreatedAt
    };

    private static FaultCaseResponse MapToFaultCaseResponse(Core.Entities.FaultCase c) => new()
    {
        Id = c.Id,
        DeviceId = c.DeviceId,
        DeviceType = c.DeviceType,
        FaultOccurredAt = c.FaultOccurredAt,
        FaultDescription = c.FaultDescription,
        Symptoms = c.Symptoms,
        RootCause = c.RootCause,
        Solution = c.Solution,
        RepairDurationMinutes = c.RepairDurationMinutes,
        PartsUsed = c.PartsUsed,
        FaultData = c.FaultData,
        Operator = c.Operator,
        IsVerified = c.IsVerified,
        SourceWorkorderId = c.SourceWorkorderId,
        Tags = c.Tags,
        CreatedAt = c.CreatedAt
    };

    #endregion
}
