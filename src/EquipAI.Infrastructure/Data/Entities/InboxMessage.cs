namespace EquipAI.Infrastructure.Data.Entities;

/// <summary>
/// 事务 Inbox 消息，按事件和处理器记录幂等消费状态。
/// </summary>
public sealed class InboxMessage
{
    /// <summary>
    /// Inbox 记录主键。
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// RabbitMQ 事件 ID。
    /// </summary>
    public Guid EventId { get; set; }

    /// <summary>
    /// 处理器稳定键，同一事件的不同处理器必须分别记录。
    /// </summary>
    public string HandlerKey { get; set; } = string.Empty;

    /// <summary>
    /// 事件所属租户 ID。
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 首次收到事件的时间（UTC）。
    /// </summary>
    public DateTime ReceivedAt { get; set; }

    /// <summary>
    /// 取得处理租约的次数。
    /// </summary>
    public int AttemptCount { get; set; }

    /// <summary>
    /// 当前处理租约的过期时间（UTC）。
    /// </summary>
    public DateTime? LockedUntil { get; set; }

    /// <summary>
    /// 当前处理租约令牌。
    /// </summary>
    public Guid? LockToken { get; set; }

    /// <summary>
    /// 处理器成功返回的时间（UTC）。
    /// </summary>
    public DateTime? ProcessedAt { get; set; }

    /// <summary>
    /// 最近一次处理失败原因。
    /// </summary>
    public string? LastError { get; set; }
}
