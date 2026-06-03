using System.Security.Claims;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Middleware;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;

namespace EquipAI.Tests.Unit.Middleware;

/// <summary>
/// TenantResolutionMiddleware 单元测试
/// 验证从 JWT Claims 中提取 tenant_id/user_id/role 并存入 HttpContext.Items 的逻辑
/// </summary>
public class TenantResolutionMiddlewareTests
{
    /// <summary>
    /// 测试用固定 GUID，模拟 JWT 中的 tenant_id
    /// </summary>
    private static readonly Guid TestTenantId = Guid.Parse("11111111-2222-3333-4444-555555555555");

    /// <summary>
    /// 测试用固定 GUID，模拟 JWT 中的 user_id（NameIdentifier）
    /// </summary>
    private static readonly Guid TestUserId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    /// <summary>
    /// 辅助方法：构建已认证的 HttpContext，携带指定的 Claims
    /// </summary>
    /// <param name="tenantId">租户 ID，传 null 则不添加 tenant_id Claim</param>
    /// <param name="userId">用户 ID，传 null 则不添加 NameIdentifier Claim</param>
    /// <param name="role">用户角色，传 null 则不添加 role Claim</param>
    /// <returns>构造好的 DefaultHttpContext</returns>
    private static DefaultHttpContext CreateAuthenticatedContext(
        Guid? tenantId = null,
        Guid? userId = null,
        string? role = null)
    {
        var context = new DefaultHttpContext();
        var claims = new List<Claim>();

        if (tenantId.HasValue)
        {
            claims.Add(new Claim("tenant_id", tenantId.Value.ToString()));
        }

        if (userId.HasValue)
        {
            claims.Add(new Claim(ClaimTypes.NameIdentifier, userId.Value.ToString()));
        }

        if (role is not null)
        {
            claims.Add(new Claim("role", role));
        }

        var identity = new ClaimsIdentity(claims, "TestAuthType");
        context.User = new ClaimsPrincipal(identity);

        return context;
    }

    /// <summary>
    /// 辅助方法：构建未认证的 HttpContext（无 Identity）
    /// </summary>
    private static DefaultHttpContext CreateUnauthenticatedContext()
    {
        var context = new DefaultHttpContext();
        // 默认的 ClaimsPrincipal 没有已认证的 Identity
        context.User = new ClaimsPrincipal();
        return context;
    }

    /// <summary>
    /// 辅助方法：执行中间件并返回处理后的 HttpContext，同时验证下一个中间件被调用
    /// </summary>
    /// <param name="context">传入的 HTTP 上下文</param>
    /// <param name="verifyNextCalled">是否验证下一个中间件被调用，默认 true</param>
    /// <returns>经过中间件处理后的 HttpContext</returns>
    private static async Task<(HttpContext Context, Mock<RequestDelegate> MockNext)> ExecuteMiddlewareAsync(
        HttpContext context, bool verifyNextCalled = true)
    {
        var mockNext = new Mock<RequestDelegate>();
        mockNext
            .Setup(next => next(It.IsAny<HttpContext>()))
            .Returns(Task.CompletedTask);

        var logger = Mock.Of<ILogger<TenantResolutionMiddleware>>();
        var middleware = new TenantResolutionMiddleware(mockNext.Object, logger);

        await middleware.InvokeAsync(context);

        if (verifyNextCalled)
        {
            mockNext.Verify(next => next(context), Times.Once,
                "中间件应始终将请求传递给管道中的下一个中间件");
        }

        return (context, mockNext);
    }

    // =====================================================================
    // 测试：有 JWT Claims 时应创建租户上下文
    // =====================================================================

    [Fact]
    public async Task InvokeAsync_有JWT_Claims时_应创建租户上下文并存入Items()
    {
        // Arrange — 构造携带完整 Claims 的已认证上下文
        var context = CreateAuthenticatedContext(
            tenantId: TestTenantId,
            userId: TestUserId,
            role: UserRole.Operator.ToString());

        // Act
        var (processedContext, _) = await ExecuteMiddlewareAsync(context);

        // Assert — 验证 HttpContext.Items 中包含 TenantContext
        processedContext.Items
            .Should().ContainKey(TenantResolutionMiddleware.TenantContextKey,
                "因为已认证用户携带有效的 tenant_id Claim，应创建租户上下文");
    }

