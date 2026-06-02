using Microsoft.AspNetCore.Http;

namespace EquipAI.Infrastructure.Middleware;

/// <summary>
/// 安全 Headers 中间件
/// 为每个 HTTP 响应添加安全相关的响应头，防御点击劫持、MIME 嗅探、XSS 等攻击
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    /// <summary>
    /// 初始化安全 Headers 中间件
    /// </summary>
    /// <param name="next">管道中的下一个中间件</param>
    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    /// <summary>
    /// 处理 HTTP 请求，在响应中添加安全头后传递给下一个中间件
    /// </summary>
    /// <param name="context">当前 HTTP 上下文</param>
    public async Task InvokeAsync(HttpContext context)
    {
        // 防止浏览器猜测（嗅探）响应内容的 MIME 类型
        context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
        // 禁止页面被嵌入 iframe，防御点击劫持攻击
        context.Response.Headers.Append("X-Frame-Options", "DENY");
        // 启用浏览器内置的 XSS 过滤器（主要针对旧版浏览器）
        context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
        // 限制 Referer 头只在同源请求时发送完整路径，跨域时只发送来源域名
        context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
        // 禁止缓存敏感 API 响应，防止代理或浏览器存储敏感数据
        context.Response.Headers.Append("Cache-Control", "no-store, no-cache, must-revalidate");
        context.Response.Headers.Append("Pragma", "no-cache");

        await _next(context);
    }
}
