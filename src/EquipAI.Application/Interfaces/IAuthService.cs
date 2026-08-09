using EquipAI.Application.DTOs.Auth;
using EquipAI.Application.DTOs.Users;

namespace EquipAI.Application.Interfaces;

/// <summary>
/// 认证服务接口，提供登录、令牌刷新、登出和修改密码等能力
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// 用户登录，验证凭据并返回 JWT 令牌
    /// </summary>
    /// <param name="request">登录请求（用户名 + 密码）</param>
    /// <returns>认证响应（含 Access Token、Refresh Token 和用户信息）</returns>
    Task<AuthResponse> LoginAsync(LoginRequest request);

    /// <summary>
    /// 使用 Refresh Token 刷新 Access Token
    /// </summary>
    /// <param name="refreshToken">刷新令牌</param>
    /// <returns>新的认证响应</returns>
    Task<AuthResponse> RefreshTokenAsync(string refreshToken);

    /// <summary>
    /// 用户登出，使当前 Token 失效
    /// </summary>
    /// <param name="userId">用户 ID</param>
    Task LogoutAsync(Guid userId);

    /// <summary>
    /// 修改密码
    /// </summary>
    /// <param name="userId">用户 ID</param>
    /// <param name="request">修改密码请求（当前密码 + 新密码）</param>
    Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request);

    /// <summary>
    /// 申请密码重置 — 按邮箱查找用户并发送重置链接邮件
    /// </summary>
    /// <param name="email">用户邮箱</param>
    /// <param name="resetUrlTemplate">重置链接模板，{token} 会被替换为实际 token</param>
    /// <param name="ct">取消令牌</param>
    Task RequestPasswordResetAsync(string email, string resetUrlTemplate, CancellationToken ct = default);

    /// <summary>
    /// 重置密码 — 验证 token 并设置新密码
    /// </summary>
    /// <param name="token">重置 token</param>
    /// <param name="newPassword">新密码</param>
    /// <param name="ct">取消令牌</param>
    Task ResetPasswordAsync(string token, string newPassword, CancellationToken ct = default);

    /// <summary>
    /// 公开注册，创建租户和管理员账户并自动登录
    /// </summary>
    /// <param name="request">注册请求（含企业信息和管理员信息）</param>
    /// <returns>认证响应（含 Access Token、Refresh Token 和用户信息）</returns>
    /// <exception cref="InvalidOperationException">企业标识或用户名已被占用</exception>
    Task<AuthResponse> RegisterAsync(RegisterRequest request);

    /// <summary>
    /// 获取所有可用套餐列表
    /// </summary>
    /// <returns>套餐信息列表</returns>
    Task<List<PlanDto>> GetPlansAsync();

    /// <summary>
    /// 验证 MFA 挑战令牌和 TOTP 验证码，完成登录
    /// 仅当 LoginAsync 返回 MfaRequired=true 时调用
    /// </summary>
    /// <param name="challengeToken">LoginAsync 返回的 MFA 挑战令牌</param>
    /// <param name="totpCode">用户 authenticator 应用生成的 6 位数字验证码</param>
    /// <returns>完整的认证响应（含 Access Token、Refresh Token）</returns>
    /// <exception cref="UnauthorizedAccessException">挑战令牌无效或验证码错误</exception>
    Task<AuthResponse> VerifyMfaAsync(string challengeToken, string totpCode);

    /// <summary>
    /// 使用首次登录注册令牌初始化强制 MFA 设置。
    /// </summary>
    /// <param name="enrollmentToken">密码验证后签发的短期 MFA 注册令牌。</param>
    /// <returns>临时 TOTP 密钥和 QR 码 URI。</returns>
    Task<MfaSetupResponse> SetupMfaEnrollmentAsync(string enrollmentToken);

    /// <summary>
    /// 使用首次登录注册令牌确认 MFA，并完成登录。
    /// </summary>
    /// <param name="enrollmentToken">密码验证后签发的短期 MFA 注册令牌。</param>
    /// <param name="totpCode">Authenticator 生成的 6 位验证码。</param>
    /// <returns>完整的认证响应（含 Access Token、Refresh Token 和一次性恢复码）。</returns>
    Task<AuthResponse> ConfirmMfaEnrollmentAsync(string enrollmentToken, string totpCode);

    /// <summary>
    /// 初始化 MFA 设置：生成 TOTP 密钥和 QR 码 URI
    /// 此阶段仅生成临时密钥（存 Redis），不写入数据库；用户需调用 ConfirmMfaSetupAsync 确认启用
    /// </summary>
    /// <param name="userId">目标用户 ID</param>
    /// <returns>包含临时密钥、QR 码 URI 的响应（前端展示 QR 码供 authenticator 扫描）</returns>
    Task<MfaSetupResponse> SetupMfaAsync(Guid userId);

    /// <summary>
    /// 确认 MFA 设置：用户用 authenticator 扫码后提供验证码，验证通过后将密钥正式写入用户记录
    /// </summary>
    /// <param name="userId">目标用户 ID</param>
    /// <param name="totpCode">authenticator 生成的验证码（用于首次验证密钥正确性）</param>
    /// <exception cref="UnauthorizedAccessException">临时密钥不存在或验证码错误</exception>
    Task<MfaRecoveryCodesResponse> ConfirmMfaSetupAsync(Guid userId, string totpCode);

    /// <summary>
    /// 使用当前 TOTP 验证码重新生成一次性 MFA 恢复码。
    /// </summary>
    /// <param name="userId">当前用户 ID。</param>
    /// <param name="totpCode">当前 authenticator 生成的验证码。</param>
    /// <returns>仅本次返回的明文恢复码。</returns>
    Task<MfaRecoveryCodesResponse> RegenerateMfaRecoveryCodesAsync(Guid userId, string totpCode);

    /// <summary>
    /// 禁用 MFA：普通角色清除用户的 TOTP 密钥并标记 MfaEnabled=false；生产强制角色会被拒绝
    /// </summary>
    /// <param name="userId">目标用户 ID</param>
    Task DisableMfaAsync(Guid userId);
}

/// <summary>
/// MFA 初始化响应 DTO
/// </summary>
public class MfaSetupResponse
{
    /// <summary>
    /// Base32 编码的 TOTP 密钥（用户可在 authenticator 中手动输入）
    /// </summary>
    public string Secret { get; set; } = string.Empty;

    /// <summary>
    /// otpauth:// URI（前端生成 QR 码图片供 authenticator 扫描）
    /// </summary>
    public string QrCodeUri { get; set; } = string.Empty;
}
