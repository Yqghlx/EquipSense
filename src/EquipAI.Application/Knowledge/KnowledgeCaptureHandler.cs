using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Knowledge;

/// <summary>
/// 工单状态变更事件处理器
/// 当工单状态变为 Closed 时触发知识沉淀
/// </summary>
public class KnowledgeCaptureHandler : IEventHandler<WorkOrderStatusChangedEvent>
{
    private readonly KnowledgeCaptureService _captureService;
    private readonly ILogger<KnowledgeCaptureHandler> _logger;

    public KnowledgeCaptureHandler(
        KnowledgeCaptureService captureService,
        ILogger<KnowledgeCaptureHandler> logger)
    {
        _captureService = captureService;
        _logger = logger;
    }

    /// <summary>
    /// 处理工单状态变更事件
    /// 仅当工单关闭（Closed）时触发知识沉淀流程
    /// </summary>
    /// <param name="event">工单状态变更事件</param>
    /// <param name="ct">取消令牌</param>
    public async Task HandleAsync(WorkOrderStatusChangedEvent @event, CancellationToken ct)
    {
        if (@event.NewStatus != "Closed")
            return;

        _logger.LogInformation("工单关闭，触发知识沉淀: WorkOrderId={WorkOrderId}", @event.WorkOrderId);

        try
        {
            await _captureService.ProcessWorkOrderClosedAsync(
                @event.TenantId, @event.WorkOrderId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "知识沉淀处理失败: WorkOrderId={WorkOrderId}", @event.WorkOrderId);
        }
    }
}
