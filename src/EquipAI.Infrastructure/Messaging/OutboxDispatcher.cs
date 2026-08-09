using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Data.Entities;
using EquipAI.Infrastructure.Metrics;
using EquipAI.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace EquipAI.Infrastructure.Messaging;

/// <summary>
/// Outbox 后台分发器。
/// 先用数据库租约领取消息，再等待 RabbitMQ 发布确认；发布失败只更新重试时间，不删除消息。
/// </summary>
public sealed class OutboxDispatcher : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IEventBusTransport _transport;
    private readonly OutboxOptions _options;
    private readonly ILogger<OutboxDispatcher> _logger;

    /// <summary>
    /// 初始化 Outbox 分发器。
    /// </summary>
    public OutboxDispatcher(
        IServiceScopeFactory scopeFactory,
        IEventBusTransport transport,
        IOptions<OutboxOptions> options,
        ILogger<OutboxDispatcher> logger)
    {
        _scopeFactory = scopeFactory;
        _transport = transport;
        _options = options.Value;
        _logger = logger;
    }

    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled)
        {
            _logger.LogWarning("事务 Outbox 分发器已通过配置关闭，生产环境不建议关闭");
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
            catch (Exception exception)
            {
                _logger.LogError(exception, "事务 Outbox 分发轮次失败，将在下一轮重试");
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
    /// 执行一轮批量分发，供后台循环和测试复用。
    /// </summary>
    internal async Task DispatchBatchAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var store = scope.ServiceProvider.GetRequiredService<OutboxMessageStore>();
        var now = DateTime.UtcNow;

        var candidates = await dbContext.OutboxMessages
            .IgnoreQueryFilters()
            .Where(item => item.PublishedAt == null
                && item.AvailableAt <= now
                && (item.LockedUntil == null || item.LockedUntil <= now))
            .OrderBy(item => item.CreatedAt)
            .Take(Math.Clamp(_options.BatchSize, 1, 1000))
            .Select(item => item.Id)
            .ToListAsync(ct);

        foreach (var messageId in candidates)
        {
            var lease = await store.TryClaimAsync(
                messageId,
                DateTime.UtcNow,
                TimeSpan.FromSeconds(Math.Max(1, _options.LeaseSeconds)),
                ct);
            if (lease is null)
            {
                continue;
            }

            var message = await dbContext.OutboxMessages
                .IgnoreQueryFilters()
                .AsNoTracking()
                .FirstOrDefaultAsync(item => item.Id == messageId, ct);
            if (message is null || message.PublishedAt.HasValue)
            {
                continue;
            }

            try
            {
                var @event = IntegrationEventSerializer.Deserialize(message.EventType, message.Payload);
                await _transport.PublishAsync(@event, ct);

                var marked = await store.MarkPublishedAsync(
                    message.Id, lease.LockToken, DateTime.UtcNow, ct);
                if (!marked)
                {
                    _logger.LogWarning(
                        "Outbox 消息已发布但租约已变化，保留为可重试状态：{EventType}, EventId={EventId}",
                        message.EventType, message.Id);
                }
                else
                {
                    BusinessMetrics.OutboxPublished.WithLabels(message.EventType).Inc();
                }
            }
            catch (Exception exception) when (!ct.IsCancellationRequested)
            {
                var nextAvailableAt = DateTime.UtcNow.Add(
                    OutboxRetryPolicy.GetDelay(message.AttemptCount + 1, _options.MaxBackoffSeconds));
                await store.MarkFailedAsync(
                    message.Id,
                    lease.LockToken,
                    nextAvailableAt,
                    exception.Message,
                    ct);
                BusinessMetrics.OutboxPublishFailures.WithLabels(message.EventType).Inc();
                _logger.LogError(
                    exception,
                    "Outbox 消息发布失败，将于 {NextAvailableAt} 重试：{EventType}, EventId={EventId}",
                    nextAvailableAt,
                    message.EventType,
                    message.Id);
            }
        }

        await CleanupPublishedMessagesAsync(dbContext, ct);
    }

    /// <summary>
    /// 清理已发布且超过保留期的消息，控制长期运行数据库的增长。
    /// 每轮最多删除一千条，避免清理任务长时间占用业务连接。
    /// </summary>
    private async Task CleanupPublishedMessagesAsync(AppDbContext dbContext, CancellationToken ct)
    {
        var retentionDays = Math.Max(1, _options.RetentionDays);
        var cutoff = DateTime.UtcNow.AddDays(-retentionDays);
        var oldMessages = await dbContext.OutboxMessages
            .IgnoreQueryFilters()
            .Where(item => item.PublishedAt != null && item.PublishedAt < cutoff)
            .OrderBy(item => item.PublishedAt)
            .Take(1000)
            .ToListAsync(ct);
        if (oldMessages.Count == 0)
        {
            return;
        }

        dbContext.OutboxMessages.RemoveRange(oldMessages);
        await dbContext.SaveChangesAsync(ct);
        _logger.LogInformation("已清理 {Count} 条过期 Outbox 消息", oldMessages.Count);
    }
}
