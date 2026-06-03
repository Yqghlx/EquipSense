# 后端测试补充（T1 中间件+Hub + T2 控制器集成测试）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补充后端中间件单元测试和控制器集成测试，从 301 个用例增加到 ~480 个

**Architecture:** 中间件测试使用 DefaultHttpContext + Mock<RequestDelegate> 模拟管道；控制器集成测试复用 CustomWebApplicationFactory + SharedTestCollection；Hub 测试使用 Mock<IGroupManager> 模拟 SignalR 基础设施

**Tech Stack:** xUnit, Moq, FluentAssertions, WebApplicationFactory, InMemory EF Core

---

## 文件结构

**新建文件：**
- `tests/EquipAI.Tests.Unit/Middleware/SecurityHeadersMiddlewareTests.cs`
- `tests/EquipAI.Tests.Unit/Middleware/ExceptionHandlingMiddlewareTests.cs`
- `tests/EquipAI.Tests.Unit/Middleware/TenantResolutionMiddlewareTests.cs`
- `tests/EquipAI.Tests.Unit/Middleware/UsageLimitMiddlewareTests.cs`
- `tests/EquipAI.Tests.Unit/Middleware/PermissionMiddlewareTests.cs`
- `tests/EquipAI.Tests.Unit/Hubs/IndustrialHubTests.cs`
- `tests/EquipAI.Tests.Integration/Controllers/UsersControllerTests.cs`
- `tests/EquipAI.Tests.Integration/Controllers/TenantsControllerTests.cs`
- `tests/EquipAI.Tests.Integration/Controllers/TelemetryControllerTests.cs`
- `tests/EquipAI.Tests.Integration/Controllers/KnowledgeControllerTests.cs`
- `tests/EquipAI.Tests.Integration/Controllers/AlertsControllerTests.cs`
- `tests/EquipAI.Tests.Integration/Controllers/AnalysesControllerTests.cs`
- `tests/EquipAI.Tests.Integration/Controllers/ApprovalChainsControllerTests.cs`
- `tests/EquipAI.Tests.Integration/Controllers/DispatchControllerTests.cs`
- `tests/EquipAI.Tests.Integration/Controllers/PushSubscriptionsControllerTests.cs`
- `tests/EquipAI.Tests.Integration/Controllers/SystemControllerTests.cs`

---

### Task 1: SecurityHeadersMiddleware 单元测试

**Files:**
- Create: `tests/EquipAI.Tests.Unit/Middleware/SecurityHeadersMiddlewareTests.cs`
- Reference: `src/EquipAI.Infrastructure/Middleware/SecurityHeadersMiddleware.cs`

- [ ] **Step 1: 创建测试文件**

创建 `tests/EquipAI.Tests.Unit/Middleware/SecurityHeadersMiddlewareTests.cs`：

```csharp
using EquipAI.Infrastructure.Middleware;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Moq;

namespace EquipAI.Tests.Unit.Middleware;

public class SecurityHeadersMiddlewareTests
{
    private readonly Mock<RequestDelegate> _nextMock;

    public SecurityHeadersMiddlewareTests()
    {
        _nextMock = new Mock<RequestDelegate>();
        _nextMock.Setup(n => n(It.IsAny<HttpContext>())).Returns(Task.CompletedTask);
    }

    [Fact]
    public async Task InvokeAsync_应添加所有安全响应头()
    {
        // Arrange
        var middleware = new SecurityHeadersMiddleware(_nextMock.Object);
        var context = new DefaultHttpContext();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.Headers.Should().ContainKey("X-Content-Type-Options");
        context.Response.Headers["X-Content-Type-Options"].Should().BeEquivalentTo("nosniff");

        context.Response.Headers.Should().ContainKey("X-Frame-Options");
        context.Response.Headers["X-Frame-Options"].Should().BeEquivalentTo("DENY");

        context.Response.Headers.Should().ContainKey("X-XSS-Protection");
        context.Response.Headers["X-XSS-Protection"].Should().BeEquivalentTo("1; mode=block");

        context.Response.Headers.Should().ContainKey("Referrer-Policy");
        context.Response.Headers["Referrer-Policy"].Should().BeEquivalentTo("strict-origin-when-cross-origin");

        context.Response.Headers.Should().ContainKey("Permissions-Policy");
        context.Response.Headers["Permissions-Policy"].Should().BeEquivalentTo("camera=(), microphone=(), geolocation=(), payment=()");

        context.Response.Headers.Should().ContainKey("X-Permitted-Cross-Domain-Policies");
        context.Response.Headers["X-Permitted-Cross-Domain-Policies"].Should().BeEquivalentTo("none");

        context.Response.Headers.Should().ContainKey("Cache-Control");
        context.Response.Headers["Cache-Control"].ToString().Should().Contain("no-store");
    }

    [Fact]
    public async Task InvokeAsync_应调用下一个中间件()
    {
        var middleware = new SecurityHeadersMiddleware(_nextMock.Object);
        var context = new DefaultHttpContext();

        await middleware.InvokeAsync(context);

        _nextMock.Verify(n => n(context), Times.Once);
    }
}
```

