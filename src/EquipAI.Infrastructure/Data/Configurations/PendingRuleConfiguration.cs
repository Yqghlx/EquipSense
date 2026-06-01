using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// 候选规则表 EF Core 配置
/// </summary>
public class PendingRuleConfiguration : IEntityTypeConfiguration<PendingRule>
{
    public void Configure(EntityTypeBuilder<PendingRule> builder)
    {
        builder.ToTable("pending_rules");

        // Conditions 和 Conclusion 使用 JSONB 存储，与正式规则保持一致
        builder.Property(e => e.Conditions).HasColumnType("jsonb");
        builder.Property(e => e.Conclusion).HasColumnType("jsonb");

        // 按租户+审核状态查询：用于筛选待审核/已批准/已驳回的规则
        builder.HasIndex(e => new { e.TenantId, e.ReviewStatus });

        // 按租户+设备类型查询：用于查看特定设备类型的候选规则
        builder.HasIndex(e => new { e.TenantId, e.DeviceType });
    }
}
