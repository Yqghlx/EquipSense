using EquipAI.Core.Interfaces;

namespace EquipAI.Core.Events;

/// <summary>
/// 告警已触发事件
/// 由 AlertEvaluationService 在告警规则评估命中后发布
/// 后续可对接 SignalR 推送、工单自动创建等
/// </summary>
/// <param name="EventId">事件唯一标识</param>
/// <param name="OccurredAt">事件发生时间（UTC）</param>
/// <param name="TenantId">所属租户 ID</param>
/// <param name="AlertId">告警实例 ID</param>
/// <param name="DeviceId">触发告警的设备 ID</param>
/// <param name="RuleId">匹配的告警规则 ID（可为空）</param>
/// <param name="Metric">触发告警的指标名称</param>
/// <param name="Value">触发告警的指标值</param>
/// <param name="Severity">告警严重级别</param>
public record AlertTriggeredEvent(
    Guid EventId,
    DateTime OccurredAt,
    Guid TenantId,
    Guid AlertId,
    Guid DeviceId,
    Guid? RuleId,
    string Metric,
    double Value,
    string Severity
) : IIntegrationEvent;
