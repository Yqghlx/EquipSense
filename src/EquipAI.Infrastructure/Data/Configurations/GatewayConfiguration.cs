using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// 网关表 — EF Core 映射配置
/// </summary>
public class GatewayConfiguration : IEntityTypeConfiguration<Gateway>
{
    public void Configure(EntityTypeBuilder<Gateway> builder)
    {
        builder.ToTable("gateways");

        builder.Property(e => e.GatewayId).HasMaxLength(64).IsRequired();
        builder.Property(e => e.Name).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Description).HasMaxLength(500);
        builder.Property(e => e.Host).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Status).HasMaxLength(20).IsRequired();
        builder.Property(e => e.Version).HasMaxLength(50);
        builder.Property(e => e.Id).ValueGeneratedNever();

        // 每个租户内 GatewayId 唯一
        builder.HasIndex(e => new { e.TenantId, e.GatewayId }).IsUnique();
        builder.HasIndex(e => e.TenantId);
    }
}
