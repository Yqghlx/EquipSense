using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// 故障案例表 EF Core 配置
/// </summary>
public class FaultCaseConfiguration : IEntityTypeConfiguration<FaultCase>
{
    public void Configure(EntityTypeBuilder<FaultCase> builder)
    {
        builder.ToTable("fault_cases");

        // FaultData 存储故障时刻的传感器/指标快照，使用 JSONB 便于灵活扩展
        builder.Property(e => e.FaultData).HasColumnType("jsonb");

        // 按租户+设备类型查询：用于查找同类设备的故障案例
        builder.HasIndex(e => new { e.TenantId, e.DeviceType });

        // 按租户+来源工单查询：用于从工单追溯关联的故障案例
        builder.HasIndex(e => new { e.TenantId, e.SourceWorkorderId });
    }
}
