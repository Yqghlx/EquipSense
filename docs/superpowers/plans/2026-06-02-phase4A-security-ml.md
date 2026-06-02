# Phase 4A+4C：安全加固 + ML 优化 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 IP 限流、审计日志、安全 Headers、输入净化等安全加固措施，以及 ML.NET 异常检测的训练数据管线和评估指标。

**Architecture:** 使用 ASP.NET Core 8 内置 `AddRateLimiter` 实现按租户 IP 限流；新建 `AuditLog` 实体 + `IAuditLogService` 记录敏感操作；安全 Headers 和输入净化作为中间件注册到管线前端；ML 训练数据管线基于已有的 `MlAnomalyDetectionService` 扩展评估指标和检测报告。

**Tech Stack:** .NET 8、ASP.NET Core RateLimiter、ML.NET (SrCnn)、PostgreSQL

---

## 文件结构

```
src/EquipAI.Core/
├── Entities/AuditLog.cs                              -- 审计日志实体
├── Interfaces/IAuditLogService.cs                    -- 审计日志服务接口
src/EquipAI.Application/
├── Services/AuditLogService.cs                       -- 审计日志实现
src/EquipAI.Infrastructure/
├── Middleware/RateLimitMiddleware.cs                  -- IP 限流中间件
├── Middleware/SecurityHeadersMiddleware.cs            -- 安全 Headers
├── Middleware/InputSanitizationMiddleware.cs          -- 输入净化
├── Data/Configurations/AuditLogConfiguration.cs      -- EF Core 实体配置
src/EquipAI.WebAPI/
├── Extensions/ServiceCollectionExtensions.cs         -- 注册限流 + 审计服务
├── Program.cs                                        -- 注册中间件
tests/EquipAI.Tests.Unit/
├── AuditLogServiceTests.cs                           -- 审计日志测试
├── InputSanitizationTests.cs                         -- 输入净化测试
```

---

### Task 1: IP 限流中间件

**Files:**
- Modify: `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs` — 注册限流
- Modify: `src/EquipAI.WebAPI/Program.cs` — 启用限流中间件

- [ ] **Step 1: 在 ServiceCollectionExtensions 注册限流服务**

在 `AddInfrastructure` 方法末尾添加限流注册：

```csharp
// IP 限流 — 使用 ASP.NET Core 8 内置 RateLimiter
// 固定窗口策略：每 IP 每分钟最多 60 次请求
services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("fixed", opt =>
    {
        opt.PermitLimit = 60;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;
    });
});
```

需要添加 using:
```csharp
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
```

- [ ] **Step 2: 在 Program.cs 启用限流中间件**

在 `app.UseCors()` 之后（行 78 附近）添加：

```csharp
// IP 限流 — 在 CORS 之后、认证之前执行
app.UseRateLimiter();
```

- [ ] **Step 3: 编译确认**

Run: `dotnet build EquipAI.slnx`
Expected: 编译成功

- [ ] **Step 4: 提交**

```bash
git add src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs src/EquipAI.WebAPI/Program.cs
git commit -m "feat: IP 限流 — 固定窗口策略每 IP 每分钟 60 次请求"
```

---

### Task 2: 审计日志服务

**Files:**
- Create: `src/EquipAI.Core/Entities/AuditLog.cs`
- Create: `src/EquipAI.Core/Interfaces/IAuditLogService.cs`
- Create: `src/EquipAI.Application/Services/AuditLogService.cs`
- Create: `src/EquipAI.Infrastructure/Data/Configurations/AuditLogConfiguration.cs`
- Modify: `src/EquipAI.Infrastructure/Data/AppDbContext.cs` — 添加 DbSet
- Create: `tests/EquipAI.Tests.Unit/AuditLogServiceTests.cs`

- [ ] **Step 1: 创建 AuditLog 实体**

