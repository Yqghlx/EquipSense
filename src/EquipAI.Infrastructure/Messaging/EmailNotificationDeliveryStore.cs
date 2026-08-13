using EquipAI.Core.Enums;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.Infrastructure.Messaging;

/// <summary>
/// 邮件投递任务的租约和状态存储。
/// 所有竞争更新都带租约令牌，避免旧 worker 覆盖新 worker 的结果。
/// </summary>
public sealed class EmailNotificationDeliveryStore
{
    private readonly AppDbContext _dbContext;

    /// <summary>
    /// 初始化邮件投递任务存储。
    /// </summary>
    public EmailNotificationDeliveryStore(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>
    /// 尝试领取一条待处理任务。
    /// </summary>
    public async Task<EmailDeliveryLease?> TryClaimAsync(
        Guid tenantId,
        Guid deliveryId,
        DateTime now,
        TimeSpan leaseDuration,
        CancellationToken ct = default)
    {
        var lockToken = Guid.NewGuid();
        var lockedUntil = now.Add(leaseDuration);
        var affectedRows = await _dbContext.EmailNotificationDeliveries
            .IgnoreQueryFilters()
            .Where(item => item.TenantId == tenantId
                && item.Id == deliveryId
                && item.Status == EmailDeliveryStatus.Pending
                && item.AvailableAt <= now
                && (item.LockedUntil == null || item.LockedUntil <= now))
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.AttemptCount, item => item.AttemptCount + 1)
                .SetProperty(item => item.LockedUntil, lockedUntil)
                .SetProperty(item => item.LockToken, lockToken), ct);

        return affectedRows == 1
            ? new EmailDeliveryLease(lockToken, lockedUntil)
            : null;
    }

    /// <summary>
    /// 在执行 SMTP 外部副作用前续租；只有当前令牌仍有效时才能成功。
    /// </summary>
    public async Task<bool> TryRenewLeaseAsync(
        Guid tenantId,
        Guid deliveryId,
        Guid lockToken,
        DateTime now,
        TimeSpan leaseDuration,
        CancellationToken ct = default)
    {
        if (leaseDuration <= TimeSpan.Zero)
            throw new ArgumentOutOfRangeException(nameof(leaseDuration), "租约时长必须大于零");

        var affectedRows = await _dbContext.EmailNotificationDeliveries
            .IgnoreQueryFilters()
            .Where(item => item.TenantId == tenantId
                && item.Id == deliveryId
                && item.Status == EmailDeliveryStatus.Pending
                && item.LockToken == lockToken)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.LockedUntil, now.Add(leaseDuration)), ct);
        return affectedRows == 1;
    }

    /// <summary>
    /// 将当前租约标记为已发送。
    /// </summary>
    public async Task<bool> MarkSentAsync(
        Guid tenantId,
        Guid deliveryId,
        Guid lockToken,
        DateTime sentAt,
        CancellationToken ct = default)
    {
        var affectedRows = await _dbContext.EmailNotificationDeliveries
            .IgnoreQueryFilters()
            .Where(item => item.TenantId == tenantId
                && item.Id == deliveryId
                && item.Status == EmailDeliveryStatus.Pending
                && item.LockToken == lockToken)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.Status, EmailDeliveryStatus.Sent)
                .SetProperty(item => item.SentAt, sentAt)
                .SetProperty(item => item.LockedUntil, (DateTime?)null)
                .SetProperty(item => item.LockToken, (Guid?)null)
                .SetProperty(item => item.LastError, (string?)null), ct);
        return affectedRows == 1;
    }

    /// <summary>
    /// 将当前租约标记为取消。
    /// </summary>
    public async Task<bool> MarkCancelledAsync(
        Guid tenantId,
        Guid deliveryId,
        Guid lockToken,
        string reason,
        CancellationToken ct = default)
    {
        var affectedRows = await _dbContext.EmailNotificationDeliveries
            .IgnoreQueryFilters()
            .Where(item => item.TenantId == tenantId
                && item.Id == deliveryId
                && item.Status == EmailDeliveryStatus.Pending
                && item.LockToken == lockToken)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.Status, EmailDeliveryStatus.Cancelled)
                .SetProperty(item => item.LockedUntil, (DateTime?)null)
                .SetProperty(item => item.LockToken, (Guid?)null)
                .SetProperty(item => item.LastError, NormalizeError(reason)), ct);
        return affectedRows == 1;
    }

    /// <summary>
    /// 记录普通发送失败并安排重试，或在达到上限时进入死信。
    /// </summary>
    public async Task<bool> MarkFailedAsync(
        Guid tenantId,
        Guid deliveryId,
        Guid lockToken,
        DateTime availableAt,
        string error,
        bool deadLetter,
        CancellationToken ct = default)
    {
        var normalizedError = NormalizeError(error);
        var status = deadLetter
            ? EmailDeliveryStatus.DeadLetter
            : EmailDeliveryStatus.Pending;
        var affectedRows = await _dbContext.EmailNotificationDeliveries
            .IgnoreQueryFilters()
            .Where(item => item.TenantId == tenantId
                && item.Id == deliveryId
                && item.Status == EmailDeliveryStatus.Pending
                && item.LockToken == lockToken)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.Status, status)
                .SetProperty(item => item.AvailableAt, availableAt)
                .SetProperty(item => item.LockedUntil, (DateTime?)null)
                .SetProperty(item => item.LockToken, (Guid?)null)
                .SetProperty(item => item.LastError, normalizedError), ct);
        return affectedRows == 1;
    }

    private static string NormalizeError(string error)
    {
        var value = string.IsNullOrWhiteSpace(error) ? "未知邮件投递错误" : error.Trim();
        return value.Length <= 2000 ? value : value[..2000];
    }
}

/// <summary>
/// 邮件投递任务租约。
/// </summary>
public sealed record EmailDeliveryLease(Guid LockToken, DateTime LockedUntil);
