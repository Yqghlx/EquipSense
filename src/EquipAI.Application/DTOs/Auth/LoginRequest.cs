using System.ComponentModel.DataAnnotations;

namespace EquipAI.Application.DTOs.Auth;

/// <summary>
/// 登录请求 DTO
/// </summary>
public class LoginRequest
{
    /// <summary>
    /// 登录用户名
    /// </summary>
    [Required(ErrorMessage = "用户名不能为空")]
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 登录密码
    /// </summary>
    [Required(ErrorMessage = "密码不能为空")]
    public string Password { get; set; } = string.Empty;
}
