using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// Analysis 实体的 EF Core 配置
/// </summary>
public class AnalysisConfiguration : IEntityTypeConfiguration<Analysis>
{
    public void Configure(EntityTypeBuilder<Analysis> builder)
    {
        builder.ToTable("analyses");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.TenantId).HasColumnName("tenant_id");
        builder.Property(e => e.AlertId).HasColumnName("alert_id");
        builder.Property(e => e.DeviceId).HasColumnName("device_id");
        builder.Property(e => e.RuleId).HasColumnName("rule_id");
        builder.Property(e => e.Level).HasColumnName("level");
        builder.Property(e => e.Status).HasColumnName("status");
        builder.Property(e => e.Confidence).HasColumnName("confidence");
        builder.Property(e => e.DataQualityScore).HasColumnName("data_quality_score");
        builder.Property(e => e.RootCause).HasColumnName("root_cause");
        builder.Property(e => e.Suggestion).HasColumnName("suggestion");
        builder.Property(e => e.RawResponse).HasColumnName("raw_response").HasColumnType("jsonb");
        builder.Property(e => e.ProcessingTimeMs).HasColumnName("processing_time_ms");
        builder.Property(e => e.CompletedAt).HasColumnName("completed_at");
        builder.Property(e => e.CreatedAt).HasColumnName("created_at");

        builder.HasIndex(e => new { e.TenantId, e.AlertId });
        builder.HasIndex(e => new { e.TenantId, e.DeviceId, e.CreatedAt });
    }
}
