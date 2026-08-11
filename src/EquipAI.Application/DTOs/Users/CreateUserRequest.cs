using System.ComponentModel.DataAnnotations;

namespace EquipAI.Application.DTOs.Users;

/// <summary>
/// 创建用户请求 DTO
/// </summary>
public class CreateUserRequest
{
    /// <summary>
    /// 登录用户名（全局唯一；登录请求不携带租户标识）
    /// </summary>
    [Required(ErrorMessage = "用户名不能为空")]
    [StringLength(50, ErrorMessage = "用户名长度不能超过 50 个字符")]
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 登录密码（至少 8 位）
    /// </summary>
    [Required(ErrorMessage = "密码不能为空")]
    [MinLength(8, ErrorMessage = "密码长度不能少于 8 位")]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// 显示名称
    /// </summary>
    [StringLength(100, ErrorMessage = "显示名称长度不能超过 100 个字符")]
    public string? DisplayName { get; set; }

    /// <summary>
    /// 用户角色（默认 viewer）
    /// </summary>
    public string Role { get; set; } = "viewer";

    /// <summary>
    /// 邮箱地址
    /// </summary>
    [EmailAddress(ErrorMessage = "邮箱格式不正确")]
    [StringLength(254, ErrorMessage = "邮箱长度不能超过 254 个字符")]
    public string? Email { get; set; }

    /// <summary>
    /// 手机号
    /// </summary>
    [StringLength(32, ErrorMessage = "手机号长度不能超过 32 个字符")]
    public string? Phone { get; set; }
}
