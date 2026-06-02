using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// 网关设备配置表 — EF Core 映射配置
/// </summary>
public class GatewayDeviceConfiguration : IEntityTypeConfiguration<GatewayDevice>
{
    public void Configure(EntityTypeBuilder<GatewayDevice> builder)
    {
        builder.ToTable("gateway_devices");

        builder.Property(e => e.GatewayId).HasMaxLength(64).IsRequired();
        builder.Property(e => e.DeviceName).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Protocol).HasMaxLength(32).IsRequired();
        builder.Property(e => e.ConnectionConfig).HasColumnType("jsonb").IsRequired();
        builder.Property(e => e.DataPoints).HasColumnType("jsonb").IsRequired();

        // 按网关+租户建索引，支持按网关拉取该租户下的所有设备配置
        builder.HasIndex(e => new { e.GatewayId, e.TenantId });
    }
}
