using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// 租户实体配置，映射到 tenants 表
/// </summary>
public class TenantConfiguration : IEntityTypeConfiguration<Core.Entities.Tenant>
{
    /// <summary>
    /// 配置租户实体的表映射、字段约束、索引和枚举转换
    /// </summary>
    public void Configure(EntityTypeBuilder<Core.Entities.Tenant> builder)
    {
        // 表映射
        builder.ToTable("tenants");

        // 主键 — UUID 由应用层生成，数据库无需自增
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedNever();

        // 字段映射（snake_case 列名）
        builder.Property(e => e.Name)
            .HasColumnName("name")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(e => e.Slug)
            .HasColumnName("slug")
            .HasMaxLength(50)
            .IsRequired();

        // 枚举 → 字符串存储，便于数据库可读性和跨语言兼容
        builder.Property(e => e.Plan)
            .HasColumnName("plan")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(e => e.IsolationMode)
            .HasColumnName("isolation_mode")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(e => e.MaxDevices)
            .HasColumnName("max_devices")
            .IsRequired();

        builder.Property(e => e.MaxUsers)
            .HasColumnName("max_users")
            .IsRequired();

        builder.Property(e => e.DataRetentionDays)
            .HasColumnName("data_retention_days")
            .IsRequired();

        // 工单运行模式枚举 → 字符串
        builder.Property(e => e.WorkOrderMode)
            .HasColumnName("work_order_mode")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        // 扩展设置 — JSONB 灵活字段
        builder.Property(e => e.Settings)
            .HasColumnName("settings")
            .HasColumnType("jsonb")
            .IsRequired();

        builder.Property(e => e.IsActive)
            .HasColumnName("is_active")
            .IsRequired();

        builder.Property(e => e.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        // Slug 唯一索引 — 确保租户标识全局唯一（用于子域名路由）
        builder.HasIndex(e => e.Slug).IsUnique();

        // 导航属性
        builder.HasMany(e => e.Users)
            .WithOne(e => e.Tenant)
            .HasForeignKey("tenant_id")
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.Devices)
            .WithOne(e => e.Tenant)
            .HasForeignKey("tenant_id")
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.DeviceTypeTemplates)
            .WithOne(e => e.Tenant)
            .HasForeignKey("tenant_id")
            .OnDelete(DeleteBehavior.Restrict);
    }
}
