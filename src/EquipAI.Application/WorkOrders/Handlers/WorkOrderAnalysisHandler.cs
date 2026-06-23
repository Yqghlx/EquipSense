using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders.Handlers;

/// <summary>
/// 工单分析更新处理器
/// 监听 AnalysisCompletedEvent，查找关联告警的活跃工单，
/// 将 AI 分析结果（分析 ID 和根因描述）更新到工单中
/// </summary>
public class WorkOrderAnalysisHandler : IEventHandler<AnalysisCompletedEvent>
{
    private readonly ILogger<WorkOrderAnalysisHandler> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public WorkOrderAnalysisHandler(
        ILogger<WorkOrderAnalysisHandler> logger,
        IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    /// <inheritdoc />
    public async Task HandleAsync(AnalysisCompletedEvent @event, CancellationToken cancellationToken = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 查找与该告警关联的活跃工单（未关闭、未取消）
        // IgnoreQueryFilters: 后台事件处理器无 HttpContext，全局租户过滤器会让查询返回 null
        var workOrder = await dbContext.WorkOrders
            .IgnoreQueryFilters()
            .Where(wo => wo.AlertId == @event.AlertId
                && wo.Status != WorkOrderStatus.Closed
                && wo.Status != WorkOrderStatus.Cancelled)
            .FirstOrDefaultAsync(cancellationToken);

        if (workOrder is null)
        {
            _logger.LogDebug(
                "未找到关联告警的活跃工单，跳过分析更新: AlertId={AlertId}", @event.AlertId);
            return;
        }

        // 更新工单的分析 ID 和根因描述
        workOrder.AnalysisId = @event.AnalysisId;
        workOrder.RootCause = @event.RootCause;

        await dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "已更新工单分析结果: WorkOrderId={WorkOrderId}, AnalysisId={AnalysisId}, Confidence={Confidence}",
            workOrder.Id, @event.AnalysisId, @event.Confidence);

        // 推送分析更新到前端，让停留在工单详情页的用户实时看到 AI 根因与建议（回归 #249）。
        // 原实现只更新 DB 不推送，前端工单详情页（useWorkOrder(id) queryKey ['work-orders', id]）不被
        // invalidate → 用户必须手动刷新才能看到根因。AI 根因分析是「告警→自动建单→异步分析」流程的
        // 核心价值点，分析完成却不展示严重降低产品可信度。
        // 从 scope 解析推送服务（Scoped，与 AppDbContext 同 scope）；解析失败则降级（DB 已更新，手动刷新仍可见）。
        var notificationService = scope.ServiceProvider.GetService<ISignalRNotificationService>();
        if (notificationService is not null)
        {
            await notificationService.SendWorkOrderAnalysisUpdatedAsync(@event.TenantId, workOrder.Id);
        }
    }
}
