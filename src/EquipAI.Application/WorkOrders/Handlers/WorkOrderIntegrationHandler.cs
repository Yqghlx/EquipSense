using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Application.WorkOrders.Router;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders.Handlers;

/// <summary>
/// 工单集成事件处理器。
/// 创建只发布 WorkOrderCreatedEvent；状态流转发布 WorkOrderStatusChangedEvent。
/// 两者都要进 IntegrationRouter，否则钉钉/飞书/EAM/Webhook 的创建通知永远不会发出。
/// </summary>
public class WorkOrderIntegrationHandler :
    IEventHandler<WorkOrderCreatedEvent>,
    IEventHandler<WorkOrderStatusChangedEvent>
{
    private readonly IntegrationRouter _router;
    private readonly ILogger<WorkOrderIntegrationHandler> _logger;

    public WorkOrderIntegrationHandler(
        IntegrationRouter router,
        ILogger<WorkOrderIntegrationHandler> logger)
    {
        _router = router;
        _logger = logger;
    }

    /// <summary>
    /// 工单创建后推送外部创建通知。
    /// </summary>
    public async Task HandleAsync(WorkOrderCreatedEvent eventMsg, CancellationToken ct)
    {
        try
        {
            await _router.RouteCreatedAsync(eventMsg.TenantId, eventMsg.WorkOrderId, ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "集成路由创建推送失败: WorkOrderId={WorkOrderId}",
                eventMsg.WorkOrderId);
        }
    }

    /// <summary>
    /// 工单状态变更后同步外部系统。
    /// PendingDispatch 若再次出现（历史兼容），仍走创建路由，避免重复定义第二套创建语义。
    /// </summary>
    public async Task HandleAsync(WorkOrderStatusChangedEvent eventMsg, CancellationToken ct)
    {
        try
        {
            if (eventMsg.NewStatus == "PendingDispatch")
            {
                await _router.RouteCreatedAsync(eventMsg.TenantId, eventMsg.WorkOrderId, ct);
            }
            else
            {
                await _router.RouteStatusChangedAsync(
                    eventMsg.TenantId, eventMsg.WorkOrderId, eventMsg.NewStatus, ct);
            }
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // 外部集成的普通失败可以降级记录，但停机或超时取消必须传播，
            // 让消息总线保留未完成的工单状态事件并按策略重试。
            throw;
        }
        catch (Exception ex)
        {
            // 集成推送失败不应阻断主流程，仅记录警告日志
            _logger.LogWarning(ex,
                "集成路由推送失败: WorkOrderId={WorkOrderId}, NewStatus={NewStatus}",
                eventMsg.WorkOrderId, eventMsg.NewStatus);
        }
    }
}
