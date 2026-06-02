# Phase 3D：多租户 SaaS 完善 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现订阅管理（计划升级/降级、试用期自动过期）、用量限制强制执行（设备数/用户数上限检查），以及前端订阅和租户设置 UI。

**Architecture:** 新建 `ISubscriptionService` 管理租户计划变更和试用期逻辑，`UsageLimitMiddleware` 在请求到达业务层前检查资源配额。租户的 `Plan`、`MaxDevices`、`MaxUsers` 等字段已存在于 `Tenant` 实体中，本阶段补充业务逻辑和强制执行机制。

**Tech Stack:** .NET 8、EF Core 8、PostgreSQL、React 19 + TanStack Query + shadcn/ui

---

## 文件结构

```
src/EquipAI.Core/
├── Interfaces/ISubscriptionService.cs               -- 订阅管理接口
src/EquipAI.Application/
├── Interfaces/
│   └── SubscriptionService.cs                       -- 订阅管理实现
├── DTOs/Tenants/
│   ├── SubscriptionDto.cs                           -- 订阅信息 DTO
│   └── ChangePlanRequest.cs                         -- 计划变更请求
src/EquipAI.Infrastructure/
├── Middleware/UsageLimitMiddleware.cs                -- 用量限制中间件
src/EquipAI.WebAPI/
├── Controllers/TenantsController.cs                 -- 扩展订阅 API
tests/EquipAI.Tests.Unit/
├── SubscriptionServiceTests.cs                      -- 订阅管理测试
├── UsageLimitMiddlewareTests.cs                     -- 用量限制测试
frontend/src/
├── hooks/useSubscription.ts                         -- 订阅 API hooks
├── pages/SettingsPage.tsx                           -- 添加订阅 Tab
```

---

### Task 1: 订阅管理服务

**Files:**
- Create: `src/EquipAI.Core/Interfaces/ISubscriptionService.cs`
- Create: `src/EquipAI.Application/Interfaces/SubscriptionService.cs`
- Create: `src/EquipAI.Application/DTOs/Tenants/SubscriptionDto.cs`
- Create: `src/EquipAI.Application/DTOs/Tenants/ChangePlanRequest.cs`
- Create: `tests/EquipAI.Tests.Unit/SubscriptionServiceTests.cs`

- [ ] **Step 1: 创建 ISubscriptionService 接口**

```csharp
// src/EquipAI.Core/Interfaces/ISubscriptionService.cs
namespace EquipAI.Core.Interfaces;

/// <summary>
/// 订阅管理服务 — 管理租户计划变更、试用期和配额
/// </summary>
public interface ISubscriptionService
{
    /// <summary>
    /// 获取租户当前订阅信息（计划、用量、配额）
    /// </summary>
    Task<SubscriptionInfo> GetSubscriptionAsync(Guid tenantId, CancellationToken ct = default);

    /// <summary>
    /// 变更租户计划（升级/降级），同时调整配额
    /// </summary>
    Task ChangePlanAsync(Guid tenantId, string newPlan, CancellationToken ct = default);

    /// <summary>
    /// 检查租户是否可以创建新资源（设备/用户）
    /// </summary>
    Task<bool> CanCreateResourceAsync(Guid tenantId, string resourceType, CancellationToken ct = default);
}

/// <summary>
/// 订阅信息
/// </summary>
public class SubscriptionInfo
{
    /// <summary>租户 ID</summary>
    public Guid TenantId { get; set; }

    /// <summary>当前计划</summary>
    public string Plan { get; set; } = string.Empty;

    /// <summary>计划显示名称</summary>
    public string PlanDisplayName { get; set; } = string.Empty;

    /// <summary>最大设备数</summary>
    public int MaxDevices { get; set; }

    /// <summary>当前设备数</summary>
    public int CurrentDevices { get; set; }

    /// <summary>最大用户数</summary>
    public int MaxUsers { get; set; }

    /// <summary>当前用户数</summary>
    public int CurrentUsers { get; set; }

    /// <summary>数据保留天数</summary>
    public int DataRetentionDays { get; set; }

    /// <summary>是否在试用期内</summary>
    public bool IsTrial { get; set; }

    /// <summary>试用到期时间</summary>
    public DateTime? TrialExpiresAt { get; set; }

    /// <summary>租户是否启用</summary>
    public bool IsActive { get; set; }
}
```

