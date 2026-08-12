using System.Net;
using System.Text.Json;

namespace EquipAI.WebAPI.Middleware;

/// <summary>
/// 强制改密会话门禁。
///
/// 用户信息中的 MustChangePassword 只是前端展示状态，不能作为安全边界；
/// 本中间件读取签名 JWT 中的同名声明，在业务请求到达控制器前阻止绕过前端的访问。
/// 仅保留完成认证闭环所需的接口，避免用户被锁在无法改密的状态。
/// </summary>
public sealed class PasswordChangeRequiredMiddleware
{
    /// <summary>JWT 中表示必须修改密码的声明名称。</summary>
    public const string MustChangePasswordClaim = "must_change_password";

    /// <summary>告知前端当前请求被强制改密门禁拒绝的响应头。</summary>
    public const string RequiredResponseHeader = "X-Password-Change-Required";

    private static readonly string[] AllowedAuthenticationPaths =
    [
        // 登录/注册/找回密码允许强制改密用户切换身份或恢复账号。
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/api/v1/auth/plans",
        "/api/v1/auth/forgot-password",
        "/api/v1/auth/reset-password",
        "/api/v1/auth/change-password",
        "/api/v1/auth/me",
        "/api/v1/auth/refresh",
        "/api/v1/auth/logout",
        // MFA 登录挑战和首次登录注册属于认证闭环；其余 MFA 管理操作必须先完成改密。
        "/api/v1/auth/mfa/verify",
        "/api/v1/auth/mfa/enroll/setup",
        "/api/v1/auth/mfa/enroll/confirm",
    ];

    private readonly RequestDelegate _next;
    private readonly ILogger<PasswordChangeRequiredMiddleware> _logger;

    /// <summary>初始化强制改密会话门禁。</summary>
    /// <param name="next">下一个中间件。</param>
    /// <param name="logger">日志记录器。</param>
    public PasswordChangeRequiredMiddleware(
        RequestDelegate next,
        ILogger<PasswordChangeRequiredMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    /// <summary>
    /// 对必须改密的已认证会话执行路径门禁。
    /// 未认证请求和已完成改密的会话保持原有管线行为。
    /// </summary>
    /// <param name="context">当前 HTTP 请求上下文。</param>
    public async Task InvokeAsync(HttpContext context)
    {
        if (!RequiresPasswordChange(context)
            || IsAllowedAuthenticationPath(context.Request.Path.Value))
        {
            await _next(context);
            return;
        }

        _logger.LogWarning(
            "用户必须先修改密码，已拒绝业务请求：{Path}",
            context.Request.Path);

        context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
        context.Response.ContentType = "application/json";
        context.Response.Headers[RequiredResponseHeader] = "true";

        var response = new
        {
            code = 403,
            message = "请先修改密码后再访问业务功能",
            details = (string?)null,
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(
            response,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
    }

    /// <summary>判断当前主体是否为必须改密的已认证会话。</summary>
    private static bool RequiresPasswordChange(HttpContext context)
    {
        if (context.User.Identity?.IsAuthenticated != true)
        {
            return false;
        }

        var claimValue = context.User.FindFirst(MustChangePasswordClaim)?.Value;
        return bool.TryParse(claimValue, out var mustChangePassword) && mustChangePassword;
    }

    /// <summary>
    /// 判断路径是否属于认证闭环。
    /// 使用精确匹配，避免把未来新增的高风险认证或 MFA 管理接口意外加入放行名单。
    /// 只有完成登录所需的挑战和首次注册端点属于认证闭环，MFA 设置、禁用和恢复码
    /// 重置等高风险管理操作必须先完成改密。
    /// </summary>
    private static bool IsAllowedAuthenticationPath(string? path)
        => path is not null
            && AllowedAuthenticationPaths.Contains(path, StringComparer.OrdinalIgnoreCase);
}
