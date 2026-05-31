using EquipAI.Core.Interfaces;

namespace EquipAI.Core.Events;

/// <summary>
/// 工单状态变更事件，由 WorkOrderService 在状态变更后发布
/// </summary>
public record WorkOrderStatusChangedEvent(
    Guid EventId,
    DateTime OccurredAt,
    Guid TenantId,
    Guid WorkOrderId,
    string OldStatus,
    string NewStatus,
    Guid? OperatorId
) : IIntegrationEvent;
