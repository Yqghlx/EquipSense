using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace EquipAI.Infrastructure.Middleware;

/// <summary>
/// Web 应用防火墙（WAF）中间件
///
/// 在 InputSanitization 基础上扩展，拦截四类常见 Web 攻击：
/// 1. SQL 注入 — UNION SELECT / OR 1=1 / 注释符 / DROP TABLE 等
/// 2. 路径遍历 — ../ 和 ..\\ 访问越权文件
/// 3. 命令注入 — 管道符、反引号、$() 执行系统命令
/// 4. XSS（复用 InputSanitization 的 script 检测）
///
/// 检查请求 URL（query string）和 POST/PUT/PATCH 请求体。
/// 命中规则返回 403 + 审计日志（记录攻击 IP 和路径）。
/// </summary>
public class WafMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<WafMiddleware> _logger;

    public WafMiddleware(RequestDelegate next, ILogger<WafMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var path = context.Request.Path.Value ?? "";

        // 1. 检查 URL + QueryString
        var urlInput = path + context.Request.QueryString.Value;
        if (IsMalicious(urlInput))
        {
            await BlockAsync(context, ip, path, "URL/QueryString");
            return;
        }

        // 2. 检查 POST/PUT/PATCH 请求体
        if (context.Request.Method is "POST" or "PUT" or "PATCH")
        {
            var contentType = context.Request.ContentType ?? "";
            if (contentType.Contains("application/json", StringComparison.OrdinalIgnoreCase))
            {
                context.Request.EnableBuffering();
                using var reader = new StreamReader(context.Request.Body, leaveOpen: true);
                var body = await reader.ReadToEndAsync();
                context.Request.Body.Position = 0;

                if (IsMalicious(body))
                {
                    await BlockAsync(context, ip, path, "RequestBody");
                    return;
                }
            }
        }

        await _next(context);
    }

    /// <summary>综合检测四类攻击模式</summary>
    internal static bool IsMalicious(string input)
        => WafRuleCatalog.IsBuiltInMalicious(input);

    /// <summary>阻断恶意请求并记录安全审计日志</summary>
    private async Task BlockAsync(HttpContext context, string ip, string path, string source)
    {
        _logger.LogWarning("🚫 WAF 拦截恶意请求: IP={IP}, Path={Path}, Source={Source}", ip, path, source);

        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync("{\"code\":403,\"message\":\"请求被安全策略拦截\"}");
    }

}
