using EquipAI.Application.Notifications;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Services;

/// <summary>
/// SignalR 实时推送服务实现
/// 通过 IHubContext 向租户组推送遥测数据，向租户内用户组推送业务事件。
/// 同时集成 Web Push 推送和数据库持久化，确保离线用户也能收到通知。
/// 租户隔离：每条消息仅推送到对应租户的广播组或用户组，并遵循活动状态与渠道偏好。
/// </summary>
public class SignalRNotificationService : ISignalRNotificationService
{
    private readonly IHubContext<Hubs.IndustrialHub> _hubContext;
    private readonly IPushNotificationService _pushService;
    private readonly AppDbContext _db;
    private readonly ILogger<SignalRNotificationService> _logger;
    private readonly NotificationPreferenceService _preferenceService;

    /// <summary>
    /// 能看到告警类站内通知的运维角色。角色展开必须发生在服务端，不能把租户广播
    /// 写成 UserId=Guid.Empty，否则通知中心按用户查询时会产生用户永远看不到的孤儿记录。
    /// </summary>
    private static readonly UserRole[] OperationsNotificationRoles =
    [
        UserRole.SystemAdmin,
        UserRole.MaintenanceLead,
        UserRole.Technician,
    ];

    /// <summary>能接收 SLA 升级站内通知的管理角色。</summary>
    private static readonly UserRole[] EscalationNotificationRoles =
    [
        UserRole.SystemAdmin,
        UserRole.MaintenanceLead,
    ];

    public SignalRNotificationService(
        IHubContext<Hubs.IndustrialHub> hubContext,
        IPushNotificationService pushService,
        AppDbContext db,
        ILogger<SignalRNotificationService> logger,
        NotificationPreferenceService preferenceService)
    {
        _hubContext = hubContext;
        _pushService = pushService;
        _db = db;
        _logger = logger;
        _preferenceService = preferenceService;
    }

    /// <summary>
    /// 查询指定租户内符合角色条件的活动用户，并按渠道偏好进一步筛选。
    /// 后台事件不依赖当前 HTTP 请求，因此租户和活动状态始终显式传入查询链路。
    /// </summary>
    private async Task<IReadOnlySet<Guid>> GetEnabledRecipientIdsAsync(
        Guid tenantId,
        IReadOnlyCollection<UserRole>? roles,
        string notificationType,
        string channel,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            return new HashSet<Guid>();

        try
        {
            var query = _db.UnfilteredSet<User>()
                .Where(user => user.TenantId == tenantId
                    && user.IsActive
                    && user.Id != Guid.Empty);

            if (roles is not null)
            {
                var roleValues = roles.Distinct().ToArray();
                query = query.Where(user => roleValues.Contains(user.Role));
            }

            var candidateIds = await query
                .Select(user => user.Id)
                .ToListAsync(cancellationToken);

            return await _preferenceService.GetEnabledUserIdsAsync(
                tenantId,
                candidateIds,
                notificationType,
                channel,
                cancellationToken);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            // 渠道筛选失败时返回空收件人，保护站内历史写入和其它通知渠道；异常必须留痕，
            // 否则用户会误以为偏好生效但实际上只是静默丢弃了实时/推送消息。
            _logger.LogWarning(
                ex,
                "通知偏好筛选失败，渠道将降级为空收件人: TenantId={TenantId}, Type={Type}, Channel={Channel}",
                tenantId,
                notificationType,
                channel);
            return new HashSet<Guid>();
        }
    }

