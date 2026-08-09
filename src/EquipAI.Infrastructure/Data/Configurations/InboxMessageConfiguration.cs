using EquipAI.Infrastructure.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// Inbox 消息表配置。
/// </summary>
public sealed class InboxMessageConfiguration : IEntityTypeConfiguration<InboxMessage>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<InboxMessage> builder)
    {
        builder.ToTable("inbox_messages");
        builder.HasKey(item => item.Id);
        builder.Property(item => item.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(item => item.EventId).HasColumnName("event_id").IsRequired();
        builder.Property(item => item.HandlerKey).HasColumnName("handler_key").HasMaxLength(300).IsRequired();
        builder.Property(item => item.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(item => item.ReceivedAt).HasColumnName("received_at").IsRequired();
        builder.Property(item => item.AttemptCount).HasColumnName("attempt_count").IsRequired();
        builder.Property(item => item.LockedUntil).HasColumnName("locked_until");
        builder.Property(item => item.LockToken).HasColumnName("lock_token");
        builder.Property(item => item.ProcessedAt).HasColumnName("processed_at");
        builder.Property(item => item.LastError).HasColumnName("last_error").HasMaxLength(2000);
        builder.HasIndex(item => new { item.EventId, item.HandlerKey }).IsUnique();
        builder.HasIndex(item => new { item.TenantId, item.ReceivedAt });
    }
}
