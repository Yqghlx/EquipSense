using System.Security.Claims;
using EquipAI.Application.Interfaces;
using EquipAI.Infrastructure.Middleware;
using EquipAI.WebAPI.Middleware;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace EquipAI.Tests.Unit.Middleware;

/// <summary>
/// PermissionMiddleware 单元测试
/// 验证权限校验中间件在各种场景下的行为：
/// - 无端点/无权限要求时直接放行
/// - 角色匹配权限时放行
/// - 缺少角色声明时返回 401
/// - 角色不匹配权限时返回 403
/// - IRbacService 未注册时返回 403
/// - 多权限叠加场景
/// </summary>
public class PermissionMiddlewareTests
{
    /// <summary>
    /// 辅助方法：构建 HttpContext，携带指定的 Claims 和可选的端点元数据
    /// </summary>
    /// <param name="role">用户角色，传 null 则不添加 role Claim</param>
    /// <param name="permissions">端点所需的权限列表，为空则不添加 RequirePermissionAttribute</param>
    /// <param name="rbacService">可选的 IRbacService Mock 实例</param>
    /// <returns>构造好的 DefaultHttpContext</returns>
    private static DefaultHttpContext CreateHttpContext(
        string? role = null,
        string[]? permissions = null,
        Mock<IRbacService>? rbacService = null)
    {
        var context = new DefaultHttpContext();

        // 构造用户 Claims
        var claims = new List<Claim>();
        if (role is not null)
        {
            claims.Add(new Claim("role", role));
        }

        var identity = new ClaimsIdentity(claims, "TestAuthType");
        context.User = new ClaimsPrincipal(identity);

        // 设置响应体为可写的 MemoryStream，便于读取中间件写入的内容
        context.Response.Body = new MemoryStream();

        // 配置 DI 容器，返回 IRbacService Mock
        var serviceProvider = new Mock<IServiceProvider>();
        if (rbacService is not null)
        {
            serviceProvider
                .Setup(sp => sp.GetService(typeof(IRbacService)))
                .Returns(rbacService.Object);
        }
        else
        {
            // 默认返回 null，模拟 IRbacService 未注册
            serviceProvider
                .Setup(sp => sp.GetService(typeof(IRbacService)))
                .Returns((object?)null);
        }

        context.RequestServices = serviceProvider.Object;

        // 构造端点及其元数据
        if (permissions is not null && permissions.Length > 0)
        {
            var metadataItems = new List<object>();
            foreach (var perm in permissions)
            {
                metadataItems.Add(new RequirePermissionAttribute(perm));
            }

            var endpoint = new Endpoint(
                requestDelegate: _ => Task.CompletedTask,
                new EndpointMetadataCollection(metadataItems),
                "TestEndpoint");

            context.SetEndpoint(endpoint);
        }

        return context;
    }

    /// <summary>
    /// 辅助方法：执行 PermissionMiddleware 并返回处理结果
    /// </summary>
    /// <param name="context">传入的 HTTP 上下文</param>
    /// <returns>经过中间件处理后的 HttpContext 和下一个中间件的 Mock</returns>
    private static async Task<(HttpContext Context, Mock<RequestDelegate> MockNext)> ExecuteMiddlewareAsync(
        HttpContext context)
    {
        var mockNext = new Mock<RequestDelegate>();
        mockNext
            .Setup(next => next(It.IsAny<HttpContext>()))
            .Returns(Task.CompletedTask);

        var logger = Mock.Of<ILogger<PermissionMiddleware>>();
        var middleware = new PermissionMiddleware(mockNext.Object, logger);

        await middleware.InvokeAsync(context);

        return (context, mockNext);
    }

    // =====================================================================
    // 测试：无端点时应直接放行
    // =====================================================================

    [Fact]
    public async Task InvokeAsync_无端点时_应直接放行()
    {
        // Arrange — 构造无端点的 HttpContext
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // 不设置端点，context.GetEndpoint() 返回 null
        var rbacMock = new Mock<IRbacService>();
        var serviceProvider = new Mock<IServiceProvider>();
        serviceProvider
            .Setup(sp => sp.GetService(typeof(IRbacService)))
            .Returns(rbacMock.Object);
        context.RequestServices = serviceProvider.Object;

        // Act
        var (_, mockNext) = await ExecuteMiddlewareAsync(context);

        // Assert — 下一个中间件应被调用，且不应调用 RBAC 服务
        mockNext.Verify(next => next(context), Times.Once,
            "因为没有端点，中间件应直接放行");
        rbacMock.Verify(
            s => s.HasPermission(It.IsAny<string>(), It.IsAny<string>()),
            Times.Never,
            "因为没有端点，不应调用权限校验服务");
    }