- [ ] **Step 2: 运行测试**

Run: `dotnet test tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj --filter "SecurityHeadersMiddleware" -v n`
Expected: 2 Passed

- [ ] **Step 3: 提交**

```bash
git add tests/EquipAI.Tests.Unit/Middleware/SecurityHeadersMiddlewareTests.cs
git commit -m "test: 添加 SecurityHeadersMiddleware 单元测试"
```

---

### Task 2: ExceptionHandlingMiddleware 单元测试

**Files:**
- Create: `tests/EquipAI.Tests.Unit/Middleware/ExceptionHandlingMiddlewareTests.cs`
- Reference: `src/EquipAI.Infrastructure/Middleware/ExceptionHandlingMiddleware.cs`

- [ ] **Step 1: 创建测试文件**

创建 `tests/EquipAI.Tests.Unit/Middleware/ExceptionHandlingMiddlewareTests.cs`：

```csharp
using EquipAI.Infrastructure.Middleware;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Text.Json;

namespace EquipAI.Tests.Unit.Middleware;

public class ExceptionHandlingMiddlewareTests
{
    private readonly Mock<RequestDelegate> _nextMock;

    public ExceptionHandlingMiddlewareTests()
    {
        _nextMock = new Mock<RequestDelegate>();
    }

    [Fact]
    public async Task InvokeAsync_无异常时应调用下一个中间件()
    {
        _nextMock.Setup(n => n(It.IsAny<HttpContext>())).Returns(Task.CompletedTask);
        var middleware = new ExceptionHandlingMiddleware(_nextMock.Object);
        var context = new DefaultHttpContext();

        await middleware.InvokeAsync(context);

        _nextMock.Verify(n => n(context), Times.Once);
        context.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
    }

    [Fact]
    public async Task InvokeAsync_UnauthorizedAccessException应返回401()
    {
        _nextMock.Setup(n => n(It.IsAny<HttpContext>()))
            .ThrowsAsync(new UnauthorizedAccessException("无权限"));
        var middleware = new ExceptionHandlingMiddleware(_nextMock.Object);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status401Unauthorized);
    }

    [Fact]
    public async Task InvokeAsync_KeyNotFoundException应返回404()
    {
        _nextMock.Setup(n => n(It.IsAny<HttpContext>()))
            .ThrowsAsync(new KeyNotFoundException("资源不存在"));
        var middleware = new ExceptionHandlingMiddleware(_nextMock.Object);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task InvokeAsync_InvalidOperationException应返回409()
    {
        _nextMock.Setup(n => n(It.IsAny<HttpContext>()))
            .ThrowsAsync(new InvalidOperationException("操作冲突"));
        var middleware = new ExceptionHandlingMiddleware(_nextMock.Object);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }

    [Fact]
    public async Task InvokeAsync_ArgumentException应返回400()
    {
        _nextMock.Setup(n => n(It.IsAny<HttpContext>()))
            .ThrowsAsync(new ArgumentException("参数无效"));
        var middleware = new ExceptionHandlingMiddleware(_nextMock.Object);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task InvokeAsync_未知异常应返回500()
    {
        _nextMock.Setup(n => n(It.IsAny<HttpContext>()))
            .ThrowsAsync(new Exception("未知错误"));
        var middleware = new ExceptionHandlingMiddleware(_nextMock.Object);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
    }

    [Fact]
    public async Task InvokeAsync_异常响应应为统一JSON格式()
    {
        _nextMock.Setup(n => n(It.IsAny<HttpContext>()))
            .ThrowsAsync(new KeyNotFoundException("测试"));
        var middleware = new ExceptionHandlingMiddleware(_nextMock.Object);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        context.Response.Body.Position = 0;
        using var reader = new StreamReader(context.Response.Body);
        var body = await reader.ReadToEndAsync();
        var json = JsonSerializer.Deserialize<JsonElement>(body);
        json.GetProperty("code").GetInt32().Should().Be(404);
        json.GetProperty("message").GetString().Should().NotBeNullOrEmpty();
    }
}
```

