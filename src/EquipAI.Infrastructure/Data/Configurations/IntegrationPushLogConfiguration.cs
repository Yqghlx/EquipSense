using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// IntegrationPushLog 实体的 EF Core 配置 — snake_case 列名、索引和字段约束
/// </summary>
public class IntegrationPushLogConfiguration : IEntityTypeConfiguration<IntegrationPushLog>
{
    public void Configure(EntityTypeBuilder<IntegrationPushLog> builder)
    {
        builder.ToTable("integration_push_logs");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedNever();

        // 按租户查询推送日志（最常见场景）
        builder.HasIndex(e => e.TenantId);
        // 按工单 ID 查询关联的所有推送记录
        builder.HasIndex(e => e.WorkOrderId);
        // 复合索引：按租户 + 集成类型 + 状态筛选（用于统计面板）
        builder.HasIndex(e => new { e.TenantId, e.IntegrationType, e.Status });

        builder.Property(e => e.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(e => e.WorkOrderId).HasColumnName("work_order_id").IsRequired();
        builder.Property(e => e.IntegrationType).HasColumnName("integration_type").HasMaxLength(50).IsRequired();
        builder.Property(e => e.Direction).HasColumnName("direction").HasMaxLength(50).IsRequired();
        builder.Property(e => e.Status).HasColumnName("status").HasMaxLength(20).IsRequired();
        builder.Property(e => e.RetryCount).HasColumnName("retry_count").IsRequired();
        builder.Property(e => e.HttpStatusCode).HasColumnName("http_status_code");
        builder.Property(e => e.ExternalId).HasColumnName("external_id").HasMaxLength(500);
        builder.Property(e => e.ErrorMessage).HasColumnName("error_message").HasMaxLength(2000);
        builder.Property(e => e.DurationMs).HasColumnName("duration_ms");
        builder.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
    }
}
