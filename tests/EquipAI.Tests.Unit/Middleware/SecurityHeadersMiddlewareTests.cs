using Microsoft.AspNetCore.Http;
using Moq;
using FluentAssertions;
using EquipAI.Infrastructure.Middleware;

namespace EquipAI.Tests.Unit.Middleware;

/// <summary>
/// SecurityHeadersMiddleware 单元测试
/// 验证安全响应头正确添加，以及中间件管道正确传递
/// </summary>
public class SecurityHeadersMiddlewareTests
{
    /// <summary>
    /// 辅助方法：创建中间件实例并执行，返回经过处理的 HttpContext
    /// </summary>
    private static async Task<HttpContext> ExecuteMiddlewareAsync()
    {
        var context = new DefaultHttpContext();
        var mockNext = new Mock<RequestDelegate>();

        // 记录下一个中间件是否被调用
        mockNext
            .Setup(next => next(It.IsAny<HttpContext>()))
            .Returns(Task.CompletedTask);

        var middleware = new SecurityHeadersMiddleware(mockNext.Object);
        await middleware.InvokeAsync(context);

        // 验证下一个中间件确实被调用
        mockNext.Verify(next => next(context), Times.Once);

        return context;
    }

    [Fact]
    public async Task InvokeAsync_应正确设置_XContentTypeOptions_为_nosniff()
    {
        // Act
        var context = await ExecuteMiddlewareAsync();

        // Assert
        context.Response.Headers["X-Content-Type-Options"].ToString()
            .Should().Be("nosniff", "因为应防止浏览器嗅探 MIME 类型");
    }

    [Fact]
    public async Task InvokeAsync_应正确设置_XFrameOptions_为_DENY()
    {
        // Act
        var context = await ExecuteMiddlewareAsync();

        // Assert
        context.Response.Headers["X-Frame-Options"].ToString()
            .Should().Be("DENY", "因为应防御点击劫持攻击");
    }

    [Fact]
    public async Task InvokeAsync_应正确设置_XXSSProtection_为启用阻止模式()
    {
        // Act
        var context = await ExecuteMiddlewareAsync();

        // Assert
        context.Response.Headers["X-XSS-Protection"].ToString()
            .Should().Be("1; mode=block", "因为应启用浏览器 XSS 过滤器并阻止渲染");
    }

    [Fact]
    public async Task InvokeAsync_应正确设置_ReferrerPolicy_为跨域严格来源()
    {
        // Act
        var context = await ExecuteMiddlewareAsync();

        // Assert
        context.Response.Headers["Referrer-Policy"].ToString()
            .Should().Be("strict-origin-when-cross-origin", "因为跨域时应只发送来源域名");
    }

    [Fact]
    public async Task InvokeAsync_应正确设置_PermissionsPolicy_禁用敏感浏览器API()
    {
        // Act
        var context = await ExecuteMiddlewareAsync();

        // Assert
        context.Response.Headers["Permissions-Policy"].ToString()
            .Should().Be("camera=(), microphone=(), geolocation=(), payment=()",
                "因为应禁止访问摄像头、麦克风、地理位置和支付 API");
    }

    [Fact]
    public async Task InvokeAsync_应正确设置_XPermittedCrossDomainPolicies_为_none()
    {
        // Act
        var context = await ExecuteMiddlewareAsync();

        // Assert
        context.Response.Headers["X-Permitted-Cross-Domain-Policies"].ToString()
            .Should().Be("none", "因为应禁止跨域策略文件");
    }

    [Fact]
    public async Task InvokeAsync_应正确设置_CacheControl_包含_no_store()
    {
        // Act
        var context = await ExecuteMiddlewareAsync();

        // Assert
        var cacheControl = context.Response.Headers["Cache-Control"].ToString();
        cacheControl.Should().Contain("no-store", "因为应禁止缓存敏感 API 响应");
        cacheControl.Should().Contain("no-cache");
        cacheControl.Should().Contain("must-revalidate");
    }

    [Fact]
    public async Task InvokeAsync_应正确设置_Pragma_为_no_cache()
    {
        // Act
        var context = await ExecuteMiddlewareAsync();

        // Assert
        context.Response.Headers["Pragma"].ToString()
            .Should().Be("no-cache", "因为应兼容 HTTP/1.0 的缓存控制");
    }

    [Fact]
    public async Task InvokeAsync_应调用下一个中间件()
    {
        // Arrange
        var context = new DefaultHttpContext();
        var mockNext = new Mock<RequestDelegate>();
        mockNext
            .Setup(next => next(It.IsAny<HttpContext>()))
            .Returns(Task.CompletedTask);

        var middleware = new SecurityHeadersMiddleware(mockNext.Object);

        // Act
        await middleware.InvokeAsync(context);

        // Assert — 验证管道中的下一个中间件被调用且只调用一次
        mockNext.Verify(next => next(context), Times.Once,
            "中间件应将请求传递给管道中的下一个中间件");
    }