- [ ] **Step 2: 运行测试**

Run: `dotnet test tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj --filter "ExceptionHandlingMiddleware" -v n`
Expected: 7 Passed

- [ ] **Step 3: 提交**

```bash
git add tests/EquipAI.Tests.Unit/Middleware/ExceptionHandlingMiddlewareTests.cs
git commit -m "test: 添加 ExceptionHandlingMiddleware 单元测试"
```

---

### Task 3: TenantResolutionMiddleware 单元测试

**Files:**
- Create: `tests/EquipAI.Tests.Unit/Middleware/TenantResolutionMiddlewareTests.cs`
- Reference: `src/EquipAI.Infrastructure/Middleware/TenantResolutionMiddleware.cs`

- [ ] **Step 1: 创建测试文件**

创建 `tests/EquipAI.Tests.Unit/Middleware/TenantResolutionMiddlewareTests.cs`：

```csharp
using EquipAI.Infrastructure.Middleware;
using EquipAI.Infrastructure.Tenant;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;

namespace EquipAI.Tests.Unit.Middleware;

public class TenantResolutionMiddlewareTests
{
    private readonly Mock<RequestDelegate> _nextMock;

    public TenantResolutionMiddlewareTests()
    {
        _nextMock = new Mock<RequestDelegate>();
        _nextMock.Setup(n => n(It.IsAny<HttpContext>())).Returns(Task.CompletedTask);
    }

    [Fact]
    public async Task InvokeAsync_有JWT Claims时应创建租户上下文()
    {
        var tenantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var middleware = new TenantResolutionMiddleware(Mock.Of<ILogger<TenantResolutionMiddleware>>());
        var context = new DefaultHttpContext();
        context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim("tenant_id", tenantId.ToString()),
            new Claim("user_id", userId.ToString()),
            new Claim("role", "operator"),
        }, "Bearer"));

        await middleware.InvokeAsync(context);

        context.Items.Should().ContainKey(TenantResolutionMiddleware.TenantContextKey);
        var tenantCtx = context.Items[TenantResolutionMiddleware.TenantContextKey] as TenantContext;
        tenantCtx.Should().NotBeNull();
        tenantCtx!.TenantId.Should().Be(tenantId);
        tenantCtx.UserId.Should().Be(userId);
    }

    [Fact]
    public async Task InvokeAsync_system_admin角色应标记为管理员()
    {
        var tenantId = Guid.NewGuid();
        var middleware = new TenantResolutionMiddleware(Mock.Of<ILogger<TenantResolutionMiddleware>>());
        var context = new DefaultHttpContext();
        context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim("tenant_id", tenantId.ToString()),
            new Claim("user_id", Guid.NewGuid().ToString()),
            new Claim("role", "system_admin"),
        }, "Bearer"));

        await middleware.InvokeAsync(context);

        var tenantCtx = context.Items[TenantResolutionMiddleware.TenantContextKey] as TenantContext;
        tenantCtx.Should().NotBeNull();
        tenantCtx!.IsSystemAdmin.Should().BeTrue();
    }

    [Fact]
    public async Task InvokeAsync_未认证用户不应创建租户上下文()
    {
        var middleware = new TenantResolutionMiddleware(Mock.Of<ILogger<TenantResolutionMiddleware>>());
        var context = new DefaultHttpContext();
        context.User = new ClaimsPrincipal(); // 无身份

        await middleware.InvokeAsync(context);

        context.Items.Should().NotContainKey(TenantResolutionMiddleware.TenantContextKey);
    }

    [Fact]
    public async Task InvokeAsync_应始终调用下一个中间件()
    {
        var middleware = new TenantResolutionMiddleware(Mock.Of<ILogger<TenantResolutionMiddleware>>());
        var context = new DefaultHttpContext();

        await middleware.InvokeAsync(context);

        _nextMock.Verify(n => n(context), Times.Once);
    }
}
```

