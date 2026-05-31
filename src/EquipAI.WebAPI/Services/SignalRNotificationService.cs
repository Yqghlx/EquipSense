using EquipAI.Core.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace EquipAI.WebAPI.Services;

/// <summary>
/// SignalR 实时推送服务实现
/// 通过 IHubContext 向租户组推送告警和遥测数据更新
/// 租户隔离：每条消息仅推送到对应租户的 SignalR 组
/// </summary>
public class SignalRNotificationService : ISignalRNotificationService
{
    private readonly IHubContext<Hubs.IndustrialHub> _hubContext;

    public SignalRNotificationService(IHubContext<Hubs.IndustrialHub> hubContext)
    {
        _hubContext = hubContext;
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
    }
}
