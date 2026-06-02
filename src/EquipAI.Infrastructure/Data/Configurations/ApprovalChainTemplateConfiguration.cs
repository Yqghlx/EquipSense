using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// ApprovalChainTemplate 实体的 EF Core 配置
/// </summary>
public class ApprovalChainTemplateConfiguration : IEntityTypeConfiguration<ApprovalChainTemplate>
{
    public void Configure(EntityTypeBuilder<ApprovalChainTemplate> builder)
    {
        builder.ToTable("approval_chain_templates");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.TenantId).HasColumnName("tenant_id");
        builder.Property(e => e.WorkOrderType).HasColumnName("work_order_type");
        builder.Property(e => e.Priority).HasColumnName("priority");
        builder.Property(e => e.Name).HasColumnName("name").HasMaxLength(200);
        builder.Property(e => e.IsDefault).HasColumnName("is_default");
        builder.Property(e => e.Enabled).HasColumnName("enabled");
        builder.Property(e => e.CreatedAt).HasColumnName("created_at");

        // 按（租户, 工单类型, 优先级）建立索引，用于快速匹配审批链
        builder.HasIndex(e => new { e.TenantId, e.WorkOrderType, e.Priority });

        // 配置与审批步骤的一对多关系
        builder.HasMany(e => e.Steps)
            .WithOne()
            .HasForeignKey(s => s.ChainId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
