using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// TechnicianProfile 实体的 EF Core 配置
/// </summary>
public class TechnicianProfileConfiguration : IEntityTypeConfiguration<TechnicianProfile>
{
    /// <summary>
    /// 配置技术人员画像实体的表映射、字段约束和索引
    /// </summary>
    public void Configure(EntityTypeBuilder<TechnicianProfile> builder)
    {
        // 表映射
        builder.ToTable("technician_profiles");

        // 主键
        builder.HasKey(e => e.Id);

        // 字段映射（snake_case 列名）
        builder.Property(e => e.TenantId)
            .HasColumnName("tenant_id")
            .IsRequired();

        builder.Property(e => e.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        builder.Property(e => e.Name)
            .HasColumnName("name")
            .HasMaxLength(100)
            .IsRequired();

        // 技能列表 — JSONB 灵活存储，支持 PostgreSQL 原生 JSON 查询
        builder.Property(e => e.Skills)
            .HasColumnName("skills")
            .HasColumnType("jsonb")
            .IsRequired();

        builder.Property(e => e.ActiveWorkCount)
            .HasColumnName("active_work_count")
            .IsRequired();

        builder.Property(e => e.CompletedCount)
            .HasColumnName("completed_count")
            .IsRequired();

        builder.Property(e => e.AvgCompletionHours)
            .HasColumnName("avg_completion_hours");

        builder.Property(e => e.IsAvailable)
            .HasColumnName("is_available")
            .IsRequired();

        builder.Property(e => e.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        // 唯一复合索引 — 确保同一租户内一个用户只有一条画像记录
        builder.HasIndex(e => new { e.TenantId, e.UserId }).IsUnique();

        // 查询索引 — 按租户筛选可派工技术人员
        builder.HasIndex(e => new { e.TenantId, e.IsAvailable });

        // 外键关系 — 关联用户，删除时级联（用户删除则画像无意义）
        builder.HasOne<Core.Entities.User>()
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // 外键关系 — 关联租户，删除时禁止级联，防止误删租户导致画像数据丢失
        builder.HasOne<Core.Entities.Tenant>()
            .WithMany()
            .HasForeignKey(e => e.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