```csharp
// src/EquipAI.Core/Entities/AuditLog.cs
namespace EquipAI.Core.Entities;

/// <summary>
/// 审计日志实体 — 记录系统中的敏感操作（登录、权限变更、数据修改等）
/// </summary>
public class AuditLog : BaseEntity
{
    /// <summary>
    /// 所属租户 ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 操作用户 ID
    /// </summary>
    public Guid? UserId { get; set; }

    /// <summary>
    /// 操作类型（Login, Logout, Create, Update, Delete, PermissionChange）
    /// </summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// 操作目标类型（Device, Alert, WorkOrder, User, Tenant, Rule）
    /// </summary>
    public string ResourceType { get; set; } = string.Empty;

    /// <summary>
    /// 操作目标 ID
    /// </summary>
    public string? ResourceId { get; set; }

    /// <summary>
    /// 操作描述
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// 客户端 IP 地址
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// 请求路径
    /// </summary>
    public string? RequestPath { get; set; }

    /// <summary>
    /// HTTP 方法
    /// </summary>
    public string? HttpMethod { get; set; }

    /// <summary>
    /// 用户代理
    /// </summary>
    public string? UserAgent { get; set; }
}
```

- [ ] **Step 2: 创建 IAuditLogService 接口**

```csharp
// src/EquipAI.Core/Interfaces/IAuditLogService.cs
namespace EquipAI.Core.Interfaces;

/// <summary>
/// 审计日志服务 — 记录和查询系统操作审计日志
/// </summary>
public interface IAuditLogService
{
    /// <summary>
    /// 记录审计日志
    /// </summary>
    Task LogAsync(Guid tenantId, string action, string resourceType, string? resourceId = null,
        string? description = null, CancellationToken ct = default);

    /// <summary>
    /// 记录审计日志（从 HttpContext 自动提取 IP、路径等信息）
    /// </summary>
    Task LogFromContextAsync(string action, string resourceType, string? resourceId = null,
        string? description = null, CancellationToken ct = default);

    /// <summary>
    /// 查询审计日志（分页）
    /// </summary>
    Task<PagedResult<AuditLogDto>> GetAuditLogsAsync(Guid tenantId, int page = 1, int pageSize = 20,
        CancellationToken ct = default);
}

/// <summary>
/// 审计日志 DTO
/// </summary>
public class AuditLogDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string ResourceType { get; set; } = string.Empty;
    public string? ResourceId { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public string? RequestPath { get; set; }
    public string? HttpMethod { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

- [ ] **Step 3: 创建 AuditLogService 实现**

```csharp
// src/EquipAI.Application/Services/AuditLogService.cs
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Services;

