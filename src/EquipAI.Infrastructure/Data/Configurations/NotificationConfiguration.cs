using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// Notification 实体的 EF Core 配置
/// </summary>
public class NotificationConfiguration : IEntityTypeConfiguration<Core.Entities.Notification>
{
    public void Configure(EntityTypeBuilder<Core.Entities.Notification> builder)
    {
        builder.ToTable("notifications");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.TenantId).HasColumnName("tenant_id");
        builder.Property(e => e.UserId).HasColumnName("user_id");
        builder.Property(e => e.Type).HasColumnName("type").HasMaxLength(20).IsRequired();
        builder.Property(e => e.Title).HasColumnName("title").HasMaxLength(200).IsRequired();
        builder.Property(e => e.Content).HasColumnName("content").HasMaxLength(1000);
        builder.Property(e => e.RelatedId).HasColumnName("related_id");
        builder.Property(e => e.Link).HasColumnName("link").HasMaxLength(500);
        builder.Property(e => e.IsRead).HasColumnName("is_read");
        builder.Property(e => e.CreatedAt).HasColumnName("created_at");

        // 租户+用户组合索引，加速用户通知查询
        builder.HasIndex(e => new { e.TenantId, e.UserId });
        // 未读状态索引，加速未读计数查询
        builder.HasIndex(e => new { e.UserId, e.IsRead });
    }
}
