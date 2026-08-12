using System.Security.Claims;
using System.Text.Json;
using EquipAI.WebAPI.Middleware;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace EquipAI.Tests.Unit.Middleware;

/// <summary>
/// 强制改密中间件单元测试。
/// 验证必须改密的会话只能访问认证闭环接口，不能通过直接调用业务 API 绕过前端限制。
/// </summary>
public sealed class PasswordChangeRequiredMiddlewareTests
{
    /// <summary>
    /// 构造带有强制改密声明的已认证请求上下文。
    /// </summary>
    private static DefaultHttpContext CreateContext(
        string path,
        bool? mustChangePassword,
        bool authenticated = true)
    {
        var context = new DefaultHttpContext();
        context.Request.Path = path;
        context.Response.Body = new MemoryStream();

        var claims = new List<Claim>();
        if (mustChangePassword.HasValue)
        {
            claims.Add(new Claim(
                PasswordChangeRequiredMiddleware.MustChangePasswordClaim,
                mustChangePassword.Value ? "true" : "false"));
        }

        context.User = new ClaimsPrincipal(new ClaimsIdentity(
            claims,
            authenticated ? "TestAuth" : null));
        return context;
    }

    /// <summary>
    /// 执行中间件并返回下游委托，便于断言请求是否被拦截。
    /// </summary>
    private static async Task<Mock<RequestDelegate>> ExecuteAsync(HttpContext context)
    {
        var next = new Mock<RequestDelegate>();
        next.Setup(handler => handler(It.IsAny<HttpContext>()))
            .Returns(Task.CompletedTask);

        var middleware = new PasswordChangeRequiredMiddleware(
            next.Object,
            NullLogger<PasswordChangeRequiredMiddleware>.Instance);

        await middleware.InvokeAsync(context);
        return next;
    }

    [Fact]
    public async Task 必须改密用户访问业务接口_应返回403并阻止下游调用()
    {
        var context = CreateContext("/api/v1/devices", mustChangePassword: true);

        var next = await ExecuteAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
        context.Response.Headers[PasswordChangeRequiredMiddleware.RequiredResponseHeader]
            .ToString().Should().Be("true");
        next.Verify(handler => handler(It.IsAny<HttpContext>()), Times.Never);

        context.Response.Body.Position = 0;
        var responseBody = await new StreamReader(context.Response.Body).ReadToEndAsync();
        using var responseJson = JsonDocument.Parse(responseBody);
        responseJson.RootElement.GetProperty("message").GetString()
            .Should().Contain("请先修改密码");
    }

    [Theory]
    [InlineData("/api/v1/auth/change-password")]
    [InlineData("/api/v1/auth/me")]
    [InlineData("/api/v1/auth/refresh")]
    [InlineData("/api/v1/auth/logout")]
    [InlineData("/api/v1/auth/mfa/verify")]
    [InlineData("/api/v1/auth/mfa/enroll/setup")]
    [InlineData("/api/v1/auth/mfa/enroll/confirm")]
    public async Task 必须改密用户访问认证闭环接口_应放行(string path)
    {
        var context = CreateContext(path, mustChangePassword: true);

        var next = await ExecuteAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
        next.Verify(handler => handler(context), Times.Once);
    }

    [Theory]
    [InlineData("/api/v1/auth/mfa/setup")]
    [InlineData("/api/v1/auth/mfa/confirm")]
    [InlineData("/api/v1/auth/mfa/recovery-codes/regenerate")]
    [InlineData("/api/v1/auth/mfa/disable")]
    public async Task 必须改密用户访问MFA管理接口_应被门禁拦截(string path)
    {
        var context = CreateContext(path, mustChangePassword: true);

        var next = await ExecuteAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
        context.Response.Headers[PasswordChangeRequiredMiddleware.RequiredResponseHeader]
            .ToString().Should().Be("true");
        next.Verify(handler => handler(It.IsAny<HttpContext>()), Times.Never);
    }

    [Fact]
    public async Task 非强制改密会话_应保持原有访问行为()
    {
        var context = CreateContext("/api/v1/devices", mustChangePassword: false);

        var next = await ExecuteAsync(context);

        next.Verify(handler => handler(context), Times.Once);
        context.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
    }

    [Fact]
    public async Task 未认证请求_应保持原有访问行为()
    {
        var context = CreateContext("/api/v1/devices", mustChangePassword: true, authenticated: false);

        var next = await ExecuteAsync(context);

        next.Verify(handler => handler(context), Times.Once);
        context.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
    }
}
