namespace EquipAI.Core.Interfaces;

/// <summary>
/// 推送通知服务接口
/// 负责管理浏览器推送订阅和发送 Web Push 通知
/// </summary>
public interface IPushNotificationService
{
    /// <summary>
    /// 注册推送订阅（新增或更新）
    /// </summary>
    Task RegisterSubscriptionAsync(Guid tenantId, Guid userId,
        string endpoint, string p256dh, string auth, string? userAgent = null);

    /// <summary>
    /// 注销推送订阅
    /// </summary>
    Task UnregisterSubscriptionAsync(Guid userId, string endpoint);

    /// <summary>
    /// 向指定用户的所有订阅发送推送通知
    /// </summary>
    Task SendToUserAsync(Guid tenantId, Guid userId, string title, string body, string? url = null);

    /// <summary>
    /// 向指定租户内多个用户的所有活动订阅发送推送通知
    /// </summary>
    Task SendToUsersAsync(Guid tenantId, IReadOnlyCollection<Guid> userIds,
        string title, string body, string? url = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// 向指定租户的所有订阅发送推送通知（广播）
    /// </summary>
    Task SendToTenantAsync(Guid tenantId, string title, string body, string? url = null,
        CancellationToken cancellationToken = default);
}
