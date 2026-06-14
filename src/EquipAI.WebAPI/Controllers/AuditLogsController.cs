using Microsoft.AspNetCore.OutputCaching;
using EquipAI.Application.DTOs.Common;
using EquipAI.Application.Services;
using EquipAI.Core.Interfaces;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 审计日志控制器 — 提供操作审计日志的查询和导出能力
/// 用于合规追溯：所有设备/工单/告警/用户的增删改操作记录均可查询和导出
/// </summary>
[ApiController]
[Route("api/v1/audit-logs")]
[Authorize]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditLogService _auditLogService;
    private readonly DataExportService _exportService;
    private readonly ITenantContext _tenantContext;

    public AuditLogsController(IAuditLogService auditLogService, DataExportService exportService, ITenantContext tenantContext)
    {
        _auditLogService = auditLogService;
        _exportService = exportService;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 分页查询审计日志（支持按动作、资源类型筛选）
    /// </summary>
    [HttpGet]
    [RequirePermission("audit:read")]
    [OutputCache(Duration = 300)] // 5 分钟缓存，审计日志变化频率低
    [ProducesResponseType(typeof(PagedResult<AuditLogDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<AuditLogDto>>> GetAuditLogs(
        [FromQuery] PagedQuery query,
        [FromQuery] string? action = null,
        [FromQuery] string? resourceType = null,
        CancellationToken ct = default)
    {
        var logs = await _auditLogService.GetAuditLogsAsync(_tenantContext.TenantId, query.Page, query.PageSize, ct);
        // 在内存中按可选筛选条件二次过滤（查询服务暂不支持条件参数）
        var items = logs.Items.AsEnumerable();
        if (!string.IsNullOrWhiteSpace(action))
            items = items.Where(l => l.Action.Equals(action, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(resourceType))
            items = items.Where(l => l.ResourceType.Equals(resourceType, StringComparison.OrdinalIgnoreCase));

        var filtered = items.ToList();
        return Ok(new PagedResult<AuditLogDto>
        {
            Items = filtered,
            Total = filtered.Count,
            Page = query.Page,
            PageSize = query.PageSize,
        });
    }

    /// <summary>
    /// 导出审计日志为 CSV（最多 10000 条）
    /// </summary>
    [HttpGet("export")]
    [RequirePermission("audit:read")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportAuditLogs(
        [FromQuery] string? action = null,
        [FromQuery] string? resourceType = null,
        CancellationToken ct = default)
    {
        var bytes = await _exportService.ExportAuditLogsAsync(_tenantContext.TenantId, action, resourceType, ct);
        var fileName = $"audit_logs_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
        return File(bytes, "text/csv; charset=utf-8", fileName);
    }
}
