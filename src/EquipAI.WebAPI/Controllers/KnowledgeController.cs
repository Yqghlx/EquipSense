using System.Text;
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

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 知识库管理控制器
/// 提供正式规则 CRUD、候选规则审核、故障案例查询、批量导入导出和版本管理等接口
/// </summary>
[ApiController]
[Route("api/v1/knowledge")]
[Authorize]
public class KnowledgeController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly KnowledgeCaptureService _captureService;
    private readonly KnowledgeImportService _importService;
    private readonly KnowledgeVersionService _versionService;
    private readonly ITenantContext _tenantContext;

    /// <summary>
    /// 初始化知识库管理控制器
    /// </summary>
    /// <param name="dbContext">数据库上下文</param>
    /// <param name="captureService">知识沉淀服务，用于候选规则审核</param>
    /// <param name="importService">知识规则导入导出服务</param>
    /// <param name="versionService">知识规则版本管理服务</param>
    /// <param name="tenantContext">租户上下文，用于获取当前请求的租户 ID</param>
    public KnowledgeController(
        AppDbContext dbContext,
        KnowledgeCaptureService captureService,
        KnowledgeImportService importService,
        KnowledgeVersionService versionService,
        ITenantContext tenantContext)
    {
        _dbContext = dbContext;
        _captureService = captureService;
        _importService = importService;
        _versionService = versionService;
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
    /// 编辑正式知识规则
    /// 编辑前自动保存版本快照，仅更新非空字段，版本号自动递增
    /// </summary>
    /// <param name="id">规则 ID</param>
    /// <param name="request">编辑请求（仅非空字段会被更新）</param>
    /// <returns>更新后的规则信息</returns>
    [HttpPut("rules/{id:guid}")]
    [RequirePermission("knowledge:update")]
    [ProducesResponseType(typeof(KnowledgeRuleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<KnowledgeRuleResponse>> UpdateRule(
        Guid id, [FromBody] UpdateKnowledgeRuleRequest request)
    {
        var rule = await _dbContext.KnowledgeRules.FindAsync([id], HttpContext.RequestAborted);
        if (rule is null)
            return NotFound(new { code = 404, message = "知识规则不存在" });

        // 编辑前先保存版本快照
        await _versionService.CreateVersionSnapshotAsync(
            rule, _tenantContext.UserId, request.ChangeSummary, HttpContext.RequestAborted);

        // 仅更新非空字段
        if (!string.IsNullOrWhiteSpace(request.DeviceType))
            rule.DeviceType = request.DeviceType;
        if (!string.IsNullOrWhiteSpace(request.Name))
            rule.Name = request.Name;
        if (!string.IsNullOrWhiteSpace(request.Conditions))
            rule.Conditions = request.Conditions;
        if (!string.IsNullOrWhiteSpace(request.Conclusion))
            rule.Conclusion = request.Conclusion;
        if (request.RecommendedActions is not null)
            rule.RecommendedActions = request.RecommendedActions;
        if (request.CheckSteps is not null)
            rule.CheckSteps = request.CheckSteps;
        if (request.ConfidenceWeight.HasValue)
            rule.ConfidenceWeight = request.ConfidenceWeight.Value;

        // 版本号递增
        rule.Version++;

        await _dbContext.SaveChangesAsync(HttpContext.RequestAborted);

        return Ok(MapToRuleResponse(rule));
    }

    /// <summary>
    /// 启用/禁用规则切换
    /// 将规则的 Enabled 状态取反
    /// </summary>
    /// <param name="id">规则 ID</param>
    /// <returns>更新后的规则信息</returns>
    [HttpPatch("rules/{id:guid}/toggle")]
    [RequirePermission("knowledge:update")]
    [ProducesResponseType(typeof(KnowledgeRuleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<KnowledgeRuleResponse>> ToggleRule(Guid id)
    {
        var rule = await _dbContext.KnowledgeRules.FindAsync([id], HttpContext.RequestAborted);
        if (rule is null)
            return NotFound(new { code = 404, message = "知识规则不存在" });

        rule.Enabled = !rule.Enabled;
        await _dbContext.SaveChangesAsync(HttpContext.RequestAborted);

        return Ok(MapToRuleResponse(rule));
    }

    /// <summary>
    /// CSV/JSON 文件批量导入知识规则
    /// 支持预览模式（仅校验不写入）和正式导入模式
    /// </summary>
    /// <param name="file">上传的文件（CSV 或 JSON 格式）</param>
    /// <param name="preview">是否预览模式（true=仅校验，false=正式导入）</param>
    /// <returns>预览结果或导入结果</returns>
    [HttpPost("rules/import")]
    [RequirePermission("knowledge:create")]
    [ProducesResponseType(typeof(ImportPreviewResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ImportResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [RequestSizeLimit(5 * 1024 * 1024)] // 5MB 文件大小限制
    public async Task<IActionResult> ImportRules(
        IFormFile file, [FromQuery] bool preview = false)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { code = 400, message = "请上传文件" });

        // 文件大小限制 5MB
        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(new { code = 400, message = "文件大小不能超过 5MB" });

        // 仅支持 .csv 和 .json
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension is not (".csv" or ".json"))
            return BadRequest(new { code = 400, message = "仅支持 .csv 和 .json 格式文件" });

        // 读取文件内容
        string content;
        using (var reader = new StreamReader(file.OpenReadStream(), Encoding.UTF8))
        {
            content = await reader.ReadToEndAsync(HttpContext.RequestAborted);
        }

        if (string.IsNullOrWhiteSpace(content))
            return BadRequest(new { code = 400, message = "文件内容不能为空" });

        if (preview)
        {
            // 预览模式：仅解析校验，不写入数据库
            var previewResult = _importService.PreviewImport(content, file.FileName);
            return Ok(previewResult);
        }

        // 正式导入模式：解析并写入数据库
        var importResult = await _importService.ExecuteImportAsync(
            content, file.FileName, _tenantContext.TenantId, _tenantContext.UserId,
            HttpContext.RequestAborted);
        return Ok(importResult);
    }

    /// <summary>
    /// 批量导出知识规则
    /// 支持 JSON 和 CSV 两种导出格式，可选按设备类型过滤
    /// </summary>
    /// <param name="format">导出格式（json 或 csv）</param>
    /// <param name="deviceType">可选：按设备类型过滤</param>
    /// <returns>导出文件</returns>
    [HttpGet("rules/export")]
    [RequirePermission("knowledge:read")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportRules(
        [FromQuery] string format = "json",
        [FromQuery] string? deviceType = null)
    {
        var ct = HttpContext.RequestAborted;

        if (format.Equals("csv", StringComparison.OrdinalIgnoreCase))
        {
            var csv = await _importService.ExportAsCsvAsync(_tenantContext.TenantId, deviceType, ct);
            var bytes = Encoding.UTF8.GetBytes(csv);
            return File(bytes, "text/csv", $"knowledge-rules-{DateTime.Now:yyyyMMddHHmmss}.csv");
        }

        // 默认 JSON 格式导出
        var json = await _importService.ExportAsJsonAsync(_tenantContext.TenantId, deviceType, ct);
        var jsonBytes = Encoding.UTF8.GetBytes(json);
        return File(jsonBytes, "application/json", $"knowledge-rules-{DateTime.Now:yyyyMMddHHmmss}.json");
    }

    /// <summary>
    /// 行业预置规则一键导入
    /// 从系统租户读取行业预置规则复制到当前租户，自动跳过已存在的同名规则
    /// </summary>
    /// <returns>导入结果</returns>
    [HttpPost("rules/preset-import")]
    [RequirePermission("knowledge:create")]
    [ProducesResponseType(typeof(ImportResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<ImportResult>> ImportIndustryPreset()
    {
        var result = await _importService.ImportIndustryPresetAsync(
            _tenantContext.TenantId, _tenantContext.UserId, HttpContext.RequestAborted);
        return Ok(result);
    }

    /// <summary>
    /// 获取规则的版本历史
    /// 按版本号降序返回该规则的所有历史快照
    /// </summary>
    /// <param name="id">规则 ID</param>
    /// <returns>版本历史列表</returns>
    [HttpGet("rules/{id:guid}/versions")]
    [RequirePermission("knowledge:read")]
    [ProducesResponseType(typeof(List<KnowledgeRuleVersionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<KnowledgeRuleVersionDto>>> GetRuleVersions(Guid id)
    {
        // 先检查规则是否存在
        var exists = await _dbContext.KnowledgeRules.AnyAsync(r => r.Id == id, HttpContext.RequestAborted);
        if (!exists)
            return NotFound(new { code = 404, message = "知识规则不存在" });

        var versions = await _versionService.GetVersionHistoryAsync(id, HttpContext.RequestAborted);
        return Ok(versions);
    }

    /// <summary>
    /// 回滚规则到指定版本
    /// 回滚前自动保存当前状态为快照，从目标版本快照恢复规则内容
    /// </summary>
    /// <param name="id">规则 ID</param>
    /// <param name="version">目标版本号（必须 >= 1）</param>
    /// <returns>回滚后的规则信息</returns>
    [HttpPost("rules/{id:guid}/rollback")]
    [RequirePermission("knowledge:update")]
    [ProducesResponseType(typeof(KnowledgeRuleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<KnowledgeRuleResponse>> RollbackRule(
        Guid id, [FromQuery] int version)
    {
        if (version < 1)
            return BadRequest(new { code = 400, message = "版本号必须 >= 1" });

        try
        {
            var rule = await _versionService.RollbackToVersionAsync(
                id, version, _tenantContext.UserId, HttpContext.RequestAborted);
            return Ok(MapToRuleResponse(rule));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { code = 404, message = ex.Message });
        }
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

        return CreatedAtAction(nameof(GetPendingRules), new { id = rule.Id }, MapToPendingRuleResponse(rule));
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
    /// 创建候选规则请求
    /// </summary>
    public class CreatePendingRuleRequest
    {
        /// <summary>规则名称</summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>触发条件</summary>
        public object? Conditions { get; set; }

        /// <summary>推荐处理措施</summary>
        public string? Recommendation { get; set; }

        /// <summary>置信度（0-1）</summary>
        public decimal? Confidence { get; set; }

        /// <summary>来源</summary>
        public string? Source { get; set; }
    }

    /// <summary>
    /// 编辑后批准请求
    /// </summary>
    public class ApproveWithEditRequest
    {
        /// <summary>调整后的触发条件</summary>
        public string? AdjustedConditions { get; set; }

        /// <summary>调整后的结论描述</summary>
        public string? AdjustedConclusion { get; set; }

        /// <summary>调整后的规则名称</summary>
        public string? AdjustedName { get; set; }

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

        /// <summary>当前版本号</summary>
        public int Version { get; set; }
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
        public Guid? SourceAlertId { get; set; }
        public Guid? SourceAnalysisId { get; set; }
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
        CreatedAt = rule.CreatedAt,
        Version = rule.Version
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
        SourceAlertId = rule.SourceAlertId,
        SourceAnalysisId = rule.SourceAnalysisId,
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
