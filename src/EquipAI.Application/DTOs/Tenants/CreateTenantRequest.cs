using System.ComponentModel.DataAnnotations;

namespace EquipAI.Application.DTOs.Tenants;

/// <summary>
/// 创建租户请求 DTO
/// </summary>
public class CreateTenantRequest
{
    /// <summary>
    /// 租户名称
    /// </summary>
    [Required(ErrorMessage = "租户名称不能为空")]
    [StringLength(200, ErrorMessage = "租户名称长度不能超过 200 个字符")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 租户标识（URL Slug），用于子域名路由
    /// </summary>
    [Required(ErrorMessage = "租户标识不能为空")]
    [StringLength(50, ErrorMessage = "租户标识长度不能超过 50 个字符")]
    public string Slug { get; set; } = string.Empty;

    /// <summary>
    /// 套餐等级（默认 basic）
    /// </summary>
    public string Plan { get; set; } = "basic";

    /// <summary>
    /// 最大允许设备数（默认 50）
    /// </summary>
    public int MaxDevices { get; set; } = 50;

    /// <summary>
    /// 最大允许用户数（默认 20）
    /// </summary>
    public int MaxUsers { get; set; } = 20;
}
