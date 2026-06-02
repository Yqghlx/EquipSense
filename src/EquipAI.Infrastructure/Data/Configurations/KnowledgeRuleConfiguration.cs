using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// 知识规则表 EF Core 配置
/// </summary>
public class KnowledgeRuleConfiguration : IEntityTypeConfiguration<KnowledgeRule>
{
    public void Configure(EntityTypeBuilder<KnowledgeRule> builder)
    {
        builder.ToTable("knowledge_rules");

        // Conditions 和 Conclusion 使用 JSONB 存储，便于灵活的规则条件表达
        builder.Property(e => e.Conditions).HasColumnType("jsonb");
        builder.Property(e => e.Conclusion).HasColumnType("jsonb");

        // 按租户+设备类型查询：用于匹配特定设备类型的规则
        builder.HasIndex(e => new { e.TenantId, e.DeviceType });

        // 按租户+启用状态查询：用于获取当前生效的规则列表
        builder.HasIndex(e => new { e.TenantId, e.Enabled });

        // Version 字段默认值
        builder.Property(e => e.Version).HasDefaultValue(1);
    }
}
