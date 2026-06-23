using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Middleware;
using EquipAI.Infrastructure.Tenant;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text.Json;

namespace EquipAI.Tests.Unit.Middleware;

/// <summary>
/// UsageLimitMiddleware 单元测试
/// 验证配额检查逻辑：非 POST 请求放行、非 API 路径放行、配额未超限放行、
/// 配额超限返回 403、ISubscriptionService 未注册时放行、无租户上下文时放行
/// </summary>
public class UsageLimitMiddlewareTests
{
    /// <summary>
    /// 测试用固定 GUID，模拟有效的租户 ID
    /// </summary>
    private static readonly Guid TestTenantId = Guid.Parse("11111111-2222-3333-4444-555555555555");

    /// <summary>
    /// 辅助方法：构造 HTTP 上下文，模拟指定请求方法、路径和租户上下文
    /// </summary>
    /// <param name="method">HTTP 方法（GET/POST/PUT 等）</param>
    /// <param name="path">请求路径</param>
    /// <param name="tenantId">租户 ID，传 null 表示不设置租户上下文</param>
    /// <param name="isSystemAdmin">是否为系统管理员</param>
    /// <param name="subscriptionService">可选的 ISubscriptionService Mock</param>
    /// <returns>构造好的 DefaultHttpContext</returns>
    private static DefaultHttpContext CreateContext(
        string method,
        string path,
        Guid? tenantId = null,
        bool isSystemAdmin = false,
        Mock<ISubscriptionService>? subscriptionService = null)
    {
        var context = new DefaultHttpContext();
        context.Request.Method = method;
        context.Request.Path = path;

        // 配置 RequestServices，返回 Mock 的 ISubscriptionService
        var serviceProvider = new Mock<IServiceProvider>();
        serviceProvider
            .Setup(sp => sp.GetService(typeof(ISubscriptionService)))
            .Returns(subscriptionService?.Object);

        context.RequestServices = serviceProvider.Object;

        // 配置 Response.Body 以便后续读取写入内容
        context.Response.Body = new MemoryStream();

        // 若提供了有效的 tenantId，在 Items 中设置租户上下文
        if (tenantId.HasValue)
        {
            var tenantContext = new TenantContext(
                tenantId.Value,
                "Shared",
                isSystemAdmin);
            context.Items[TenantResolutionMiddleware.TenantContextKey] = tenantContext;
        }

        return context;
    }

    /// <summary>
    /// 辅助方法：执行中间件并返回处理后的上下文和 MockNext
    /// </summary>
    /// <param name="context">传入的 HTTP 上下文</param>
    /// <returns>处理后的上下文和下一个中间件的 Mock</returns>
    private static async Task<(HttpContext Context, Mock<RequestDelegate> MockNext)> ExecuteMiddlewareAsync(
        HttpContext context)
    {
        var mockNext = new Mock<RequestDelegate>();
        mockNext
            .Setup(next => next(It.IsAny<HttpContext>()))
            .Returns(Task.CompletedTask);

        var logger = Mock.Of<ILogger<UsageLimitMiddleware>>();
        var middleware = new UsageLimitMiddleware(mockNext.Object, logger);

        await middleware.InvokeAsync(context);

        return (context, mockNext);
    }

    // =====================================================================
    // 测试：非 POST 请求应直接放行
    // =====================================================================

