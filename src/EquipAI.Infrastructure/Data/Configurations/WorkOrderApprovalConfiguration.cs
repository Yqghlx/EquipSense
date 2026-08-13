using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// WorkOrderApproval 实体的 EF Core 配置
/// </summary>
public class WorkOrderApprovalConfiguration : IEntityTypeConfiguration<WorkOrderApproval>
{
    public void Configure(EntityTypeBuilder<WorkOrderApproval> builder)
    {
        builder.ToTable("work_order_approvals");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.TenantId).HasColumnName("tenant_id");
        builder.Property(e => e.WorkOrderId).HasColumnName("work_order_id");
        builder.Property(e => e.StepOrder).HasColumnName("step_order");
        builder.Property(e => e.ExpectedRole).HasColumnName("expected_role").HasMaxLength(100);
        builder.Property(e => e.SpecificApproverId).HasColumnName("specific_approver_id");
        builder.Property(e => e.ApproverId).HasColumnName("approver_id");
        builder.Property(e => e.Action).HasColumnName("action");
        builder.Property(e => e.Comment).HasColumnName("comment");
        builder.Property(e => e.ActedAt).HasColumnName("acted_at");
        builder.Property(e => e.CreatedAt).HasColumnName("created_at");

        // 按租户和工单建立索引，用于查询某租户下某工单的所有审批记录
        builder.HasIndex(e => new { e.TenantId, e.WorkOrderId });

        // 按工单和步骤顺序建立索引，用于按序查询审批步骤
        builder.HasIndex(e => new { e.WorkOrderId, e.StepOrder });

        // 指定审批人待办查询需要单独索引，避免租户规模扩大后退化为全表扫描。
        builder.HasIndex(e => new { e.TenantId, e.SpecificApproverId, e.Action });
    }
}
