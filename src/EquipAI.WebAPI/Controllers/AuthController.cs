using System.Security.Claims;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Application.DTOs.Users;
using EquipAI.Application.Interfaces;
using EquipAI.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.RateLimiting;
using EquipAI.WebAPI.Middleware;
using EquipAI.WebAPI.Security;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 认证控制器，提供登录、令牌刷新、登出和修改密码等接口
/// 登录和刷新接口无需 JWT；浏览器认证使用 HttpOnly Cookie，机器客户端响应体令牌需要 X-API-Key。
/// </summary>
[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IRepository<EquipAI.Core.Entities.User> _userRepo;
    private readonly AuthResponsePolicy _authResponsePolicy;

    /// <summary>
    /// 初始化认证控制器
    /// </summary>
    /// <param name="authService">认证服务</param>
    /// <param name="userRepo">用户仓储</param>
    /// <param name="authResponsePolicy">认证响应令牌暴露策略</param>
    public AuthController(
        IAuthService authService,
        IRepository<EquipAI.Core.Entities.User> userRepo,
        AuthResponsePolicy authResponsePolicy)
    {
        _authService = authService;
        _userRepo = userRepo;
        _authResponsePolicy = authResponsePolicy;
    }

    /// <summary>
    /// 用户登录，验证凭据并返回 JWT 令牌
    /// </summary>
    /// <param name="request">登录请求（用户名 + 密码）</param>
    /// <returns>认证响应；Production 浏览器请求只通过 Cookie 建立会话</returns>
    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    [Audit("Login", "User")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var response = await _authService.LoginAsync(request);
        SetAuthCookies(response.AccessToken, response.RefreshToken, response.ExpiresIn);
        return Ok(PrepareAuthResponse(response));
    }

    /// <summary>
    /// 公开注册，创建租户和管理员账户并自动登录
    /// </summary>
    /// <param name="request">注册请求（含企业信息和管理员信息）</param>
    /// <returns>认证响应和用户信息；Production 浏览器请求只通过 Cookie 建立会话</returns>
    [HttpPost("register")]
    [Audit("Register", "Tenant")]    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var response = await _authService.RegisterAsync(request);
            SetAuthCookies(response.AccessToken, response.RefreshToken, response.ExpiresIn);
            return Ok(PrepareAuthResponse(response));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { code = 400, message = ex.Message });
        }
    }

    /// <summary>
    /// 获取所有可用套餐列表，用于注册页面展示
    /// </summary>
    /// <returns>套餐信息列表</returns>
    [HttpGet("plans")]
    [ProducesResponseType(typeof(List<PlanDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<PlanDto>>> GetPlans()
    {
        var plans = await _authService.GetPlansAsync();
        return Ok(plans);
    }

    /// <summary>
    /// 使用 Refresh Token 刷新 Access Token
    ///
    /// Refresh Token 来源优先级：
    ///   1. 请求体 refreshToken 字段（前端主动续期 Hook 使用，token 可读时传入）
    ///   2. HttpOnly Cookie（401 拦截器无法读取 HttpOnly cookie，降级为此路径，浏览器自动携带）
    /// </summary>
    /// <param name="request">刷新令牌请求（body 可空）</param>
    /// <returns>新的认证响应</returns>
    [HttpPost("refresh")]
    [EnableRateLimiting("auth")]
    [SkipAudit] // 刷新令牌高频，不审计（登录已记录）
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> Refresh(
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] RefreshTokenRequest? request)
    {
        // 优先用请求体中的 token，其次从 HttpOnly Cookie 中读取（前端无法访问 HttpOnly cookie 时降级）
        var refreshToken = !string.IsNullOrWhiteSpace(request?.RefreshToken)
            ? request.RefreshToken
            : Request.Cookies["refresh_token"];

        var response = await _authService.RefreshTokenAsync(refreshToken ?? string.Empty);
        // 刷新令牌对：同时更新 Cookie；响应体令牌仅对显式机器客户端返回，浏览器仍可读取 expiresIn。
        SetAuthCookies(response.AccessToken, response.RefreshToken, response.ExpiresIn);
        return Ok(PrepareAuthResponse(response));
    }

    /// <summary>
    /// 用户登出，使当前 Token 失效
    /// </summary>
    [HttpPost("logout")]
    [Audit("Logout", "User")]    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Logout()
    {
        // 从 JWT Claims 中提取用户 ID
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
            ?? User.FindFirst("sub");

        if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
        {
            var sessionId = User.FindFirst("sid")?.Value;
            await _authService.LogoutAsync(userId, sessionId);
        }

        // 清除认证 Cookie（无论登出是否成功都清除，避免残留）
        ClearAuthCookies();

        return Ok(new { message = "登出成功" });
    }

    /// <summary>
    /// 修改密码，验证当前密码后设置新密码并刷新当前浏览器会话
    /// </summary>
    /// <param name="request">修改密码请求（当前密码 + 新密码）</param>
    [HttpPost("change-password")]
    [Audit("ChangePassword", "User")]    [Authorize]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        // 从 JWT Claims 中提取用户 ID
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
            ?? User.FindFirst("sub");

        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            return Unauthorized(new { code = 401, message = "无法识别用户身份" });
        }

        var response = await _authService.ChangePasswordAsync(userId, request);
        // 密码修改会吊销旧刷新令牌；为避免用户完成改密后被迫再次登录，
        // 服务端为当前会话签发了新的令牌对并同步更新 HttpOnly Cookie。
        SetAuthCookies(response.AccessToken, response.RefreshToken, response.ExpiresIn);
        return Ok(PrepareAuthResponse(response));
    }

    /// <summary>
    /// 忘记密码 — 申请密码重置，发送重置链接到用户邮箱
    /// 无论邮箱是否存在都返回成功（防止邮箱枚举攻击）
    /// </summary>
    /// <param name="request">邮箱</param>
    /// <param name="ct">取消令牌</param>
    [HttpPost("forgot-password")]
    [EnableRateLimiting("auth")]
    [SkipAudit] // 未认证请求，无用户上下文，且审计在 Service 内已记录
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken ct)
    {
        // 重置链接前端路由：/reset-password?token=xxx
        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        var resetUrlTemplate = $"{baseUrl}/reset-password?token={{token}}";

        await _authService.RequestPasswordResetAsync(request.Email, resetUrlTemplate, ct);
        return Ok(new { message = "如果该邮箱已注册，重置链接已发送至您的邮箱" });
    }

    /// <summary>
    /// 重置密码 — 使用重置 token 设置新密码
    /// </summary>
    /// <param name="request">重置 token + 新密码</param>
    /// <param name="ct">取消令牌</param>
    [HttpPost("reset-password")]
    [EnableRateLimiting("auth")]
    [Audit("PasswordReset", "User")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken ct)
    {
        try
        {
            await _authService.ResetPasswordAsync(request.Token, request.NewPassword, ct);
            return Ok(new { message = "密码重置成功，请使用新密码登录" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return BadRequest(new { code = 400, message = ex.Message });
        }
    }

    /// <summary>
    /// 验证 MFA 挑战令牌和 TOTP 验证码，完成登录
    /// 仅在 Login 返回 MfaRequired=true 时调用
    /// </summary>
    /// <param name="request">MFA 验证请求（挑战令牌 + 6 位验证码）</param>
    [HttpPost("mfa/verify")]
    [EnableRateLimiting("auth")]
    [SkipAudit] // 验证过程在 AuthService 内部记录审计
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> VerifyMfa([FromBody] MfaVerifyRequest request)
    {
        try
        {
            var response = await _authService.VerifyMfaAsync(request.ChallengeToken, request.TotpCode);
            SetAuthCookies(response.AccessToken, response.RefreshToken, response.ExpiresIn);
            return Ok(PrepareAuthResponse(response));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { code = 401, message = ex.Message });
        }
    }

    /// <summary>
    /// 初始化首次登录的强制 MFA 设置。
    /// 该接口仅接受密码验证阶段签发的短期注册令牌，不会授予业务访问权限。
    /// </summary>
    /// <param name="request">MFA 注册令牌请求。</param>
    [HttpPost("mfa/enroll/setup")]
    [EnableRateLimiting("auth")]
    [SkipAudit]
    [ProducesResponseType(typeof(MfaSetupResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<MfaSetupResponse>> SetupMfaEnrollment([FromBody] MfaEnrollmentRequest request)
    {
        try
        {
            var response = await _authService.SetupMfaEnrollmentAsync(request.EnrollmentToken);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { code = 401, message = ex.Message });
        }
    }

    /// <summary>
    /// 确认首次登录的强制 MFA 设置并完成登录。
    /// </summary>
    /// <param name="request">MFA 注册令牌和 TOTP 验证码。</param>
    [HttpPost("mfa/enroll/confirm")]
    [EnableRateLimiting("auth")]
    [SkipAudit]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> ConfirmMfaEnrollment([FromBody] MfaEnrollmentConfirmRequest request)
    {
        try
        {
            var response = await _authService.ConfirmMfaEnrollmentAsync(
                request.EnrollmentToken,
                request.TotpCode);
            SetAuthCookies(response.AccessToken, response.RefreshToken, response.ExpiresIn);
            return Ok(PrepareAuthResponse(response));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { code = 401, message = ex.Message });
        }
    }

    /// <summary>
    /// 初始化 MFA 设置：生成 TOTP 密钥和 QR 码 URI
    /// 前端根据 QrCodeUri 生成 QR 码图片，用户用 authenticator 应用扫描
    /// </summary>
    [HttpPost("mfa/setup")]
    [Authorize]
    [Audit("MfaSetup", "User")]
    [ProducesResponseType(typeof(MfaSetupResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<MfaSetupResponse>> SetupMfa()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
            ?? User.FindFirst("sub");

        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            return Unauthorized(new { code = 401, message = "无法识别用户身份" });
        }

        var response = await _authService.SetupMfaAsync(userId);
        return Ok(response);
    }

    /// <summary>
    /// 确认 MFA 设置：用户扫码后输入验证码，验证通过后正式启用 MFA
    /// </summary>
    /// <param name="request">MFA 确认请求（6 位验证码）</param>
    [HttpPost("mfa/confirm")]
    [Authorize]
    [Audit("MfaConfirm", "User")]
    [ProducesResponseType(typeof(MfaRecoveryCodesResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ConfirmMfa([FromBody] MfaConfirmRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
            ?? User.FindFirst("sub");

        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            return Unauthorized(new { code = 401, message = "无法识别用户身份" });
        }

        try
        {
            var response = await _authService.ConfirmMfaSetupAsync(userId, request.TotpCode);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return BadRequest(new { code = 400, message = ex.Message });
        }
    }

    /// <summary>
    /// 使用当前 TOTP 验证码重新生成一次性 MFA 恢复码。
    /// 旧恢复码会立即失效，明文仅在本次响应返回。
    /// </summary>
    [HttpPost("mfa/recovery-codes/regenerate")]
    [Authorize]
    [Audit("MfaRecoveryCodesRegenerate", "User")]
    [ProducesResponseType(typeof(MfaRecoveryCodesResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<MfaRecoveryCodesResponse>> RegenerateMfaRecoveryCodes(
        [FromBody] MfaRecoveryCodesRegenerateRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
            ?? User.FindFirst("sub");

        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            return Unauthorized(new { code = 401, message = "无法识别用户身份" });
        }

        try
        {
            var response = await _authService.RegenerateMfaRecoveryCodesAsync(userId, request.TotpCode);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { code = 401, message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { code = 400, message = ex.Message });
        }
    }

    /// <summary>
    /// 禁用 MFA：普通角色清除用户的 TOTP 密钥；生产强制角色会被拒绝
    /// </summary>
    [HttpPost("mfa/disable")]
    [Authorize]
    [Audit("MfaDisable", "User")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DisableMfa()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
            ?? User.FindFirst("sub");

        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            return Unauthorized(new { code = 401, message = "无法识别用户身份" });
        }

        try
        {
            await _authService.DisableMfaAsync(userId);
            return Ok(new { message = "MFA 已成功禁用" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { code = 400, message = ex.Message });
        }
    }

    /// <summary>
    /// 获取当前登录用户信息
    /// </summary>
    /// <returns>当前用户信息</returns>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
            ?? User.FindFirst("sub");

        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            return Unauthorized(new { code = 401, message = "无法识别用户身份" });
        }

        var user = await _userRepo.GetByIdAsync(userId);
        if (user == null)
        {
            return NotFound(new { code = 404, message = "用户不存在" });
        }

        return Ok(new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            TenantId = user.TenantId,
            DisplayName = user.DisplayName,
            Role = user.Role.ToString(),
            Email = user.Email,
            Phone = user.Phone,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            MustChangePassword = user.MustChangePassword,
            MfaEnabled = user.MfaEnabled,
        });
    }

    /// <summary>
    /// 设置认证 Cookie（Access Token + Refresh Token）
    ///
    /// Cookie 安全策略（v1.3.0 强化）：
    ///   - HttpOnly：access_token 和 refresh_token 都设 HttpOnly=true
    ///     JavaScript 完全无法读取，彻底防 XSS 窃取 token。
    ///     前端 useTokenRefresh Hook 不再依赖读 token 字符串，
    ///     改用响应体的 expiresIn 字段调度刷新定时器。
    ///   - Secure：仅 HTTPS 传输（开发环境 HTTPS 不可用时降级为非 Secure）
    ///   - SameSite=Strict：浏览器跨站请求一律不携带 Cookie，原生防 CSRF
    ///     代价：用户从外部链接跳转登录会丢会话（前端和后端必须同站点）
    ///   - Path=/：覆盖所有路径，包括 SignalR Hub 连接
    /// </summary>
    private void SetAuthCookies(string accessToken, string refreshToken, int expiresInSeconds)
    {
        var isHttps = Request.IsHttps
            || string.Equals(Request.Headers["X-Forwarded-Proto"], "https", StringComparison.OrdinalIgnoreCase);

        // 两个 Cookie 共享的安全策略（HttpOnly + SameSite=Strict）
        var baseOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = isHttps,
            SameSite = SameSiteMode.Strict,
            Path = "/",
        };

        Response.Cookies.Append("access_token", accessToken, new CookieOptions
        {
            HttpOnly = baseOptions.HttpOnly,
            Secure = baseOptions.Secure,
            SameSite = baseOptions.SameSite,
            Path = baseOptions.Path,
            MaxAge = TimeSpan.FromSeconds(expiresInSeconds),
        });

        Response.Cookies.Append("refresh_token", refreshToken, new CookieOptions
        {
            HttpOnly = baseOptions.HttpOnly,
            Secure = baseOptions.Secure,
            SameSite = baseOptions.SameSite,
            Path = baseOptions.Path,
            MaxAge = TimeSpan.FromDays(7),
        });
    }

    /// <summary>按请求头中的机器客户端 API Key 准备认证响应。</summary>
    private AuthResponse PrepareAuthResponse(AuthResponse response)
        => _authResponsePolicy.PrepareForResponse(
            response,
            Request.Headers[AuthResponsePolicy.MachineApiKeyHeaderName].FirstOrDefault());

    /// <summary>
    /// 清除认证 Cookie（登出或令牌失效时调用）
    /// 通过设置 MaxAge=0 + Expires=过去时间使浏览器立即丢弃 Cookie
    /// </summary>
    private void ClearAuthCookies()
    {
        var isHttps = Request.IsHttps
            || string.Equals(Request.Headers["X-Forwarded-Proto"], "https", StringComparison.OrdinalIgnoreCase);

        // 清除时必须设置与写入时完全一致的属性（Path/Secure/SameSite/HttpOnly），否则浏览器拒绝删除
        Response.Cookies.Delete("access_token", new CookieOptions
        {
            HttpOnly = true,
            Secure = isHttps,
            SameSite = SameSiteMode.Strict,
            Path = "/",
        });

        Response.Cookies.Delete("refresh_token", new CookieOptions
        {
            HttpOnly = true,
            Secure = isHttps,
            SameSite = SameSiteMode.Strict,
            Path = "/",
        });
    }
}

/// <summary>
/// 刷新令牌请求 DTO
/// </summary>
public class RefreshTokenRequest
{
    /// <summary>
    /// 刷新令牌字符串
    /// </summary>
    public string RefreshToken { get; set; } = string.Empty;
}

/// <summary>
/// MFA 登录验证请求 DTO
/// </summary>
public class MfaVerifyRequest
{
    /// <summary>
    /// 登录时返回的 MFA 挑战令牌
    /// </summary>
    public string ChallengeToken { get; set; } = string.Empty;

    /// <summary>
    /// 用户 authenticator 应用生成的 6 位数字 TOTP 验证码，或一次性恢复码
    /// </summary>
    public string TotpCode { get; set; } = string.Empty;
}

/// <summary>
/// MFA 设置确认请求 DTO
/// </summary>
public class MfaConfirmRequest
{
    /// <summary>
    /// 用户 authenticator 应用生成的 6 位数字 TOTP 验证码（用于首次验证密钥正确性）
    /// </summary>
    public string TotpCode { get; set; } = string.Empty;
}

/// <summary>
/// MFA 恢复码重新生成请求 DTO。
/// </summary>
public class MfaRecoveryCodesRegenerateRequest
{
    /// <summary>
    /// 当前 authenticator 应用生成的 6 位验证码。
    /// </summary>
    public string TotpCode { get; set; } = string.Empty;
}

/// <summary>
/// 强制 MFA 注册初始化请求 DTO。
/// </summary>
public class MfaEnrollmentRequest
{
    /// <summary>
    /// 密码验证成功后返回的短期注册令牌。
    /// </summary>
    public string EnrollmentToken { get; set; } = string.Empty;
}

/// <summary>
/// 强制 MFA 注册确认请求 DTO。
/// </summary>
public class MfaEnrollmentConfirmRequest
{
    /// <summary>
    /// 密码验证成功后返回的短期注册令牌。
    /// </summary>
    public string EnrollmentToken { get; set; } = string.Empty;

    /// <summary>
    /// Authenticator 应用生成的 6 位数字验证码。
    /// </summary>
    public string TotpCode { get; set; } = string.Empty;
}
