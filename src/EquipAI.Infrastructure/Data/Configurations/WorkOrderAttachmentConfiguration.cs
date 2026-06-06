using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// 工单附件实体 EF Core 配置
/// </summary>
public class WorkOrderAttachmentConfiguration : IEntityTypeConfiguration<WorkOrderAttachment>
{
    public void Configure(EntityTypeBuilder<WorkOrderAttachment> builder)
    {
        builder.ToTable("work_order_attachments");

        builder.Property(a => a.Id).HasColumnName("id");
        builder.Property(a => a.TenantId).HasColumnName("tenant_id");
        builder.Property(a => a.WorkOrderId).HasColumnName("work_order_id");
        builder.Property(a => a.FileName).HasColumnName("file_name").HasMaxLength(255).IsRequired();
        builder.Property(a => a.ContentType).HasColumnName("content_type").HasMaxLength(100).IsRequired();
        builder.Property(a => a.StoragePath).HasColumnName("storage_path").HasMaxLength(500).IsRequired();
        builder.Property(a => a.UploadedBy).HasColumnName("uploaded_by");
        builder.Property(a => a.CreatedAt).HasColumnName("created_at");

        // 索引：按工单查询附件
        builder.HasIndex(a => a.WorkOrderId);
        // 索引：按租户隔离查询
        builder.HasIndex(a => a.TenantId);

        // 外键关联
        builder.HasOne(a => a.WorkOrder)
            .WithMany()
            .HasForeignKey(a => a.WorkOrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
