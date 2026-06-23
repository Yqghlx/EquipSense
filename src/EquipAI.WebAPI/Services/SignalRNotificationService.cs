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

    /// <inheritdoc />
    public async Task SendWorkOrderCreatedAsync(Guid tenantId, Guid workOrderId,
        Guid deviceId, string title, string priority)
    {
        await _hubContext.Clients.Group($"tenant:{tenantId}")
            .SendAsync("OnWorkOrderCreated", new
            {
                workOrderId,
                deviceId,
                title,
                priority,
                createdAt = DateTime.UtcNow
            });
    }

    /// <inheritdoc />
    public async Task SendWorkOrderStatusChangedAsync(Guid tenantId, Guid workOrderId,
        string oldStatus, string newStatus)
    {
        await _hubContext.Clients.Group($"tenant:{tenantId}")
            .SendAsync("OnWorkOrderStatusChanged", new
            {
                workOrderId,
                oldStatus,
                newStatus,
                changedAt = DateTime.UtcNow
            });
    }

    /// <inheritdoc />
    public async Task SendWorkOrderEscalatedAsync(Guid tenantId, Guid workOrderId,
        string workOrderCode, string title, string oldPriority, string newPriority)
    {
        // 关键修复：原 SLA 超时升级只更新数据库 Priority 字段，没有通知主管，
        // 导致 Critical 工单超时后主管完全不知情。现在补齐 SignalR + 持久化 + Web Push 三路通知。
        await _hubContext.Clients.Group($"tenant:{tenantId}")
            .SendAsync("OnWorkOrderEscalated", new
            {
                workOrderId,
                workOrderCode,
                title,
                oldPriority,
                newPriority,
                escalatedAt = DateTime.UtcNow
            });

        // 持久化通知（让主管登录后看到待处理事项）
        var notifyTitle = $"⚠️ SLA 超时升级: {workOrderCode}";
        var notifyContent = $"工单《{title}》SLA 已超时，优先级由 {oldPriority} 升级为 {newPriority}，请尽快处理";

        _db.Notifications.Add(new Notification
        {
            TenantId = tenantId,
            Type = "workorder_escalated",
            Title = notifyTitle,
            Content = notifyContent,
            RelatedId = workOrderId,
            Link = $"/work-orders/{workOrderId}",
        });

        // Web Push 推送（离线主管也能收到）
        try
        {
            await _pushService.SendToTenantAsync(tenantId, notifyTitle, notifyContent, $"/work-orders/{workOrderId}");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Web Push 推送失败（SLA 升级），工单 ID: {WorkOrderId}", workOrderId);
        }

        await _db.SaveChangesAsync();
    }
}
