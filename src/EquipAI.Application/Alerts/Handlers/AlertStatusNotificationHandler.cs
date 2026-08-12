using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Alerts.Handlers;

/// <summary>
/// 告警状态变更 SignalR 推送处理器
/// 监听告警确认/解决事件，通过 SignalR 实时推送到前端告警中心，让其他在线用户实时看到告警状态变化
/// （与 WorkOrderNotificationHandler 对称——工单状态变更已全链路推送，告警状态变更此前缺失）。
/// 推送失败仅记录日志，不影响事件管线的其他告警处理器（根因分析、自动建单等）。
/// </summary>
public class AlertStatusNotificationHandler :
    IEventHandler<AlertAcknowledgedEvent>,
    IEventHandler<AlertResolvedEvent>
{
    private readonly ISignalRNotificationService _notificationService;
    private readonly ILogger<AlertStatusNotificationHandler> _logger;

    public AlertStatusNotificationHandler(
        ISignalRNotificationService notificationService,
        ILogger<AlertStatusNotificationHandler> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task HandleAsync(AlertAcknowledgedEvent @event, CancellationToken ct)
    {
        try
        {
            // 轻量推送（仅 SignalR）：让告警中心在线用户实时看到告警已被确认接管
            await _notificationService.SendAlertAcknowledgedAsync(
                @event.TenantId, @event.AlertId, ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // 宿主停机或消息处理超时取消必须交回事件总线，不能被故障隔离逻辑吞掉。
            throw;
        }
        catch (Exception ex)
        {
            // SignalR 推送失败不应阻塞其他告警事件处理器（根因分析、自动建单等）
            _logger.LogError(ex, "告警确认 SignalR 推送失败: AlertId={AlertId}", @event.AlertId);
        }
    }

    /// <inheritdoc />
    public async Task HandleAsync(AlertResolvedEvent @event, CancellationToken ct)
    {
        try
        {
            // 复活既有 SendAlertResolvedAsync（三路推送：SignalR + 持久化通知 + Web Push）——此前接口/实现/
            // 前端监听三者齐备但全仓零调用（死代码），告警解决对其他用户完全不可见
            await _notificationService.SendAlertResolvedAsync(
                @event.TenantId, @event.AlertId, ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // 宿主停机或消息处理超时取消必须交回事件总线，不能被故障隔离逻辑吞掉。
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "告警解决 SignalR 推送失败: AlertId={AlertId}", @event.AlertId);
        }
    }
}