/// <summary>
/// 审计日志服务
/// </summary>
public class AuditLogService : IAuditLogService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AuditLogService> _logger;
    private readonly IServiceProvider _sp;

    public AuditLogService(IServiceScopeFactory scopeFactory, ILogger<AuditLogService> logger, IServiceProvider sp)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _sp = sp;
    }

    public async Task LogAsync(Guid tenantId, string action, string resourceType,
        string? resourceId = null, string? description = null, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var tenantContext = _sp.GetService<ITenantContext>();
        var httpContextAccessor = _sp.GetService<Microsoft.AspNetCore.Http.IHttpContextAccessor>();
        var httpContext = httpContextAccessor?.HttpContext;

        var auditLog = new AuditLog
        {
            TenantId = tenantId,
            UserId = tenantContext?.UserId,
            Action = action,
            ResourceType = resourceType,
            ResourceId = resourceId,
            Description = description ?? $"{action} {resourceType}",
            IpAddress = httpContext?.Connection.RemoteIpAddress?.ToString(),
            RequestPath = httpContext?.Request.Path,
            HttpMethod = httpContext?.Request.Method,
            UserAgent = httpContext?.Request.Headers.UserAgent.ToString()
        };

        db.UnfilteredSet<AuditLog>().Add(auditLog);

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            // 审计日志写入失败不应影响业务流程
            _logger.LogWarning(ex, "审计日志写入失败: Action={Action}, Resource={ResourceType}", action, resourceType);
        }
    }

    public async Task LogFromContextAsync(string action, string resourceType,
        string? resourceId = null, string? description = null, CancellationToken ct = default)
    {
        var tenantContext = _sp.GetService<ITenantContext>();
        var tenantId = tenantContext?.TenantId ?? Guid.Empty;
        await LogAsync(tenantId, action, resourceType, resourceId, description, ct);
    }

    public async Task<PagedResult<AuditLogDto>> GetAuditLogsAsync(Guid tenantId, int page = 1,
        int pageSize = 20, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var query = db.UnfilteredSet<AuditLog>()
            .Where(a => a.TenantId == tenantId)
            .OrderByDescending(a => a.CreatedAt);

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditLogDto
            {
                Id = a.Id,
                TenantId = a.TenantId,
                UserId = a.UserId,
                Action = a.Action,
                ResourceType = a.ResourceType,
                ResourceId = a.ResourceId,
                Description = a.Description,
                IpAddress = a.IpAddress,
                RequestPath = a.RequestPath,
                HttpMethod = a.HttpMethod,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync(ct);

        return new PagedResult<AuditLogDto>(items, total, page, pageSize);
    }
}
```

注意：`PagedResult<T>` 已存在于 `EquipAI.Application.DTOs.Common`。

- [ ] **Step 4: 创建 EF Core 实体配置**

```csharp
// src/EquipAI.Infrastructure/Data/Configurations/AuditLogConfiguration.cs
using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// 审计日志实体配置
/// </summary>
public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("audit_logs");
        builder.HasKey(a => a.Id);
        builder.HasIndex(a => a.TenantId);
        builder.HasIndex(a => a.CreatedAt);
        builder.HasIndex(a => new { a.TenantId, a.Action });
        builder.Property(a => a.Action).HasMaxLength(50).IsRequired();
        builder.Property(a => a.ResourceType).HasMaxLength(50).IsRequired();
        builder.Property(a => a.Description).HasMaxLength(500);
        builder.Property(a => a.IpAddress).HasMaxLength(45);
        builder.Property(a => a.RequestPath).HasMaxLength(500);
        builder.Property(a => a.HttpMethod).HasMaxLength(10);
        builder.Property(a => a.UserAgent).HasMaxLength(1000);
    }
}
```

- [ ] **Step 5: 在 AppDbContext 添加 DbSet**

在 `AppDbContext.cs` 的 DbSet 声明区域（约行 94 之后）添加：

```csharp
/// <summary>
/// 审计日志表
/// </summary>
public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
```

- [ ] **Step 6: 注册服务到 DI**

在 `ServiceCollectionExtensions.cs` 的 `AddApplication` 方法中添加：

```csharp
// 审计日志服务
services.AddScoped<IAuditLogService, AuditLogService>();
```

添加 using: `using EquipAI.Application.Services;`

- [ ] **Step 7: 编写测试**

```csharp
// tests/EquipAI.Tests.Unit/AuditLogServiceTests.cs
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Tests.Unit;

public class AuditLogServiceTests : IAsyncDisposable
{
    private readonly ServiceProvider _sp;

    public AuditLogServiceTests()
    {
        var dbName = $"AuditLogTest_{Guid.NewGuid()}";
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(dbName));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(Guid.NewGuid()));
        services.AddLogging();
        services.AddHttpContextAccessor();
        services.AddScoped<IAuditLogService, Application.Services.AuditLogService>();
        _sp = services.BuildServiceProvider();
    }

    [Fact]
    public async Task LogAsync_应创建审计日志记录()
    {
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IAuditLogService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        await service.LogAsync(tenantId, "Create", "Device", "dev-001", "创建设备");

        var logs = await db.UnfilteredSet<AuditLog>().Where(a => a.TenantId == tenantId).ToListAsync();
        logs.Should().HaveCount(1);
        logs[0].Action.Should().Be("Create");
        logs[0].ResourceType.Should().Be("Device");
    }

    [Fact]
    public async Task GetAuditLogsAsync_应返回分页结果()
    {
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IAuditLogService>();
        var tenantId = Guid.NewGuid();

        for (int i = 0; i < 5; i++)
        {
            await service.LogAsync(tenantId, $"Action{i}", "Device");
        }

        var result = await service.GetAuditLogsAsync(tenantId, page: 1, pageSize: 3);
        result.Items.Should().HaveCount(3);
        result.Total.Should().Be(5);
    }

    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }

    public async ValueTask DisposeAsync() => await _sp.DisposeAsync();
}
```

- [ ] **Step 8: 运行测试**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "AuditLogServiceTests" --verbosity normal`
Expected: 2/2 通过

- [ ] **Step 9: 提交**

