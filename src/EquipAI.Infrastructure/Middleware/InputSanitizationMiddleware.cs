using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;

namespace EquipAI.Infrastructure.Middleware;

/// <summary>
/// 输入净化中间件
/// 检查请求体中的潜在恶意内容（script 标签、事件处理器属性、javascript 协议等）
/// 拦截 POST/PUT/PATCH 请求中包含 JSON 体的可疑内容，返回 400 错误
/// </summary>
public partial class InputSanitizationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<InputSanitizationMiddleware> _logger;

    /// <summary>
    /// 初始化输入净化中间件
    /// </summary>
    /// <param name="next">管道中的下一个中间件</param>
    /// <param name="logger">日志记录器</param>
    public InputSanitizationMiddleware(RequestDelegate next, ILogger<InputSanitizationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    /// <summary>
    /// 处理 HTTP 请求，对写入类请求的 JSON 请求体进行恶意内容检测
    /// 使用 EnableBuffering 支持请求体的多次读取，不影响后续中间件和控制器
    /// </summary>
    /// <param name="context">当前 HTTP 上下文</param>
    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Method is "POST" or "PUT" or "PATCH")
        {
            var contentType = context.Request.ContentType ?? "";
            if (contentType.Contains("application/json", StringComparison.OrdinalIgnoreCase))
            {
                // 启用请求体缓冲，允许后续中间件和控制器再次读取 Body
                context.Request.EnableBuffering();
                using var reader = new StreamReader(context.Request.Body, leaveOpen: true);
                var body = await reader.ReadToEndAsync();
                context.Request.Body.Position = 0;

                if (ContainsMaliciousContent(body))
                {
                    _logger.LogWarning("检测到潜在恶意输入: Path={Path}", context.Request.Path);

                    context.Response.StatusCode = StatusCodes.Status400BadRequest;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync("{\"code\":400,\"message\":\"请求包含不允许的内容\"}");
                    return;
                }
            }
        }

        await _next(context);
    }

    /// <summary>
    /// 检测输入字符串是否包含潜在的恶意内容
    /// 匹配规则：script 标签、HTML 事件处理器属性（onclick、onerror 等）、javascript 协议
    /// </summary>
    /// <param name="input">待检测的字符串</param>
    /// <returns>包含恶意内容返回 true，否则返回 false</returns>
    internal static bool ContainsMaliciousContent(string input)
    {
        if (string.IsNullOrEmpty(input)) return false;
        return MaliciousPattern().IsMatch(input);
    }

    /// <summary>
    /// 恶意内容正则表达式（源生成器编译，运行时零开销）
    /// 匹配：&lt;script 标签、on* 事件处理器赋值、javascript: 协议
    /// </summary>
    [GeneratedRegex(@"<\s*script|on\w+\s*=|javascript\s*:", RegexOptions.IgnoreCase | RegexOptions.Compiled)]
    private static partial Regex MaliciousPattern();
}
