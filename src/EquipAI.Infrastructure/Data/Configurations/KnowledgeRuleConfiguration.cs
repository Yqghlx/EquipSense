using System.Text.Json;
using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// 知识规则表 EF Core 配置
/// </summary>
public class KnowledgeRuleConfiguration : IEntityTypeConfiguration<KnowledgeRule>
{
    /// <summary>静态序列化选项，避免在表达式树中使用可选参数（EF Core HasConversion 限制）</summary>
    private static readonly JsonSerializerOptions JsonOpts = new();

    public void Configure(EntityTypeBuilder<KnowledgeRule> builder)
    {
        builder.ToTable("knowledge_rules");

        // Conditions 使用 JSONB 存储结构化条件表达式（如 [{metric, operator, threshold}]）
        builder.Property(e => e.Conditions).HasColumnType("jsonb");
        // Conclusion 是自然语言文本但数据库列为 jsonb（迁移历史遗留），用 HasConversion 自动处理：
        // 写入时 Serialize 成合法 JSON 字符串，读取时 Deserialize 解包去引号，业务代码无感知
        builder.Property(e => e.Conclusion)
            .HasColumnType("jsonb")
            .HasConversion(
                v => JsonSerializer.Serialize(v, JsonOpts),
                v => JsonSerializer.Deserialize<string>(v, JsonOpts) ?? v);

        // 按租户+设备类型查询：用于匹配特定设备类型的规则
        builder.HasIndex(e => new { e.TenantId, e.DeviceType });

        // 按租户+启用状态查询：用于获取当前生效的规则列表
        builder.HasIndex(e => new { e.TenantId, e.Enabled });

        // Version 字段默认值
        builder.Property(e => e.Version).HasDefaultValue(1);
    }
}