    // =====================================================================
    // 测试：无权限要求（endpoint 无 RequirePermissionAttribute）时应直接放行
    // =====================================================================

    [Fact]
    public async Task InvokeAsync_端点无权限要求时_应直接放行()
    {
        // Arrange — 构造有端点但无 RequirePermissionAttribute 的上下文
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        var endpoint = new Endpoint(
            requestDelegate: _ => Task.CompletedTask,
            new EndpointMetadataCollection(),
            "NoPermissionEndpoint");

        context.SetEndpoint(endpoint);

        var rbacMock = new Mock<IRbacService>();
        var serviceProvider = new Mock<IServiceProvider>();
        serviceProvider
            .Setup(sp => sp.GetService(typeof(IRbacService)))
            .Returns(rbacMock.Object);
        context.RequestServices = serviceProvider.Object;

        // Act
        var (_, mockNext) = await ExecuteMiddlewareAsync(context);

        // Assert
        mockNext.Verify(next => next(context), Times.Once,
            "因为端点没有权限要求，中间件应直接放行");
        rbacMock.Verify(
            s => s.HasPermission(It.IsAny<string>(), It.IsAny<string>()),
            Times.Never,
            "因为端点没有权限要求，不应调用权限校验服务");
    }

    // =====================================================================
    // 测试：有权限要求但用户缺少角色声明时应返回 401
    // =====================================================================

    [Fact]
    public async Task InvokeAsync_有权限要求但用户无角色声明_应返回401()
    {
        // Arrange — 构造有权限要求但没有 role Claim 的上下文
        var context = CreateHttpContext(
            role: null,
            permissions: ["device:create"]);

        // Act
        var (processedContext, mockNext) = await ExecuteMiddlewareAsync(context);

        // Assert
        processedContext.Response.StatusCode.Should().Be(StatusCodes.Status401Unauthorized,
            "因为用户缺少角色声明，应返回 401 未授权");
        mockNext.Verify(next => next(It.IsAny<HttpContext>()), Times.Never,
            "因为权限校验失败，不应调用下一个中间件");
    }

    // =====================================================================
    // 测试：IRbacService 未注册时应返回 403
    // =====================================================================

    [Fact]
    public async Task InvokeAsync_IRbacService未注册_应返回403()
    {
        // Arrange — 构造有权限要求、有角色但 IRbacService 未注册的上下文
        var context = CreateHttpContext(
            role: "MaintenanceLead",
            permissions: ["device:create"],
            rbacService: null); // null 表示 IRbacService 未注册

        // Act
        var (processedContext, mockNext) = await ExecuteMiddlewareAsync(context);

        // Assert
        processedContext.Response.StatusCode.Should().Be(StatusCodes.Status403Forbidden,
            "因为 IRbacService 未注册，无法进行权限校验，应返回 403");
        mockNext.Verify(next => next(It.IsAny<HttpContext>()), Times.Never,
            "因为权限校验服务不可用，不应调用下一个中间件");
    }

    // =====================================================================
    // 测试：角色拥有所需权限时应放行
    // =====================================================================

    [Fact]
    public async Task InvokeAsync_角色拥有所需权限_应放行()
    {
        // Arrange — MaintenanceLead 拥有 device:create 权限
        var rbacMock = new Mock<IRbacService>();
        rbacMock
            .Setup(s => s.HasPermission("MaintenanceLead", "device:create"))
            .Returns(true);

        var context = CreateHttpContext(
            role: "MaintenanceLead",
            permissions: ["device:create"],
            rbacService: rbacMock);

        // Act
        var (_, mockNext) = await ExecuteMiddlewareAsync(context);

        // Assert
        mockNext.Verify(next => next(context), Times.Once,
            "因为角色拥有所需权限，应放行并调用下一个中间件");
        rbacMock.Verify(s => s.HasPermission("MaintenanceLead", "device:create"), Times.Once,
            "应调用 RBAC 服务校验指定角色和权限");
    }