- [ ] **Step 2: 创建 DTO**

```csharp
// src/EquipAI.Application/DTOs/Tenants/ChangePlanRequest.cs
namespace EquipAI.Application.DTOs.Tenants;

/// <summary>
/// 变更计划请求
/// </summary>
public class ChangePlanRequest
{
    /// <summary>
    /// 新计划名称（Trial/Basic/Professional/Enterprise）
    /// </summary>
    public string Plan { get; set; } = string.Empty;
}
```

- [ ] **Step 3: 编写测试**

```csharp
// tests/EquipAI.Tests.Unit/SubscriptionServiceTests.cs
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Tests.Unit;

public class SubscriptionServiceTests : IAsyncDisposable
{
    private readonly ServiceProvider _sp;

    public SubscriptionServiceTests()
    {
        var dbName = $"SubscriptionTest_{Guid.NewGuid()}";
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(dbName));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(Guid.Empty));
        services.AddLogging();
        services.AddScoped<ISubscriptionService, Application.Interfaces.SubscriptionService>();
        _sp = services.BuildServiceProvider();
    }

    [Fact]
    public async Task GetSubscriptionAsync_应返回正确的计划信息()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        db.UnfilteredSet<Tenant>().Add(new Tenant
        {
            Id = tenantId,
            Name = "测试租户",
            Slug = "test",
            Plan = TenantPlan.Professional,
            MaxDevices = 200,
            MaxUsers = 50,
        });
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<ISubscriptionService>();
        var sub = await service.GetSubscriptionAsync(tenantId);

        sub.Should().NotBeNull();
        sub.Plan.Should().Be("Professional");
        sub.MaxDevices.Should().Be(200);
        sub.MaxUsers.Should().Be(50);
    }

    [Fact]
    public async Task ChangePlanAsync_应更新计划并调整配额()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        db.UnfilteredSet<Tenant>().Add(new Tenant
        {
            Id = tenantId,
            Name = "测试租户",
            Slug = "test2",
            Plan = TenantPlan.Basic,
            MaxDevices = 50,
            MaxUsers = 20,
        });
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<ISubscriptionService>();
        await service.ChangePlanAsync(tenantId, "Enterprise");

        var updated = await db.UnfilteredSet<Tenant>().FindAsync(tenantId);
        updated!.Plan.Should().Be(TenantPlan.Enterprise);
        updated.MaxDevices.Should().Be(500); // Enterprise 配额
        updated.MaxUsers.Should().Be(200);
    }

    [Fact]
    public async Task CanCreateResourceAsync_未超限应返回true()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        db.UnfilteredSet<Tenant>().Add(new Tenant
        {
            Id = tenantId,
            Name = "测试租户",
            Slug = "test3",
            Plan = TenantPlan.Basic,
            MaxDevices = 50,
        });
        // 添加 5 个设备
        for (int i = 0; i < 5; i++)
        {
            db.Devices.Add(new Device
            {
                TenantId = tenantId,
                DeviceCode = $"DEV-{i}",
                Name = $"设备{i}",
                Type = "电机"
            });
        }
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<ISubscriptionService>();
        var canCreate = await service.CanCreateResourceAsync(tenantId, "device");

        canCreate.Should().BeTrue();
    }

    [Fact]
    public async Task CanCreateResourceAsync_已超限应返回false()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        db.UnfilteredSet<Tenant>().Add(new Tenant
        {
            Id = tenantId,
            Name = "测试租户",
            Slug = "test4",
            Plan = TenantPlan.Basic,
            MaxDevices = 3,
        });
        for (int i = 0; i < 3; i++)
        {
            db.Devices.Add(new Device
            {
                TenantId = tenantId,
                DeviceCode = $"DEV-FULL-{i}",
                Name = $"满设备{i}",
                Type = "电机"
            });
        }
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<ISubscriptionService>();
        var canCreate = await service.CanCreateResourceAsync(tenantId, "device");

        canCreate.Should().BeFalse();
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

- [ ] **Step 4: 实现 SubscriptionService**

```csharp
// src/EquipAI.Application/Interfaces/SubscriptionService.cs
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Interfaces;

