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
    private readonly IWafRuleProvider _ruleProvider;

    public WafMiddleware(
        RequestDelegate next,
        ILogger<WafMiddleware> logger,
        IWafRuleProvider ruleProvider)
    {
        _next = next;
        _logger = logger;
        _ruleProvider = ruleProvider;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var path = context.Request.Path.Value ?? "";
        var snapshot = _ruleProvider.Current;

        // 1. 检查 URL + QueryString
        var urlInput = path + context.Request.QueryString.Value;
        if (TryDetect(urlInput, snapshot, "URL/QueryString", out var urlDetection))
        {
            await BlockAsync(context, ip, path, urlDetection);
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

                if (TryDetect(body, snapshot, "RequestBody", out var bodyDetection))
                {
                    await BlockAsync(context, ip, path, bodyDetection);
                    return;
                }
            }
        }

        await _next(context);
    }

    /// <summary>综合检测四类攻击模式</summary>
    internal static bool IsMalicious(string input)
        => WafRuleCatalog.IsBuiltInMalicious(input);

    /// <summary>
    /// 使用不可变快照按固定顺序寻找首个命中规则。
    /// </summary>
    internal static bool TryDetect(
        string input,
        WafRuleSnapshot snapshot,
        string source,
        out WafDetection detection)
    {
        if (!string.IsNullOrEmpty(input))
        {
            foreach (var rule in snapshot.Rules)
            {
                if (rule.IsMatch(input))
                {
                    detection = new WafDetection(rule.Id, rule.Category, source);
                    return true;
                }
            }
        }

        detection = null!;
        return false;
    }

    /// <summary>阻断恶意请求并记录不含请求正文的安全审计日志</summary>
    private async Task BlockAsync(
        HttpContext context,
        string ip,
        string path,
        WafDetection detection)
    {
        _logger.LogWarning(
            "🚫 WAF 拦截恶意请求: IP={IP}, Path={Path}, RuleId={RuleId}, Category={Category}, Source={Source}",
            ip,
            path,
            detection.RuleId,
            detection.Category,
            detection.Source);

        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync("{\"code\":403,\"message\":\"请求被安全策略拦截\"}");
    }

}
