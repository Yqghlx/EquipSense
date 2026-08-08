using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.Application.Notifications;

/// <summary>
/// 通知查询与管理服务。
/// 封装通知列表查询、未读计数、标记已读、删除等，使 Controller 不直接依赖 <c>AppDbContext</c>。
/// 所有操作按 <c>UserId</c> 过滤，确保用户只能访问自己的通知（除全局过滤器外额外保险）。
/// </summary>
public class NotificationService
{
    private readonly AppDbContext _db;
    private readonly ITenantContext _tenantContext;

    public NotificationService(AppDbContext db, ITenantContext tenantContext)
    {
        _db = db;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 分页查询当前用户的通知列表。
    /// </summary>
    public async Task<object> ListAsync(int page, int pageSize, bool? unreadOnly = null, CancellationToken ct = default)
    {
        var query = _db.Notifications
            .Where(n => n.UserId == _tenantContext.UserId);

        if (unreadOnly == true)
            query = query.Where(n => !n.IsRead);

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

        return new { items, total, page, pageSize };
    }

    /// <summary>
    /// 获取当前用户未读通知数量。
    /// </summary>
    public async Task<int> GetUnreadCountAsync(CancellationToken ct = default)
        => await _db.Notifications
            .CountAsync(n => n.UserId == _tenantContext.UserId && !n.IsRead, ct);

    /// <summary>
    /// 标记指定通知为已读。返回 false 表示该通知不属于当前用户或不存在。
    /// </summary>
    public async Task<bool> MarkReadAsync(Guid id, CancellationToken ct = default)
    {
        var notification = await _db.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == _tenantContext.UserId, ct);

        if (notification is null)
            return false;

        notification.IsRead = true;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    /// <summary>
    /// 标记当前用户所有未读通知为已读。
    /// </summary>
    public async Task MarkAllReadAsync(CancellationToken ct = default)
    {
        await _db.Notifications
            .Where(n => n.UserId == _tenantContext.UserId && !n.IsRead)
            .ExecuteUpdateAsync(setters => setters.SetProperty(n => n.IsRead, true), ct);
    }

    /// <summary>
    /// 删除指定通知。返回 false 表示该通知不属于当前用户或不存在。
    /// </summary>
    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var notification = await _db.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == _tenantContext.UserId, ct);

        if (notification is null)
            return false;

        _db.Notifications.Remove(notification);
        await _db.SaveChangesAsync(ct);
        return true;
    }
}
