using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// WorkOrder 实体的 EF Core 配置
/// </summary>
public class WorkOrderConfiguration : IEntityTypeConfiguration<WorkOrder>
{
    public void Configure(EntityTypeBuilder<WorkOrder> builder)
    {
        builder.ToTable("work_orders");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.TenantId).HasColumnName("tenant_id");
        builder.Property(e => e.WorkOrderCode).HasColumnName("workorder_code").HasMaxLength(50);
        builder.Property(e => e.Title).HasColumnName("title").HasMaxLength(500);
        builder.Property(e => e.Type).HasColumnName("type");
        builder.Property(e => e.Status).HasColumnName("status");
        builder.Property(e => e.Priority).HasColumnName("priority");
        builder.Property(e => e.DeviceId).HasColumnName("device_id");
        builder.Property(e => e.AlertId).HasColumnName("alert_id");
        builder.Property(e => e.AnalysisId).HasColumnName("analysis_id");
        builder.Property(e => e.RootCause).HasColumnName("root_cause");
        builder.Property(e => e.Resolution).HasColumnName("resolution");
        builder.Property(e => e.AssignedTo).HasColumnName("assigned_to");
        builder.Property(e => e.DueDate).HasColumnName("due_date");
        builder.Property(e => e.StartedAt).HasColumnName("started_at");
        builder.Property(e => e.CompletedAt).HasColumnName("completed_at");
        builder.Property(e => e.ClosedAt).HasColumnName("closed_at");
        builder.Property(e => e.CreatedBy).HasColumnName("created_by");
        builder.Property(e => e.CreatedAt).HasColumnName("created_at");

        builder.HasIndex(e => e.WorkOrderCode).IsUnique();
        builder.HasIndex(e => new { e.TenantId, e.Status });
        builder.HasIndex(e => new { e.TenantId, e.DeviceId });

        // v1.5 性能加固：工单列表分页排序索引
        // 命中 WorkOrderService.GetWorkOrdersAsync 的高频查询：
        //   WHERE tenant_id = ? [AND status = ?] ORDER BY created_at DESC LIMIT ? OFFSET ?
        // 之前 (tenant_id, status) 不含 created_at，10k+ 工单下排序溢出（filesort）
        builder.HasIndex(e => new { e.TenantId, e.Status, e.CreatedAt });
    }
}
