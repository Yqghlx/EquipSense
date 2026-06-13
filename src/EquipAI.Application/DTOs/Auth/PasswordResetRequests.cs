using System.ComponentModel.DataAnnotations;

namespace EquipAI.Application.DTOs.Auth;

/// <summary>
/// 忘记密码请求 DTO — 提交邮箱申请密码重置
/// </summary>
public class ForgotPasswordRequest
{
    /// <summary>
    /// 用户注册邮箱
    /// </summary>
    [Required(ErrorMessage = "邮箱不能为空")]
    [EmailAddress(ErrorMessage = "邮箱格式不正确")]
    public string Email { get; set; } = string.Empty;
}

/// <summary>
/// 重置密码请求 DTO — 使用重置 token 设置新密码
/// </summary>
public class ResetPasswordRequest
{
    /// <summary>
    /// 密码重置 token（来自邮件链接）
    /// </summary>
    [Required(ErrorMessage = "重置令牌不能为空")]
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// 新密码（至少 8 位）
    /// </summary>
    [Required(ErrorMessage = "新密码不能为空")]
    [MinLength(8, ErrorMessage = "新密码长度不能少于 8 位")]
    public string NewPassword { get; set; } = string.Empty;
}
