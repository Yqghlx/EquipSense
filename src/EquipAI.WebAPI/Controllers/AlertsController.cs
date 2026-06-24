using Microsoft.AspNetCore.OutputCaching;
using AutoMapper;
using EquipAI.Application.Alerts.DTOs;
using EquipAI.Application.DTOs.Common;
using EquipAI.Application.Services;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Middleware;
using EquipAI.WebAPI.Middleware;
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
    private readonly DataExportService _exportService;
    private readonly IEventBus _eventBus;

    public AlertsController(AppDbContext dbContext, IMapper mapper, ITenantContext tenantContext, DataExportService exportService, IEventBus eventBus)
    {
        _dbContext = dbContext;
        _mapper = mapper;
        _tenantContext = tenantContext;
        _exportService = exportService;
        _eventBus = eventBus;
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
    {
        var alerts = _dbContext.Alerts.AsQueryable();

        if (deviceId.HasValue)
        {
            alerts = alerts.Where(a => a.DeviceId == deviceId.Value);
        }

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
    public async Task<ActionResult<AlertDto>> GetAlert(Guid id)
    {
        var alert = await _dbContext.Alerts.FindAsync(id);
        if (alert == null)
            return NotFound(new { code = 404, message = "告警不存在" });

        return Ok(_mapper.Map<AlertDto>(alert));
    }

    [HttpPut("{id:guid}/acknowledge")]
    [RequirePermission("alert:acknowledge")]
    [Audit("Acknowledge", "Alert")]
    [ProducesResponseType(typeof(AlertDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AlertDto>> AcknowledgeAlert(Guid id, [FromBody] AcknowledgeAlertRequest? request)
    {
        var alert = await _dbContext.Alerts.FindAsync(id)
            ?? throw new KeyNotFoundException($"告警 {id} 不存在");

        if (alert.Status != AlertStatus.Active)
            return BadRequest(new { code = 400, message = "只能确认活跃状态的告警" });

        alert.Status = AlertStatus.Acknowledged;
        // 记录操作用户 ID（非租户 ID）：审计须追溯「谁确认了告警」。原误用 TenantId（全租户共享同一 GUID），
        // 致确认/解决操作审计归因失效——与 WorkOrdersController 一致地用 UserId
        alert.AcknowledgedBy = _tenantContext.UserId;
        alert.AcknowledgedAt = DateTime.UtcNow;
        alert.AcknowledgementNote = request?.Note;

        await _dbContext.SaveChangesAsync();

        // 发布告警确认事件 → AlertStatusNotificationHandler → SignalR 推送 OnAlertAcknowledged，
        // 让告警中心其他在线用户实时看到该告警已被确认接管（避免多人重复确认/重复派工）。
        // 原实现只改 DB 返回、无实时推送——与工单状态变更推送（#231-#251）不对称。
        // 显式 CancellationToken.None：即便发起方断开连接，状态变更仍须通知其他在线用户
        await _eventBus.PublishAsync(new AlertAcknowledgedEvent(
            EventId: Guid.NewGuid(),
            OccurredAt: DateTime.UtcNow,
            TenantId: _tenantContext.TenantId,
            AlertId: id,
            AcknowledgedBy: _tenantContext.UserId,
            Note: request?.Note), CancellationToken.None);

        return Ok(_mapper.Map<AlertDto>(alert));
    }

    [HttpPut("{id:guid}/resolve")]
    [Audit("Resolve", "Alert")]
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
        // 记录操作用户 ID（非租户 ID），与 Acknowledge 对称（审计须追溯「谁解决了告警」）
        alert.ResolvedBy = _tenantContext.UserId;
        alert.ResolvedAt = DateTime.UtcNow;
        alert.Resolution = request.Resolution;

        await _dbContext.SaveChangesAsync();

        // 发布告警解决事件 → AlertStatusNotificationHandler → SendAlertResolvedAsync（复活既有死代码：
        // 接口/实现/前端监听齐备但全仓零调用），三路推送 OnAlertResolved + 持久化通知 + Web Push，
        // 让告警中心其他用户实时看到该告警已闭环。与 Acknowledge 对称。
        await _eventBus.PublishAsync(new AlertResolvedEvent(
            EventId: Guid.NewGuid(),
            OccurredAt: DateTime.UtcNow,
            TenantId: _tenantContext.TenantId,
            AlertId: id,
            ResolvedBy: _tenantContext.UserId,
            Resolution: request.Resolution), CancellationToken.None);

        return Ok(_mapper.Map<AlertDto>(alert));
    }
}
