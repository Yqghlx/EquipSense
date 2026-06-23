using System.Text.Json.Serialization;
using EquipAI.Application.DTOs.Users;

namespace EquipAI.Application.DTOs.Auth;

/// <summary>
/// 认证成功响应 DTO
///
/// v1.3.0 安全策略（折衷方案）：
///   - Token 通过 HttpOnly + SameSite=Strict + Secure Cookie 传递（浏览器主路径）
///   - 响应体仍包含 AccessToken / RefreshToken 字段：
///     * 兼容机器客户端（k6 压测脚本 / Simulator 等）
///     * 浏览器前端已不再依赖响应体 token（不存 sessionStorage）
///   - 前端 sessionStorage 只存 user 信息（XSS 偷不到 token）
///
/// 进一步强化（v1.4 候选）：可拆分为 /auth/login（浏览器，无 token 响应体）
/// 和 /auth/machine-login（机器客户端，需 X-API-Key，返回 token）。
/// </summary>
public class AuthResponse
{
    /// <summary>
    /// JWT 访问令牌
    /// 浏览器前端不读取此字段（依赖 Cookie），机器客户端可直接使用
    /// </summary>
    public string AccessToken { get; set; } = string.Empty;

    /// <summary>
    /// 访问令牌剩余有效时间（秒），前端据此主动续期
    /// 默认 15 分钟 = 900 秒（与 JwtTokenService.AccessTokenMinutes 同源，AuthService 颁发时覆盖）
    /// </summary>
    public int ExpiresIn { get; set; } = 900;

    /// <summary>
    /// 刷新令牌，用于续期 Access Token
    /// 浏览器前端不读取此字段（依赖 HttpOnly Cookie），机器客户端可直接使用
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
