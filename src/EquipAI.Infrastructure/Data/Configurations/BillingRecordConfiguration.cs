using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// BillingRecord 实体的 EF Core 配置
/// </summary>
public class BillingRecordConfiguration : IEntityTypeConfiguration<BillingRecord>
{
    public void Configure(EntityTypeBuilder<BillingRecord> builder)
    {
        builder.ToTable("billing_records");
        builder.HasKey(b => b.Id);

        builder.Property(b => b.TenantId).IsRequired();
        builder.Property(b => b.Plan).HasConversion<string>().HasMaxLength(20);
        builder.Property(b => b.Amount).HasColumnType("decimal(10,2)");
        builder.Property(b => b.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(b => b.PaymentMethod).HasMaxLength(20);
        builder.Property(b => b.Remark).HasMaxLength(500);

        builder.HasIndex(b => b.TenantId);
        builder.HasIndex(b => new { b.TenantId, b.PeriodStart });
    }
}
