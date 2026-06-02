using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// PushSubscription 实体的 EF Core 配置
/// </summary>
public class PushSubscriptionConfiguration : IEntityTypeConfiguration<PushSubscription>
{
    public void Configure(EntityTypeBuilder<PushSubscription> builder)
    {
        builder.ToTable("push_subscriptions");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.TenantId).HasColumnName("tenant_id");
        builder.Property(e => e.UserId).HasColumnName("user_id");
        builder.Property(e => e.Endpoint).HasColumnName("endpoint").HasMaxLength(500).IsRequired();
        builder.Property(e => e.P256dh).HasColumnName("p256dh").HasMaxLength(200).IsRequired();
        builder.Property(e => e.Auth).HasColumnName("auth").HasMaxLength(100).IsRequired();
        builder.Property(e => e.UserAgent).HasColumnName("user_agent").HasMaxLength(500);
        builder.Property(e => e.IsActive).HasColumnName("is_active");
        builder.Property(e => e.CreatedAt).HasColumnName("created_at");

        // Endpoint 全局唯一索引，防止同一订阅重复注册
        builder.HasIndex(e => e.Endpoint).IsUnique();
        // 租户+用户组合索引
        builder.HasIndex(e => new { e.TenantId, e.UserId });
    }
}
