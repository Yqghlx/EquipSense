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
    /// 访问令牌剩余有效时间（秒），前端据此主动续期
    /// 默认 24 小时 = 86400 秒
    /// </summary>
    public int ExpiresIn { get; set; } = 86400;

    /// <summary>
    /// 刷新令牌，用于续期 Access Token
    /// </summary>
    public string RefreshToken { get; set; } = string.Empty;

    /// <summary>
    /// 当前登录用户信息
    /// </summary>
    public UserDto UserInfo { get; set; } = null!;

    /// <summary>
    /// 是否需要 MFA 二次验证
    /// 为 true 时，AccessToken / RefreshToken 均为空，客户端需调用 /auth/mfa/verify 完成登录
    /// </summary>
    public bool MfaRequired { get; set; }

    /// <summary>
    /// MFA 挑战令牌（MfaRequired=true 时返回）
    /// 客户端在 /auth/mfa/verify 请求体中携带此值，后端从 Redis 中解析对应的用户 ID
    /// 有效期 5 分钟，单次使用，防止重放攻击
    /// </summary>
    public string? MfaChallengeToken { get; set; }
}
