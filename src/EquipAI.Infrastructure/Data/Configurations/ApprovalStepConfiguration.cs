using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// ApprovalStep 实体的 EF Core 配置
/// </summary>
public class ApprovalStepConfiguration : IEntityTypeConfiguration<ApprovalStep>
{
    public void Configure(EntityTypeBuilder<ApprovalStep> builder)
    {
        builder.ToTable("approval_steps");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.ChainId).HasColumnName("chain_id");
        builder.Property(e => e.StepOrder).HasColumnName("step_order");
        builder.Property(e => e.Role).HasColumnName("role").HasMaxLength(100);
        builder.Property(e => e.SpecificApproverId).HasColumnName("specific_approver_id");
        builder.Property(e => e.IsRequired).HasColumnName("is_required");
        builder.Property(e => e.CreatedAt).HasColumnName("created_at");

        // 按（审批链, 步骤顺序）建立索引，用于按序查询审批步骤
        builder.HasIndex(e => new { e.ChainId, e.StepOrder });
    }
}
