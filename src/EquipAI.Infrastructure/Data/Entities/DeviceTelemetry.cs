namespace EquipAI.Infrastructure.Data.Entities;

/// <summary>
/// 设备遥测时序数据实体（TimescaleDB 超级表）
/// 窄表设计：一行一个指标值，新增指标不需要改表结构
/// 无主键，由 TimescaleDB 管理分区
/// </summary>
public class DeviceTelemetry
{
    public DateTime Time { get; set; }
    public Guid TenantId { get; set; }
    public Guid DeviceId { get; set; }
    public string Metric { get; set; } = string.Empty;
    public double? Value { get; set; }
    public string? StringValue { get; set; }
    public string Quality { get; set; } = "good";
    public string Source { get; set; } = "mqtt";
}
