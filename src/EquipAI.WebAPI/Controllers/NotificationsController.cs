using EquipAI.Application.Notifications;
using EquipAI.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 通知控制器 — 提供通知查询、标记已读、删除等功能
/// </summary>
[ApiController]
[Route("api/v1/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly ITenantContext _tenantContext;
    private readonly NotificationService _notificationService;
    private readonly NotificationPreferenceService _prefService;

    public NotificationsController(
        ITenantContext tenantContext,
        NotificationService notificationService,
        NotificationPreferenceService prefService)
    {
        _tenantContext = tenantContext;
        _notificationService = notificationService;
        _prefService = prefService;
    }

    /// <summary>
    /// 查询当前用户的通知列表
    /// </summary>
    [HttpGet]
    public async Task<ActionResult> GetNotifications(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? unreadOnly = null,
        CancellationToken ct = default)
        => Ok(await _notificationService.ListAsync(page, pageSize, unreadOnly, ct));

    /// <summary>
    /// 获取当前用户未读通知数量
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<ActionResult<int>> GetUnreadCount(CancellationToken ct)
        => Ok(await _notificationService.GetUnreadCountAsync(ct));

    /// <summary>
    /// 标记指定通知为已读
    /// </summary>
    [HttpPut("{id:guid}/read")]
    public async Task<ActionResult> MarkRead(Guid id, CancellationToken ct)
    {
        var ok = await _notificationService.MarkReadAsync(id, ct);
        return ok ? NoContent() : NotFound();
    }

    /// <summary>
    /// 标记当前用户所有通知为已读
    /// </summary>
    [HttpPut("read-all")]
    public async Task<ActionResult> MarkAllRead(CancellationToken ct)
    {
        await _notificationService.MarkAllReadAsync(ct);
        return NoContent();
    }

    /// <summary>
    /// 删除指定通知
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteNotification(Guid id, CancellationToken ct)
    {
        var ok = await _notificationService.DeleteAsync(id, ct);
        return ok ? NoContent() : NotFound();
    }

    /// <summary>
    /// 获取当前用户的通知偏好设置
    /// </summary>
    [HttpGet("preferences")]
    public async Task<ActionResult<NotificationPreferences>> GetPreferences(CancellationToken ct)
    {
        var prefs = await _prefService.GetAsync(_tenantContext.UserId, ct);
        return Ok(prefs);
    }

    /// <summary>
    /// 更新当前用户的通知偏好设置
    /// </summary>
    [HttpPut("preferences")]
    public async Task<ActionResult<NotificationPreferences>> UpdatePreferences(
        [FromBody] NotificationPreferences prefs, CancellationToken ct)
    {
        var updated = await _prefService.UpdateAsync(_tenantContext.UserId, prefs, ct);
        return Ok(updated);
    }
}
