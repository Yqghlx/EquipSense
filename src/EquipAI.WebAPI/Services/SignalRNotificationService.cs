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
        // SignalR 推送用 try/catch 隔离：Hub 推送失败（连接/序列化/底层 WebSocket 错误）不得阻塞后续
        // 站内通知持久化与 Web Push——告警多渠道冗余，SignalR 单点失败拖垮全部通知渠道会让客户完全
        // 错过 Critical 故障（在线 Web、离线推送、乃至下游经 DispatchAsync 发的钉钉/飞书全丢）。
        try
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
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SignalR 告警推送失败，继续站内通知与 Web Push: AlertId={AlertId}", alertId);
        }

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
        // SignalR 推送用 try/catch 隔离（与 SendAlertTriggeredAsync 一致）：Hub 推送失败不得阻塞
        // 后续站内通知持久化与 Web Push——告警解除通知同样多渠道冗余，SignalR 单点失败拖垮全部渠道
        // 会让客户以为告警仍在处理（实际已解除），信息长期不同步。
        try
        {
            await _hubContext.Clients.Group($"tenant:{tenantId}")
                .SendAsync("OnAlertResolved", alertId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SignalR 告警解除推送失败，继续站内通知与 Web Push: AlertId={AlertId}", alertId);
        }

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
        // SignalR 推送用 try/catch 隔离（与 SendAlertTriggeredAsync 一致）：SLA 超时升级须通知主管，
        // 主管未必在线看 Web，恰恰依赖站内持久化 + Web Push 兜底，SignalR 单点失败拖垮它们会让
        // 主管完全不知情（#184/#231 专门补的升级通知形同虚设）。
        try
        {
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
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SignalR SLA 升级推送失败，继续站内通知与 Web Push: WorkOrderId={WorkOrderId}", workOrderId);
        }

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

    /// <inheritdoc />
    public async Task SendDeviceOfflineAsync(Guid tenantId, Guid deviceId, string deviceCode, string deviceName)
    {
        // 设备离线（超阈值无遥测）是工业监控基本告警：通信中断可能源于设备故障/网络故障/网关故障。
        // 原实现只更新状态不发通知，运维完全不知情；且设备离线不产生遥测，不触发阈值告警，
        // 故必须有独立离线通知。补齐 SignalR + 持久化 + Web Push 三路通知。
        // SignalR 推送用 try/catch 隔离（与 SendAlertTriggeredAsync 一致）：设备离线须通知运维，
        // 运维未必在线看 Web，恰恰依赖站内持久化 + Web Push 兜底，SignalR 单点失败拖垮它们会让
        // 运维完全错过通信中断（#232 专门补的离线通知形同虚设）。
        try
        {
            await _hubContext.Clients.Group($"tenant:{tenantId}")
                .SendAsync("OnDeviceStatusChanged", new
                {
                    deviceId,
                    deviceCode,
                    deviceName,
                    status = "Offline",
                    changedAt = DateTime.UtcNow
                });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SignalR 设备离线推送失败，继续站内通知与 Web Push: DeviceId={DeviceId}", deviceId);
        }

        var notifyTitle = $"⚠️ 设备离线: {deviceCode}";
        var notifyContent = $"设备《{deviceName}》（{deviceCode}）已超过阈值无遥测，可能通信中断，请检查";

        _db.Notifications.Add(new Notification
        {
            TenantId = tenantId,
            Type = "device_offline",
            Title = notifyTitle,
            Content = notifyContent,
            RelatedId = deviceId,
            Link = "/devices",
        });

        try
        {
            await _pushService.SendToTenantAsync(tenantId, notifyTitle, notifyContent, "/devices");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Web Push 推送失败（设备离线），设备 ID: {DeviceId}", deviceId);
        }

        await _db.SaveChangesAsync();
    }
}
