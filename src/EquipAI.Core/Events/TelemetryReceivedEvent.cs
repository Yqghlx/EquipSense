using EquipAI.Core.Interfaces;

namespace EquipAI.Core.Events;

/// <summary>
/// 遥测数据已接收事件
/// 每条 metric 一行数据对应一个事件，由 TelemetryService 在写入数据库后发布
/// </summary>
/// <param name="EventId">事件唯一标识</param>
/// <param name="OccurredAt">事件发生时间（UTC）</param>
/// <param name="TenantId">所属租户 ID</param>
/// <param name="DeviceId">设备 ID</param>
/// <param name="Metric">指标名称（如 temperature、vibration）</param>
/// <param name="Value">指标数值</param>
/// <param name="Timestamp">遥测数据原始时间戳</param>
/// <param name="Quality">数据质量标记（good/warning/bad）</param>
public record TelemetryReceivedEvent(
    Guid EventId,
    DateTime OccurredAt,
    Guid TenantId,
    Guid DeviceId,
    string Metric,
    double Value,
    DateTime Timestamp,
    string Quality
) : IIntegrationEvent;
