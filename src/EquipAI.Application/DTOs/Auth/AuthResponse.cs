using EquipAI.Application.DTOs.Users;

namespace EquipAI.Application.DTOs.Auth;

/// <summary>
/// 认证成功响应 DTO，包含 JWT 令牌和用户信息
/// </summary>
public class AuthResponse
{
    /// <summary>
    /// JWT 访问令牌
    /// </summary>
    public string AccessToken { get; set; } = string.Empty;

    /// <summary>
    /// 刷新令牌，用于续期 Access Token
    /// </summary>
    public string RefreshToken { get; set; } = string.Empty;

    /// <summary>
    /// 当前登录用户信息
    /// </summary>
    public UserDto UserInfo { get; set; } = null!;
}