/// <summary>
/// 订阅管理服务
/// 各计划默认配额：
/// Trial: 5 设备, 3 用户, 30 天保留
/// Basic: 50 设备, 20 用户, 90 天保留
/// Professional: 200 设备, 50 用户, 180 天保留
/// Enterprise: 500 设备, 200 用户, 365 天保留
/// </summary>
public class SubscriptionService : ISubscriptionService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SubscriptionService> _logger;

    private static readonly Dictionary<TenantPlan, (int MaxDevices, int MaxUsers, int RetentionDays)> PlanLimits = new()
    {
        [TenantPlan.Trial] = (5, 3, 30),
        [TenantPlan.Basic] = (50, 20, 90),
        [TenantPlan.Professional] = (200, 50, 180),
        [TenantPlan.Enterprise] = (500, 200, 365),
    };

    public SubscriptionService(IServiceScopeFactory scopeFactory, ILogger<SubscriptionService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<SubscriptionInfo> GetSubscriptionAsync(Guid tenantId, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var tenant = await db.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == tenantId, ct)
            ?? throw new KeyNotFoundException($"租户不存在: {tenantId}");

        var deviceCount = await db.UnfilteredSet<Core.Entities.Device>()
            .CountAsync(d => d.TenantId == tenantId, ct);

        var userCount = await db.UnfilteredSet<Core.Entities.User>()
            .CountAsync(u => u.TenantId == tenantId, ct);

        return new SubscriptionInfo
        {
            TenantId = tenantId,
            Plan = tenant.Plan.ToString(),
            PlanDisplayName = GetPlanDisplayName(tenant.Plan),
            MaxDevices = tenant.MaxDevices,
            CurrentDevices = deviceCount,
            MaxUsers = tenant.MaxUsers,
            CurrentUsers = userCount,
            DataRetentionDays = tenant.DataRetentionDays,
            IsTrial = tenant.Plan == TenantPlan.Trial,
            IsActive = tenant.IsActive
        };
    }

    /// <inheritdoc />
    public async Task ChangePlanAsync(Guid tenantId, string newPlan, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var tenant = await db.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == tenantId, ct)
            ?? throw new KeyNotFoundException($"租户不存在: {tenantId}");

        if (!Enum.TryParse<TenantPlan>(newPlan, ignoreCase: true, out var plan))
            throw new ArgumentException($"无效的计划名称: {newPlan}");

        var limits = PlanLimits[plan];

        tenant.Plan = plan;
        tenant.MaxDevices = limits.MaxDevices;
        tenant.MaxUsers = limits.MaxUsers;
        tenant.DataRetentionDays = limits.RetentionDays;

        await db.SaveChangesAsync(ct);

        _logger.LogInformation("租户 {TenantId} 计划变更: {OldPlan} → {NewPlan}", tenantId, tenant.Plan, plan);
    }

    /// <inheritdoc />
    public async Task<bool> CanCreateResourceAsync(Guid tenantId, string resourceType, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var tenant = await db.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == tenantId, ct);

        if (tenant == null || !tenant.IsActive) return false;

        return resourceType.ToLowerInvariant() switch
        {
            "device" => await db.UnfilteredSet<Core.Entities.Device>()
                .CountAsync(d => d.TenantId == tenantId, ct) < tenant.MaxDevices,
            "user" => await db.UnfilteredSet<Core.Entities.User>()
                .CountAsync(u => u.TenantId == tenantId, ct) < tenant.MaxUsers,
            _ => true
        };
    }

    private static string GetPlanDisplayName(TenantPlan plan) => plan switch
    {
        TenantPlan.Trial => "试用版",
        TenantPlan.Basic => "基础版",
        TenantPlan.Professional => "专业版",
        TenantPlan.Enterprise => "企业版",
        _ => plan.ToString()
    };
}
```

- [ ] **Step 5: 运行测试**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "SubscriptionServiceTests" --verbosity normal`
Expected: 4/4 通过

