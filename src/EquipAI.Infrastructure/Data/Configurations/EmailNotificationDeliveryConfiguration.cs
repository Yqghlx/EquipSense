using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// 告警邮件投递任务的 EF Core 映射。
/// </summary>
public sealed class EmailNotificationDeliveryConfiguration : IEntityTypeConfiguration<EmailNotificationDelivery>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<EmailNotificationDelivery> builder)
    {
        builder.ToTable("email_notification_deliveries");
        builder.HasKey(item => item.Id);
        builder.Property(item => item.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(item => item.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(item => item.UserId).HasColumnName("user_id").IsRequired();
        builder.Property(item => item.NotificationId).HasColumnName("notification_id").IsRequired();
        builder.Property(item => item.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();
        builder.Property(item => item.AttemptCount).HasColumnName("attempt_count").IsRequired();
        builder.Property(item => item.AvailableAt).HasColumnName("available_at").IsRequired();
        builder.Property(item => item.LockedUntil).HasColumnName("locked_until");
        builder.Property(item => item.LockToken).HasColumnName("lock_token");
        builder.Property(item => item.SentAt).HasColumnName("sent_at");
        builder.Property(item => item.LastError).HasColumnName("last_error").HasMaxLength(2000);
        builder.Property(item => item.CreatedAt).HasColumnName("created_at").IsRequired();

        // 一个站内通知对应一个邮件任务，防止事务重试产生重复邮件。
        builder.HasIndex(item => item.NotificationId).IsUnique();
        // worker 按状态、可领取时间和租约扫描，索引避免每轮全表排序。
        builder.HasIndex(item => new
        {
            item.Status,
            item.AvailableAt,
            item.LockedUntil,
            item.CreatedAt,
        });
        builder.HasIndex(item => new { item.TenantId, item.CreatedAt });
    }
}
