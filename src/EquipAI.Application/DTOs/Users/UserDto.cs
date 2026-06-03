namespace EquipAI.Application.DTOs.Users;

/// <summary>
/// 用户信息 DTO，用于 API 响应和认证结果中的用户数据
/// </summary>
public class UserDto
{
    /// <summary>
    /// 用户唯一标识
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// 登录用户名
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 显示名称
    /// </summary>
    public string? DisplayName { get; set; }

    /// <summary>
    /// 用户角色名称（如 SystemAdmin、MaintenanceLead 等）
    /// </summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>
    /// 邮箱地址
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// 手机号
    /// </summary>
    public string? Phone { get; set; }

    /// <summary>
    /// 是否启用
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// 创建时间（UTC）
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 是否需要在下次登录时强制修改密码
    /// </summary>
    public bool MustChangePassword { get; set; }
}