- [ ] **Step 6: 提交**

```bash
git add src/EquipAI.Core/Interfaces/ISubscriptionService.cs src/EquipAI.Application/Interfaces/SubscriptionService.cs src/EquipAI.Application/DTOs/Tenants/ChangePlanRequest.cs tests/EquipAI.Tests.Unit/SubscriptionServiceTests.cs
git commit -m "feat: 订阅管理服务 SubscriptionService — 计划变更 + 配额检查"
```

---

### Task 2: 用量限制中间件

**Files:**
- Create: `src/EquipAI.Infrastructure/Middleware/UsageLimitMiddleware.cs`
- Modify: `src/EquipAI.WebAPI/Program.cs` — 注册中间件

- [ ] **Step 1: 创建 UsageLimitMiddleware**

```csharp
// src/EquipAI.Infrastructure/Middleware/UsageLimitMiddleware.cs
using EquipAI.Core.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Text.Json;

namespace EquipAI.Infrastructure.Middleware;

/// <summary>
/// 用量限制中间件
/// 在创建资源的请求（POST /devices、POST /users）到达 Controller 前，
/// 检查租户是否还有配额。如果已满则返回 403。
/// 依赖 ISubscriptionService 进行配额查询
/// </summary>
public class UsageLimitMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<UsageLimitMiddleware> _logger;

    public UsageLimitMiddleware(RequestDelegate next, ILogger<UsageLimitMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value;
        var method = context.Request.Method;

        // 仅拦截 POST 创建请求
        if (method != "POST")
        {
            await _next(context);
            return;
        }

        var resourceType = GetResourceType(path);
        if (resourceType == null)
        {
            await _next(context);
            return;
        }

        // 从 HttpContext.Items 获取租户上下文
        if (!context.Items.TryGetValue(TenantResolutionMiddleware.TenantContextKey, out var tenantCtxObj)
            || tenantCtxObj is not ITenantContext tenantCtx
            || tenantCtx.TenantId == Guid.Empty)
        {
            await _next(context);
            return;
        }

        var subscriptionService = context.RequestServices.GetService<ISubscriptionService>();
        if (subscriptionService == null)
        {
            await _next(context);
            return;
        }

        var canCreate = await subscriptionService.CanCreateResourceAsync(
            tenantCtx.TenantId, resourceType, context.RequestAborted);

        if (!canCreate)
        {
            _logger.LogWarning("租户 {TenantId} 超出 {ResourceType} 配额限制", tenantCtx.TenantId, resourceType);
            context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
            context.Response.ContentType = "application/json";
            var resourceTypeName = resourceType == "device" ? "设备" : "用户";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                code = 403,
                message = $"已超出{resourceTypeName}数量上限，请升级计划",
                details = (string?)null
            }, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
            return;
        }

        await _next(context);
    }

    /// <summary>
    /// 从请求路径推断资源类型
    /// </summary>
    private static string? GetResourceType(string? path)
    {
        if (path == null) return null;

        if (path.StartsWith("/api/v1/devices", StringComparison.OrdinalIgnoreCase))
            return "device";

        // 租户管理员创建用户的路径
        if (path.StartsWith("/api/v1/admin/users", StringComparison.OrdinalIgnoreCase))
            return "user";

        return null;
    }
}
```

- [ ] **Step 2: 在 Program.cs 注册中间件**

在 `Program.cs` 的中间件管道中，在 `TenantResolution` 中间件之后、`Permission` 中间件之前添加：

```csharp
app.UseMiddleware<UsageLimitMiddleware>();
```

确保添加 `using EquipAI.Infrastructure.Middleware;`

- [ ] **Step 3: 在 ServiceCollectionExtensions 注册 SubscriptionService**

在 `AddApplication` 方法中添加：

```csharp
services.AddScoped<ISubscriptionService, SubscriptionService>();
```

以及 `using EquipAI.Application.Interfaces;`（应该已存在）

