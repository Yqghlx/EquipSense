namespace EquipAI.Application.DTOs.Users;

/// <summary>
/// 更新用户请求 DTO（仅允许修改非敏感字段）
/// </summary>
public class UpdateUserRequest
{
    /// <summary>
    /// 显示名称
    /// </summary>
    public string? DisplayName { get; set; }

    /// <summary>
    /// 邮箱地址
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// 手机号
    /// </summary>
    public string? Phone { get; set; }
}
