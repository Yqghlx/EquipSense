namespace EquipAI.Infrastructure.Data.Entities;

/// <summary>
/// 事务 Outbox 消息。
/// 事件 ID 同时作为主键和 RabbitMQ message_id，保证发布重试不会生成新的业务事件。
/// </summary>
public sealed class OutboxMessage
{
    /// <summary>
    /// 事件唯一标识。
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// 所属租户 ID。
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 白名单中的稳定事件类型名称。
    /// </summary>
    public string EventType { get; set; } = string.Empty;

    /// <summary>
    /// 事件 JSON 载荷。
    /// </summary>
    public string Payload { get; set; } = string.Empty;

    /// <summary>
    /// 业务事件发生时间（UTC）。
    /// </summary>
    public DateTime OccurredAt { get; set; }

    /// <summary>
    /// Outbox 入库时间（UTC）。
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 下一次允许领取的时间（UTC）。
    /// </summary>
    public DateTime AvailableAt { get; set; }

    /// <summary>
    /// 已领取并尝试发布的次数。
    /// </summary>
    public int AttemptCount { get; set; }

    /// <summary>
    /// 当前分发租约的过期时间（UTC）。
    /// </summary>
    public DateTime? LockedUntil { get; set; }

    /// <summary>
    /// 当前分发租约令牌。
    /// </summary>
    public Guid? LockToken { get; set; }

    /// <summary>
    /// RabbitMQ 发布确认时间（UTC）；为空表示尚未确认。
    /// </summary>
    public DateTime? PublishedAt { get; set; }

    /// <summary>
    /// 最近一次发布失败原因。
    /// </summary>
    public string? LastError { get; set; }
}
