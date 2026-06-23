namespace EquipAI.Core.Interfaces;

/// <summary>
/// SignalR 实时推送服务接口
/// 定义告警和遥测数据的实时推送能力
/// </summary>
public interface ISignalRNotificationService
{
    /// <summary>
    /// 推送告警触发事件到租户组
    /// </summary>
    Task SendAlertTriggeredAsync(Guid tenantId, Guid alertId, string alertCode,
        Guid deviceId, string metric, double value, string severity);

    /// <summary>
    /// 推送遥测数据更新到租户组
    /// </summary>
    Task SendTelemetryUpdateAsync(Guid tenantId, Guid deviceId, string metric, double value);

    /// <summary>
    /// 推送告警解决事件到租户组
    /// </summary>
    Task SendAlertResolvedAsync(Guid tenantId, Guid alertId);

    /// <summary>
    /// 推送工单创建事件到租户组
    /// </summary>
    Task SendWorkOrderCreatedAsync(Guid tenantId, Guid workOrderId, Guid deviceId,
        string title, string priority);

    /// <summary>
    /// 推送工单状态变更事件到租户组
    /// </summary>
    Task SendWorkOrderStatusChangedAsync(Guid tenantId, Guid workOrderId,
        string oldStatus, string newStatus);

    /// <summary>
    /// 推送工单 SLA 超时升级事件到租户组
    ///
    /// 业务意义：SLA 超时后系统自动升级优先级，但如果不通知，主管完全不知情。
    /// 此方法确保主管收到推送 + 持久化通知 + Web Push（即使离线也能看到）。
    /// </summary>
    /// <param name="oldPriority">升级前优先级</param>
    /// <param name="newPriority">升级后优先级</param>
    Task SendWorkOrderEscalatedAsync(Guid tenantId, Guid workOrderId, string workOrderCode,
        string title, string oldPriority, string newPriority);
}
