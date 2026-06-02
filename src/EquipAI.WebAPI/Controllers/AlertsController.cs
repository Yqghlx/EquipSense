using AutoMapper;
using EquipAI.Application.Alerts.DTOs;
using EquipAI.Application.DTOs.Common;
using EquipAI.Core.Entities;
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
/// 告警实例管理控制器
/// </summary>
[ApiController]
[Route("api/v1/alerts")]
[Authorize]
public class AlertsController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IMapper _mapper;
    private readonly ITenantContext _tenantContext;

    public AlertsController(AppDbContext dbContext, IMapper mapper, ITenantContext tenantContext)
    {
        _dbContext = dbContext;
        _mapper = mapper;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    [RequirePermission("alert:read")]
    [ProducesResponseType(typeof(PagedResult<AlertDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<AlertDto>>> GetAlerts(
        [FromQuery] PagedQuery query,
        [FromQuery] string? status = null,
        [FromQuery] string? severity = null)
    {
        var alerts = _dbContext.Alerts.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<AlertStatus>(status, ignoreCase: true, out var alertStatus))
        {
            alerts = alerts.Where(a => a.Status == alertStatus);
        }

        if (!string.IsNullOrWhiteSpace(severity) &&
            Enum.TryParse<AlertSeverity>(severity, ignoreCase: true, out var alertSeverity))
        {
            alerts = alerts.Where(a => a.Severity == alertSeverity);
        }

        var (items, total) = await alerts.ToPagedAsync(query);

        return Ok(new PagedResult<AlertDto>
        {
            Items = _mapper.Map<List<AlertDto>>(items)!,
            Total = total,
            Page = query.Page,
            PageSize = query.PageSize
        });
    }

    [HttpGet("{id:guid}")]
    [RequirePermission("alert:read")]
    [ProducesResponseType(typeof(AlertDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AlertDto>> GetAlert(Guid id)
    {
        var alert = await _dbContext.Alerts.FindAsync(id);
        if (alert == null)
            return NotFound(new { code = 404, message = "告警不存在" });

        return Ok(_mapper.Map<AlertDto>(alert));
    }

    [HttpPut("{id:guid}/acknowledge")]
    [RequirePermission("alert:acknowledge")]
    [ProducesResponseType(typeof(AlertDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AlertDto>> AcknowledgeAlert(Guid id, [FromBody] AcknowledgeAlertRequest? request)
    {
        var alert = await _dbContext.Alerts.FindAsync(id)
            ?? throw new KeyNotFoundException($"告警 {id} 不存在");

        if (alert.Status != AlertStatus.Active)
            return BadRequest(new { code = 400, message = "只能确认活跃状态的告警" });

        alert.Status = AlertStatus.Acknowledged;
        alert.AcknowledgedBy = _tenantContext.TenantId;
        alert.AcknowledgedAt = DateTime.UtcNow;
        alert.AcknowledgementNote = request?.Note;

        await _dbContext.SaveChangesAsync();

        return Ok(_mapper.Map<AlertDto>(alert));
    }

    [HttpPut("{id:guid}/resolve")]
    [RequirePermission("alert:update")]
    [ProducesResponseType(typeof(AlertDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AlertDto>> ResolveAlert(Guid id, [FromBody] ResolveAlertRequest request)
    {
        var alert = await _dbContext.Alerts.FindAsync(id)
            ?? throw new KeyNotFoundException($"告警 {id} 不存在");

        if (alert.Status == AlertStatus.Resolved)
            return BadRequest(new { code = 400, message = "告警已解决" });

        alert.Status = AlertStatus.Resolved;
        alert.ResolvedBy = _tenantContext.TenantId;
        alert.ResolvedAt = DateTime.UtcNow;
        alert.Resolution = request.Resolution;

        await _dbContext.SaveChangesAsync();

        return Ok(_mapper.Map<AlertDto>(alert));
    }
}