    [Fact]
    public async Task InvokeAsync_应在调用下一个中间件之前添加所有安全头()
    {
        // Arrange
        var context = new DefaultHttpContext();
        var headersAtNextCall = new Dictionary<string, string>();

        var mockNext = new Mock<RequestDelegate>();
        mockNext
            .Setup(next => next(It.IsAny<HttpContext>()))
            .Callback<HttpContext>(ctx =>
            {
                // 在下一个中间件执行时，捕获当前已有的响应头
                headersAtNextCall["X-Content-Type-Options"] = ctx.Response.Headers["X-Content-Type-Options"].ToString();
                headersAtNextCall["X-Frame-Options"] = ctx.Response.Headers["X-Frame-Options"].ToString();
                headersAtNextCall["X-XSS-Protection"] = ctx.Response.Headers["X-XSS-Protection"].ToString();
                headersAtNextCall["Referrer-Policy"] = ctx.Response.Headers["Referrer-Policy"].ToString();
                headersAtNextCall["Cache-Control"] = ctx.Response.Headers["Cache-Control"].ToString();
                headersAtNextCall["Permissions-Policy"] = ctx.Response.Headers["Permissions-Policy"].ToString();
                headersAtNextCall["X-Permitted-Cross-Domain-Policies"] = ctx.Response.Headers["X-Permitted-Cross-Domain-Policies"].ToString();
                headersAtNextCall["Pragma"] = ctx.Response.Headers["Pragma"].ToString();
            })
            .Returns(Task.CompletedTask);

        var middleware = new SecurityHeadersMiddleware(mockNext.Object);

        // Act
        await middleware.InvokeAsync(context);

        // Assert — 安全头在下一个中间件被调用时已经存在
        headersAtNextCall.Should().ContainKey("X-Content-Type-Options")
            .WhoseValue.Should().Be("nosniff");
        headersAtNextCall.Should().ContainKey("X-Frame-Options")
            .WhoseValue.Should().Be("DENY");
        headersAtNextCall.Should().ContainKey("X-XSS-Protection")
            .WhoseValue.Should().Be("1; mode=block");
        headersAtNextCall.Should().ContainKey("Referrer-Policy")
            .WhoseValue.Should().Be("strict-origin-when-cross-origin");
        headersAtNextCall.Should().ContainKey("Cache-Control")
            .WhoseValue.Should().Contain("no-store");
        headersAtNextCall.Should().ContainKey("Permissions-Policy")
            .WhoseValue.Should().Be("camera=(), microphone=(), geolocation=(), payment=()");
        headersAtNextCall.Should().ContainKey("X-Permitted-Cross-Domain-Policies")
            .WhoseValue.Should().Be("none");
        headersAtNextCall.Should().ContainKey("Pragma")
            .WhoseValue.Should().Be("no-cache");
    }

    /// <summary>
    /// v1.4 CSP 收紧验证：script-src 必须不含 'unsafe-inline'
    ///
    /// 设计意图：React 构建产物无内联 script（全部走外部 src），
    /// 可以安全移除 'unsafe-inline'，缩小 XSS 攻击面。
    /// 保留 'unsafe-eval'（ECharts 内部 new Function() 必需）。
    /// </summary>
    [Fact]
    public async Task InvokeAsync_CSP_必须移除_unsafe_inline_保留_unsafe_eval()
    {
        // Act
        var context = await ExecuteMiddlewareAsync();

        // Assert
        var csp = context.Response.Headers["Content-Security-Policy"].ToString();

        // 安全红线：script-src 不允许 'unsafe-inline'（XSS 注入入口）
        csp.Should().NotContain("script-src 'self' 'unsafe-inline'",
            "React 构建产物无内联 script，必须移除 unsafe-inline 缩小 XSS 攻击面");
        csp.Should().NotMatch("*script-src 'self' 'unsafe-inline' 'unsafe-eval'*",
            "混合 unsafe-inline+eval 等于完全关闭 CSP");

        // ECharts 必需：'unsafe-eval' 必须保留
        csp.Should().Contain("script-src 'self' 'unsafe-eval'",
            "ECharts 用 new Function() 动态生成 formatter，移除 unsafe-eval 会让所有图表崩溃");

        // 加固：禁止 Flash/Java 插件
        csp.Should().Contain("object-src 'none'",
            "object-src 必须为 none，禁止 Flash/PDF embed 等浏览器插件");

        // 加固：自动升级 HTTP → HTTPS
        csp.Should().Contain("upgrade-insecure-requests",
            "强制浏览器自动升级所有 http:// 请求到 https://");
    }
}
