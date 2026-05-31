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
}