    [Fact]
    public async Task InvokeAsync_有JWT_Claims时_租户上下文的TenantId应与Claim一致()
    {
        // Arrange
        var context = CreateAuthenticatedContext(
            tenantId: TestTenantId,
            userId: TestUserId,
            role: UserRole.Operator.ToString());

        // Act
        var (processedContext, _) = await ExecuteMiddlewareAsync(context);

        // Assert
        var tenantContext = processedContext.Items[TenantResolutionMiddleware.TenantContextKey] as ITenantContext;
        tenantContext.Should().NotBeNull();
        tenantContext!.TenantId.Should().Be(TestTenantId,
            "因为 TenantId 应从 JWT 的 tenant_id Claim 中解析");
    }

    [Fact]
    public async Task InvokeAsync_有JWT_Claims时_租户上下文的UserId应与Claim一致()
    {
        // Arrange
        var context = CreateAuthenticatedContext(
            tenantId: TestTenantId,
            userId: TestUserId,
            role: UserRole.Operator.ToString());

        // Act
        var (processedContext, _) = await ExecuteMiddlewareAsync(context);

        // Assert
        var tenantContext = processedContext.Items[TenantResolutionMiddleware.TenantContextKey] as ITenantContext;
        tenantContext.Should().NotBeNull();
        tenantContext!.UserId.Should().Be(TestUserId,
            "因为 UserId 应从 JWT 的 NameIdentifier Claim 中解析");
    }

    // =====================================================================
    // 测试：system_admin 角色应标记为管理员
    // =====================================================================

    [Fact]
    public async Task InvokeAsync_system_admin角色_应标记IsSystemAdmin为true()
    {
        // Arrange — 使用 SystemAdmin 角色构造已认证上下文
        var context = CreateAuthenticatedContext(
            tenantId: TestTenantId,
            userId: TestUserId,
            role: UserRole.SystemAdmin.ToString());

        // Act
        var (processedContext, _) = await ExecuteMiddlewareAsync(context);

        // Assert
        var tenantContext = processedContext.Items[TenantResolutionMiddleware.TenantContextKey] as ITenantContext;
        tenantContext.Should().NotBeNull();
        tenantContext!.IsSystemAdmin.Should().BeTrue(
            "因为 role Claim 为 SystemAdmin 时，应标记为系统管理员");
    }

    [Fact]
    public async Task InvokeAsync_非system_admin角色_应标记IsSystemAdmin为false()
    {
        // Arrange — 使用 MaintenanceLead 角色构造已认证上下文
        var context = CreateAuthenticatedContext(
            tenantId: TestTenantId,
            userId: TestUserId,
            role: UserRole.MaintenanceLead.ToString());

        // Act
        var (processedContext, _) = await ExecuteMiddlewareAsync(context);

        // Assert
        var tenantContext = processedContext.Items[TenantResolutionMiddleware.TenantContextKey] as ITenantContext;
        tenantContext.Should().NotBeNull();
        tenantContext!.IsSystemAdmin.Should().BeFalse(
            "因为 role Claim 不是 SystemAdmin 时，不应标记为系统管理员");
    }

    // =====================================================================
    // 测试：未认证用户不应创建租户上下文
    // =====================================================================

    [Fact]
    public async Task InvokeAsync_未认证用户_不应创建租户上下文()
    {
        // Arrange — 构造未认证的上下文
        var context = CreateUnauthenticatedContext();

        // Act
        var (processedContext, _) = await ExecuteMiddlewareAsync(context);

        // Assert — 未认证用户的 HttpContext.Items 中不应有 TenantContext
        processedContext.Items
            .Should().NotContainKey(TenantResolutionMiddleware.TenantContextKey,
                "因为未认证用户（如访问登录接口）不需要租户上下文");
    }

    // =====================================================================
    // 测试：已认证但无 tenant_id Claim 时不应创建租户上下文
    // =====================================================================