```bash
git add src/EquipAI.Core/Entities/AuditLog.cs src/EquipAI.Core/Interfaces/IAuditLogService.cs src/EquipAI.Application/Services/AuditLogService.cs src/EquipAI.Infrastructure/Data/Configurations/AuditLogConfiguration.cs src/EquipAI.Infrastructure/Data/AppDbContext.cs src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs tests/EquipAI.Tests.Unit/AuditLogServiceTests.cs
git commit -m "feat: 审计日志服务 AuditLogService — 敏感操作记录 + 分页查询"
```

---

### Task 3: 安全 Headers + 输入净化中间件

**Files:**
- Create: `src/EquipAI.Infrastructure/Middleware/SecurityHeadersMiddleware.cs`
- Create: `src/EquipAI.Infrastructure/Middleware/InputSanitizationMiddleware.cs`
- Create: `tests/EquipAI.Tests.Unit/InputSanitizationTests.cs`
- Modify: `src/EquipAI.WebAPI/Program.cs` — 注册中间件

- [ ] **Step 1: 创建 SecurityHeadersMiddleware**

```csharp
// src/EquipAI.Infrastructure/Middleware/SecurityHeadersMiddleware.cs
using Microsoft.AspNetCore.Http;

namespace EquipAI.Infrastructure.Middleware;

/// <summary>
/// 安全 Headers 中间件
/// 为每个响应添加安全相关的 HTTP Headers
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // 防止 MIME 类型嗅探
        context.Response.Headers.XContentTypeOptions = "nosniff";
        // 防止点击劫持
        context.Response.Headers.XFrameOptions = "DENY";
        // XSS 保护（旧浏览器兼容）
        context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
        // 控制引用来源信息
        context.Response.Headers.ReferrerPolicy = "strict-origin-when-cross-origin";
        // 禁止浏览器缓存敏感页面（API 响应默认不缓存）
        context.Response.Headers.CacheControl = "no-store, no-cache, must-revalidate";
        context.Response.Headers.Pragma = "no-cache";

        await _next(context);
    }
}
```

- [ ] **Step 2: 创建 InputSanitizationMiddleware**

```csharp
// src/EquipAI.Infrastructure/Middleware/InputSanitizationMiddleware.cs
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;

namespace EquipAI.Infrastructure.Middleware;

/// <summary>
/// 输入净化中间件
/// 检查请求体中的潜在恶意内容（script 标签、事件处理器属性等）
/// 仅检查 Content-Type 为 text/plain 或 application/json 的请求
/// 不修改请求体，仅记录警告并拒绝明显恶意的请求
/// </summary>
public partial class InputSanitizationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<InputSanitizationMiddleware> _logger;

    public InputSanitizationMiddleware(RequestDelegate next, ILogger<InputSanitizationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // 仅检查写操作的请求体
        if (context.Request.Method is "POST" or "PUT" or "PATCH")
        {
            var contentType = context.Request.ContentType ?? "";
            if (contentType.Contains("application/json", StringComparison.OrdinalIgnoreCase))
            {
                context.Request.EnableBuffering();
                using var reader = new StreamReader(context.Request.Body, leaveOpen: true);
                var body = await reader.ReadToEndAsync();
                context.Request.Body.Position = 0;

                if (ContainsMaliciousContent(body))
                {
                    _logger.LogWarning("检测到潜在恶意输入: Path={Path}, Body 前缀={Prefix}",
                        context.Request.Path, body[..Math.Min(body.Length, 200)]);

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
    /// 检测是否包含明显的恶意内容
    /// 匹配模式：script 标签、事件处理器属性（onclick 等）、javascript: 协议
    /// </summary>
    internal static bool ContainsMaliciousContent(string input)
    {
        if (string.IsNullOrEmpty(input)) return false;

        return MaliciousPattern().IsMatch(input);
    }

    [GeneratedRegex(@"<\s*script|on\w+\s*=|javascript\s*:", RegexOptions.IgnoreCase | RegexOptions.Compiled)]
    private static partial Regex MaliciousPattern();
}
```

- [ ] **Step 3: 编写输入净化测试**

