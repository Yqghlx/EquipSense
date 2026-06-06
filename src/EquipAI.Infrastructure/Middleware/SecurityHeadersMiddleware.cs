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
        // 限制浏览器 API 访问（摄像头、麦克风、地理位置、支付）
        context.Response.Headers.Append("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
        // 禁止跨域策略文件
        context.Response.Headers.Append("X-Permitted-Cross-Domain-Policies", "none");
        // 内容安全策略：限制资源加载来源，防御 XSS 和数据注入攻击
        // unsafe-inline/eval：前端使用 TailwindCSS 内联样式和 ECharts 动态脚本，后续可逐步收紧
        context.Response.Headers.Append("Content-Security-Policy",
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: blob:; " +
            "font-src 'self' data:; " +
            "connect-src 'self' wss: https:; " +
            "frame-ancestors 'none'; " +
            "base-uri 'self'; " +
            "form-action 'self'");
        // HTTP 严格传输安全：强制浏览器在 1 年内只使用 HTTPS 访问（含子域名）
        context.Response.Headers.Append("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

        await _next(context);
    }
}
