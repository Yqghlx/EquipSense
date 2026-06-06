using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.AspNetCore.SignalR;

namespace EquipAI.WebAPI.Services;

/// <summary>
/// SignalR 实时推送服务实现
/// 通过 IHubContext 向租户组推送告警和遥测数据更新
/// 同时集成 Web Push 推送和数据库持久化，确保离线用户也能收到通知
/// 租户隔离：每条消息仅推送到对应租户的 SignalR 组
/// </summary>
public class SignalRNotificationService : ISignalRNotificationService
{
    private readonly IHubContext<Hubs.IndustrialHub> _hubContext;
    private readonly IPushNotificationService _pushService;
    private readonly AppDbContext _db;
    private readonly ILogger<SignalRNotificationService> _logger;

    public SignalRNotificationService(
        IHubContext<Hubs.IndustrialHub> hubContext,
        IPushNotificationService pushService,
        AppDbContext db,
        ILogger<SignalRNotificationService> logger)
    {
        _hubContext = hubContext;
        _pushService = pushService;
        _db = db;
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

        // 持久化通知到数据库（租户级通知，不指定具体用户）
        var title = $"告警触发: {metric}";
        var content = $"指标 {metric} 达到 {value}，严重级别: {severity}";

        _db.Notifications.Add(new Notification
        {
            TenantId = tenantId,
            Type = "alert",
            Title = title,
            Content = content,
            RelatedId = alertId,
            Link = "/alerts",
        });

        // Web Push 推送通知 — 确保离线用户也能收到告警
        try
        {
            await _pushService.SendToTenantAsync(tenantId, title, content, "/alerts");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Web Push 推送失败，告警 ID: {AlertId}", alertId);
        }

        await _db.SaveChangesAsync();
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

        // 持久化告警解除通知
        _db.Notifications.Add(new Notification
        {
            TenantId = tenantId,
            Type = "alert",
            Title = "告警解除",
            Content = $"告警已解除",
            RelatedId = alertId,
            Link = "/alerts",
        });

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

        await _db.SaveChangesAsync();
    }
}
