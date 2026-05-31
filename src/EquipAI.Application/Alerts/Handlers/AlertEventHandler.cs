using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Alerts.Handlers;

/// <summary>
/// 告警触发事件处理器
/// 当前仅记录日志，后续可对接 SignalR 推送、工单自动创建等
/// </summary>
public class AlertEventHandler : IEventHandler<AlertTriggeredEvent>
{
    private readonly ILogger<AlertEventHandler> _logger;

    public AlertEventHandler(ILogger<AlertEventHandler> logger)
    {
        _logger = logger;
    }

    /// <inheritdoc />
    public Task HandleAsync(AlertTriggeredEvent @event, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "告警已触发: AlertId={AlertId}, 设备={DeviceId}, 指标={Metric}, 值={Value}, 级别={Severity}",
            @event.AlertId, @event.DeviceId, @event.Metric, @event.Value, @event.Severity);

        return Task.CompletedTask;
    }
}