- [ ] **Step 4: 编译确认**

Run: `dotnet build EquipAI.slnx`
Expected: 编译成功

- [ ] **Step 5: 提交**

```bash
git add src/EquipAI.Infrastructure/Middleware/UsageLimitMiddleware.cs src/EquipAI.WebAPI/Program.cs src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs
git commit -m "feat: 用量限制中间件 UsageLimitMiddleware — 设备/用户配额检查"
```

---

### Task 3: 扩展 TenantsController 订阅 API

**Files:**
- Modify: `src/EquipAI.WebAPI/Controllers/TenantsController.cs` — 添加订阅查询和计划变更端点

- [ ] **Step 1: 读取当前 TenantsController.cs**

读取 `src/EquipAI.WebAPI/Controllers/TenantsController.cs` 了解现有端点，然后添加两个新端点。

- [ ] **Step 2: 添加订阅查询和计划变更端点**

在 `TenantsController` 中添加：

```csharp
/// <summary>
/// 获取租户订阅信息（计划、用量、配额）
/// </summary>
[HttpGet("{id:guid}/subscription")]
[RequirePermission("tenant:read")]
[ProducesResponseType(typeof(SubscriptionInfo), StatusCodes.Status200OK)]
public async Task<ActionResult<SubscriptionInfo>> GetSubscription(Guid id)
{
    var subscription = await _subscriptionService.GetSubscriptionAsync(id);
    return Ok(subscription);
}

/// <summary>
/// 变更租户计划（升级/降级）
/// </summary>
[HttpPut("{id:guid}/plan")]
[RequirePermission("tenant:update")]
[ProducesResponseType(StatusCodes.Status200OK)]
public async Task<ActionResult> ChangePlan(Guid id, [FromBody] ChangePlanRequest request)
{
    await _subscriptionService.ChangePlanAsync(id, request.Plan);
    return Ok(new { message = "计划变更成功" });
}
```

同时修改构造函数，注入 `ISubscriptionService`：

```csharp
private readonly ITenantService _tenantService;
private readonly ISubscriptionService _subscriptionService;

public TenantsController(ITenantService tenantService, ISubscriptionService subscriptionService)
{
    _tenantService = tenantService;
    _subscriptionService = subscriptionService;
}
```

添加 `using EquipAI.Core.Interfaces;` 和 `using EquipAI.Application.DTOs.Tenants;`

- [ ] **Step 3: 编译确认**

Run: `dotnet build EquipAI.slnx`
Expected: 编译成功

- [ ] **Step 4: 运行测试**

Run: `dotnet test tests/EquipAI.Tests.Unit --verbosity normal`
Expected: 所有测试通过

- [ ] **Step 5: 提交**

```bash
git add src/EquipAI.WebAPI/Controllers/TenantsController.cs
git commit -m "feat: TenantsController 订阅 API — 查询订阅 + 变更计划"
```

---

### Task 4: 前端订阅管理 UI

**Files:**
- Create: `frontend/src/hooks/useSubscription.ts`
- Modify: `frontend/src/pages/SettingsPage.tsx` — 添加订阅/租户管理 Tab
- Modify: `frontend/src/i18n/zh.json` and `en.json`

- [ ] **Step 1: 创建订阅 API hooks**

```typescript
// frontend/src/hooks/useSubscription.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface SubscriptionInfo {
  tenantId: string;
  plan: string;
  planDisplayName: string;
  maxDevices: number;
  currentDevices: number;
  maxUsers: number;
  currentUsers: number;
  dataRetentionDays: number;
  isTrial: boolean;
  isActive: boolean;
}

/** 获取当前租户订阅信息 */
export function useSubscription(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['subscription', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const { data } = await api.get(`/admin/tenants/${tenantId}/subscription`);
      return data as SubscriptionInfo;
    },
    enabled: !!tenantId,
  });
}

/** 变更租户计划 */
export function useChangePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tenantId, plan }: { tenantId: string; plan: string }) => {
      await api.put(`/admin/tenants/${tenantId}/plan`, { plan });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}
```

- [ ] **Step 2: 在 SettingsPage 添加订阅/租户管理 Tab**

