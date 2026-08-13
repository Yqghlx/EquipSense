using EquipAI.Core.Enums;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Messaging;
using EquipAI.Infrastructure.Metrics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace EquipAI.Application.Notifications;

/// <summary>
/// 告警邮件投递后台 worker。
/// SMTP 故障只影响邮件队列，不阻塞告警事件和站内通知主链。
/// </summary>
public sealed class EmailNotificationDispatcher : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly EmailDeliveryOptions _options;
    private readonly IOptions<SmtpOptions> _smtpOptions;
    private readonly ILogger<EmailNotificationDispatcher> _logger;
    private bool _smtpWarningLogged;

    /// <summary>
    /// 初始化邮件投递 worker。
    /// </summary>
    public EmailNotificationDispatcher(
        IServiceScopeFactory scopeFactory,
        IOptions<EmailDeliveryOptions> options,
        IOptions<SmtpOptions> smtpOptions,
        ILogger<EmailNotificationDispatcher> logger)
    {
        _scopeFactory = scopeFactory;
        _options = options.Value;
        _smtpOptions = smtpOptions;
        _logger = logger;
    }

    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled)
        {
            _logger.LogWarning("告警邮件投递 worker 已通过配置关闭");
            return;
        }

        var delay = TimeSpan.FromSeconds(Math.Max(1, _options.PollIntervalSeconds));
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await DispatchBatchAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "告警邮件投递轮次失败，将在下一轮重试");
            }

            try
            {
                await Task.Delay(delay, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }

    /// <summary>
    /// 执行一轮邮件投递，供后台循环和测试复用。
    /// </summary>
    internal async Task DispatchBatchAsync(CancellationToken ct)
    {
        if (!_options.Enabled)
            return;

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var pendingCount = await db.EmailNotificationDeliveries
            .IgnoreQueryFilters()
            .CountAsync(item => item.Status == EmailDeliveryStatus.Pending, ct);
        BusinessMetrics.EmailDeliveryPending.Set(pendingCount);

        if (!_smtpOptions.Value.IsConfigured)
        {
            if (!_smtpWarningLogged)
            {
                _logger.LogWarning("SMTP 未配置，告警邮件任务暂不领取；配置恢复后将继续投递");
                _smtpWarningLogged = true;
            }

            return;
        }

        _smtpWarningLogged = false;
        var store = scope.ServiceProvider.GetRequiredService<EmailNotificationDeliveryStore>();
        var preferences = scope.ServiceProvider.GetRequiredService<NotificationPreferenceService>();
        var emailService = scope.ServiceProvider.GetRequiredService<SmtpEmailNotificationService>();
        var now = DateTime.UtcNow;
        var leaseDuration = TimeSpan.FromSeconds(
            Math.Max(EmailDeliveryOptions.MinimumLeaseSeconds, _options.LeaseSeconds));

        var candidates = await db.EmailNotificationDeliveries
            .IgnoreQueryFilters()
            .Where(item => item.Status == EmailDeliveryStatus.Pending
                && item.AvailableAt <= now
                && (item.LockedUntil == null || item.LockedUntil <= now))
            .OrderBy(item => item.CreatedAt)
            .Take(Math.Clamp(_options.BatchSize, 1, 1000))
            .Select(item => new { item.Id, item.TenantId })
            .ToListAsync(ct);

        foreach (var candidate in candidates)
        {
            var lease = await store.TryClaimAsync(
                candidate.TenantId,
                candidate.Id,
                DateTime.UtcNow,
                leaseDuration,
                ct);
            if (lease is null)
                continue;

            var delivery = await db.EmailNotificationDeliveries
                .IgnoreQueryFilters()
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    item => item.TenantId == candidate.TenantId && item.Id == candidate.Id,
                    ct);
            if (delivery is null || delivery.Status != EmailDeliveryStatus.Pending)
                continue;

            try
            {
                var user = await db.UnfilteredSet<Core.Entities.User>()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(
                        item => item.Id == delivery.UserId && item.TenantId == delivery.TenantId,
                        ct);
                var notification = await db.UnfilteredSet<Core.Entities.Notification>()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(
                        item => item.Id == delivery.NotificationId && item.TenantId == delivery.TenantId,
                        ct);

                if (user is null || notification is null)
                {
                    await store.MarkCancelledAsync(
                        delivery.TenantId,
                        delivery.Id,
                        lease.LockToken,
                        "用户或站内通知不存在",
                        ct);
                    continue;
                }

                if (!user.IsActive || string.IsNullOrWhiteSpace(user.Email))
                {
                    await store.MarkCancelledAsync(
                        delivery.TenantId,
                        delivery.Id,
                        lease.LockToken,
                        user.IsActive ? "用户未配置邮箱" : "用户已停用",
                        ct);
                    continue;
                }

                var enabledUserIds = await preferences.GetEnabledUserIdsAsync(
                    delivery.TenantId,
                    [delivery.UserId],
                    "alert",
                    "email",
                    ct);
                if (!enabledUserIds.Contains(delivery.UserId))
                {
                    await store.MarkCancelledAsync(
                        delivery.TenantId,
                        delivery.Id,
                        lease.LockToken,
                        "用户已关闭告警邮件偏好",
                        ct);
                    continue;
                }

                var htmlBody = AlertEmailTemplateRenderer.Render(notification, user.Language);

                // 前置查询可能因数据库拥塞接近原租约截止时间。SMTP 是不可回滚的外部副作用，
                // 发送前必须原子续租；若令牌已被其他 worker 接管，本 worker 直接放弃发送。
                var renewed = await store.TryRenewLeaseAsync(
                    delivery.TenantId,
                    delivery.Id,
                    lease.LockToken,
                    DateTime.UtcNow,
                    leaseDuration,
                    ct);
                if (!renewed)
                    continue;

                var sent = await emailService.SendAsync(
                    user.Email,
                    notification.Title,
                    htmlBody,
                    ct);
                if (sent)
                {
                    if (await store.MarkSentAsync(
                            delivery.TenantId,
                            delivery.Id,
                            lease.LockToken,
                            DateTime.UtcNow,
                            ct))
                        BusinessMetrics.EmailDeliverySent.Inc();
                    continue;
                }

                var failure = await MarkRetryOrDeadLetterAsync(
                    store,
                    delivery,
                    lease.LockToken,
                    "SMTP 未接受邮件",
                    ct);
                RecordFailureMetrics(failure);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                // 停机取消时保留 Pending 和租约状态，避免把未完成发送伪装成成功或永久失败。
                throw;
            }
            catch (Exception ex)
            {
                var failure = await MarkRetryOrDeadLetterAsync(
                    store,
                    delivery,
                    lease.LockToken,
                    "邮件投递处理异常",
                    ct);
                RecordFailureMetrics(failure);
                _logger.LogError(
                    ex,
                    "告警邮件投递失败: TenantId={TenantId}, UserId={UserId}, DeliveryId={DeliveryId}",
                    delivery.TenantId,
                    delivery.UserId,
                    delivery.Id);
            }
        }

        await CleanupCompletedAsync(db, ct);
        var remainingPendingCount = await db.EmailNotificationDeliveries
            .IgnoreQueryFilters()
            .CountAsync(item => item.Status == EmailDeliveryStatus.Pending, ct);
        BusinessMetrics.EmailDeliveryPending.Set(remainingPendingCount);
    }

    /// <summary>
    /// 按尝试次数计算退避并更新任务状态。
    /// </summary>
    private async Task<(bool Updated, bool DeadLetter)> MarkRetryOrDeadLetterAsync(
        EmailNotificationDeliveryStore store,
        Core.Entities.EmailNotificationDelivery delivery,
        Guid lockToken,
        string error,
        CancellationToken ct)
    {
        var maxAttempts = Math.Max(1, _options.MaxAttempts);
        var deadLetter = delivery.AttemptCount >= maxAttempts;
        var exponent = Math.Max(0, delivery.AttemptCount - 1);
        var backoffSeconds = Math.Min(
            Math.Max(0, _options.MaxBackoffSeconds),
            Math.Pow(2, exponent));
        var availableAt = DateTime.UtcNow.AddSeconds(backoffSeconds);
        var updated = await store.MarkFailedAsync(
            delivery.TenantId,
            delivery.Id,
            lockToken,
            availableAt,
            error,
            deadLetter,
            ct);
        return (updated, deadLetter);
    }

    /// <summary>
    /// 仅在状态更新成功后记录指标，避免租约已被其他 worker 接管时重复计数。
    /// </summary>
    private static void RecordFailureMetrics((bool Updated, bool DeadLetter) result)
    {
        if (!result.Updated)
            return;

        BusinessMetrics.EmailDeliveryFailures.Inc();
        if (result.DeadLetter)
            BusinessMetrics.EmailDeliveryDeadLetters.Inc();
    }

    /// <summary>
    /// 清理已结束且超过保留期的任务，控制长期运行数据库的增长。
    /// </summary>
    private async Task CleanupCompletedAsync(AppDbContext db, CancellationToken ct)
    {
        var cutoff = DateTime.UtcNow.AddDays(-Math.Max(1, _options.RetentionDays));
        var oldDeliveries = await db.EmailNotificationDeliveries
            .IgnoreQueryFilters()
            .Where(item => item.Status != EmailDeliveryStatus.Pending && item.CreatedAt < cutoff)
            .OrderBy(item => item.CreatedAt)
            .Take(1000)
            .ToListAsync(ct);
        if (oldDeliveries.Count == 0)
            return;

        db.EmailNotificationDeliveries.RemoveRange(oldDeliveries);
        await db.SaveChangesAsync(ct);
    }
}
