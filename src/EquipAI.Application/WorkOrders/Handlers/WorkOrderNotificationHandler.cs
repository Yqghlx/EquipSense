using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders.Handlers;

/// <summary>
/// 工单 SignalR 推送处理器
/// 监听工单创建和状态变更事件，通过 SignalR 实时推送到前端
/// 推送失败仅记录日志，不影响事件管线的其他处理器
/// </summary>
public class WorkOrderNotificationHandler :
    IEventHandler<WorkOrderCreatedEvent>,
    IEventHandler<WorkOrderStatusChangedEvent>
{
    private readonly ISignalRNotificationService _notificationService;
    private readonly ILogger<WorkOrderNotificationHandler> _logger;

    public WorkOrderNotificationHandler(
        ISignalRNotificationService notificationService,
        ILogger<WorkOrderNotificationHandler> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task HandleAsync(WorkOrderCreatedEvent @event, CancellationToken ct)
    {
        try
        {
            await _notificationService.SendWorkOrderCreatedAsync(
                @event.TenantId, @event.WorkOrderId, @event.DeviceId,
                @event.Title, @event.Priority);
        }
        catch (Exception ex)
        {
            // SignalR 推送失败不应阻塞其他事件处理器（知识沉淀、外部集成等）
            _logger.LogError(ex, "工单创建 SignalR 推送失败: WorkOrderId={WorkOrderId}", @event.WorkOrderId);
        }
    }

    /// <inheritdoc />
    public async Task HandleAsync(WorkOrderStatusChangedEvent @event, CancellationToken ct)
    {
        try
        {
            await _notificationService.SendWorkOrderStatusChangedAsync(
                @event.TenantId, @event.WorkOrderId,
                @event.OldStatus, @event.NewStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "工单状态变更 SignalR 推送失败: WorkOrderId={WorkOrderId}", @event.WorkOrderId);
        }
    }
}
