using EquipAI.Infrastructure.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// Outbox 消息表配置。
/// </summary>
public sealed class OutboxMessageConfiguration : IEntityTypeConfiguration<OutboxMessage>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<OutboxMessage> builder)
    {
        builder.ToTable("outbox_messages");
        builder.HasKey(item => item.Id);
        builder.Property(item => item.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(item => item.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(item => item.EventType).HasColumnName("event_type").HasMaxLength(200).IsRequired();
        builder.Property(item => item.Payload).HasColumnName("payload").HasColumnType("jsonb").IsRequired();
        builder.Property(item => item.OccurredAt).HasColumnName("occurred_at").IsRequired();
        builder.Property(item => item.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(item => item.AvailableAt).HasColumnName("available_at").IsRequired();
        builder.Property(item => item.AttemptCount).HasColumnName("attempt_count").IsRequired();
        builder.Property(item => item.LockedUntil).HasColumnName("locked_until");
        builder.Property(item => item.LockToken).HasColumnName("lock_token");
        builder.Property(item => item.PublishedAt).HasColumnName("published_at");
        builder.Property(item => item.LastError).HasColumnName("last_error").HasMaxLength(2000);
        builder.HasIndex(item => new
        {
            item.PublishedAt,
            item.AvailableAt,
            item.LockedUntil,
            item.CreatedAt
        });
        builder.HasIndex(item => new { item.TenantId, item.CreatedAt });
    }
}