- [ ] **Step 2: 运行测试**

Run: `dotnet test tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj --filter "TenantResolutionMiddleware" -v n`
Expected: 4 Passed

- [ ] **Step 3: 提交**

```bash
git add tests/EquipAI.Tests.Unit/Middleware/TenantResolutionMiddlewareTests.cs
git commit -m "test: 添加 TenantResolutionMiddleware 单元测试"
```

---

### Task 4: UsageLimitMiddleware 单元测试

**Files:**
- Create: `tests/EquipAI.Tests.Unit/Middleware/UsageLimitMiddlewareTests.cs`
- Reference: `src/EquipAI.Infrastructure/Middleware/UsageLimitMiddleware.cs`

- [ ] **Step 1: 创建测试文件**

创建 `tests/EquipAI.Tests.Unit/Middleware/UsageLimitMiddlewareTests.cs`：

```csharp
using EquipAI.Application.Interfaces;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Middleware;
using EquipAI.Infrastructure.Tenant;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Moq;

namespace EquipAI.Tests.Unit.Middleware;

public class UsageLimitMiddlewareTests
{
    private readonly Mock<RequestDelegate> _nextMock;
    private readonly Mock<IServiceProvider> _serviceProviderMock;

    public UsageLimitMiddlewareTests()
    {
        _nextMock = new Mock<RequestDelegate>();
        _nextMock.Setup(n => n(It.IsAny<HttpContext>())).Returns(Task.CompletedTask);
        _serviceProviderMock = new Mock<IServiceProvider>();
    }

    private HttpContext CreateContext(string method, string path, bool isAdmin = false)
    {
        var tenantId = Guid.NewGuid();
        var context = new DefaultHttpContext();
        context.Request.Method = method;
        context.Request.Path = path;
        context.RequestServices = _serviceProviderMock.Object;
        context.Items[TenantResolutionMiddleware.TenantContextKey] = new TenantContext(
            tenantId, "Shared", isAdmin, Guid.NewGuid());

        var subscriptionMock = new Mock<ISubscriptionService>();
        subscriptionMock.Setup(s => s.CanCreateResourceAsync(It.IsAny<Guid>(), "device", default))
            .ReturnsAsync(true);
        subscriptionMock.Setup(s => s.CanCreateResourceAsync(It.IsAny<Guid>(), "user", default))
            .ReturnsAsync(false);
        _serviceProviderMock.Setup(sp => sp.GetService(typeof(ISubscriptionService)))
            .Returns(subscriptionMock.Object);

        return context;
    }

    [Fact]
    public async Task InvokeAsync_非POST请求应直接放行()
    {
        var middleware = new UsageLimitMiddleware(Mock.Of<ILogger<UsageLimitMiddleware>>());
        var context = CreateContext("GET", "/api/v1/devices");

        await middleware.InvokeAsync(context);

        _nextMock.Verify(n => n(context), Times.Once);
        context.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
    }

    [Fact]
    public async Task InvokeAsync_非API路径应直接放行()
    {
        var middleware = new UsageLimitMiddleware(Mock.Of<ILogger<UsageLimitMiddleware>>());
        var context = CreateContext("POST", "/health");

        await middleware.InvokeAsync(context);

        _nextMock.Verify(n => n(context), Times.Once);
    }

    [Fact]
    public async Task InvokeAsync_配额未超限时应放行POST()
    {
        var middleware = new UsageLimitMiddleware(Mock.Of<ILogger<UsageLimitMiddleware>>());
        var context = CreateContext("POST", "/api/v1/devices");

        await middleware.InvokeAsync(context);

        _nextMock.Verify(n => n(context), Times.Once);
        context.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
    }

    [Fact]
    public async Task InvokeAsync_配额超限时应返回403()
    {
        var middleware = new UsageLimitMiddleware(Mock.Of<ILogger<UsageLimitMiddleware>>());
        var context = CreateContext("POST", "/api/v1/admin/users");

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
        _nextMock.Verify(n => n(context), Times.Never);
    }

    [Fact]
    public async Task InvokeAsync_系统管理员应跳过配额检查()
    {
        var middleware = new UsageLimitMiddleware(Mock.Of<ILogger<UsageLimitMiddleware>>());
        var context = CreateContext("POST", "/api/v1/admin/users", isAdmin: true);

        await middleware.InvokeAsync(context);

        _nextMock.Verify(n => n(context), Times.Once);
    }
}
```