    [Fact]
    public async Task InvokeAsync_已认证但无tenant_id_Claim_不应创建租户上下文()
    {
        // Arrange — 已认证但只有 user_id，没有 tenant_id
        var context = CreateAuthenticatedContext(
            tenantId: null,
            userId: TestUserId,
            role: UserRole.Operator.ToString());

        // Act
        var (processedContext, _) = await ExecuteMiddlewareAsync(context);

        // Assert — 缺少 tenant_id 时不应创建租户上下文
        processedContext.Items
            .Should().NotContainKey(TenantResolutionMiddleware.TenantContextKey,
                "因为已认证用户缺少有效的 tenant_id，无法确定租户归属");
    }

    // =====================================================================
    // 测试：无 role Claim 时 IsSystemAdmin 应为 false
    // =====================================================================

    [Fact]
    public async Task InvokeAsync_无role_Claim_应标记IsSystemAdmin为false()
    {
        // Arrange — 有 tenant_id 和 user_id，但没有 role Claim
        var context = CreateAuthenticatedContext(
            tenantId: TestTenantId,
            userId: TestUserId,
            role: null);

        // Act
        var (processedContext, _) = await ExecuteMiddlewareAsync(context);

        // Assert
        var tenantContext = processedContext.Items[TenantResolutionMiddleware.TenantContextKey] as ITenantContext;
        tenantContext.Should().NotBeNull();
        tenantContext!.IsSystemAdmin.Should().BeFalse(
            "因为没有 role Claim，默认不应为系统管理员");
    }

    // =====================================================================
    // 测试：应始终调用下一个中间件
    // =====================================================================

    [Fact]
    public async Task InvokeAsync_未认证用户_仍应调用下一个中间件()
    {
        // Arrange
        var context = CreateUnauthenticatedContext();

        // Act — ExecuteMiddlewareAsync 内部会验证下一个中间件被调用
        await ExecuteMiddlewareAsync(context);
    }

    [Fact]
    public async Task InvokeAsync_已认证用户_应调用下一个中间件()
    {
        // Arrange
        var context = CreateAuthenticatedContext(
            tenantId: TestTenantId,
            userId: TestUserId,
            role: UserRole.Viewer.ToString());

        // Act — ExecuteMiddlewareAsync 内部会验证下一个中间件被调用
        await ExecuteMiddlewareAsync(context);
    }

    // =====================================================================
    // 测试：X-Tenant-Id 请求头作为备用来源
    // =====================================================================

    [Fact]
    public async Task InvokeAsync_JWT中无tenant_id时_应从XTenantId请求头获取()
    {
        // Arrange — 已认证但 JWT 中没有 tenant_id，请求头中携带 X-Tenant-Id
        var context = CreateAuthenticatedContext(
            tenantId: null,
            userId: TestUserId,
            role: UserRole.Operator.ToString());
        context.Request.Headers["X-Tenant-Id"] = TestTenantId.ToString();

        // Act
        var (processedContext, _) = await ExecuteMiddlewareAsync(context);

        // Assert — 应从请求头中解析 tenant_id 并创建租户上下文
        var tenantContext = processedContext.Items[TenantResolutionMiddleware.TenantContextKey] as ITenantContext;
        tenantContext.Should().NotBeNull();
        tenantContext!.TenantId.Should().Be(TestTenantId,
            "因为 JWT 中无 tenant_id 时，应回退到 X-Tenant-Id 请求头");
    }

    // =====================================================================
    // 测试：IsolationMode 应始终为 Shared
    // =====================================================================

    [Fact]
    public async Task InvokeAsync_创建租户上下文时_IsolationMode应为Shared()
    {
        // Arrange
        var context = CreateAuthenticatedContext(
            tenantId: TestTenantId,
            userId: TestUserId,
            role: UserRole.Operator.ToString());

        // Act
        var (processedContext, _) = await ExecuteMiddlewareAsync(context);

        // Assert
        var tenantContext = processedContext.Items[TenantResolutionMiddleware.TenantContextKey] as ITenantContext;
        tenantContext.Should().NotBeNull();
        tenantContext!.IsolationMode.Should().Be(TenantIsolationMode.Shared.ToString(),
            "因为当前阶段使用共享数据库行级隔离模式");
    }
}
