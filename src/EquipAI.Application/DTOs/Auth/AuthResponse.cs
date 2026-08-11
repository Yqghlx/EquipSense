using System.Text.Json.Serialization;
using EquipAI.Application.DTOs.Users;

namespace EquipAI.Application.DTOs.Auth;

/// <summary>
/// 认证成功响应 DTO
///
/// v1.4.0 安全策略：
///   - Token 通过 HttpOnly + SameSite=Strict + Secure Cookie 传递（浏览器主路径）
///   - Production 浏览器响应会清空 AccessToken / RefreshToken 字段，避免页面脚本或日志获得 JWT
///   - 机器客户端必须使用独立的 X-API-Key 请求头，才能读取响应体令牌
///   - Development/Testing 保留响应体令牌，便于本地联调和测试契约兼容
/// </summary>
public class AuthResponse
{
    /// <summary>
    /// JWT 访问令牌
    /// Production 浏览器请求下为空；携带有效机器客户端 API Key 时返回真实令牌
    /// </summary>
    public string AccessToken { get; set; } = string.Empty;

    /// <summary>
    /// 访问令牌剩余有效时间（秒），前端据此主动续期
    /// 默认 15 分钟 = 900 秒（与 JwtTokenService.AccessTokenMinutes 同源，AuthService 颁发时覆盖）
    /// </summary>
    public int ExpiresIn { get; set; } = 900;

    /// <summary>
    /// 刷新令牌，用于续期 Access Token
    /// Production 浏览器请求下为空；携带有效机器客户端 API Key 时返回真实令牌
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

    /// <summary>
    /// 是否必须先完成 MFA 注册。
    /// 为 true 时不颁发 JWT，客户端需使用 MfaEnrollmentToken 完成首次 MFA 配置。
    /// </summary>
    public bool MfaEnrollmentRequired { get; set; }

    /// <summary>
    /// MFA 首次注册令牌（MfaEnrollmentRequired=true 时返回）。
    /// 令牌仅存活 10 分钟，完成注册后立即失效。
    /// </summary>
    public string? MfaEnrollmentToken { get; set; }

    /// <summary>
    /// MFA 注册成功时返回的一次性恢复码。
    /// 仅在注册或重新生成当次响应返回，客户端应立即保存，服务端只存摘要。
    /// </summary>
    public List<string>? MfaRecoveryCodes { get; set; }
}
