using EquipAI.Core.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace EquipAI.WebAPI.Services;

/// <summary>
/// SignalR 实时推送服务实现
/// 通过 IHubContext 向租户组推送告警和遥测数据更新
/// 同时集成 Web Push 推送，确保离线用户也能收到告警通知
/// 租户隔离：每条消息仅推送到对应租户的 SignalR 组
/// </summary>
public class SignalRNotificationService : ISignalRNotificationService
{
    private readonly IHubContext<Hubs.IndustrialHub> _hubContext;
    private readonly IPushNotificationService _pushService;
    private readonly ILogger<SignalRNotificationService> _logger;

    public SignalRNotificationService(
        IHubContext<Hubs.IndustrialHub> hubContext,
        IPushNotificationService pushService,
        ILogger<SignalRNotificationService> logger)
    {
        _hubContext = hubContext;
        _pushService = pushService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task SendAlertTriggeredAsync(Guid tenantId, Guid alertId, string alertCode,
        Guid deviceId, string metric, double value, string severity)
    {
        await _hubContext.Clients.Group($"tenant:{tenantId}")
            .SendAsync("OnAlertTriggered", new
            {
                alertId,
                alertCode,
                deviceId,
                metric,
                value,
                severity,
                occurredAt = DateTime.UtcNow
            });

        // Web Push 推送通知 — 确保离线用户也能收到告警
        try
        {
            await _pushService.SendToTenantAsync(
                tenantId, "告警触发",
                $"指标 {metric} 达到 {value}，严重级别: {severity}",
                "/alerts");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Web Push 推送失败，告警 ID: {AlertId}", alertId);
        }
    }

    /// <inheritdoc />
    public async Task SendTelemetryUpdateAsync(Guid tenantId, Guid deviceId, string metric, double value)
    {
        await _hubContext.Clients.Group($"tenant:{tenantId}")
            .SendAsync("OnTelemetryUpdate", deviceId, metric, value);
    }

    /// <inheritdoc />
    public async Task SendAlertResolvedAsync(Guid tenantId, Guid alertId)
    {
        await _hubContext.Clients.Group($"tenant:{tenantId}")
            .SendAsync("OnAlertResolved", alertId);

        // Web Push 推送告警解除通知
        try
        {
            await _pushService.SendToTenantAsync(
                tenantId, "告警解除",
                $"告警 {alertId} 已解除",
                "/alerts");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Web Push 推送失败（告警解除），告警 ID: {AlertId}", alertId);
        }
    }
}