    // =====================================================================
    // 测试：角色缺少所需权限时应返回 403
    // =====================================================================

    [Fact]
    public async Task InvokeAsync_角色缺少所需权限_应返回403()
    {
        // Arrange — Viewer 没有 device:create 权限
        var rbacMock = new Mock<IRbacService>();
        rbacMock
            .Setup(s => s.HasPermission("Viewer", "device:create"))
            .Returns(false);

        var context = CreateHttpContext(
            role: "Viewer",
            permissions: ["device:create"],
            rbacService: rbacMock);

        // Act
        var (processedContext, mockNext) = await ExecuteMiddlewareAsync(context);

        // Assert
        processedContext.Response.StatusCode.Should().Be(StatusCodes.Status403Forbidden,
            "因为角色缺少所需权限，应返回 403");
        mockNext.Verify(next => next(It.IsAny<HttpContext>()), Times.Never,
            "因为权限校验失败，不应调用下一个中间件");
    }

    // =====================================================================
    // 测试：多个权限要求全部满足时应放行
    // =====================================================================

    [Fact]
    public async Task InvokeAsync_多个权限要求全部满足_应放行()
    {
        // Arrange — SystemAdmin 同时拥有 device:read 和 device:create 权限
        var rbacMock = new Mock<IRbacService>();
        rbacMock
            .Setup(s => s.HasPermission("SystemAdmin", "device:read"))
            .Returns(true);
        rbacMock
            .Setup(s => s.HasPermission("SystemAdmin", "device:create"))
            .Returns(true);

        var context = CreateHttpContext(
            role: "SystemAdmin",
            permissions: ["device:read", "device:create"],
            rbacService: rbacMock);

        // Act
        var (_, mockNext) = await ExecuteMiddlewareAsync(context);

        // Assert
        mockNext.Verify(next => next(context), Times.Once,
            "因为所有权限要求均满足，应放行");
    }

    // =====================================================================
    // 测试：多个权限要求中部分不满足时应返回 403
    // =====================================================================

    [Fact]
    public async Task InvokeAsync_多个权限要求中部分不满足_应返回403()
    {
        // Arrange — Operator 有 device:read 但没有 alert:configure 权限
        var rbacMock = new Mock<IRbacService>();
        rbacMock
            .Setup(s => s.HasPermission("Operator", "device:read"))
            .Returns(true);
        rbacMock
            .Setup(s => s.HasPermission("Operator", "alert:configure"))
            .Returns(false);

        var context = CreateHttpContext(
            role: "Operator",
            permissions: ["device:read", "alert:configure"],
            rbacService: rbacMock);

        // Act
        var (processedContext, mockNext) = await ExecuteMiddlewareAsync(context);

        // Assert
        processedContext.Response.StatusCode.Should().Be(StatusCodes.Status403Forbidden,
            "因为多个权限要求中有不满足的项，应返回 403");
        mockNext.Verify(next => next(It.IsAny<HttpContext>()), Times.Never,
            "因为权限校验失败，不应调用下一个中间件");
    }

    // =====================================================================
    // 测试：401 响应体应为 JSON 格式
    // =====================================================================

    [Fact]
    public async Task InvokeAsync_返回401时_响应体应为JSON格式()
    {
        // Arrange
        var context = CreateHttpContext(
            role: null,
            permissions: ["device:create"]);

        // Act
        var (processedContext, _) = await ExecuteMiddlewareAsync(context);

        // Assert — 验证响应内容类型
        processedContext.Response.ContentType.Should().Be("application/json",
            "因为错误响应应为 JSON 格式");

        // 读取响应体内容并验证结构
        processedContext.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(processedContext.Response.Body);
        var body = await reader.ReadToEndAsync();

        body.Should().Contain("\"code\":401",
            "因为响应体应包含 code 字段且值为 401");
        body.Should().Contain("\"message\"",
            "因为响应体应包含 message 字段");
    }

    // =====================================================================
    // 测试：403 响应体应为 JSON 格式
    // =====================================================================

