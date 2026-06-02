using System.ComponentModel.DataAnnotations;

namespace EquipAI.Application.DTOs.Auth;

/// <summary>
/// 公开注册请求 DTO，用于新企业自助注册
/// 同时创建租户和管理员账户，并自动登录返回 JWT
/// </summary>
public class RegisterRequest
{
    /// <summary>企业名称</summary>
    [Required(ErrorMessage = "企业名称不能为空")]
    [StringLength(200)]
    public string TenantName { get; set; } = string.Empty;

    /// <summary>企业标识（URL Slug），全局唯一</summary>
    [Required(ErrorMessage = "企业标识不能为空")]
    [StringLength(50)]
    [RegularExpression(@"^[a-z0-9][a-z0-9\-]*[a-z0-9]$",
        ErrorMessage = "企业标识只能包含小写字母、数字和连字符")]
    public string Slug { get; set; } = string.Empty;

    /// <summary>管理员登录用户名</summary>
    [Required(ErrorMessage = "用户名不能为空")]
    [StringLength(50)]
    public string Username { get; set; } = string.Empty;

    /// <summary>管理员密码（至少 8 位，含大小写字母和数字）</summary>
    [Required(ErrorMessage = "密码不能为空")]
    [StringLength(100, MinimumLength = 8)]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$",
        ErrorMessage = "密码需包含大小写字母和数字")]
    public string Password { get; set; } = string.Empty;

    /// <summary>管理员显示名称</summary>
    [StringLength(100)]
    public string? DisplayName { get; set; }

    /// <summary>管理员邮箱</summary>
    [EmailAddress(ErrorMessage = "邮箱格式不正确")]
    public string? Email { get; set; }

    /// <summary>选择的套餐（Trial/Professional/Enterprise），默认 Trial</summary>
    public string Plan { get; set; } = "Trial";
}
