using System.ComponentModel.DataAnnotations;

namespace EquipAI.Application.DTOs.Users;

/// <summary>
/// 更新用户请求 DTO（仅允许修改非敏感字段）
/// </summary>
public class UpdateUserRequest
{
    /// <summary>
    /// 显示名称
    /// </summary>
    [StringLength(100, ErrorMessage = "显示名称长度不能超过 100 个字符")]
    public string? DisplayName { get; set; }

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
