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
        var workOrder = await dbContext.WorkOrders
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
    }
}
