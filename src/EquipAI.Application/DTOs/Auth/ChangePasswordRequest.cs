using System.ComponentModel.DataAnnotations;

namespace EquipAI.Application.DTOs.Auth;

/// <summary>
/// 修改密码请求 DTO
/// </summary>
public class ChangePasswordRequest
{
    /// <summary>
    /// 当前密码
    /// </summary>
    [Required(ErrorMessage = "当前密码不能为空")]
    public string CurrentPassword { get; set; } = string.Empty;

    /// <summary>
    /// 新密码（至少 8 位）
    /// </summary>
    [Required(ErrorMessage = "新密码不能为空")]
    [MinLength(8, ErrorMessage = "新密码长度不能少于 8 位")]
    public string NewPassword { get; set; } = string.Empty;
}
