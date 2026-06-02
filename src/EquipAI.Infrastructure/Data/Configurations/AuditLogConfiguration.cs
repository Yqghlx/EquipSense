using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// AuditLog 实体的 EF Core 配置 — 定义表名、索引、字段约束
/// </summary>
public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("audit_logs");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).ValueGeneratedNever();

        // 按租户查询审计日志是最常见的场景
        builder.HasIndex(a => a.TenantId);
        // 按时间倒序查询，索引加速排序
        builder.HasIndex(a => a.CreatedAt);
        // 复合索引：按租户 + 操作类型筛选
        builder.HasIndex(a => new { a.TenantId, a.Action });

        builder.Property(a => a.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(a => a.UserId).HasColumnName("user_id");
        builder.Property(a => a.Action).HasColumnName("action").HasMaxLength(50).IsRequired();
        builder.Property(a => a.ResourceType).HasColumnName("resource_type").HasMaxLength(50).IsRequired();
        builder.Property(a => a.ResourceId).HasColumnName("resource_id").HasMaxLength(36);
        builder.Property(a => a.Description).HasColumnName("description").HasMaxLength(500);
        builder.Property(a => a.IpAddress).HasColumnName("ip_address").HasMaxLength(45);
        builder.Property(a => a.RequestPath).HasColumnName("request_path").HasMaxLength(500);
        builder.Property(a => a.HttpMethod).HasColumnName("http_method").HasMaxLength(10);
        builder.Property(a => a.UserAgent).HasColumnName("user_agent").HasMaxLength(1000);
        builder.Property(a => a.CreatedAt).HasColumnName("created_at").IsRequired();
    }
}
