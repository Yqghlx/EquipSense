using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Alerts.Handlers;

/// <summary>
/// 遥测数据事件处理器
/// 收到 TelemetryReceivedEvent 后构建设备上下文并触发告警评估
/// </summary>
public class TelemetryEventHandler : IEventHandler<TelemetryReceivedEvent>
{
    private readonly IAlertEvaluationService _evaluationService;
    private readonly ILogger<TelemetryEventHandler> _logger;

    public TelemetryEventHandler(
        IAlertEvaluationService evaluationService,
        ILogger<TelemetryEventHandler> logger)
    {
        _evaluationService = evaluationService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task HandleAsync(TelemetryReceivedEvent @event, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("处理遥测事件: 设备={DeviceId}, 指标={Metric}, 值={Value}",
            @event.DeviceId, @event.Metric, @event.Value);

        // 构建设备上下文，当前仅包含触发事件的单一指标
        // 后续可扩展为从缓存加载设备全量指标，支持组合规则评估
        var context = new DeviceContext();
        context.Metrics[@event.Metric] = @event.Value;

        await _evaluationService.EvaluateForDeviceAsync(
            @event.TenantId,
            @event.DeviceId,
            string.Empty,
            @event.Metric,
            @event.Value,
            context);
    }
}
