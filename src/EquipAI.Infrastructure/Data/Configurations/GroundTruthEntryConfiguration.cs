using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// 标准答案记录表 EF Core 配置
/// </summary>
public class GroundTruthEntryConfiguration : IEntityTypeConfiguration<GroundTruthEntry>
{
    public void Configure(EntityTypeBuilder<GroundTruthEntry> builder)
    {
        builder.ToTable("ground_truth_entries");

        // AffectedMetrics 用 JSONB 存储指标数组
        builder.Property(e => e.AffectedMetrics).HasColumnType("jsonb");
        // ExpectedRootCause 是中文诊断文本，用 text 避免此前 jsonb 中文写入问题
        builder.Property(e => e.ExpectedRootCause).HasColumnType("text");

        // 按运行批次查询
        builder.HasIndex(e => e.RunId);
        // 按设备 + 时间查询（匹配 analysis 时使用）
        builder.HasIndex(e => new { e.DeviceId, e.InjectedAt });
    }
}
