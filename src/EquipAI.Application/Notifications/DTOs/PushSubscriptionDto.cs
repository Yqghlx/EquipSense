namespace EquipAI.Application.Notifications.DTOs;

/// <summary>
/// 注册推送订阅请求
/// </summary>
public record RegisterPushSubscriptionRequest
{
    /// <summary>推送端点 URL</summary>
    public string Endpoint { get; init; } = string.Empty;

    /// <summary>客户端加密公钥</summary>
    public string P256dh { get; init; } = string.Empty;

    /// <summary>认证密钥</summary>
    public string Auth { get; init; } = string.Empty;
}
