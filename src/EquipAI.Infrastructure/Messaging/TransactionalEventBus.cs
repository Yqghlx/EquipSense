using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Infrastructure.Messaging;

/// <summary>
/// 事务事件总线。
/// 业务代码仍使用 IEventBus，但生产 RabbitMQ 模式下事件先进入当前数据库的 Outbox，
/// 由后台分发器调用底层传输，避免业务线程直接依赖 broker 可用性。
/// </summary>
public sealed class TransactionalEventBus : IEventBus
{
    private readonly AppDbContext _dbContext;
    private readonly IEventBusTransport _transport;
    private readonly ILogger<TransactionalEventBus> _logger;

    /// <summary>
    /// 初始化事务事件总线。
    /// </summary>
    public TransactionalEventBus(
        AppDbContext dbContext,
        IEventBusTransport transport,
        ILogger<TransactionalEventBus> logger)
    {
        _dbContext = dbContext;
        _transport = transport;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task PublishAsync<TEvent>(
        TEvent @event,
        CancellationToken cancellationToken = default)
        where TEvent : IIntegrationEvent
    {
        ArgumentNullException.ThrowIfNull(@event);
        var serialized = IntegrationEventSerializer.Serialize(@event);

        // 同一作用域内的重复调用不应制造多条 Outbox。数据库主键继续作为跨实例的最终防线。
        if (_dbContext.OutboxMessages.Local.Any(item => item.Id == @event.EventId)
            || await _dbContext.OutboxMessages
                .IgnoreQueryFilters()
                .AnyAsync(item => item.Id == @event.EventId, cancellationToken))
        {
            return;
        }

        _dbContext.OutboxMessages.Add(new OutboxMessage
        {
            Id = @event.EventId,
            TenantId = @event.TenantId,
            EventType = serialized.EventType,
            Payload = serialized.Payload,
            OccurredAt = @event.OccurredAt.Kind == DateTimeKind.Utc
                ? @event.OccurredAt
                : @event.OccurredAt.ToUniversalTime(),
            CreatedAt = DateTime.UtcNow,
            AvailableAt = DateTime.UtcNow
        });

        // 这里保存当前 DbContext 的全部变更：调用方若先修改业务实体再发布事件，
        // 两者会进入同一个 SaveChanges 事务；仍在保存后发布的旧路径至少会获得持久化 Outbox。
        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogDebug(
            "事件已写入事务 Outbox：{EventType}, EventId={EventId}, TenantId={TenantId}",
            serialized.EventType, @event.EventId, @event.TenantId);
    }

    /// <inheritdoc />
    public void Subscribe<TEvent, THandler>()
        where TEvent : IIntegrationEvent
        where THandler : IEventHandler<TEvent>
    {
        _transport.Subscribe<TEvent, THandler>();
    }
}
