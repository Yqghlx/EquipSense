using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// 设备类型模板实体配置，映射到 device_type_templates 表
/// </summary>
public class DeviceTypeTemplateConfiguration : IEntityTypeConfiguration<DeviceTypeTemplate>
{
    /// <summary>
    /// 配置设备类型模板实体的表映射、字段约束和外键关系
    /// </summary>
    public void Configure(EntityTypeBuilder<DeviceTypeTemplate> builder)
    {
        // 表映射
        builder.ToTable("device_type_templates");

        // 主键 — UUID 由应用层生成
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedNever();

        // 租户外键（系统预置模板使用 SystemTenantId）
        builder.Property(e => e.TenantId)
            .HasColumnName("tenant_id")
            .IsRequired();

        // 字段映射（snake_case 列名）
        builder.Property(e => e.Name)
            .HasColumnName("name")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(e => e.Industry)
            .HasColumnName("industry")
            .HasMaxLength(50);

        // 设备参数定义 — JSONB 字段（监控指标、单位、范围等）
        builder.Property(e => e.Parameters)
            .HasColumnName("parameters")
            .HasColumnType("jsonb")
            .IsRequired();

        // 默认告警规则 — JSONB 数组（创建设备时可一键套用）
        builder.Property(e => e.DefaultAlarmRules)
            .HasColumnName("default_alarm_rules")
            .HasColumnType("jsonb")
            .IsRequired();

        // 默认诊断规则 — JSONB 数组（AI 根因分析的知识映射）
        builder.Property(e => e.DefaultDiagnosisRules)
            .HasColumnName("default_diagnosis_rules")
            .HasColumnType("jsonb")
            .IsRequired();

        builder.Property(e => e.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        // 外键：租户 — Restrict 防止误删租户
        builder.HasOne(e => e.Tenant)
            .WithMany(e => e.DeviceTypeTemplates)
            .HasForeignKey(e => e.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
