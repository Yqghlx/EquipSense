using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Application.WorkOrders.Router;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders.Handlers;

/// <summary>
/// 工单集成事件处理器
/// 监听 WorkOrderStatusChangedEvent，在工单创建/状态变更时委托 IntegrationRouter 推送到外部系统
/// 集成配置存储在 Tenant.Settings JSONB 字段中
/// </summary>
public class WorkOrderIntegrationHandler : IEventHandler<WorkOrderStatusChangedEvent>
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

    public async Task HandleAsync(WorkOrderStatusChangedEvent eventMsg, CancellationToken ct)
    {
        try
        {
            if (eventMsg.NewStatus == "PendingDispatch")
            {
                // 工单新建：路由创建通知
                await _router.RouteCreatedAsync(eventMsg.TenantId, eventMsg.WorkOrderId, ct);
            }
            else
            {
                // 工单状态变更：路由状态更新
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
