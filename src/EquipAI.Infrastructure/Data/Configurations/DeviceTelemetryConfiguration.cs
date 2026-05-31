using EquipAI.Infrastructure.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

public class DeviceTelemetryConfiguration : IEntityTypeConfiguration<DeviceTelemetry>
{
    public void Configure(EntityTypeBuilder<DeviceTelemetry> builder)
    {
        builder.HasNoKey();
        builder.ToTable("device_telemetry");

        builder.Property(e => e.Time).HasColumnName("time").IsRequired();
        builder.Property(e => e.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(e => e.DeviceId).HasColumnName("device_id").IsRequired();
        builder.Property(e => e.Metric).HasColumnName("metric").HasMaxLength(100).IsRequired();
        builder.Property(e => e.Value).HasColumnName("value");
        builder.Property(e => e.StringValue).HasColumnName("string_value").HasMaxLength(500);
        builder.Property(e => e.Quality).HasColumnName("quality").HasMaxLength(20).HasDefaultValue("good");
        builder.Property(e => e.Source).HasColumnName("source").HasMaxLength(20).HasDefaultValue("mqtt");
    }
}
