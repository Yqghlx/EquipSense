using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// FMEA 故障模式库配置
/// </summary>
public class FmeaEntryConfiguration : IEntityTypeConfiguration<FmeaEntry>
{
    public void Configure(EntityTypeBuilder<FmeaEntry> builder)
    {
        builder.ToTable("fmea_library");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.TenantId)
            .IsRequired();

        builder.Property(e => e.DeviceType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.FailureMode)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.Cause)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(e => e.Effect)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(e => e.Detection)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(e => e.RecommendedAction)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(e => e.Severity)
            .IsRequired();

        builder.Property(e => e.Occurrence)
            .IsRequired();

        builder.Property(e => e.Detectability)
            .IsRequired();

        builder.Property(e => e.Rpn)
            .IsRequired();

        builder.Property(e => e.IsEnabled)
            .HasDefaultValue(true);

        // 多租户全局过滤器
        builder.HasQueryFilter(e => e.TenantId == EF.Property<Guid>(e, "TenantId"));

        // 索引
        builder.HasIndex(e => e.TenantId);
        builder.HasIndex(e => e.DeviceType);
        builder.HasIndex(e => e.Rpn);
        builder.HasIndex(e => e.IsEnabled);
        builder.HasIndex(e => new { e.TenantId, e.KnowledgeRuleId, e.IsEnabled });
    }
}