- [ ] **Step 2: 运行测试**

Run: `dotnet test tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj --filter "UsageLimitMiddleware" -v n`
Expected: 5 Passed

- [ ] **Step 3: 提交**

```bash
git add tests/EquipAI.Tests.Unit/Middleware/UsageLimitMiddlewareTests.cs
git commit -m "test: 添加 UsageLimitMiddleware 单元测试"
```

---

### Task 5: PermissionMiddleware 单元测试

**Files:**
- Create: `tests/EquipAI.Tests.Unit/Middleware/PermissionMiddlewareTests.cs`
- Reference: `src/EquipAI.WebAPI/Middleware/PermissionMiddleware.cs`, `src/EquipAI.Infrastructure/Middleware/RequirePermissionAttribute.cs`

- [ ] **Step 1: 创建测试文件**

创建 `tests/EquipAI.Tests.Unit/Middleware/PermissionMiddlewareTests.cs`：

```csharp
using EquipAI.Application.Services;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Middleware;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Moq;
using System.Security.Claims;

namespace EquipAI.Tests.Unit.Middleware;

public class PermissionMiddlewareTests
{
    private readonly Mock<RequestDelegate> _nextMock;

    public PermissionMiddlewareTests()
    {
        _nextMock = new Mock<RequestDelegate>();
        _nextMock.Setup(n => n(It.IsAny<HttpContext>())).Returns(Task.CompletedTask);
    }

    private HttpContext CreateContextWithPermission(string permission, string role)
    {
        var rbacMock = new Mock<IRbacService>();
        rbacMock.Setup(r => r.HasPermission(role, permission)).Returns(true);
        rbacMock.Setup(r => r.HasPermission("viewer", permission)).Returns(false);

        var spMock = new Mock<IServiceProvider>();
        spMock.Setup(sp => sp.GetService(typeof(IRbacService))).Returns(rbacMock.Object);

        var context = new DefaultHttpContext();
        context.RequestServices = spMock.Object;
        context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim("role", role),
        }, "Bearer"));

        var metadata = new List<object>();
        if (permission != null)
        {
            metadata.Add(new RequirePermissionAttribute(permission));
        }
        var endpoint = new Endpoint(
            _ => Task.CompletedTask,
            new EndpointMetadataCollection(metadata),
            "test");

        context.SetEndpoint(endpoint);
        return context;
    }

    [Fact]
    public async Task InvokeAsync_无权限要求时应直接放行()
    {
        var middleware = new PermissionMiddleware();
        var context = CreateContextWithPermission(null, "operator");

        await middleware.InvokeAsync(context);

        _nextMock.Verify(n => n(context), Times.Once);
    }

    [Fact]
    public async Task InvokeAsync_有权限时应放行()
    {
        var middleware = new PermissionMiddleware();
        var context = CreateContextWithPermission("device:create", "maintenance_lead");

        await middleware.InvokeAsync(context);

        _nextMock.Verify(n => n(context), Times.Once);
    }

    [Fact]
    public async Task InvokeAsync_无权限时应返回403()
    {
        var middleware = new PermissionMiddleware();
        var context = CreateContextWithPermission("device:create", "viewer");

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
        _nextMock.Verify(n => n(context), Times.Never);
    }
}
```

- [ ] **Step 2: 运行测试**