    [Fact]
    public async Task InvokeAsync_返回403时_响应体应为JSON格式()
    {
        // Arrange
        var rbacMock = new Mock<IRbacService>();
        rbacMock
            .Setup(s => s.HasPermission("Viewer", "device:delete"))
            .Returns(false);

        var context = CreateHttpContext(
            role: "Viewer",
            permissions: ["device:delete"],
            rbacService: rbacMock);

        // Act
        var (processedContext, _) = await ExecuteMiddlewareAsync(context);

        // Assert
        processedContext.Response.ContentType.Should().Be("application/json",
            "因为错误响应应为 JSON 格式");

        processedContext.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(processedContext.Response.Body);
        var body = await reader.ReadToEndAsync();

        body.Should().Contain("\"code\":403",
            "因为响应体应包含 code 字段且值为 403");
        body.Should().Contain("\"message\"",
            "因为响应体应包含 message 字段");
        body.Should().Contain("device:delete",
            "因为响应消息应包含缺少的权限标识");
    }

    // =====================================================================
    // 测试：RBAC 权限矩阵 — 各角色的典型权限场景
    // =====================================================================

    [Theory]
    [InlineData("SystemAdmin", "device:create", true)]
    [InlineData("SystemAdmin", "alert:configure", true)]
    [InlineData("SystemAdmin", "workorder:assign", true)]
    [InlineData("MaintenanceLead", "device:read", true)]
    [InlineData("MaintenanceLead", "alert:configure", true)]
    [InlineData("Technician", "device:read", true)]
    [InlineData("Technician", "device:create", false)]
    [InlineData("Operator", "alert:read", true)]
    [InlineData("Operator", "alert:configure", false)]
    [InlineData("Viewer", "device:read", true)]
    [InlineData("Viewer", "device:create", false)]
    public async Task InvokeAsync_角色权限矩阵校验_应根据RBAC服务结果决定是否放行(
        string role, string permission, bool hasPermission)
    {
        // Arrange — 根据 Theory 数据设置 RBAC 服务的返回值
        var rbacMock = new Mock<IRbacService>();
        rbacMock
            .Setup(s => s.HasPermission(role, permission))
            .Returns(hasPermission);

        var context = CreateHttpContext(
            role: role,
            permissions: [permission],
            rbacService: rbacMock);

        // Act
        var (processedContext, mockNext) = await ExecuteMiddlewareAsync(context);

        // Assert
        if (hasPermission)
        {
            mockNext.Verify(next => next(context), Times.Once,
                $"因为角色 {role} 拥有 {permission} 权限，应放行");
        }
        else
        {
            processedContext.Response.StatusCode.Should().Be(StatusCodes.Status403Forbidden,
                $"因为角色 {role} 缺少 {permission} 权限，应返回 403");
            mockNext.Verify(next => next(It.IsAny<HttpContext>()), Times.Never,
                $"因为角色 {role} 权限不足，不应调用下一个中间件");
        }
    }

    // =====================================================================
    // 测试：不同角色访问同一端点应产生不同结果
    // =====================================================================

    [Fact]
    public async Task InvokeAsync_不同角色访问同一权限端点_应根据RBAC结果区分处理()
    {
        // Arrange — Technician 和 MaintenanceLead 访问 alert:configure
        // MaintenanceLead 有权，Technician 无权
        var rbacMock = new Mock<IRbacService>();
        rbacMock
            .Setup(s => s.HasPermission("MaintenanceLead", "alert:configure"))
            .Returns(true);
        rbacMock
            .Setup(s => s.HasPermission("Technician", "alert:configure"))
            .Returns(false);

        // Act & Assert — MaintenanceLead 应被放行
        var context1 = CreateHttpContext(
            role: "MaintenanceLead",
            permissions: ["alert:configure"],
            rbacService: rbacMock);
        var (_, mockNext1) = await ExecuteMiddlewareAsync(context1);
        mockNext1.Verify(next => next(context1), Times.Once,
            "MaintenanceLead 拥有 alert:configure 权限，应被放行");

        // Act & Assert — Technician 应被拒绝
        var context2 = CreateHttpContext(
            role: "Technician",
            permissions: ["alert:configure"],
            rbacService: rbacMock);
        var (processedContext2, mockNext2) = await ExecuteMiddlewareAsync(context2);
        processedContext2.Response.StatusCode.Should().Be(StatusCodes.Status403Forbidden,
            "Technician 没有 alert:configure 权限，应被拒绝");
        mockNext2.Verify(next => next(It.IsAny<HttpContext>()), Times.Never,
            "Technician 权限不足，不应继续管道");
    }
}