在 `SettingsPage.tsx` 的 `TabsList` 中添加新的 `TabsTrigger`：

```tsx
<TabsTrigger value="subscription">{t('settings.subscription', '订阅管理')}</TabsTrigger>
```

以及对应的 `TabsContent`：

```tsx
<TabsContent value="subscription">
  <SubscriptionPanel />
</TabsContent>
```

在文件中添加 `SubscriptionPanel` 内联组件：

```tsx
import { useSubscription, useChangePlan } from '../hooks/useSubscription';

const plans = [
  { value: 'Trial', label: '试用版', devices: 5, users: 3, retention: 30 },
  { value: 'Basic', label: '基础版', devices: 50, users: 20, retention: 90 },
  { value: 'Professional', label: '专业版', devices: 200, users: 50, retention: 180 },
  { value: 'Enterprise', label: '企业版', devices: 500, users: 200, retention: 365 },
];

function SubscriptionPanel() {
  const { t } = useTranslation();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const tenantId = user?.tenantId;
  const { data: sub } = useSubscription(tenantId);
  const changePlanMutation = useChangePlan();

  if (!sub) return <p className="text-center text-muted-foreground py-8">{t('subscription.noData', '暂无订阅信息')}</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('subscription.title', '当前订阅')}</CardTitle>
        <CardDescription>{t('subscription.currentPlan', '当前计划')}: {sub.planDisplayName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 用量概览 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{t('subscription.devices', '设备数')}</p>
            <p className="text-2xl font-bold">{sub.currentDevices} <span className="text-sm font-normal text-muted-foreground">/ {sub.maxDevices}</span></p>
            <div className="mt-2 h-2 rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, (sub.currentDevices / sub.maxDevices) * 100)}%` }}
              />
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{t('subscription.users', '用户数')}</p>
            <p className="text-2xl font-bold">{sub.currentUsers} <span className="text-sm font-normal text-muted-foreground">/ {sub.maxUsers}</span></p>
            <div className="mt-2 h-2 rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, (sub.currentUsers / sub.maxUsers) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 数据保留 */}
        <p className="text-sm text-muted-foreground">
          {t('subscription.dataRetention', '数据保留')}: {sub.dataRetentionDays} {t('subscription.days', '天')}
        </p>

        <Separator />

        {/* 计划选择 */}
        <h3 className="font-medium">{t('subscription.changePlan', '变更计划')}</h3>
        <div className="grid grid-cols-2 gap-3">
          {plans.map((plan) => (
            <Card
              key={plan.value}
              className={`cursor-pointer transition-colors ${sub.plan === plan.value ? 'ring-2 ring-primary' : ''}`}
              onClick={() => {
                if (sub.plan !== plan.value) {
                  changePlanMutation.mutate({ tenantId: sub.tenantId, plan: plan.value });
                }
              }}
            >
              <CardContent className="p-4">
                <p className="font-medium">{plan.label}</p>
                <p className="text-xs text-muted-foreground">
                  {plan.devices} {t('subscription.devices', '设备')} / {plan.users} {t('subscription.users', '用户')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {plan.retention} {t('subscription.days', '天')} {t('subscription.dataRetention', '数据保留')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: 添加 i18n 翻译**

在 `zh.json` 的 `settings` 部分添加：
```json
"subscription": "订阅管理"
```

在 `zh.json` 顶层添加 `subscription` 对象：
```json
"subscription": {
  "title": "当前订阅",
  "currentPlan": "当前计划",
  "noData": "暂无订阅信息",
  "devices": "设备数",
  "users": "用户数",
  "dataRetention": "数据保留",
  "days": "天",
  "changePlan": "变更计划"
}
```

在 `en.json` 对应添加英文翻译。

- [ ] **Step 4: TypeScript 检查**

Run: `cd frontend && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 5: 提交**

```bash
git add frontend/src/hooks/useSubscription.ts frontend/src/pages/SettingsPage.tsx frontend/src/i18n/
git commit -m "feat: 前端订阅管理 UI — 用量进度条 + 计划切换"
```