Run: `dotnet test tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj --filter "PermissionMiddleware" -v n`
Expected: 3 Passed

- [ ] **Step 3: 提交**

```bash
git add tests/EquipAI.Tests.Unit/Middleware/PermissionMiddlewareTests.cs
git commit -m "test: 添加 PermissionMiddleware 单元测试"
```

---

### Task 6: IndustrialHub 单元测试

**Files:**
- Create: `tests/EquipAI.Tests.Unit/Hubs/IndustrialHubTests.cs`
- Reference: `src/EquipAI.WebAPI/Hubs/IndustrialHub.cs`

- [ ] **Step 1: 创建测试文件**

创建 `tests/EquipAI.Tests.Unit/Hubs/IndustrialHubTests.cs`：

```csharp
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Tenant;
using EquipAI.WebAPI.Hubs;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Moq;

namespace EquipAI.Tests.Unit.Hubs;

public class IndustrialHubTests
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly Mock<ITenantContext> _tenantContextMock;
    private readonly Mock<IGroupManager> _groupsMock;
    private readonly Mock<HubCallerContext> _callerContextMock;
    private readonly string _connectionId = "test-connection-123";

    public IndustrialHubTests()
    {
        _tenantContextMock = new Mock<ITenantContext>();
        _tenantContextMock.Setup(t => t.TenantId).Returns(_tenantId);

        _groupsMock = new Mock<IGroupManager>();

        _callerContextMock = new Mock<HubCallerContext>();
        _callerContextMock.Setup(c => c.ConnectionId).Returns(_connectionId);
    }

    private IndustrialHub CreateHub()
    {
        var hub = new IndustrialHub(_tenantContextMock.Object)
        {
            Context = _callerContextMock.Object,
            Groups = _groupsMock.Object,
        };
        return hub;
    }

    [Fact]
    public async Task OnConnectedAsync_应将连接加入租户组()
    {
        var hub = CreateHub();

        await hub.OnConnectedAsync();

        _groupsMock.Verify(
            g => g.AddToGroupAsync(_connectionId, $"tenant:{_tenantId}", default),
            Times.Once);
    }

    [Fact]
    public async Task OnDisconnectedAsync_应将连接从租户组移除()
    {
        var hub = CreateHub();

        await hub.OnDisconnectedAsync(null);

        _groupsMock.Verify(
            g => g.RemoveFromGroupAsync(_connectionId, $"tenant:{_tenantId}", default),
            Times.Once);
    }

    [Fact]
    public async Task OnDisconnectedAsync_有异常时仍应移除连接()
    {
        var hub = CreateHub();

        await hub.OnDisconnectedAsync(new Exception("测试异常"));

        _groupsMock.Verify(
            g => g.RemoveFromGroupAsync(_connectionId, $"tenant:{_tenantId}", default),
            Times.Once);
    }
}
```

- [ ] **Step 2: 运行测试**

Run: `dotnet test tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj --filter "IndustrialHub" -v n`
Expected: 3 Passed

- [ ] **Step 3: 提交**

```bash
git add tests/EquipAI.Tests.Unit/Hubs/IndustrialHubTests.cs
git commit -m "test: 添加 IndustrialHub SignalR Hub 单元测试"
```

---

### Task 7-17: 控制器集成测试（11 个控制器）

每个控制器测试文件遵循相同模式，使用 `[Collection("SharedFactory")]` + `GetAuthenticatedClientAsync()`。由于数量多，每个控制器测试文件作为一个子任务，格式统一如下。

#### 通用模式（每个控制器测试文件）

所有控制器测试文件都遵循此结构：

```csharp
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Json;

namespace EquipAI.Tests.Integration.Controllers;

[Collection("SharedFactory")]
public class XxxControllerTests
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public XxxControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<HttpClient> GetAuthenticatedClientAsync()
    {
        var client = _factory.CreateClient();
        var loginResponse = await client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            username = "admin",
            password = "admin123"
        });
        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var auth = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", auth!.AccessToken);
        return client;
    }

    // 测试方法...
}
```

### Task 7: SystemControllerTests

