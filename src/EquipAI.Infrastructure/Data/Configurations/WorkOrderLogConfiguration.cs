using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// WorkOrderLog 实体的 EF Core 配置
/// </summary>
public class WorkOrderLogConfiguration : IEntityTypeConfiguration<WorkOrderLog>
{
    public void Configure(EntityTypeBuilder<WorkOrderLog> builder)
    {
        builder.ToTable("work_order_logs");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.WorkOrderId).HasColumnName("work_order_id");
        builder.Property(e => e.Action).HasColumnName("action");
        builder.Property(e => e.OldStatus).HasColumnName("old_status");
        builder.Property(e => e.NewStatus).HasColumnName("new_status");
        builder.Property(e => e.OperatorId).HasColumnName("operator_id");
        builder.Property(e => e.Note).HasColumnName("note");
        builder.Property(e => e.CreatedAt).HasColumnName("created_at");

        builder.HasIndex(e => e.WorkOrderId);
    }
}
