using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

public class AlertRuleConfiguration : IEntityTypeConfiguration<AlertRule>
{
    public void Configure(EntityTypeBuilder<AlertRule> builder)
    {
        builder.ToTable("alert_rules");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedNever();

        builder.Property(e => e.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(e => e.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
        builder.Property(e => e.DeviceType).HasColumnName("device_type").HasMaxLength(50);
        builder.Property(e => e.DeviceId).HasColumnName("device_id");
        builder.Property(e => e.Metric).HasColumnName("metric").HasMaxLength(100).IsRequired();
        builder.Property(e => e.RuleType).HasColumnName("rule_type").HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(e => e.Operator).HasColumnName("operator").HasMaxLength(5);
        builder.Property(e => e.Threshold).HasColumnName("threshold").HasPrecision(18, 4);
        builder.Property(e => e.Conditions).HasColumnName("conditions").HasColumnType("jsonb");
        builder.Property(e => e.BaselineStddevMultiplier).HasColumnName("baseline_stddev_multiplier");
        builder.Property(e => e.Severity).HasColumnName("severity").HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(e => e.CooldownSeconds).HasColumnName("cooldown_seconds").IsRequired();
        builder.Property(e => e.AutoCreateWorkorder).HasColumnName("auto_create_workorder").IsRequired();
        builder.Property(e => e.Enabled).HasColumnName("enabled").IsRequired();
        builder.Property(e => e.CreatedBy).HasColumnName("created_by");
        builder.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();

        builder.HasIndex(e => new { e.TenantId, e.Enabled });

        // v1.5 性能加固：告警评估时按指标筛选规则的索引
        // 命中 AlertEvaluationService.EvaluateAsync 的查询：
        //   WHERE tenant_id = ? AND enabled = true AND metric = ?
        // 之前 (tenant_id, enabled) 不含 metric，规则多时需回表过滤
        builder.HasIndex(e => new { e.TenantId, e.Enabled, e.Metric });
    }
}
