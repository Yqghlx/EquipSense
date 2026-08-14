using System.Text;
using EquipAI.Application.DTOs.Common;
using EquipAI.Application.Knowledge;
using EquipAI.Application.Knowledge.DTOs;
using EquipAI.Core.Interfaces;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Controllers.Knowledge;

/// <summary>
/// 正式知识规则管理控制器
/// 提供规则 CRUD、冲突检测、批量导入导出、版本管理与回滚
/// 路由前缀保持 api/v1/knowledge 以兼容前端
/// </summary>
[ApiController]
[Route("api/v1/knowledge")]
[Authorize]
public class KnowledgeRulesController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly KnowledgeConflictService _conflictService;
    private readonly KnowledgeImportService _importService;
    private readonly KnowledgeVersionService _versionService;
    private readonly ITenantContext _tenantContext;

    /// <summary>
    /// 初始化正式知识规则控制器
    /// </summary>
    public KnowledgeRulesController(
        AppDbContext dbContext,
        KnowledgeConflictService conflictService,
        KnowledgeImportService importService,
        KnowledgeVersionService versionService,
        ITenantContext tenantContext)
    {
        _dbContext = dbContext;
        _conflictService = conflictService;
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
        // 全局过滤器之外再次绑定当前租户，避免跟踪实体或过滤器上下文异常导致越权读取。
        var rules = _dbContext.KnowledgeRules
            .Where(r => r.TenantId == _tenantContext.TenantId);

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
            Items = items.Select(KnowledgeMapper.MapToRuleResponse).ToList(),
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

        return CreatedAtAction(nameof(GetRules), new { id = rule.Id }, KnowledgeMapper.MapToRuleResponse(rule));
    }

    /// <summary>
    /// 检测知识规则冲突
    /// 比较指定设备类型和条件与已有规则的指标重叠情况
    /// </summary>
    /// <param name="request">冲突检测请求</param>
    /// <returns>冲突结果列表</returns>
    [HttpPost("rules/check-conflicts")]
    [RequirePermission("knowledge:read")]
    [ProducesResponseType(typeof(List<KnowledgeConflictResult>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<KnowledgeConflictResult>>> CheckConflicts(
        [FromBody] ConflictCheckRequest request)
    {
        var conflicts = await _conflictService.DetectConflictsAsync(
            _tenantContext.TenantId,
            request.DeviceType,
            request.Conditions,
            request.ExcludeRuleId,
            HttpContext.RequestAborted);

        return Ok(conflicts);
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
        var rule = await _dbContext.KnowledgeRules
            .FirstOrDefaultAsync(
                r => r.Id == id && r.TenantId == _tenantContext.TenantId,
                HttpContext.RequestAborted);
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

        return Ok(KnowledgeMapper.MapToRuleResponse(rule));
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
        var rule = await _dbContext.KnowledgeRules
            .FirstOrDefaultAsync(
                r => r.Id == id && r.TenantId == _tenantContext.TenantId,
                HttpContext.RequestAborted);
        if (rule is null)
            return NotFound(new { code = 404, message = "知识规则不存在" });

        rule.Enabled = !rule.Enabled;
        await _dbContext.SaveChangesAsync(HttpContext.RequestAborted);

        return Ok(KnowledgeMapper.MapToRuleResponse(rule));
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
    /// 支持 JSON 和 CSV 两种导出格式，可选按设备类型过滤，单次最多返回 10000 条
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
        var exists = await _dbContext.KnowledgeRules.AnyAsync(
            r => r.Id == id && r.TenantId == _tenantContext.TenantId,
            HttpContext.RequestAborted);
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
            return Ok(KnowledgeMapper.MapToRuleResponse(rule));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { code = 404, message = ex.Message });
        }
    }
}
