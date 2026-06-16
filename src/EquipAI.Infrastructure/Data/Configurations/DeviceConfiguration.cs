using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// 设备实体配置，映射到 devices 表
/// </summary>
public class DeviceConfiguration : IEntityTypeConfiguration<Device>
{
    /// <summary>
    /// 配置设备实体的表映射、字段约束、唯一索引和外键关系
    /// </summary>
    public void Configure(EntityTypeBuilder<Device> builder)
    {
        // 表映射
        builder.ToTable("devices");

        // 主键 — UUID 由应用层生成
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedNever();

        // 租户外键
        builder.Property(e => e.TenantId)
            .HasColumnName("tenant_id")
            .IsRequired();

        // 字段映射（snake_case 列名）
        builder.Property(e => e.DeviceCode)
            .HasColumnName("device_code")
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(e => e.Name)
            .HasColumnName("name")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(e => e.Type)
            .HasColumnName("type")
            .HasMaxLength(50)
            .IsRequired();

        // 类型模板外键（可为空）
        builder.Property(e => e.TypeTemplateId)
            .HasColumnName("type_template_id");

        builder.Property(e => e.Manufacturer)
            .HasColumnName("manufacturer")
            .HasMaxLength(100);

        builder.Property(e => e.Model)
            .HasColumnName("model")
            .HasMaxLength(100);

        builder.Property(e => e.SerialNumber)
            .HasColumnName("serial_number")
            .HasMaxLength(100);

        // 安装位置 — JSONB 灵活字段（车间、产线、工位等层级信息）
        builder.Property(e => e.Location)
            .HasColumnName("location")
            .HasColumnType("jsonb")
            .IsRequired();

        builder.Property(e => e.InstallDate)
            .HasColumnName("install_date");

        builder.Property(e => e.GatewayId)
            .HasColumnName("gateway_id")
            .HasMaxLength(100);

        // 连接配置 — JSONB 字段（协议类型、地址、端口等连接参数）
        builder.Property(e => e.Connection)
            .HasColumnName("connection_config")
            .HasColumnType("jsonb")
            .IsRequired();

        // 设备负责人外键（可为空）
        builder.Property(e => e.ResponsibleUserId)
            .HasColumnName("responsible_user_id");

        // 设备关键等级枚举 → 字符串存储
        builder.Property(e => e.Criticality)
            .HasColumnName("criticality")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(e => e.DowntimeCostPerHour)
            .HasColumnName("downtime_cost_per_hour")
            .HasPrecision(10, 2);

        builder.Property(e => e.HealthScore)
            .HasColumnName("health_score")
            .HasPrecision(5, 2)
            .IsRequired();

        // 设备状态枚举 → 字符串存储
        builder.Property(e => e.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        // 最近一次收到遥测的时间，用于在线检测（DeviceStatusMonitor）
        builder.Property(e => e.LastSeenAt)
            .HasColumnName("last_seen_at");

        // text[] 数组 — Npgsql 原生支持 PostgreSQL 数组类型
        builder.Property(e => e.Tags)
            .HasColumnName("tags");

        // 自定义扩展字段 — JSONB 灵活字段
        builder.Property(e => e.CustomFields)
            .HasColumnName("custom_fields")
            .HasColumnType("jsonb")
            .IsRequired();

        builder.Property(e => e.LastDataAt)
            .HasColumnName("last_data_at");

        builder.Property(e => e.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        builder.Property(e => e.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        // 唯一复合索引 — 确保同一租户内设备编码唯一
        builder.HasIndex(e => new { e.TenantId, e.DeviceCode }).IsUnique();

        // 外键：租户 — Restrict 防止误删租户
        builder.HasOne(e => e.Tenant)
            .WithMany(e => e.Devices)
            .HasForeignKey(e => e.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        // 外键：设备类型模板 — SetNull 模板删除时设备保留，仅清除模板引用
        builder.HasOne(e => e.TypeTemplate)
            .WithMany()
            .HasForeignKey(e => e.TypeTemplateId)
            .OnDelete(DeleteBehavior.SetNull);

        // 外键：设备负责人 — SetNull 用户删除时设备保留，仅清除负责人
        builder.HasOne(e => e.ResponsibleUser)
            .WithMany()
            .HasForeignKey(e => e.ResponsibleUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
