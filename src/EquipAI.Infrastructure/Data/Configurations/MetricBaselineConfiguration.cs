using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// MetricBaseline 实体的 EF Core 配置
/// 映射到 metric_baselines 表，配置唯一约束和列映射
/// </summary>
public class MetricBaselineConfiguration : IEntityTypeConfiguration<MetricBaseline>
{
    public void Configure(EntityTypeBuilder<MetricBaseline> builder)
    {
        builder.ToTable("metric_baselines");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.TenantId).HasColumnName("tenant_id");
        builder.Property(e => e.DeviceId).HasColumnName("device_id");
        builder.Property(e => e.Metric).HasColumnName("metric").HasMaxLength(100);
        builder.Property(e => e.PeriodStart).HasColumnName("period_start");
        builder.Property(e => e.PeriodEnd).HasColumnName("period_end");
        builder.Property(e => e.AvgValue).HasColumnName("avg_value");
        builder.Property(e => e.StdDev).HasColumnName("std_dev");
        builder.Property(e => e.MinValue).HasColumnName("min_value");
        builder.Property(e => e.MaxValue).HasColumnName("max_value");
        builder.Property(e => e.P95Value).HasColumnName("p95_value");
        builder.Property(e => e.SampleCount).HasColumnName("sample_count");
        builder.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        builder.Property(e => e.CreatedAt).HasColumnName("created_at");

        // 唯一约束：同一租户同一设备同一指标只有一条基线
        builder.HasIndex(e => new { e.TenantId, e.DeviceId, e.Metric }).IsUnique();
    }
}