    /// <summary>
    /// 向符合偏好的租户内用户组发送 SignalR 消息。
    /// 组名同时包含租户和用户 ID，避免同一用户 ID 在不同租户间发生碰撞。
    /// </summary>
    private async Task SendToEnabledUserGroupsAsync(
        Guid tenantId,
        IReadOnlyCollection<UserRole>? roles,
        string notificationType,
        string method,
        object payload,
        CancellationToken cancellationToken)
    {
        try
        {
            var userIds = await GetEnabledRecipientIdsAsync(
                tenantId,
                roles,
                notificationType,
                "signalr",
                cancellationToken);
            if (userIds.Count == 0)
                return;

            var groups = userIds
                .Select(userId => GetUserGroupName(tenantId, userId))
                .ToArray();
            await _hubContext.Clients.Groups(groups)
                .SendAsync(method, payload, cancellationToken);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "SignalR 用户定向通知失败: TenantId={TenantId}, Type={Type}, Method={Method}",
                tenantId,
                notificationType,
                method);
        }
    }

    /// <summary>
    /// 向符合偏好的用户发送 Web Push；无收件人时不调用底层推送服务。
    /// </summary>
    private async Task SendPushToEnabledUsersAsync(
        Guid tenantId,
        IReadOnlyCollection<UserRole>? roles,
        string notificationType,
        string title,
        string body,
        string? url,
        CancellationToken cancellationToken)
    {
        try
        {
            var userIds = await GetEnabledRecipientIdsAsync(
                tenantId,
                roles,
                notificationType,
                "push",
                cancellationToken);
            if (userIds.Count == 0)
                return;

            await _pushService.SendToUsersAsync(
                tenantId,
                userIds,
                title,
                body,
                url,
                cancellationToken);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Web Push 用户定向通知失败: TenantId={TenantId}, Type={Type}",
                tenantId,
                notificationType);
        }
    }

    /// <summary>
    /// 构造租户限定的用户组名称。
    /// </summary>
    private static string GetUserGroupName(Guid tenantId, Guid userId)
        => $"tenant:{tenantId}:user:{userId}";

    /// <summary>
    /// 查询租户内活动收件人并为每个用户创建通知。
    ///
    /// 后台监控和事件处理器通常没有 HttpContext，不能依赖全局租户过滤器；这里始终
    /// 使用显式 tenantId，并且只选择活动用户，避免停用账号继续收到旧租户的运维通知。
    /// </summary>
    private async Task AddUserNotificationsAsync(
        Guid tenantId,
        string type,
        string title,
        string content,
        Guid relatedId,
        string link,
        IReadOnlyCollection<UserRole> roles,
        CancellationToken cancellationToken)
    {
        var roleValues = roles.ToArray();
        var recipientIds = await _db.UnfilteredSet<User>()
            .Where(user => user.TenantId == tenantId
                           && user.IsActive
                           && user.Id != Guid.Empty
                           && roleValues.Contains(user.Role))
            .Select(user => user.Id)
            .ToListAsync(cancellationToken);

        foreach (var userId in recipientIds)
        {
            _db.Notifications.Add(new Notification
            {
                TenantId = tenantId,
                UserId = userId,
                Type = type,
                Title = title,
                Content = content,
                RelatedId = relatedId,
                Link = link,
            });
        }
    }

    /// <inheritdoc />
    public async Task SendAlertTriggeredAsync(Guid tenantId, Guid alertId, string alertCode,
        Guid deviceId, string metric, double value, string severity,
        CancellationToken cancellationToken = default)
    {
        // 告警是运维通知，只发给活动运维用户，并按用户自己的渠道偏好筛选。
        // SignalR/Push 各自隔离，某一通道异常不能阻断另一通道。
        await SendToEnabledUserGroupsAsync(
            tenantId,
            OperationsNotificationRoles,
            "alert",
            "OnAlertTriggered",
            new
            {
                alertId,
                alertCode,
                deviceId,
                metric,
                value,
                severity,
                occurredAt = DateTime.UtcNow,
            },
            cancellationToken);

        await SendPushToEnabledUsersAsync(
            tenantId,
            OperationsNotificationRoles,
            "alert",
            $"告警触发: {metric}",
            $"指标 {metric} 达到 {value}，严重级别: {severity}",
            "/alerts",
            cancellationToken);

    }

    /// <inheritdoc />
    public async Task SendTelemetryUpdateAsync(Guid tenantId, Guid deviceId, string metric, double value,
        CancellationToken cancellationToken = default)
    {
        await _hubContext.Clients.Group($"tenant:{tenantId}")
            .SendAsync("OnTelemetryUpdate", deviceId, metric, value, cancellationToken);
    }

    /// <inheritdoc />
    public async Task SendAlertResolvedAsync(Guid tenantId, Guid alertId,
        CancellationToken cancellationToken = default)
    {
        await SendToEnabledUserGroupsAsync(
            tenantId,
            OperationsNotificationRoles,
            "alert",
            "OnAlertResolved",
            alertId,
            cancellationToken);

        // 通知中心按用户查询，必须为每个活动运维用户展开通知，不能写租户级 Guid.Empty 记录。
        await AddUserNotificationsAsync(
            tenantId,
            "alert",
            "告警解除",
            "告警已解除",
            alertId,
            "/alerts",
            OperationsNotificationRoles,
            cancellationToken);

        await SendPushToEnabledUsersAsync(
            tenantId,
            OperationsNotificationRoles,
            "alert",
            "告警解除",
            $"告警 {alertId} 已解除",
            "/alerts",
            cancellationToken);

        await _db.SaveChangesAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task SendAlertAcknowledgedAsync(Guid tenantId, Guid alertId,
        CancellationToken cancellationToken = default)
    {
        // 轻量推送（仅 SignalR）：告警确认是协作态变化，不产生站内通知/Web Push，
        // 但仍按告警 SignalR 偏好发送，避免关闭实时通知的用户被强制打扰。
        await SendToEnabledUserGroupsAsync(
            tenantId,
            OperationsNotificationRoles,
            "alert",
            "OnAlertAcknowledged",
            new
            {
                alertId,
                acknowledgedAt = DateTime.UtcNow,
            },
            cancellationToken);
    }

    /// <inheritdoc />
    public async Task SendWorkOrderCreatedAsync(Guid tenantId, Guid workOrderId,
        Guid deviceId, string title, string priority,
        CancellationToken cancellationToken = default)
    {
        await SendToEnabledUserGroupsAsync(
            tenantId,
            null,
            "workorder",
            "OnWorkOrderCreated",
            new
            {
                workOrderId,
                deviceId,
                title,
                priority,
                createdAt = DateTime.UtcNow,
            },
            cancellationToken);
    }

    /// <inheritdoc />
    public async Task SendWorkOrderStatusChangedAsync(Guid tenantId, Guid workOrderId,
        string oldStatus, string newStatus,
        CancellationToken cancellationToken = default)
    {
        await SendToEnabledUserGroupsAsync(
            tenantId,
            null,
            "workorder",
            "OnWorkOrderStatusChanged",
            new
            {
                workOrderId,
                oldStatus,
                newStatus,
                changedAt = DateTime.UtcNow,
            },
            cancellationToken);
    }

    /// <inheritdoc />
    public async Task SendWorkOrderAnalysisUpdatedAsync(Guid tenantId, Guid workOrderId,
        CancellationToken cancellationToken = default)
    {
        // 仅 SignalR 推送（轻量）：分析完成是工单详情页的实时更新，非紧急打扰事项，
        // 不持久化通知/不发 Web Push，但仍尊重工单实时通知偏好。
        await SendToEnabledUserGroupsAsync(
            tenantId,
            null,
            "workorder",
            "OnWorkOrderAnalysisUpdated",
            new
            {
                workOrderId,
                updatedAt = DateTime.UtcNow,
            },
            cancellationToken);
    }

    /// <inheritdoc />
    public async Task SendPendingRuleCreatedAsync(Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        // 仅 SignalR 推送（轻量）：候选规则产生是知识库审核列表的实时更新，非紧急打扰事项，
        // 不持久化通知/不发 Web Push，但仍尊重系统通知偏好。
        await SendToEnabledUserGroupsAsync(
            tenantId,
            null,
            "system",
            "OnPendingRuleCreated",
            new { updatedAt = DateTime.UtcNow },
            cancellationToken);
    }

    /// <inheritdoc />
    public async Task SendWorkOrderEscalatedAsync(Guid tenantId, Guid workOrderId,
        string workOrderCode, string title, string oldPriority, string newPriority,
        CancellationToken cancellationToken = default)
    {
        // SLA 升级只通知活动主管，且 SignalR/Push 分别按工单偏好定向投递。
        await SendToEnabledUserGroupsAsync(
            tenantId,
            EscalationNotificationRoles,
            "workorder",
            "OnWorkOrderEscalated",
            new
            {
                workOrderId,
                workOrderCode,
                title,
                oldPriority,
                newPriority,
                escalatedAt = DateTime.UtcNow,
            },
            cancellationToken);

        // 持久化通知（让活动主管登录后看到待处理事项）；按用户展开，避免 Guid.Empty 孤儿记录。
        var notifyTitle = $"⚠️ SLA 超时升级: {workOrderCode}";
        var notifyContent = $"工单《{title}》SLA 已超时，优先级由 {oldPriority} 升级为 {newPriority}，请尽快处理";

        await AddUserNotificationsAsync(
            tenantId,
            "workorder_escalated",
            notifyTitle,
            notifyContent,
            workOrderId,
            $"/work-orders/{workOrderId}",
            EscalationNotificationRoles,
            cancellationToken);

        // Web Push 推送（离线主管也能收到），按主管自己的工单 Push 偏好筛选。
        await SendPushToEnabledUsersAsync(
            tenantId,
            EscalationNotificationRoles,
            "workorder",
            notifyTitle,
            notifyContent,
            $"/work-orders/{workOrderId}",
            cancellationToken);

        await _db.SaveChangesAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task SendDeviceOfflineAsync(Guid tenantId, Guid deviceId, string deviceCode, string deviceName,
        CancellationToken cancellationToken = default)
    {
        await SendToEnabledUserGroupsAsync(
            tenantId,
            OperationsNotificationRoles,
            "alert",
            "OnDeviceStatusChanged",
            new
            {
                deviceId,
                deviceCode,
                deviceName,
                status = "Offline",
                changedAt = DateTime.UtcNow,
            },
            cancellationToken);

        var notifyTitle = $"⚠️ 设备离线: {deviceCode}";
        var notifyContent = $"设备《{deviceName}》（{deviceCode}）已超过阈值无遥测，可能通信中断，请检查";

        await AddUserNotificationsAsync(
            tenantId,
            "device_offline",
            notifyTitle,
            notifyContent,
            deviceId,
            "/devices",
            OperationsNotificationRoles,
            cancellationToken);

        await SendPushToEnabledUsersAsync(
            tenantId,
            OperationsNotificationRoles,
            "alert",
            notifyTitle,
            notifyContent,
            "/devices",
            cancellationToken);

        await _db.SaveChangesAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task SendGatewayOfflineAsync(Guid tenantId, Guid gatewayId, string gatewayCode, string gatewayName,
        CancellationToken cancellationToken = default)
    {
        await SendToEnabledUserGroupsAsync(
            tenantId,
            OperationsNotificationRoles,
            "alert",
            "OnGatewayOffline",
            new
            {
                gatewayId,
                gatewayCode,
                gatewayName,
                changedAt = DateTime.UtcNow,
            },
            cancellationToken);

        var notifyTitle = $"⚠️ 网关离线: {gatewayCode}";
        var notifyContent = $"网关《{gatewayName}》（{gatewayCode}）心跳超时，该网关下设备数据采集已中断，请立即检查";

        await AddUserNotificationsAsync(
            tenantId,
            "gateway_offline",
            notifyTitle,
            notifyContent,
            gatewayId,
            "/gateways",
            OperationsNotificationRoles,
            cancellationToken);

        await SendPushToEnabledUsersAsync(
            tenantId,
            OperationsNotificationRoles,
            "alert",
            notifyTitle,
            notifyContent,
            "/gateways",
            cancellationToken);

        await _db.SaveChangesAsync(cancellationToken);
    }
}
