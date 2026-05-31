using EquipAI.Core.Interfaces;

namespace EquipAI.Core.Events;

/// <summary>
/// 工单创建事件，由 WorkOrderService 在创建工单后发布
/// 供 SignalR 推送等下游模块消费
/// </summary>
public record WorkOrderCreatedEvent(
    Guid EventId,
    DateTime OccurredAt,
    Guid TenantId,
    Guid WorkOrderId,
    Guid DeviceId,
    string Title,
    string Priority
) : IIntegrationEvent;