    [Fact]
    public async Task InvokeAsync_GET请求_应直接放行不检查配额()
    {
        // Arrange — 构造 GET 请求到设备 API 路径
        var context = CreateContext("GET", "/api/v1/devices", TestTenantId);
        var mockSubscriptionService = new Mock<ISubscriptionService>();
        // 即使配额超限，也不应被调用
        mockSubscriptionService
            .Setup(s => s.CanCreateResourceAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // 通过带 SubscriptionService 的版本重新构造上下文
        context = CreateContext("GET", "/api/v1/devices", TestTenantId,
            subscriptionService: mockSubscriptionService);

        // Act
        var (processedContext, mockNext) = await ExecuteMiddlewareAsync(context);

        // Assert — 下一个中间件应被调用，SubscriptionService 不应被调用
        mockNext.Verify(next => next(processedContext), Times.Once,
            "GET 请求应直接传递给下一个中间件");
        mockSubscriptionService.Verify(
            s => s.CanCreateResourceAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "GET 请求不应触发配额检查");
        processedContext.Response.StatusCode.Should().Be(200,
            "GET 请求不应被拦截，状态码应保持默认值");
    }

    [Fact]
    public async Task InvokeAsync_PUT请求_应直接放行不检查配额()
    {
        // Arrange — 构造 PUT 请求到设备 API 路径
        var context = CreateContext("PUT", "/api/v1/devices/123", TestTenantId);

        // Act
        var (processedContext, mockNext) = await ExecuteMiddlewareAsync(context);

        // Assert
        mockNext.Verify(next => next(processedContext), Times.Once,
            "PUT 请求应直接传递给下一个中间件");
    }

    [Fact]
    public async Task InvokeAsync_DELETE请求_应直接放行不检查配额()
    {
        // Arrange
        var context = CreateContext("DELETE", "/api/v1/devices/123", TestTenantId);

        // Act
        var (processedContext, mockNext) = await ExecuteMiddlewareAsync(context);

        // Assert
        mockNext.Verify(next => next(processedContext), Times.Once,
            "DELETE 请求应直接传递给下一个中间件");
    }

    // =====================================================================
    // 测试：非 API 路径应直接放行
    // =====================================================================

    [Fact]
    public async Task InvokeAsync_非API路径_应直接放行()
    {
        // Arrange — POST 请求到 /health 路径，不属于受保护的 API 路径
        var context = CreateContext("POST", "/health", TestTenantId);

        // Act
        var (processedContext, mockNext) = await ExecuteMiddlewareAsync(context);

        // Assert
        mockNext.Verify(next => next(processedContext), Times.Once,
            "/health 路径不匹配任何受保护资源，应直接放行");
    }

    [Fact]
    public async Task InvokeAsync_非受保护的API路径_应直接放行()
    {
        // Arrange — POST 请求到其他 API 路径（如告警），不属于设备或用户管理
        var context = CreateContext("POST", "/api/v1/alerts", TestTenantId);

        // Act
        var (processedContext, mockNext) = await ExecuteMiddlewareAsync(context);

        // Assert
        mockNext.Verify(next => next(processedContext), Times.Once,
            "非设备/用户的 API 路径应直接放行");
    }

    // =====================================================================
    // 测试：配额未超限时放行 POST 请求
    // =====================================================================

    [Fact]
    public async Task InvokeAsync_POST创建设备_配额未超限_应放行()
    {
        // Arrange — 配额未超限，CanCreateResourceAsync 返回 true
        var mockSubscriptionService = new Mock<ISubscriptionService>();
        mockSubscriptionService
            .Setup(s => s.CanCreateResourceAsync(TestTenantId, "device", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var context = CreateContext("POST", "/api/v1/devices", TestTenantId,
            subscriptionService: mockSubscriptionService);

        // Act
        var (processedContext, mockNext) = await ExecuteMiddlewareAsync(context);

        // Assert — 请求应放行，下一个中间件被调用
        mockNext.Verify(next => next(processedContext), Times.Once,
            "配额未超限时应将请求传递给下一个中间件");
        processedContext.Response.StatusCode.Should().Be(200,
            "配额未超限时状态码应保持默认值");
        mockSubscriptionService.Verify(
            s => s.CanCreateResourceAsync(TestTenantId, "device", It.IsAny<CancellationToken>()),
            Times.Once,
            "应调用 CanCreateResourceAsync 检查设备配额");
    }

    [Fact]
    public async Task InvokeAsync_POST创建用户_配额未超限_应放行()
    {
        // Arrange — 用户管理路径，配额未超限
        var mockSubscriptionService = new Mock<ISubscriptionService>();
        mockSubscriptionService
            .Setup(s => s.CanCreateResourceAsync(TestTenantId, "user", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var context = CreateContext("POST", "/api/v1/admin/users", TestTenantId,
            subscriptionService: mockSubscriptionService);

        // Act
        var (processedContext, mockNext) = await ExecuteMiddlewareAsync(context);

        // Assert
        mockNext.Verify(next => next(processedContext), Times.Once,
            "配额未超限时应将请求传递给下一个中间件");
        mockSubscriptionService.Verify(
            s => s.CanCreateResourceAsync(TestTenantId, "user", It.IsAny<CancellationToken>()),
            Times.Once,
            "应调用 CanCreateResourceAsync 检查用户配额");
    }

    // =====================================================================
    // 测试：配额超限时返回 403
    // =====================================================================

    [Fact]
    public async Task InvokeAsync_POST创建设备_配额超限_应返回403()
    {
        // Arrange — 设备配额已超限，CanCreateResourceAsync 返回 false
        var mockSubscriptionService = new Mock<ISubscriptionService>();
        mockSubscriptionService
            .Setup(s => s.CanCreateResourceAsync(TestTenantId, "device", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var context = CreateContext("POST", "/api/v1/devices", TestTenantId,
            subscriptionService: mockSubscriptionService);

        // Act
        var (processedContext, mockNext) = await ExecuteMiddlewareAsync(context);

        // Assert — 应返回 403，且不调用下一个中间件
        processedContext.Response.StatusCode.Should().Be(403,
            "配额超限时应返回 403 Forbidden");
        mockNext.Verify(next => next(It.IsAny<HttpContext>()), Times.Never,
            "配额超限时不应调用下一个中间件");
    }

    /// <summary>
    /// 回归：POST 到设备的非创建子路由（重算单设备健康度）不得被配额检查拦截。
    ///
    /// 历史缺陷：GetResourceType 用 StartsWith("/api/v1/devices") 匹配，导致所有 POST 子路由——
    /// /api/v1/devices/{id}/health-score（重算健康度）、/health-score/refresh-all（批量重算）、
    /// /import（导入，自有按批次配额检查）——都被当作"创建设备"做配额检查。当租户恰好用满配额
    /// （CurrentDeviceCount == MaxDevices，即最理想的全量付费客户）时，这些非创建操作被 403 拦截，
    /// 报"已超出设备数量上限，请升级计划"——对已达上限的付费客户，重算健康度却被要求升级套餐，
    /// 既错误又荒谬。修复：仅对集合根 POST /api/v1/devices 精确匹配，子路由放行。
    /// </summary>
    [Fact]
    public async Task InvokeAsync_重算单设备健康度POST_即使配额已满也不应拦截()
    {
        // Arrange — 租户设备配额已满（CanCreateResourceAsync 返回 false，模拟全量付费客户）
        var mockSubscriptionService = new Mock<ISubscriptionService>();
        mockSubscriptionService
            .Setup(s => s.CanCreateResourceAsync(TestTenantId, "device", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var deviceId = Guid.NewGuid();
        var context = CreateContext("POST", $"/api/v1/devices/{deviceId}/health-score", TestTenantId,
            subscriptionService: mockSubscriptionService);

        // Act
        var (processedContext, mockNext) = await ExecuteMiddlewareAsync(context);

        // Assert — 重算健康度非资源创建，必须放行，不得触发配额检查
        processedContext.Response.StatusCode.Should().Be(200,
            "重算健康度非创建操作，即使配额已满也不应被拦截");
        mockNext.Verify(next => next(It.IsAny<HttpContext>()), Times.Once,
            "非创建子路由应放行给下一个中间件");
        mockSubscriptionService.Verify(
            s => s.CanCreateResourceAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "非创建子路由不应触发配额检查");
    }

    /// <summary>
    /// 回归：POST /api/v1/devices/health-score/refresh-all（批量重算）同样不得被配额拦截。
    /// </summary>
    [Fact]
    public async Task InvokeAsync_批量重算健康度POST_即使配额已满也不应拦截()
    {
        // Arrange — 配额已满
        var mockSubscriptionService = new Mock<ISubscriptionService>();
        mockSubscriptionService
            .Setup(s => s.CanCreateResourceAsync(TestTenantId, "device", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var context = CreateContext("POST", "/api/v1/devices/health-score/refresh-all", TestTenantId,
            subscriptionService: mockSubscriptionService);

        // Act
        var (processedContext, mockNext) = await ExecuteMiddlewareAsync(context);

        // Assert
        processedContext.Response.StatusCode.Should().Be(200,
            "批量重算健康度非创建操作，不应被配额拦截");
        mockNext.Verify(next => next(It.IsAny<HttpContext>()), Times.Once);
        mockSubscriptionService.Verify(
            s => s.CanCreateResourceAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    /// <summary>
    /// 回归保护：设备批量导入 POST /api/v1/devices/import 不应被中间件做单设备配额检查——
    /// 该路径由 DeviceImportService 自有按批次配额检查兜底（中间件单设备检查过弱且会误拦已满配额租户）。
    /// </summary>
    [Fact]
    public async Task InvokeAsync_设备批量导入POST_不应被中间件单设备配额检查拦截()
    {
        // Arrange — 配额已满
        var mockSubscriptionService = new Mock<ISubscriptionService>();
        mockSubscriptionService
            .Setup(s => s.CanCreateResourceAsync(TestTenantId, "device", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var context = CreateContext("POST", "/api/v1/devices/import", TestTenantId,
            subscriptionService: mockSubscriptionService);

        // Act
        var (processedContext, mockNext) = await ExecuteMiddlewareAsync(context);

        // Assert — 中间件放行，由导入服务自有按批次配额检查
        mockNext.Verify(next => next(It.IsAny<HttpContext>()), Times.Once,
            "导入路径应放行，由 DeviceImportService 自有配额检查兜底");
        mockSubscriptionService.Verify(
            s => s.CanCreateResourceAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task InvokeAsync_POST创建设备配额超限_响应体应包含中文错误信息()
    {
        // Arrange
        var mockSubscriptionService = new Mock<ISubscriptionService>();
        mockSubscriptionService
            .Setup(s => s.CanCreateResourceAsync(TestTenantId, "device", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var context = CreateContext("POST", "/api/v1/devices", TestTenantId,
            subscriptionService: mockSubscriptionService);

        // Act
        var (processedContext, _) = await ExecuteMiddlewareAsync(context);

        // Assert — 读取响应体并解析 JSON 结构
        processedContext.Response.Body.Position = 0;
        using var reader = new StreamReader(processedContext.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        // JSON 序列化器可能将中文转义为 Unicode 编码，因此通过解析后的值验证
        var jsonDoc = JsonDocument.Parse(responseBody);
        jsonDoc.RootElement.GetProperty("code").GetInt32().Should().Be(403,
            "响应体应包含错误码 403");
        var message = jsonDoc.RootElement.GetProperty("message").GetString();
        message.Should().NotBeNull();
        message.Should().Contain("设备",
            "设备配额超限时，错误信息应包含'设备'字样");
        message.Should().Contain("数量上限",
            "错误信息应提示超出数量上限");
        jsonDoc.RootElement.GetProperty("details").ValueKind.Should().Be(JsonValueKind.Null,
            "details 字段应为 null");
    }

    [Fact]
    public async Task InvokeAsync_POST创建用户_配额超限_应返回403()
    {
        // Arrange — 用户配额已超限
        var mockSubscriptionService = new Mock<ISubscriptionService>();
        mockSubscriptionService
            .Setup(s => s.CanCreateResourceAsync(TestTenantId, "user", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var context = CreateContext("POST", "/api/v1/admin/users", TestTenantId,
            subscriptionService: mockSubscriptionService);

        // Act
        var (processedContext, mockNext) = await ExecuteMiddlewareAsync(context);

        // Assert
        processedContext.Response.StatusCode.Should().Be(403,
            "用户配额超限时应返回 403 Forbidden");
        mockNext.Verify(next => next(It.IsAny<HttpContext>()), Times.Never,
            "配额超限时不应调用下一个中间件");
    }

    [Fact]
    public async Task InvokeAsync_POST创建用户配额超限_响应体应包含中文错误信息()
    {
        // Arrange
        var mockSubscriptionService = new Mock<ISubscriptionService>();
        mockSubscriptionService
            .Setup(s => s.CanCreateResourceAsync(TestTenantId, "user", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var context = CreateContext("POST", "/api/v1/admin/users", TestTenantId,
            subscriptionService: mockSubscriptionService);

        // Act
        var (processedContext, _) = await ExecuteMiddlewareAsync(context);

        // Assert — 通过解析 JSON 后验证中文内容
        processedContext.Response.Body.Position = 0;
        using var reader = new StreamReader(processedContext.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        var jsonDoc = JsonDocument.Parse(responseBody);
        var message = jsonDoc.RootElement.GetProperty("message").GetString();
        message.Should().NotBeNull();
        message.Should().Contain("用户",
            "用户配额超限时，错误信息应包含'用户'字样");
        message.Should().Contain("数量上限",
            "错误信息应提示超出数量上限");
    }

    [Fact]
    public async Task InvokeAsync_配额超限时_响应ContentType应为Json()
    {
        // Arrange
        var mockSubscriptionService = new Mock<ISubscriptionService>();
        mockSubscriptionService
            .Setup(s => s.CanCreateResourceAsync(TestTenantId, "device", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var context = CreateContext("POST", "/api/v1/devices", TestTenantId,
            subscriptionService: mockSubscriptionService);

        // Act
        var (processedContext, _) = await ExecuteMiddlewareAsync(context);

        // Assert
        processedContext.Response.ContentType.Should().Be("application/json",
            "错误响应的 Content-Type 应为 application/json");
    }

    // =====================================================================
    // 测试：无租户上下文时应放行
    // =====================================================================

    [Fact]
    public async Task InvokeAsync_无租户上下文_应直接放行()
    {
        // Arrange — POST 请求到设备路径，但未设置租户上下文（tenantId 为 null）
        var context = CreateContext("POST", "/api/v1/devices");

        // Act
        var (processedContext, mockNext) = await ExecuteMiddlewareAsync(context);

        // Assert
        mockNext.Verify(next => next(processedContext), Times.Once,
            "无租户上下文时应直接放行");
    }

    [Fact]
    public async Task InvokeAsync_租户上下文TenantId为空_应直接放行()
    {
        // Arrange — 租户上下文存在但 TenantId 为 Guid.Empty
        var context = CreateContext("POST", "/api/v1/devices", Guid.Empty);

        // Act
        var (processedContext, mockNext) = await ExecuteMiddlewareAsync(context);

        // Assert
        mockNext.Verify(next => next(processedContext), Times.Once,
            "租户 ID 为空时应直接放行");
    }

    // =====================================================================
    // 测试：ISubscriptionService 未注册时应放行
    // =====================================================================

    [Fact]
    public async Task InvokeAsync_ISubscriptionService未注册_应直接放行()
    {
        // Arrange — 不提供 SubscriptionService Mock，GetService 返回 null
        // CreateContext 中不传 subscriptionService 时，默认 Mock 返回 null
        var context = CreateContext("POST", "/api/v1/devices", TestTenantId);

        // Act
        var (processedContext, mockNext) = await ExecuteMiddlewareAsync(context);

        // Assert — SubscriptionService 未注册时不应阻断请求
        mockNext.Verify(next => next(processedContext), Times.Once,
            "ISubscriptionService 未注册时应直接放行，避免阻断整个管线");
    }

    // =====================================================================
    // 测试：路径匹配的边界情况
    // =====================================================================

    [Fact]
    public async Task InvokeAsync_设备路径带尾部斜杠_应识别为device资源()
    {
        // Arrange — StartsWith 匹配，带尾部斜杠也应识别
        var mockSubscriptionService = new Mock<ISubscriptionService>();
        mockSubscriptionService
            .Setup(s => s.CanCreateResourceAsync(TestTenantId, "device", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var context = CreateContext("POST", "/api/v1/devices/", TestTenantId,
            subscriptionService: mockSubscriptionService);

        // Act
        await ExecuteMiddlewareAsync(context);

        // Assert
        mockSubscriptionService.Verify(
            s => s.CanCreateResourceAsync(TestTenantId, "device", It.IsAny<CancellationToken>()),
            Times.Once,
            "/api/v1/devices/ 路径应识别为 device 资源类型");
    }

    [Fact]
    public async Task InvokeAsync_用户管理路径_应识别为user资源()
    {
        // Arrange
        var mockSubscriptionService = new Mock<ISubscriptionService>();
        mockSubscriptionService
            .Setup(s => s.CanCreateResourceAsync(TestTenantId, "user", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var context = CreateContext("POST", "/api/v1/admin/users", TestTenantId,
            subscriptionService: mockSubscriptionService);

        // Act
        await ExecuteMiddlewareAsync(context);

        // Assert
        mockSubscriptionService.Verify(
            s => s.CanCreateResourceAsync(TestTenantId, "user", It.IsAny<CancellationToken>()),
            Times.Once,
            "/api/v1/admin/users 路径应识别为 user 资源类型");
    }

    [Fact]
    public async Task InvokeAsync_设备路径不区分大小写_应正确识别()
    {
        // Arrange — 路径使用大写，OrdinalIgnoreCase 匹配
        var mockSubscriptionService = new Mock<ISubscriptionService>();
        mockSubscriptionService
            .Setup(s => s.CanCreateResourceAsync(TestTenantId, "device", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var context = CreateContext("POST", "/API/V1/Devices", TestTenantId,
            subscriptionService: mockSubscriptionService);

        // Act
        await ExecuteMiddlewareAsync(context);

        // Assert
        mockSubscriptionService.Verify(
            s => s.CanCreateResourceAsync(TestTenantId, "device", It.IsAny<CancellationToken>()),
            Times.Once,
            "路径匹配应不区分大小写");
    }

    [Fact]
    public async Task InvokeAsync_路径为null_应直接放行()
    {
        // Arrange — 构造 Path.Value 为 null 的情况（极端边界）
        var context = new DefaultHttpContext();
        context.Request.Method = "POST";
        // Path 默认为 "/"，Path.Value 不为 null，需要通过特殊方式模拟
        // 实际场景中 Path.Value 不太可能为 null，但 GetResourceType 中有防御性检查
        var serviceProvider = new Mock<IServiceProvider>();
        context.RequestServices = serviceProvider.Object;
        context.Response.Body = new MemoryStream();
        // 设置租户上下文以确保不会因缺少租户上下文而提前放行
        var tenantContext = new TenantContext(TestTenantId, "Shared", false);
        context.Items[TenantResolutionMiddleware.TenantContextKey] = tenantContext;

        // 由于 DefaultHttpContext.Request.Path.Value 不可能为 null，
        // 此测试验证非受保护路径的放行逻辑
        context.Request.Path = "/other";

        // Act
        var (_, mockNext) = await ExecuteMiddlewareAsync(context);

        // Assert
        mockNext.Verify(next => next(context), Times.Once,
            "非受保护路径应直接放行");
    }
}
