using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Alerts.Handlers;

/// <summary>
/// 告警触发事件处理器
/// 1. 记录日志
/// 2. 通过 SignalR 实时推送到前端
/// 3. 多渠道通知分发（持久化站内通知 + 钉钉/飞书机器人推送 Critical/High）
/// </summary>
public class AlertEventHandler : IEventHandler<AlertTriggeredEvent>
{
    private readonly ILogger<AlertEventHandler> _logger;
    private readonly ISignalRNotificationService _notificationService;
    private readonly AlertNotificationService _alertNotificationService;
    private readonly IServiceScopeFactory _scopeFactory;

    public AlertEventHandler(
        ILogger<AlertEventHandler> logger,
        ISignalRNotificationService notificationService,
        AlertNotificationService alertNotificationService,
        IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _notificationService = notificationService;
        _alertNotificationService = alertNotificationService;
        _scopeFactory = scopeFactory;
    }

    /// <inheritdoc />
    public async Task HandleAsync(AlertTriggeredEvent @event, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "告警已触发: AlertId={AlertId}, 设备={DeviceId}, 指标={Metric}, 值={Value}, 级别={Severity}",
            @event.AlertId, @event.DeviceId, @event.Metric, @event.Value, @event.Severity);

        // 查询告警实体获取 alertCode 用于推送
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var alert = await dbContext.Alerts.FindAsync(new object[] { @event.AlertId }, cancellationToken);
        if (alert != null)
        {
            // 1. SignalR 实时推送到前端
            await _notificationService.SendAlertTriggeredAsync(
                @event.TenantId,
                alert.Id,
                alert.AlertCode,
                @event.DeviceId,
                @event.Metric,
                @event.Value,
                @event.Severity);
            _logger.LogDebug("告警已通过 SignalR 推送: AlertId={AlertId}", @event.AlertId);

            // 2. 多渠道通知分发（站内通知 + 钉钉/飞书机器人）
            await _alertNotificationService.DispatchAsync(@event, alert, cancellationToken);
        }
    }
}
