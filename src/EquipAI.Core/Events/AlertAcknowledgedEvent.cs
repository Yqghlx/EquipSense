using EquipAI.Core.Interfaces;

namespace EquipAI.Core.Events;

/// <summary>
/// 告警已确认事件
/// 由 AlertsController.AcknowledgeAlert 在告警状态变更为 Acknowledged 后发布，
/// 供 AlertStatusNotificationHandler 订阅并通过 SignalR 推送 OnAlertAcknowledged，
/// 让告警中心其他在线用户实时看到该告警已被确认接管（避免多人重复确认/重复派工）。
/// </summary>
/// <param name="EventId">事件唯一标识</param>
/// <param name="OccurredAt">事件发生时间（UTC）</param>
/// <param name="TenantId">所属租户 ID</param>
/// <param name="AlertId">告警实例 ID</param>
/// <param name="AcknowledgedBy">确认操作的用户 ID（来自 ITenantContext.UserId，非租户 ID——审计须追溯具体操作人）</param>
/// <param name="Note">确认备注（可为空）</param>
public record AlertAcknowledgedEvent(
    Guid EventId,
    DateTime OccurredAt,
    Guid TenantId,
    Guid AlertId,
    Guid AcknowledgedBy,
    string? Note
) : IIntegrationEvent;
