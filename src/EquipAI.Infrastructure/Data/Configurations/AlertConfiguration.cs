using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

public class AlertConfiguration : IEntityTypeConfiguration<Alert>
{
    public void Configure(EntityTypeBuilder<Alert> builder)
    {
        builder.ToTable("alerts");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedNever();

        builder.Property(e => e.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(e => e.AlertCode).HasColumnName("alert_code").HasMaxLength(100).IsRequired();
        builder.Property(e => e.RuleId).HasColumnName("rule_id");
        builder.Property(e => e.DeviceId).HasColumnName("device_id").IsRequired();
        builder.Property(e => e.Severity).HasColumnName("severity").HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(e => e.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(e => e.Metric).HasColumnName("metric").HasMaxLength(100).IsRequired();
        builder.Property(e => e.Value).HasColumnName("value").HasPrecision(18, 4).IsRequired();
        builder.Property(e => e.Threshold).HasColumnName("threshold").HasPrecision(18, 4);
        builder.Property(e => e.Message).HasColumnName("message").HasMaxLength(500);
        builder.Property(e => e.DataSnapshot).HasColumnName("data_snapshot").HasColumnType("jsonb");
        builder.Property(e => e.AggregatedFrom).HasColumnName("aggregated_from");
        builder.Property(e => e.OccurredAt).HasColumnName("occurred_at").IsRequired();
        builder.Property(e => e.AcknowledgedBy).HasColumnName("acknowledged_by");
        builder.Property(e => e.AcknowledgedAt).HasColumnName("acknowledged_at");
        builder.Property(e => e.AcknowledgementNote).HasColumnName("acknowledgement_note").HasMaxLength(500);
        builder.Property(e => e.ResolvedBy).HasColumnName("resolved_by");
        builder.Property(e => e.ResolvedAt).HasColumnName("resolved_at");
        builder.Property(e => e.Resolution).HasColumnName("resolution").HasMaxLength(1000);
        builder.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();

        builder.HasIndex(e => new { e.TenantId, e.Status, e.OccurredAt });

        // v1.5 性能加固：告警评估路径专用索引
        // 命中 AlertEvaluationService.UpdateExistingAlertAsync / TryAutoResolveAsync 的高频查询：
        //   WHERE tenant_id = ? AND device_id = ? AND metric = ? AND status = ? ORDER BY occurred_at DESC
        // 之前仅 (tenant_id, status, occurred_at) 索引，需回表过滤 device_id + metric，10k+ 告警下半表扫描
        builder.HasIndex(e => new { e.TenantId, e.DeviceId, e.Metric, e.Status, e.OccurredAt });

        builder.HasIndex(e => e.AlertCode).IsUnique();
    }
}
