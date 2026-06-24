using EquipAI.Core.Interfaces;

namespace EquipAI.Core.Events;

/// <summary>
/// 告警已解决事件
/// 由 AlertsController.ResolveAlert 在告警状态变更为 Resolved 后发布，
/// 供 AlertStatusNotificationHandler 订阅并调用 SendAlertResolvedAsync（复活此前全仓零调用的死代码），
/// 经 SignalR 推送 OnAlertResolved + 持久化通知 + Web Push 三路，让告警中心其他用户实时看到该告警已闭环。
/// </summary>
/// <param name="EventId">事件唯一标识</param>
/// <param name="OccurredAt">事件发生时间（UTC）</param>
/// <param name="TenantId">所属租户 ID</param>
/// <param name="AlertId">告警实例 ID</param>
/// <param name="ResolvedBy">解决操作的用户 ID（来自 ITenantContext.UserId，非租户 ID）</param>
/// <param name="Resolution">解决方案说明</param>
public record AlertResolvedEvent(
    Guid EventId,
    DateTime OccurredAt,
    Guid TenantId,
    Guid AlertId,
    Guid ResolvedBy,
    string Resolution
) : IIntegrationEvent;