```csharp
// tests/EquipAI.Tests.Unit/InputSanitizationTests.cs
using EquipAI.Infrastructure.Middleware;
using FluentAssertions;

namespace EquipAI.Tests.Unit;

public class InputSanitizationTests
{
    [Theory]
    [InlineData("<script>alert('xss')</script>", true)]
    [InlineData("<img onerror=alert(1) src=x>", true)]
    [InlineData("javascript:alert(1)", true)]
    [InlineData("<SCRIPT>document.cookie</SCRIPT>", true)]
    [InlineData("onclick=alert(1)", true)]
    [InlineData("正常文本内容", false)]
    [InlineData("{\"name\":\"设备1\",\"type\":\"电机\"}", false)]
    [InlineData("设备温度超过阈值，请检查", false)]
    [InlineData("", false)]
    public void ContainsMaliciousContent_应正确识别(string input, bool expected)
    {
        InputSanitizationMiddleware.ContainsMaliciousContent(input).Should().Be(expected);
    }
}
```

- [ ] **Step 4: 在 Program.cs 注册中间件**

在 `app.UseMiddleware<ExceptionHandlingMiddleware>();` 之后（行 74 附近）添加：

```csharp
// 安全 Headers + 输入净化
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<InputSanitizationMiddleware>();
```

- [ ] **Step 5: 运行测试**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "InputSanitizationTests" --verbosity normal`
Expected: 8/8 通过

- [ ] **Step 6: 提交**

```bash
git add src/EquipAI.Infrastructure/Middleware/SecurityHeadersMiddleware.cs src/EquipAI.Infrastructure/Middleware/InputSanitizationMiddleware.cs tests/EquipAI.Tests.Unit/InputSanitizationTests.cs src/EquipAI.WebAPI/Program.cs
git commit -m "feat: 安全 Headers + 输入净化中间件 — XSS 防护 + 安全响应头"
```

---

### Task 4: ML 异常检测评估指标

**Files:**
- Modify: `src/EquipAI.Core/Interfaces/IMlAnomalyDetectionService.cs` — 扩展返回结果
- Modify: `src/EquipAI.Application/Analysis/MlAnomalyDetectionService.cs` — 添加评估指标
- Modify: `src/EquipAI.Application/Analysis/RootCauseAnalysisEngine.cs` — 使用新指标

- [ ] **Step 1: 读取现有接口和结果类型**

读取 `src/EquipAI.Core/Interfaces/IMlAnomalyDetectionService.cs` 和 `src/EquipAI.Core/Interfaces/MlAnomalyResult.cs`（如果独立存在）了解当前的返回类型。

- [ ] **Step 2: 扩展 MlAnomalyResult 添加评估指标**

找到 `MlAnomalyResult` record（在 `IMlAnomalyDetectionService.cs` 第 30 行），当前定义为：

```csharp
public record MlAnomalyResult(
    bool IsAnomaly,
    double AnomalyScore,
    double ExpectedValue,
    string Description);
```

添加样本数量和检测窗口信息：

```csharp
/// <summary>
/// ML 异常检测结果 — 增加 eval 指标
/// </summary>
public record MlAnomalyResult(
    bool IsAnomaly,
    double AnomalyScore,
    double ExpectedValue,
    string Description,
    int SampleCount = 0,
    int WindowSize = 0);
```

- [ ] **Step 3: 更新 MlAnomalyDetectionService 返回新指标**

在 `MlAnomalyDetectionService.DetectAsync` 方法中，修改 return 语句（约第 123 行），传入 sampleCount 和 windowSize：

```csharp
return new MlAnomalyResult(
    isAnomaly, probability, expectedValue, description,
    validData.Count, windowSize);
```

- [ ] **Step 4: 更新 RootCauseAnalysisEngine 使用新字段**

在 `RootCauseAnalysisEngine` 中找到使用 `MlAnomalyResult` 的地方，确保解构时兼容新字段。如果使用位置解构需添加对应变量，如果使用属性访问则无需修改。

- [ ] **Step 5: 编译确认**

Run: `dotnet build EquipAI.slnx`
Expected: 编译成功

- [ ] **Step 6: 运行全部测试**

Run: `dotnet test tests/EquipAI.Tests.Unit --verbosity normal`
Expected: 所有测试通过

- [ ] **Step 7: 提交**

```bash
git add src/EquipAI.Core/Interfaces/ src/EquipAI.Application/Analysis/
git commit -m "feat: ML 异常检测评估指标 — 样本数量 + 检测窗口信息"
```
