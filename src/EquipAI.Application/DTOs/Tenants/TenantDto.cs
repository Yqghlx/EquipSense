namespace EquipAI.Application.DTOs.Tenants;

/// <summary>
/// 租户信息 DTO，用于 API 响应中的租户数据
/// </summary>
public class TenantDto
{
    /// <summary>
    /// 租户唯一标识
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// 租户名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 租户标识（URL Slug），用于子域名路由
    /// </summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>
    /// 套餐等级名称（如 Trial、Basic、Professional、Enterprise）
    /// </summary>
    public string Plan { get; set; } = string.Empty;

    /// <summary>
    /// 最大允许设备数
    /// </summary>
    public int MaxDevices { get; set; }

    /// <summary>
    /// 最大允许用户数
    /// </summary>
    public int MaxUsers { get; set; }

    /// <summary>
    /// 是否启用
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// 创建时间（UTC）
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 租户状态名称
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// 当前设备数量
    /// </summary>
    public int CurrentDeviceCount { get; set; }

    /// <summary>
    /// 当前用户数量
    /// </summary>
    public int CurrentUserCount { get; set; }

    /// <summary>
    /// 试用期截止时间
    /// </summary>
    public DateTime? TrialEndsAt { get; set; }

    /// <summary>
    /// 订阅到期时间
    /// </summary>
    public DateTime? SubscriptionEndsAt { get; set; }

    /// <summary>
    /// 数据保留天数
    /// </summary>
    public int DataRetentionDays { get; set; }
}
