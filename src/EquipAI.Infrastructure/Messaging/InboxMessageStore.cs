using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.Infrastructure.Messaging;

/// <summary>
/// Inbox 消息租约和幂等状态存储。
/// </summary>
public sealed class InboxMessageStore
{
    private readonly AppDbContext _dbContext;

    /// <summary>
    /// 初始化 Inbox 存储。
    /// </summary>
    /// <param name="dbContext">应用数据库上下文</param>
    public InboxMessageStore(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>
    /// 尝试取得“事件 + 处理器”的消费租约。
    /// </summary>
    public async Task<InboxClaim> TryClaimAsync(
        IIntegrationEvent @event,
        string handlerKey,
        DateTime now,
        TimeSpan leaseDuration,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(@event);
        if (string.IsNullOrWhiteSpace(handlerKey))
        {
            throw new ArgumentException("处理器键不能为空", nameof(handlerKey));
        }

        var existing = await FindAsync(@event.EventId, handlerKey, ct);
        if (existing is null)
        {
            var lockToken = Guid.NewGuid();
            var newMessage = new InboxMessage
            {
                Id = Guid.NewGuid(),
                EventId = @event.EventId,
                HandlerKey = handlerKey,
                TenantId = @event.TenantId,
                ReceivedAt = now,
                AttemptCount = 1,
                LockedUntil = now.Add(leaseDuration),
                LockToken = lockToken
            };
            _dbContext.InboxMessages.Add(newMessage);
            try
            {
                await _dbContext.SaveChangesAsync(ct);
                return new InboxClaim(InboxClaimStatus.Claimed, lockToken);
            }
            catch (DbUpdateException)
            {
                // 多实例首次插入可能发生唯一键竞争。清理本地实体后重新读取，
                // 只有确认数据库中存在同一键时才把竞争视为正常路径。
                _dbContext.Entry(newMessage).State = EntityState.Detached;
                existing = await FindAsync(@event.EventId, handlerKey, ct);
                if (existing is null) throw;
            }
        }

        if (existing!.ProcessedAt.HasValue)
        {
            return new InboxClaim(InboxClaimStatus.AlreadyProcessed, Guid.Empty);
        }

        if (existing.LockedUntil.HasValue && existing.LockedUntil > now)
        {
            return new InboxClaim(InboxClaimStatus.Locked, Guid.Empty);
        }

        var replacementToken = Guid.NewGuid();
        var affectedRows = await _dbContext.InboxMessages
            .IgnoreQueryFilters()
            .Where(item => item.EventId == @event.EventId
                && item.HandlerKey == handlerKey
                && item.ProcessedAt == null
                && (item.LockedUntil == null || item.LockedUntil <= now))
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.AttemptCount, item => item.AttemptCount + 1)
                .SetProperty(item => item.LockedUntil, now.Add(leaseDuration))
                .SetProperty(item => item.LockToken, replacementToken), ct);

        if (affectedRows == 1)
        {
            return new InboxClaim(InboxClaimStatus.Claimed, replacementToken);
        }

        var latest = await FindAsync(@event.EventId, handlerKey, ct);
        return latest?.ProcessedAt is not null
            ? new InboxClaim(InboxClaimStatus.AlreadyProcessed, Guid.Empty)
            : new InboxClaim(InboxClaimStatus.Locked, Guid.Empty);
    }

    /// <summary>
    /// 将当前租约标记为处理成功。
    /// </summary>
    public async Task<bool> MarkProcessedAsync(
        Guid eventId,
        string handlerKey,
        Guid lockToken,
        DateTime processedAt,
        CancellationToken ct = default)
    {
        var affectedRows = await _dbContext.InboxMessages
            .IgnoreQueryFilters()
            .Where(item => item.EventId == eventId
                && item.HandlerKey == handlerKey
                && item.LockToken == lockToken
                && item.ProcessedAt == null)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.ProcessedAt, processedAt)
                .SetProperty(item => item.LockedUntil, (DateTime?)null)
                .SetProperty(item => item.LockToken, (Guid?)null)
                .SetProperty(item => item.LastError, (string?)null), ct);
        return affectedRows == 1;
    }

    /// <summary>
    /// 记录处理失败并释放当前租约，让 RabbitMQ 的重试队列再次投递。
    /// </summary>
    public async Task<bool> MarkFailedAsync(
        Guid eventId,
        string handlerKey,
        Guid lockToken,
        string error,
        CancellationToken ct = default)
    {
        var normalizedError = error.Length <= 2000 ? error : error[..2000];
        var affectedRows = await _dbContext.InboxMessages
            .IgnoreQueryFilters()
            .Where(item => item.EventId == eventId
                && item.HandlerKey == handlerKey
                && item.LockToken == lockToken
                && item.ProcessedAt == null)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.LockedUntil, (DateTime?)null)
                .SetProperty(item => item.LockToken, (Guid?)null)
                .SetProperty(item => item.LastError, normalizedError), ct);
        return affectedRows == 1;
    }

    private Task<InboxMessage?> FindAsync(Guid eventId, string handlerKey, CancellationToken ct) =>
        _dbContext.InboxMessages
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(
                item => item.EventId == eventId && item.HandlerKey == handlerKey,
                ct);
}

/// <summary>
/// Inbox 领取结果。
/// </summary>
public enum InboxClaimStatus
{
    /// <summary>当前实例取得租约。</summary>
    Claimed,

    /// <summary>该事件已由当前处理器成功处理。</summary>
    AlreadyProcessed,

    /// <summary>其他实例仍持有未过期租约。</summary>
    Locked
}

/// <summary>
/// Inbox 租约结果。
/// </summary>
/// <param name="Status">领取状态</param>
/// <param name="LockToken">当前实例的租约令牌</param>
public sealed record InboxClaim(InboxClaimStatus Status, Guid LockToken);
