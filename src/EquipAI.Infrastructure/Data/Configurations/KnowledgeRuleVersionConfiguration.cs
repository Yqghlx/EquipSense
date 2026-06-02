using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// 知识规则版本表 EF Core 配置
/// </summary>
public class KnowledgeRuleVersionConfiguration : IEntityTypeConfiguration<KnowledgeRuleVersion>
{
    public void Configure(EntityTypeBuilder<KnowledgeRuleVersion> builder)
    {
        builder.ToTable("knowledge_rule_versions");

        builder.Property(e => e.Snapshot).HasColumnType("jsonb");
        builder.Property(e => e.ChangeSummary).HasMaxLength(500);

        // 按租户+规则 ID 查询
        builder.HasIndex(e => new { e.TenantId, e.RuleId });
        // 按规则+版本号唯一约束
        builder.HasIndex(e => new { e.RuleId, e.Version }).IsUnique();
    }
}
