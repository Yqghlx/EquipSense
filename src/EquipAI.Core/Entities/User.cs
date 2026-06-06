using EquipAI.Core.Enums;

namespace EquipAI.Core.Entities;

/// <summary>
/// 用户实体，关联租户并携带 RBAC 角色信息
/// </summary>
public class User : BaseEntity
{
    /// <summary>
    /// 所属租户 ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 登录用户名（租户内唯一）
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 密码哈希值（BCrypt）
    /// </summary>
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>
    /// 显示名称
    /// </summary>
    public string? DisplayName { get; set; }

    /// <summary>
    /// 用户角色（RBAC 五角色之一）
    /// </summary>
    public UserRole Role { get; set; } = UserRole.Viewer;

    /// <summary>
    /// 技能标签列表（如 ["电气", "液压", "PLC"]），用于智能派工
    /// </summary>
    public List<string> Skills { get; set; } = [];

    /// <summary>
    /// 负责区域/位置列表（如 ["车间A", "产线3"]），用于智能派工
    /// </summary>
    public List<string> Locations { get; set; } = [];

    /// <summary>
    /// 手机号
    /// </summary>
    public string? Phone { get; set; }

    /// <summary>
    /// 邮箱地址
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// 界面语言偏好（默认 zh-CN）
    /// </summary>
    public string Language { get; set; } = "zh-CN";

    /// <summary>
    /// 通知偏好设置（JSONB），控制各类通知渠道开关
    /// </summary>
    public string NotificationPrefs { get; set; } = "{}";

    /// <summary>
    /// JWT Token 版本号，用于主动失效已颁发的令牌
    /// </summary>
    public int TokenVersion { get; set; }

    /// <summary>
    /// 是否需要在下次登录时强制修改密码
    /// </summary>
    public bool MustChangePassword { get; set; }

    /// <summary>
    /// 是否启用
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// 登录连续失败次数，成功后重置为 0
    /// </summary>
    public int AccessFailedCount { get; set; }

    /// <summary>
    /// 账户锁定截止时间（UTC），null 表示未锁定。
    /// 连续失败 5 次后自动锁定 15 分钟
    /// </summary>
    public DateTime? LockoutEnd { get; set; }

    /// <summary>
    /// 最后登录时间（UTC）
    /// </summary>
    public DateTime? LastLoginAt { get; set; }

    // 导航属性

    /// <summary>
    /// 所属租户
    /// </summary>
    public Tenant Tenant { get; set; } = null!;
}
