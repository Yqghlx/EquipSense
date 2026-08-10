using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// 用户实体配置，映射到 users 表
/// </summary>
public class UserConfiguration : IEntityTypeConfiguration<User>
{
    /// <summary>
    /// 配置用户实体的表映射、字段约束、唯一索引和外键关系
    /// </summary>
    public void Configure(EntityTypeBuilder<User> builder)
    {
        // 表映射
        builder.ToTable("users");

        // 主键 — UUID 由应用层生成
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedNever();

        // 租户外键
        builder.Property(e => e.TenantId)
            .HasColumnName("tenant_id")
            .IsRequired();

        // 字段映射（snake_case 列名）
        builder.Property(e => e.Username)
            .HasColumnName("username")
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(e => e.PasswordHash)
            .HasColumnName("password_hash")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(e => e.DisplayName)
            .HasColumnName("display_name")
            .HasMaxLength(100);

        // 角色枚举 → 字符串存储
        builder.Property(e => e.Role)
            .HasColumnName("role")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        // text[] 数组 — Npgsql 原生支持 PostgreSQL 数组类型
        builder.Property(e => e.Skills)
            .HasColumnName("skills");

        builder.Property(e => e.Locations)
            .HasColumnName("locations");

        builder.Property(e => e.Phone)
            .HasColumnName("phone")
            // AES-GCM 密文包含版本、nonce、认证标签和 Base64 编码，长度会大于原始手机号。
            .HasMaxLength(256);

        builder.Property(e => e.Email)
            .HasColumnName("email")
            // 为最长合法邮箱预留加密后长度，避免 ValueConverter 截断密文。
            .HasMaxLength(256);

        builder.Property(e => e.EmailLookupHash)
            .HasColumnName("email_lookup_hash")
            .HasMaxLength(64);

        builder.Property(e => e.PhoneLookupHash)
            .HasColumnName("phone_lookup_hash")
            .HasMaxLength(64);

        builder.Property(e => e.Language)
            .HasColumnName("language")
            .HasMaxLength(10)
            .IsRequired();

        // 通知偏好 — JSONB 字段
        builder.Property(e => e.NotificationPrefs)
            .HasColumnName("notification_prefs")
            .HasColumnType("jsonb")
            .IsRequired();

        builder.Property(e => e.TokenVersion)
            .HasColumnName("token_version")
            .IsRequired();

        builder.Property(e => e.MustChangePassword)
            .HasColumnName("must_change_password")
            .IsRequired();

        builder.Property(e => e.IsActive)
            .HasColumnName("is_active")
            .IsRequired();

        builder.Property(e => e.LastLoginAt)
            .HasColumnName("last_login_at");

        builder.Property(e => e.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        // MFA 双因素认证
        builder.Property(e => e.MfaEnabled)
            .HasColumnName("mfa_enabled")
            .IsRequired();

        builder.Property(e => e.TotpSecret)
            .HasColumnName("totp_secret")
            .HasMaxLength(200);

        builder.Property(e => e.MfaRecoveryCodes)
            .HasColumnName("mfa_recovery_codes")
            .HasColumnType("jsonb");

        // 唯一复合索引 — 确保同一租户内用户名唯一
        builder.HasIndex(e => new { e.TenantId, e.Username }).IsUnique();

        // 盲索引只支持等值查找，不能用于模糊搜索；不设唯一约束以兼容不同租户使用同一联系方式。
        builder.HasIndex(e => e.EmailLookupHash)
            .HasDatabaseName("IX_users_email_lookup_hash");
        builder.HasIndex(e => e.PhoneLookupHash)
            .HasDatabaseName("IX_users_phone_lookup_hash");

        // 外键关系 — 租户删除时禁止级联（Restrict），防止误删租户导致用户数据丢失
        builder.HasOne(e => e.Tenant)
            .WithMany(e => e.Users)
            .HasForeignKey(e => e.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
