using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.Infrastructure.Messaging;

/// <summary>
/// Outbox 消息租约和状态更新存储。
/// 所有竞争操作都带租约令牌条件，避免旧实例在租约失效后覆盖新实例结果。
/// </summary>
public sealed class OutboxMessageStore
{
    private readonly AppDbContext _dbContext;

    /// <summary>
    /// 初始化 Outbox 存储。
    /// </summary>
    /// <param name="dbContext">应用数据库上下文</param>
    public OutboxMessageStore(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>
    /// 尝试取得一条消息的分发租约。
    /// </summary>
    /// <param name="messageId">消息 ID</param>
    /// <param name="now">当前 UTC 时间</param>
    /// <param name="leaseDuration">租约时长</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>取得租约时返回租约，否则返回 null</returns>
    public async Task<OutboxLease?> TryClaimAsync(
        Guid messageId,
        DateTime now,
        TimeSpan leaseDuration,
        CancellationToken ct = default)
    {
        var lockToken = Guid.NewGuid();
        var lockedUntil = now.Add(leaseDuration);
        var affectedRows = await _dbContext.OutboxMessages
            .IgnoreQueryFilters()
            .Where(item => item.Id == messageId
                && item.PublishedAt == null
                && item.AvailableAt <= now
                && (item.LockedUntil == null || item.LockedUntil <= now))
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.AttemptCount, item => item.AttemptCount + 1)
                .SetProperty(item => item.LockedUntil, lockedUntil)
                .SetProperty(item => item.LockToken, lockToken), ct);

        return affectedRows == 1 ? new OutboxLease(lockToken, lockedUntil) : null;
    }

    /// <summary>
    /// 仅由当前租约持有者把消息标记为已发布。
    /// </summary>
    public async Task<bool> MarkPublishedAsync(
        Guid messageId,
        Guid lockToken,
        DateTime publishedAt,
        CancellationToken ct = default)
    {
        var affectedRows = await _dbContext.OutboxMessages
            .IgnoreQueryFilters()
            .Where(item => item.Id == messageId
                && item.LockToken == lockToken
                && item.PublishedAt == null)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.PublishedAt, publishedAt)
                .SetProperty(item => item.LockedUntil, (DateTime?)null)
                .SetProperty(item => item.LockToken, (Guid?)null)
                .SetProperty(item => item.LastError, (string?)null), ct);
        return affectedRows == 1;
    }

    /// <summary>
    /// 记录当前租约的发布失败，并安排下一次重试。
    /// </summary>
    public async Task<bool> MarkFailedAsync(
        Guid messageId,
        Guid lockToken,
        DateTime availableAt,
        string error,
        CancellationToken ct = default)
    {
        var normalizedError = error.Length <= 2000 ? error : error[..2000];
        var affectedRows = await _dbContext.OutboxMessages
            .IgnoreQueryFilters()
            .Where(item => item.Id == messageId
                && item.LockToken == lockToken
                && item.PublishedAt == null)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.AvailableAt, availableAt)
                .SetProperty(item => item.LockedUntil, (DateTime?)null)
                .SetProperty(item => item.LockToken, (Guid?)null)
                .SetProperty(item => item.LastError, normalizedError), ct);
        return affectedRows == 1;
    }
}

/// <summary>
/// Outbox 分发租约。
/// </summary>
/// <param name="LockToken">租约令牌</param>
/// <param name="LockedUntil">租约过期时间</param>
public sealed record OutboxLease(Guid LockToken, DateTime LockedUntil);
