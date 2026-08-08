using EquipAI.Application.Alerts;
using EquipAI.Application.Alerts.DTOs;
using EquipAI.Application.DTOs.Common;
using EquipAI.Application.Services;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Middleware;
using EquipAI.WebAPI.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 告警实例管理控制器
/// </summary>
[ApiController]
[Route("api/v1/alerts")]
[Authorize]
public class AlertsController : ControllerBase
{
    private readonly AlertQueryService _queryService;
    private readonly DataExportService _exportService;
    private readonly ITenantContext _tenantContext;

    public AlertsController(
        AlertQueryService queryService,
        DataExportService exportService,
        ITenantContext tenantContext)
    {
        _queryService = queryService;
        _exportService = exportService;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    [RequirePermission("alert:read")]
    [OutputCache(Duration = 30)] // 30 秒缓存，平衡实时性与数据库负载
    [ProducesResponseType(typeof(PagedResult<AlertDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<AlertDto>>> GetAlerts(
        [FromQuery] PagedQuery query,
        [FromQuery] string? status = null,
        [FromQuery] string? severity = null,
        [FromQuery] Guid? deviceId = null)
        => Ok(await _queryService.ListAsync(query, status, severity, deviceId));

    /// <summary>
    /// 导出告警为 CSV（支持与列表相同的筛选条件，最多 10000 条）
    /// </summary>
    [HttpGet("export")]
    [RequirePermission("alert:read")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportAlerts(
        [FromQuery] string? status = null,
        [FromQuery] string? severity = null,
        [FromQuery] Guid? deviceId = null,
        CancellationToken ct = default)
    {
        AlertStatus? statusEnum = !string.IsNullOrWhiteSpace(status) && Enum.TryParse<AlertStatus>(status, true, out var s) ? s : null;
        AlertSeverity? sevEnum = !string.IsNullOrWhiteSpace(severity) && Enum.TryParse<AlertSeverity>(severity, true, out var sv) ? sv : null;

        var bytes = await _exportService.ExportAlertsAsync(_tenantContext.TenantId, statusEnum, sevEnum, deviceId, ct);
        var fileName = $"alerts_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
        return File(bytes, "text/csv; charset=utf-8", fileName);
    }

    [HttpGet("{id:guid}")]
    [RequirePermission("alert:read")]
    [ProducesResponseType(typeof(AlertDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AlertDto>> GetAlert(Guid id, CancellationToken ct = default)
    {
        var alert = await _queryService.GetAsync(id, ct);
        if (alert == null)
            return NotFound(new { code = 404, message = "告警不存在" });
        return Ok(alert);
    }

    [HttpPut("{id:guid}/acknowledge")]
    [RequirePermission("alert:acknowledge")]
    [Audit("Acknowledge", "Alert")]
    [ProducesResponseType(typeof(AlertDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AlertDto>> AcknowledgeAlert(Guid id, [FromBody] AcknowledgeAlertRequest? request, CancellationToken ct = default)
    {
        var (alert, error) = await _queryService.AcknowledgeAsync(id, request?.Note, ct);
        if (alert is null)
            return error == "告警不存在" ? NotFound(new { code = 404, message = error }) : BadRequest(new { code = 400, message = error });
        return Ok(alert);
    }

    [HttpPut("{id:guid}/resolve")]
    [Audit("Resolve", "Alert")]
    [RequirePermission("alert:update")]
    [ProducesResponseType(typeof(AlertDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AlertDto>> ResolveAlert(Guid id, [FromBody] ResolveAlertRequest request, CancellationToken ct = default)
    {
        var (alert, error) = await _queryService.ResolveAsync(id, request.Resolution, ct);
        if (alert is null)
            return error == "告警不存在" ? NotFound(new { code = 404, message = error }) : BadRequest(new { code = 400, message = error });
        return Ok(alert);
    }
}
