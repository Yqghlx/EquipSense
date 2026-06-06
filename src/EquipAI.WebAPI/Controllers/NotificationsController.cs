using EquipAI.Application.Notifications;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 通知控制器 — 提供通知查询、标记已读、删除等功能
/// </summary>
[ApiController]
[Route("api/v1/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITenantContext _tenantContext;
    private readonly NotificationPreferenceService _prefService;

    public NotificationsController(AppDbContext db, ITenantContext tenantContext, NotificationPreferenceService prefService)
    {
        _db = db;
        _tenantContext = tenantContext;
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
    {
        var query = _db.Notifications
            .Where(n => n.UserId == _tenantContext.UserId);

        if (unreadOnly == true)
        {
            query = query.Where(n => !n.IsRead);
        }

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new
            {
                n.Id,
                n.Type,
                n.Title,
                n.Content,
                n.RelatedId,
                n.Link,
                n.IsRead,
                n.CreatedAt,
            })
            .ToListAsync(ct);

        return Ok(new { items, total, page, pageSize });
    }

    /// <summary>
    /// 获取当前用户未读通知数量
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<ActionResult<int>> GetUnreadCount(CancellationToken ct)
    {
        var count = await _db.Notifications
            .CountAsync(n => n.UserId == _tenantContext.UserId && !n.IsRead, ct);
        return Ok(count);
    }

    /// <summary>
    /// 标记指定通知为已读
    /// </summary>
    [HttpPut("{id:guid}/read")]
    public async Task<ActionResult> MarkRead(Guid id, CancellationToken ct)
    {
        var notification = await _db.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == _tenantContext.UserId, ct);

        if (notification is null)
        {
            return NotFound();
        }

        notification.IsRead = true;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    /// <summary>
    /// 标记当前用户所有通知为已读
    /// </summary>
    [HttpPut("read-all")]
    public async Task<ActionResult> MarkAllRead(CancellationToken ct)
    {
        await _db.Notifications
            .Where(n => n.UserId == _tenantContext.UserId && !n.IsRead)
            .ExecuteUpdateAsync(setters => setters.SetProperty(n => n.IsRead, true), ct);

        return NoContent();
    }

    /// <summary>
    /// 删除指定通知
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteNotification(Guid id, CancellationToken ct)
    {
        var notification = await _db.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == _tenantContext.UserId, ct);

        if (notification is null)
        {
            return NotFound();
        }

        _db.Notifications.Remove(notification);
        await _db.SaveChangesAsync(ct);
        return NoContent();
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
