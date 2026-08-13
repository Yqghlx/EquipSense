using EquipAI.Core.Enums;

namespace EquipAI.Core.Entities;

/// <summary>
/// 告警邮件投递任务。
/// 不保存邮箱和正文，避免在队列表中复制 PII；worker 发送前从关联用户和通知读取最新内容。
/// </summary>
public sealed class EmailNotificationDelivery : BaseEntity
{
    /// <summary>所属租户 ID。</summary>
    public Guid TenantId { get; set; }

    /// <summary>目标用户 ID。</summary>
    public Guid UserId { get; set; }

    /// <summary>对应的站内通知 ID；每条通知最多生成一条邮件任务。</summary>
    public Guid NotificationId { get; set; }

    /// <summary>当前任务状态。</summary>
    public EmailDeliveryStatus Status { get; set; } = EmailDeliveryStatus.Pending;

    /// <summary>已领取并尝试发送的次数。</summary>
    public int AttemptCount { get; set; }

    /// <summary>下一次允许领取的时间（UTC）。</summary>
    public DateTime AvailableAt { get; set; } = DateTime.UtcNow;

    /// <summary>当前租约过期时间（UTC）。</summary>
    public DateTime? LockedUntil { get; set; }

    /// <summary>当前租约令牌。</summary>
    public Guid? LockToken { get; set; }

    /// <summary>SMTP 接受发送的时间（UTC）。</summary>
    public DateTime? SentAt { get; set; }

    /// <summary>最近一次失败原因，不得包含邮箱、正文或凭据。</summary>
    public string? LastError { get; set; }
}
