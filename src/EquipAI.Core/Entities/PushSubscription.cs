namespace EquipAI.Core.Entities;

/// <summary>
/// Web Push 推送订阅实体
/// 存储浏览器端的推送订阅信息（endpoint + keys），用于发送 Web Push 通知
/// 一个用户可以有多个订阅（不同浏览器/设备）
/// </summary>
public class PushSubscription : BaseEntity
{
    /// <summary>
    /// 所属租户 ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 订阅用户 ID
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// 推送端点 URL（由浏览器 Push 服务生成，全局唯一）
    /// </summary>
    public string Endpoint { get; set; } = string.Empty;

    /// <summary>
    /// 客户端加密公钥（P-256 ECDH）
    /// </summary>
    public string P256dh { get; set; } = string.Empty;

    /// <summary>
    /// 认证密钥
    /// </summary>
    public string Auth { get; set; } = string.Empty;

    /// <summary>
    /// 用户代理标识（浏览器/设备信息）
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// 是否启用
    /// </summary>
    public bool IsActive { get; set; } = true;
}
