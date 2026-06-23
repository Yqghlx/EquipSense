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

        // IgnoreQueryFilters: 后台事件处理器无 HttpContext，全局租户过滤器会让 FindAsync 返回 null
        var alert = await dbContext.Alerts
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(a => a.Id == @event.AlertId, cancellationToken);
        if (alert != null)
        {
            // 1. SignalR 实时推送到前端（失败不阻塞后续多渠道通知）
            //    SignalR 与多渠道（站内/钉钉/飞书）是独立通知路径，SignalR 推送失败（含其内部
            //    持久化/Web Push 异常）不得拖垮 DispatchAsync——Critical 告警客户依赖钉钉/飞书
            //    （未必在线看 Web），SignalR 单点故障导致这些渠道全不发会让客户完全错过故障。
            try
            {
                await _notificationService.SendAlertTriggeredAsync(
                    @event.TenantId,
                    alert.Id,
                    alert.AlertCode,
                    @event.DeviceId,
                    @event.Metric,
                    @event.Value,
                    @event.Severity);
                _logger.LogDebug("告警已通过 SignalR 推送: AlertId={AlertId}", @event.AlertId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "SignalR 告警推送失败，继续多渠道通知分发: AlertId={AlertId}", @event.AlertId);
            }

            // 2. 多渠道通知分发（站内通知 + 钉钉/飞书机器人）— 独立于 SignalR
            await _alertNotificationService.DispatchAsync(@event, alert, cancellationToken);
        }
    }
}