**Files:**
- Create: `tests/EquipAI.Tests.Integration/Controllers/SystemControllerTests.cs`

- [ ] **Step 1: 创建测试文件**

```csharp
// 文件头同上通用模式

[Fact]
public async Task GetInfo_应返回版本和环境信息()
{
    var response = await _client.GetAsync("/api/v1/system/info");

    response.StatusCode.Should().Be(HttpStatusCode.OK);
    var info = await response.Content.ReadFromJsonAsync<JsonElement>();
    info.GetProperty("version").GetString().Should().Be("1.0.0");
    info.GetProperty("environment").GetString().Should().Be("Testing");
}
```

- [ ] **Step 2: 运行并提交**

```bash
dotnet test tests/EquipAI.Tests.Integration/EquipAI.Tests.Integration.csproj --filter "SystemController" -v n
git add tests/EquipAI.Tests.Integration/Controllers/SystemControllerTests.cs
git commit -m "test: 添加 SystemController 集成测试"
```

### Task 8: UsersControllerTests

**Files:**
- Create: `tests/EquipAI.Tests.Integration/Controllers/UsersControllerTests.cs`

测试用例：
- GET /api/v1/users 未认证返回 401
- GET /api/v1/users 认证后返回用户列表
- GET /api/v1/users/{id} 返回指定用户

### Task 9: TenantsControllerTests

**Files:**
- Create: `tests/EquipAI.Tests.Integration/Controllers/TenantsControllerTests.cs`

测试用例：
- GET /api/v1/tenants/current 返回当前租户信息
- PUT /api/v1/tenants/current 更新租户设置

### Task 10: TelemetryControllerTests

**Files:**
- Create: `tests/EquipAI.Tests.Integration/Controllers/TelemetryControllerTests.cs`

测试用例：
- GET /api/v1/telemetry/{deviceId}/latest 返回最新遥测
- GET /api/v1/telemetry/{deviceId}/history 返回历史数据

### Task 11: KnowledgeControllerTests

**Files:**
- Create: `tests/EquipAI.Tests.Integration/Controllers/KnowledgeControllerTests.cs`

测试用例：
- GET /api/v1/knowledge/rules 规则列表
- POST /api/v1/knowledge/rules 创建规则
- PUT /api/v1/knowledge/rules/{id} 更新规则
- DELETE /api/v1/knowledge/rules/{id} 删除规则

### Task 12: AlertsControllerTests

**Files:**
- Create: `tests/EquipAI.Tests.Integration/Controllers/AlertsControllerTests.cs`

测试用例：
- GET /api/v1/alerts 告警列表
- GET /api/v1/alerts/{id} 告警详情
- PUT /api/v1/alerts/{id}/acknowledge 确认告警

### Task 13: AnalysesControllerTests

**Files:**
- Create: `tests/EquipAI.Tests.Integration/Controllers/AnalysesControllerTests.cs`

测试用例：
- GET /api/v1/analyses 分析报告列表

### Task 14: ApprovalChainsControllerTests

**Files:**
- Create: `tests/EquipAI.Tests.Integration/Controllers/ApprovalChainsControllerTests.cs`

测试用例：
- GET /api/v1/approval-chains 审批链列表
- POST /api/v1/approval-chains 创建审批链

### Task 15: DispatchControllerTests

**Files:**
- Create: `tests/EquipAI.Tests.Integration/Controllers/DispatchControllerTests.cs`

测试用例：
- GET /api/v1/dispatch/recommendations 派工推荐

### Task 16: PushSubscriptionsControllerTests

**Files:**
- Create: `tests/EquipAI.Tests.Integration/Controllers/PushSubscriptionsControllerTests.cs`

测试用例：
- GET /api/v1/push/vapid-public-key 返回公钥（AllowAnonymous）

### Task 17: 运行全部集成测试

- [ ] **运行所有集成测试**

Run: `dotnet test tests/EquipAI.Tests.Integration/EquipAI.Tests.Integration.csproj -v n`
Expected: 所有测试通过

- [ ] **提交所有控制器测试（如未单独提交）**

```bash
git add tests/EquipAI.Tests.Integration/Controllers/
git commit -m "test: 添加 11 个控制器集成测试"
```
