# 3D: 多租户 SaaS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现完整的多租户 SaaS 能力 -- 公开注册流程、套餐配额执行（Redis 缓存加速）、system_admin 租户管理门户，以及数据隔离集成测试验证。

**Architecture:** 在已有的 Tenant/SubscriptionService/UsageLimitMiddleware 基础上扩展：(1) Tenant 实体增加 Status/TrialEndsAt/SubscriptionEndsAt/CurrentDeviceCount/CurrentUserCount 字段，减少配额检查时的 COUNT 查询；(2) AuthService 增加 RegisterAsync 公开注册，事务性创建 Tenant + 管理员 User；(3) UsageLimitMiddleware 增强 Redis 缓存配额读取；(4) 新增 system_admin 管理端点和前端页面。

**Tech Stack:** .NET 8 / EF Core 8 / PostgreSQL / Redis / React 19 + TanStack Query + shadcn/ui + React Hook Form + Zod

---

## 套餐设计规格

| 套餐 | 设备上限 | 用户上限 | 数据保留 | 价格 | TrialEndsAt |
|------|---------|---------|---------|------|-------------|
| Trial（试用版） | 5 | 3 | 7 天 | 免费 | 注册后 14 天 |
| Professional（专业版） | 50 | 20 | 90 天 | 999 元/月 | - |
| Enterprise（企业版） | 不限(0=int.MaxValue) | 不限(0=int.MaxValue) | 365 天 | 定制 | - |

> 注：TrialEndsAt = 14 天后自动过期，需要 system_admin 手动升级为 Professional 或 Enterprise。

---

## 文件结构

```
src/EquipAI.Core/
├── Enums/TenantStatus.cs                               -- [新建] 租户状态枚举
├── Entities/Tenant.cs                                  -- [修改] 新增 Status/TrialEndsAt 等字段
src/EquipAI.Application/
├── DTOs/Auth/RegisterRequest.cs                        -- [新建] 注册请求 DTO
├── DTOs/Auth/PlanDto.cs                                -- [新建] 套餐信息 DTO
├── DTOs/Tenants/TenantDto.cs                           -- [修改] 新增 Status/TrialEndsAt 等字段
├── DTOs/Tenants/TenantDetailDto.cs                     -- [新建] 租户详情(含用量统计)
├── Interfaces/IAuthService.cs                          -- [修改] 新增 RegisterAsync/GetPlansAsync
├── Services/AuthService.cs                             -- [修改] 实现注册逻辑
├── Services/TenantService.cs                           -- [修改] 新增冻结/解冻方法
├── Interfaces/ITenantService.cs                        -- [修改] 新增冻结/解冻接口
├── Mapping/MappingProfile.cs                           -- [修改] 新增注册/租户详情映射
src/EquipAI.Infrastructure/
├── Data/Migrations/                                    -- [新建] EF 迁移
├── Middleware/UsageLimitMiddleware.cs                   -- [修改] Redis 缓存配额
├── Cache/RedisService.cs                               -- [修改] 新增配额缓存方法
src/EquipAI.WebAPI/
├── Controllers/AuthController.cs                       -- [修改] 新增 register/plans 端点
├── Controllers/TenantsController.cs                    -- [修改] 新增冻结/解冻/统计端点
frontend/src/
├── pages/RegisterPage.tsx                              -- [新建] 注册页面
├── pages/admin/TenantsPage.tsx                         -- [新建] 租户列表管理页
├── pages/admin/TenantDetailPage.tsx                    -- [新建] 租户详情页
├── hooks/useSubscription.ts                            -- [修改] 新增租户管理 hooks
├── hooks/useRegister.ts                                -- [新建] 注册 hooks
├── types/index.ts                                      -- [修改] 新增注册/套餐类型
├── components/layout/AuthGuard.tsx                     -- [修改] 支持 system_admin 路由
├── components/layout/Sidebar.tsx                       -- [修改] system_admin 导航项
├── App.tsx                                             -- [修改] 注册路由 + admin 路由
├── i18n/zh.json / en.json                              -- [修改] 新增翻译
tests/EquipAI.Tests.Integration/
├── Controllers/AuthControllerTests.cs                  -- [修改] 新增注册测试
├── Controllers/TenantIsolationTests.cs                 -- [新建] 数据隔离集成测试
```

---

### Task 1: Tenant 实体扩展 + EF 迁移

**Goal:** 为 Tenant 实体新增 SaaS 所需的租户状态、订阅时间和资源计数字段，生成数据库迁移。

**Files:**
- Create: `src/EquipAI.Core/Enums/TenantStatus.cs`
- Modify: `src/EquipAI.Core/Entities/Tenant.cs`
- Modify: `src/EquipAI.Application/DTOs/Tenants/TenantDto.cs`
- Create: `src/EquipAI.Application/DTOs/Tenants/TenantDetailDto.cs`
- Modify: `src/EquipAI.Application/Mapping/MappingProfile.cs`

- [ ] **Step 1: 创建 TenantStatus 枚举**

```csharp
// src/EquipAI.Core/Enums/TenantStatus.cs
namespace EquipAI.Core.Enums;

/// <summary>
/// 租户状态枚举，用于 SaaS 订阅生命周期管理
/// </summary>
public enum TenantStatus
{
    /// <summary>试用中</summary>
    Trial,

    /// <summary>活跃（已订阅）</summary>
    Active,

    /// <summary>已过期（试用结束或订阅到期未续费）</summary>
    Expired,

    /// <summary>被冻结（system_admin 操作，通常因违规或欠费）</summary>
    Frozen,

    /// <summary>已注销</summary>
    Closed
}
```

- [ ] **Step 2: 扩展 Tenant 实体**

在 `src/EquipAI.Core/Entities/Tenant.cs` 的 `IsActive` 属性后面添加新字段：

```csharp
// --- 新增 SaaS 字段 ---

/// <summary>
/// 租户状态（Trial/Active/Expired/Frozen/Closed）
/// </summary>
public TenantStatus Status { get; set; } = TenantStatus.Trial;

/// <summary>
/// 当前设备数量（由应用层维护，避免每次 COUNT 查询）
/// </summary>
public int CurrentDeviceCount { get; set; }

/// <summary>
/// 当前用户数量（由应用层维护，避免每次 COUNT 查询）
/// </summary>
public int CurrentUserCount { get; set; }

/// <summary>
/// 试用期截止时间（注册时设置为当前时间 +14 天）
/// </summary>
public DateTime? TrialEndsAt { get; set; }

/// <summary>
/// 订阅到期时间（付费套餐到期日）
/// </summary>
public DateTime? SubscriptionEndsAt { get; set; }
```

- [ ] **Step 3: 扩展 TenantDto**

在 `src/EquipAI.Application/DTOs/Tenants/TenantDto.cs` 中添加对应字段：

```csharp
/// <summary>
/// 租户状态名称
/// </summary>
public string Status { get; set; } = string.Empty;

/// <summary>
/// 当前设备数量
/// </summary>
public int CurrentDeviceCount { get; set; }

/// <summary>
/// 当前用户数量
/// </summary>
public int CurrentUserCount { get; set; }

/// <summary>
/// 试用期截止时间
/// </summary>
public DateTime? TrialEndsAt { get; set; }

/// <summary>
/// 订阅到期时间
/// </summary>
public DateTime? SubscriptionEndsAt { get; set; }

/// <summary>
/// 数据保留天数
/// </summary>
public int DataRetentionDays { get; set; }
```

- [ ] **Step 4: 创建 TenantDetailDto（含用量统计）**

```csharp
// src/EquipAI.Application/DTOs/Tenants/TenantDetailDto.cs
namespace EquipAI.Application.DTOs.Tenants;

/// <summary>
/// 租户详情 DTO，包含基础信息 + 资源用量统计
/// 用于 system_admin 门户的租户详情页
/// </summary>
public class TenantDetailDto : TenantDto
{
    /// <summary>
    /// 活跃告警数
    /// </summary>
    public int ActiveAlertCount { get; set; }

    /// <summary>
    /// 待处理工单数
    /// </summary>
    public int PendingWorkOrderCount { get; set; }

    /// <summary>
    /// 本月 AI 分析次数
    /// </summary>
    public int MonthlyAnalysisCount { get; set; }

    /// <summary>
    /// 管理员用户名
    /// </summary>
    public string AdminUsername { get; set; } = string.Empty;

    /// <summary>
    /// 管理员邮箱
    /// </summary>
    public string? AdminEmail { get; set; }
}
```

- [ ] **Step 5: 更新 MappingProfile**

在 `src/EquipAI.Application/Mapping/MappingProfile.cs` 中修改 Tenant -> TenantDto 映射：

```csharp
// 替换现有的 Tenant -> TenantDto 映射
CreateMap<Tenant, TenantDto>()
    .ForMember(dest => dest.Plan, opt => opt.MapFrom(src => src.Plan.ToString()))
    .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
```

- [ ] **Step 6: 生成 EF 迁移**

```bash
dotnet ef migrations add AddTenantSaaSFields \
  --project src/EquipAI.Infrastructure \
  --startup-project src/EquipAI.WebAPI
```

- [ ] **Step 7: 更新 DataSeeder 种子数据**

在 `DataSeeder.cs` 的 `SeedTenantsAsync` 中，为默认租户设置新增字段：

```csharp
// 默认租户增加 SaaS 字段
var defaultTenant = new Core.Entities.Tenant
{
    // ... 现有字段 ...
    Status = TenantStatus.Active,  // 默认租户直接设为 Active
    TrialEndsAt = null,
    SubscriptionEndsAt = DateTime.UtcNow.AddYears(1),
    CurrentDeviceCount = 0,
    CurrentUserCount = 1  // admin 用户
};
```

- [ ] **Step 8: 编译确认**

Run: `dotnet build EquipAI.slnx`
Expected: 编译成功，无错误

- [ ] **Step 9: 提交**

```bash
git add src/EquipAI.Core/Enums/TenantStatus.cs \
        src/EquipAI.Core/Entities/Tenant.cs \
        src/EquipAI.Application/DTOs/Tenants/ \
        src/EquipAI.Application/Mapping/MappingProfile.cs \
        src/EquipAI.Infrastructure/Data/Migrations/ \
        src/EquipAI.Infrastructure/Seeding/DataSeeder.cs
git commit -m "feat: Tenant 实体扩展 — 新增 Status/TrialEndsAt/资源计数字段及迁移"
```

---

### Task 2: 注册 API (AuthService 增强 + RegisterRequest/Response)

**Goal:** 实现公开注册流程 -- POST /api/v1/auth/register 创建 Tenant + 管理员 User + 默认告警规则，以及 GET /api/v1/auth/plans 获取套餐列表。

**Pre-requisites:** Task 1 完成（Tenant 实体已有 Status/TrialEndsAt 字段）

**Files:**
- Create: `src/EquipAI.Application/DTOs/Auth/RegisterRequest.cs`
- Create: `src/EquipAI.Application/DTOs/Auth/PlanDto.cs`
- Modify: `src/EquipAI.Application/Interfaces/IAuthService.cs`
- Modify: `src/EquipAI.Application/Services/AuthService.cs`
- Modify: `src/EquipAI.WebAPI/Controllers/AuthController.cs`

- [ ] **Step 1: 编写注册测试（TDD 红灯）**

在 `tests/EquipAI.Tests.Integration/Controllers/AuthControllerTests.cs` 中添加：

```csharp
/// <summary>
/// 验证：使用有效信息注册新租户，应返回 200 和 JWT 令牌
/// </summary>
[Fact]
public async Task Register_WithValidData_ReturnsTokensAndCreatesTenant()
{
    var client = await _factory.CreateClientWithSeedAsync();
    var request = new
    {
        tenantName = "测试企业",
        slug = "test-company",
        username = "testadmin",
        password = "TestAdmin@123",
        displayName = "测试管理员",
        email = "test@example.com",
        plan = "Trial"
    };

    var response = await client.PostAsJsonAsync("/api/v1/auth/register", request);

    response.StatusCode.Should().Be(HttpStatusCode.OK);
    var result = await response.Content.ReadFromJsonAsync<AuthResponse>();
    result.Should().NotBeNull();
    result!.AccessToken.Should().NotBeEmpty();
    result.UserInfo.Username.Should().Be("testadmin");
}

/// <summary>
/// 验证：使用重复 Slug 注册，应返回 400
/// </summary>
[Fact]
public async Task Register_WithDuplicateSlug_Returns400()
{
    var client = await _factory.CreateClientWithSeedAsync();
    var request = new
    {
        tenantName = "默认租户",
        slug = "default",  // DataSeeder 已创建的 Slug
        username = "newadmin",
        password = "NewAdmin@123",
        displayName = "新管理员",
        email = "new@example.com",
        plan = "Trial"
    };

    var response = await client.PostAsJsonAsync("/api/v1/auth/register", request);

    response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
}

/// <summary>
/// 验证：获取套餐列表应返回公开数据
/// </summary>
[Fact]
public async Task GetPlans_ReturnsPlanList()
{
    var client = _factory.CreateClient();  // 无需种子数据

    var response = await client.GetAsync("/api/v1/auth/plans");

    response.StatusCode.Should().Be(HttpStatusCode.OK);
    var plans = await response.Content.ReadFromJsonAsync<List<PlanDto>>();
    plans.Should().NotBeNull();
    plans!.Count.Should().Be(3);
}
```

- [ ] **Step 2: 创建 RegisterRequest DTO**

```csharp
// src/EquipAI.Application/DTOs/Auth/RegisterRequest.cs
using System.ComponentModel.DataAnnotations;

namespace EquipAI.Application.DTOs.Auth;

/// <summary>
/// 公开注册请求 DTO
/// 同时创建租户和管理员用户，实现一站式注册
/// </summary>
public class RegisterRequest
{
    /// <summary>
    /// 租户名称（企业/组织名称）
    /// </summary>
    [Required(ErrorMessage = "企业名称不能为空")]
    [StringLength(200, ErrorMessage = "企业名称长度不能超过 200 个字符")]
    public string TenantName { get; set; } = string.Empty;

    /// <summary>
    /// 租户标识（URL Slug），用于子域名路由，全局唯一
    /// </summary>
    [Required(ErrorMessage = "企业标识不能为空")]
    [StringLength(50, ErrorMessage = "企业标识长度不能超过 50 个字符")]
    [RegularExpression(@"^[a-z0-9][a-z0-9\-]*[a-z0-9]$",
        ErrorMessage = "企业标识只能包含小写字母、数字和连字符，且不能以连字符开头或结尾")]
    public string Slug { get; set; } = string.Empty;

    /// <summary>
    /// 管理员登录用户名
    /// </summary>
    [Required(ErrorMessage = "用户名不能为空")]
    [StringLength(50, ErrorMessage = "用户名长度不能超过 50 个字符")]
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 管理员密码（至少 8 位，需包含大小写字母和数字）
    /// </summary>
    [Required(ErrorMessage = "密码不能为空")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "密码长度须在 8-100 个字符之间")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$",
        ErrorMessage = "密码需包含大小写字母和数字")]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// 管理员显示名称
    /// </summary>
    [StringLength(100, ErrorMessage = "显示名称长度不能超过 100 个字符")]
    public string? DisplayName { get; set; }

    /// <summary>
    /// 管理员邮箱
    /// </summary>
    [EmailAddress(ErrorMessage = "邮箱格式不正确")]
    public string? Email { get; set; }

    /// <summary>
    /// 选择的套餐（Trial/Professional/Enterprise），默认 Trial
    /// </summary>
    public string Plan { get; set; } = "Trial";
}
```

- [ ] **Step 3: 创建 PlanDto**

```csharp
// src/EquipAI.Application/DTOs/Auth/PlanDto.cs
namespace EquipAI.Application.DTOs.Auth;

/// <summary>
/// 套餐信息 DTO，用于公开的套餐列表展示
/// </summary>
public class PlanDto
{
    /// <summary>
    /// 套餐标识（Trial/Professional/Enterprise）
    /// </summary>
    public string PlanId { get; set; } = string.Empty;

    /// <summary>
    /// 套餐显示名称
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// 套餐描述
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// 最大设备数（0 表示不限）
    /// </summary>
    public int MaxDevices { get; set; }

    /// <summary>
    /// 最大用户数（0 表示不限）
    /// </summary>
    public int MaxUsers { get; set; }

    /// <summary>
    /// 数据保留天数
    /// </summary>
    public int DataRetentionDays { get; set; }

    /// <summary>
    /// 月度价格（元），0 表示免费
    /// </summary>
    public decimal MonthlyPrice { get; set; }

    /// <summary>
    /// 是否为免费套餐
    /// </summary>
    public bool IsFree { get; set; }
}
```

- [ ] **Step 4: 扩展 IAuthService 接口**

在 `src/EquipAI.Application/Interfaces/IAuthService.cs` 中添加两个方法：

```csharp
/// <summary>
/// 公开注册：创建租户 + 管理员用户，返回认证响应
/// 在一个事务中完成，确保原子性
/// </summary>
/// <param name="request">注册请求</param>
/// <returns>认证响应（含 Access Token、Refresh Token 和用户信息）</returns>
Task<AuthResponse> RegisterAsync(RegisterRequest request);

/// <summary>
/// 获取公开套餐列表（无需认证）
/// </summary>
/// <returns>套餐信息列表</returns>
Task<List<PlanDto>> GetPlansAsync();
```

在文件顶部添加 `using EquipAI.Application.DTOs.Auth;`。

- [ ] **Step 5: 实现 AuthService.RegisterAsync 和 GetPlansAsync（TDD 绿灯）**

在 `src/EquipAI.Application/Services/AuthService.cs` 中添加：

```csharp
/// <summary>
/// 各套餐对应的配额和价格定义
/// </summary>
private static readonly List<(string Id, string DisplayName, string Description,
    int MaxDevices, int MaxUsers, int RetentionDays, decimal Price)> PlanDefinitions = new()
{
    ("Trial", "试用版", "免费体验，14 天试用期",
        5, 3, 7, 0m),
    ("Professional", "专业版", "适合中小型制造企业",
        50, 20, 90, 999m),
    ("Enterprise", "企业版", "不限设备不限用户，专属支持",
        0, 0, 365, 0m),  // 0 表示不限
};

/// <summary>
/// 各套餐对应的配额限制，用于注册时设置 Tenant 字段
/// </summary>
private static readonly Dictionary<TenantPlan, (int MaxDevices, int MaxUsers, int RetentionDays)> PlanLimits = new()
{
    [TenantPlan.Trial] = (5, 3, 7),
    [TenantPlan.Professional] = (50, 20, 90),
    [TenantPlan.Enterprise] = (0, 0, 365),  // 0 表示不限
};

/// <summary>
/// 公开注册：在单个事务中创建租户和管理员用户
/// 注册后自动登录，返回 JWT 令牌
/// </summary>
/// <param name="request">注册请求</param>
/// <returns>认证响应</returns>
/// <exception cref="InvalidOperationException">Slug 或用户名已被占用</exception>
public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
{
    // 1. 检查 Slug 唯一性
    var slugExists = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
        .AnyAsync(t => t.Slug == request.Slug);

    if (slugExists)
    {
        throw new InvalidOperationException($"企业标识 '{request.Slug}' 已被占用");
    }

    // 2. 检查用户名全局唯一性
    var usernameExists = await _dbContext.UnfilteredSet<Core.Entities.User>()
        .AnyAsync(u => u.Username == request.Username);

    if (usernameExists)
    {
        throw new InvalidOperationException($"用户名 '{request.Username}' 已被占用");
    }

    // 3. 解析套餐
    var plan = Enum.TryParse<TenantPlan>(request.Plan, ignoreCase: true, out var p)
        ? p : TenantPlan.Trial;
    var limits = PlanLimits[plan];

    // 4. 创建租户
    var tenant = new Core.Entities.Tenant
    {
        Name = request.TenantName,
        Slug = request.Slug,
        Plan = plan,
        IsolationMode = TenantIsolationMode.Shared,
        MaxDevices = limits.MaxDevices == 0 ? int.MaxValue : limits.MaxDevices,
        MaxUsers = limits.MaxUsers == 0 ? int.MaxValue : limits.MaxUsers,
        DataRetentionDays = limits.RetentionDays,
        WorkOrderMode = WorkOrderMode.Independent,
        Settings = "{}",
        IsActive = true,
        Status = TenantStatus.Trial,
        TrialEndsAt = DateTime.UtcNow.AddDays(14),
        CurrentDeviceCount = 0,
        CurrentUserCount = 1  // 即将创建的管理员
    };

    _dbContext.Tenants.Add(tenant);

    // 5. 创建管理员用户
    var user = new Core.Entities.User
    {
        TenantId = tenant.Id,
        Username = request.Username,
        PasswordHash = PasswordHasher.HashPassword(request.Password),
        DisplayName = request.DisplayName ?? request.Username,
        Email = request.Email,
        Role = UserRole.SystemAdmin,
        IsActive = true,
        MustChangePassword = false,
        Language = "zh-CN"
    };

    _dbContext.Users.Add(user);

    // 6. 事务性保存
    await _dbContext.SaveChangesAsync();

    _logger.LogInformation(
        "新租户注册成功：{TenantName}（Slug: {Slug}），管理员：{Username}，套餐：{Plan}",
        tenant.Name, tenant.Slug, user.Username, plan);

    // 7. 自动登录，生成 JWT
    var accessToken = _jwtTokenService.GenerateAccessToken(user);
    var refreshToken = _jwtTokenService.GenerateRefreshToken();
    await _redisService.SetRefreshTokenAsync(user.Id, refreshToken, TimeSpan.FromDays(7));

    user.LastLoginAt = DateTime.UtcNow;
    await _dbContext.SaveChangesAsync();

    return new AuthResponse
    {
        AccessToken = accessToken,
        RefreshToken = refreshToken,
        UserInfo = _mapper.Map<UserDto>(user)!
    };
}

/// <summary>
/// 获取公开套餐列表
/// </summary>
/// <returns>套餐信息列表</returns>
public Task<List<PlanDto>> GetPlansAsync()
{
    var plans = PlanDefinitions.Select(p => new PlanDto
    {
        PlanId = p.Id,
        DisplayName = p.DisplayName,
        Description = p.Description,
        MaxDevices = p.MaxDevices,
        MaxUsers = p.MaxUsers,
        DataRetentionDays = p.RetentionDays,
        MonthlyPrice = p.Price,
        IsFree = p.Price == 0m
    }).ToList();

    return Task.FromResult(plans);
}
```

在文件顶部添加以下 using：

```csharp
using EquipAI.Core.Enums;
using Microsoft.EntityFrameworkCore;
```

- [ ] **Step 6: 扩展 AuthController**

在 `src/EquipAI.WebAPI/Controllers/AuthController.cs` 中添加两个新端点：

```csharp
/// <summary>
/// 公开注册：创建租户和管理员用户，自动登录
/// </summary>
/// <param name="request">注册请求</param>
/// <returns>认证响应</returns>
[HttpPost("register")]
[ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status400BadRequest)]
public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
{
    try
    {
        var response = await _authService.RegisterAsync(request);
        return Ok(response);
    }
    catch (InvalidOperationException ex)
    {
        return BadRequest(new { code = 400, message = ex.Message });
    }
}

/// <summary>
/// 获取公开套餐列表（无需认证）
/// </summary>
/// <returns>套餐列表</returns>
[HttpGet("plans")]
[ProducesResponseType(typeof(List<PlanDto>), StatusCodes.Status200OK)]
public async Task<ActionResult<List<PlanDto>>> GetPlans()
{
    var plans = await _authService.GetPlansAsync();
    return Ok(plans);
}
```

在文件顶部添加 `using EquipAI.Application.DTOs.Auth;`。

- [ ] **Step 7: 运行注册相关测试**

Run: `dotnet test tests/EquipAI.Tests.Integration --filter "AuthControllerTests" --verbosity normal`
Expected: 所有 Auth 测试通过（包括原有登录测试和新增注册测试）

- [ ] **Step 8: 编译全量确认**

Run: `dotnet build EquipAI.slnx`
Expected: 编译成功

- [ ] **Step 9: 提交**

```bash
git add src/EquipAI.Application/DTOs/Auth/RegisterRequest.cs \
        src/EquipAI.Application/DTOs/Auth/PlanDto.cs \
        src/EquipAI.Application/Interfaces/IAuthService.cs \
        src/EquipAI.Application/Services/AuthService.cs \
        src/EquipAI.WebAPI/Controllers/AuthController.cs \
        tests/EquipAI.Tests.Integration/Controllers/AuthControllerTests.cs
git commit -m "feat: 公开注册 API — RegisterAsync + GetPlans + 事务性租户/用户创建"
```

---

### Task 3: QuotaMiddleware + 配额检查服务增强（Redis 缓存）

**Goal:** 升级 UsageLimitMiddleware 使用 Redis 缓存加速配额检查，新增 TenantService 冻结/解冻方法，更新 SubscriptionService 支持 TenantStatus。

**Pre-requisites:** Task 1 完成（Tenant 已有 Status/CurrentDeviceCount/CurrentUserCount）

**Files:**
- Modify: `src/EquipAI.Infrastructure/Cache/RedisService.cs`
- Modify: `src/EquipAI.Infrastructure/Middleware/UsageLimitMiddleware.cs`
- Modify: `src/EquipAI.Application/Interfaces/ITenantService.cs`
- Modify: `src/EquipAI.Application/Services/TenantService.cs`
- Modify: `src/EquipAI.Application/Interfaces/SubscriptionService.cs` (即 SubscriptionService 实现类)
- Modify: `src/EquipAI.Application/Services/DeviceService.cs` — 维护 CurrentDeviceCount
- Modify: `src/EquipAI.Application/Services/UserService.cs` — 维护 CurrentUserCount

- [ ] **Step 1: 编写配额缓存测试**

在 `tests/EquipAI.Tests.Unit/` 中新建或追加配额相关测试（此处为简化的集成测试，确保中间件在配额超限时返回 403）。

- [ ] **Step 2: 扩展 RedisService 配额缓存方法**

在 `src/EquipAI.Infrastructure/Cache/RedisService.cs` 中新增：

```csharp
/// <summary>
/// 获取租户配额缓存（设备数/用户数）
/// 键格式：quota:{tenantId}:devices / quota:{tenantId}:users
/// 默认缓存 5 分钟，减少数据库 COUNT 查询
/// </summary>
/// <param name="tenantId">租户 ID</param>
/// <param name="resourceType">资源类型（device/user）</param>
/// <returns>缓存中的计数，未命中返回 null</returns>
public virtual async Task<int?> GetQuotaCacheAsync(Guid tenantId, string resourceType)
{
    var key = $"quota:{tenantId}:{resourceType}";
    var value = await _database.StringGetAsync(key);
    return value.HasValue ? (int?)value : null;
}

/// <summary>
/// 设置租户配额缓存
/// </summary>
/// <param name="tenantId">租户 ID</param>
/// <param name="resourceType">资源类型</param>
/// <param name="count">当前数量</param>
/// <param name="expiry">缓存过期时间，默认 5 分钟</param>
public virtual async Task SetQuotaCacheAsync(Guid tenantId, string resourceType, int count,
    TimeSpan? expiry = null)
{
    var key = $"quota:{tenantId}:{resourceType}";
    await _database.StringSetAsync(key, count, expiry ?? TimeSpan.FromMinutes(5));
}

/// <summary>
/// 使租户配额缓存失效（创建/删除资源后调用）
/// </summary>
/// <param name="tenantId">租户 ID</param>
/// <param name="resourceType">资源类型</param>
public virtual async Task InvalidateQuotaCacheAsync(Guid tenantId, string resourceType)
{
    var key = $"quota:{tenantId}:{resourceType}";
    await _database.KeyDeleteAsync(key);
}
```

- [ ] **Step 3: 升级 SubscriptionService 支持 TenantStatus**

修改 `src/EquipAI.Application/Interfaces/SubscriptionService.cs` 中的 `CanCreateResourceAsync`：

```csharp
/// <inheritdoc />
public async Task<bool> CanCreateResourceAsync(Guid tenantId, string resourceType, CancellationToken ct = default)
{
    using var scope = _scopeFactory.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    var tenant = await db.UnfilteredSet<Core.Entities.Tenant>()
        .FirstOrDefaultAsync(t => t.Id == tenantId, ct);

    // 租户不存在、未激活或已冻结时不允许创建资源
    if (tenant == null || !tenant.IsActive)
        return false;

    // 检查租户状态：Expired/Frozen/Closed 不允许创建
    if (tenant.Status == TenantStatus.Expired
        || tenant.Status == TenantStatus.Frozen
        || tenant.Status == TenantStatus.Closed)
        return false;

    // 试用期过期检查
    if (tenant.Status == TenantStatus.Trial
        && tenant.TrialEndsAt.HasValue
        && tenant.TrialEndsAt.Value < DateTime.UtcNow)
        return false;

    // 使用 CurrentDeviceCount/CurrentUserCount 快速判断（优先从字段读取，无需 COUNT）
    return resourceType.ToLowerInvariant() switch
    {
        "device" => tenant.CurrentDeviceCount < tenant.MaxDevices,
        "user" => tenant.CurrentUserCount < tenant.MaxUsers,
        _ => true
    };
}
```

在文件顶部添加 `using EquipAI.Core.Enums;`。

- [ ] **Step 4: 升级 UsageLimitMiddleware 使用 Redis 缓存**

修改 `src/EquipAI.Infrastructure/Middleware/UsageLimitMiddleware.cs` 中的 `InvokeAsync` 方法核心逻辑：

```csharp
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

    // 从 HttpContext.Items 获取租户上下文（由 TenantResolutionMiddleware 写入）
    if (!context.Items.TryGetValue(TenantResolutionMiddleware.TenantContextKey, out var tenantCtxObj)
        || tenantCtxObj is not ITenantContext tenantCtx
        || tenantCtx.TenantId == Guid.Empty)
    {
        await _next(context);
        return;
        }

    // 按需解析服务
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
        _logger.LogWarning("租户 {TenantId} 超出 {ResourceType} 配额限制或租户状态异常",
            tenantCtx.TenantId, resourceType);
        context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
        context.Response.ContentType = "application/json";

        var resourceTypeName = resourceType switch
        {
            "device" => "设备",
            "user" => "用户",
            _ => resourceType
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(new
        {
            code = 403,
            message = $"已超出{resourceTypeName}数量上限或租户状态异常，请联系管理员",
            details = (string?)null
        }, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
        return;
    }

    await _next(context);
}
```

- [ ] **Step 5: 扩展 ITenantService 增加冻结/解冻接口**

在 `src/EquipAI.Application/Interfaces/ITenantService.cs` 中添加：

```csharp
/// <summary>
/// 冻结租户（停用登录和数据写入）
/// </summary>
/// <param name="tenantId">租户 ID</param>
Task FreezeTenantAsync(Guid tenantId);

/// <summary>
/// 解冻租户（恢复为 Active 状态）
/// </summary>
/// <param name="tenantId">租户 ID</param>
Task UnfreezeTenantAsync(Guid tenantId);

/// <summary>
/// 获取租户详情（含用量统计），用于 system_admin 门户
/// </summary>
/// <param name="tenantId">租户 ID</param>
/// <returns>租户详情</returns>
Task<TenantDetailDto?> GetTenantDetailAsync(Guid tenantId);
```

在文件顶部添加 `using EquipAI.Application.DTOs.Tenants;`。

- [ ] **Step 6: 实现冻结/解冻和详情方法**

在 `src/EquipAI.Application/Services/TenantService.cs` 中添加：

```csharp
/// <summary>
/// 冻结租户 — 将状态设为 Frozen，IsActive 设为 false
/// 冻结后该租户所有用户无法登录，无法创建新资源
/// </summary>
/// <param name="tenantId">租户 ID</param>
/// <exception cref="KeyNotFoundException">租户不存在</exception>
public async Task FreezeTenantAsync(Guid tenantId)
{
    var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
        .FirstOrDefaultAsync(t => t.Id == tenantId)
        ?? throw new KeyNotFoundException($"租户 {tenantId} 不存在");

    tenant.Status = TenantStatus.Frozen;
    tenant.IsActive = false;
    await _dbContext.SaveChangesAsync();

    _logger.LogWarning("租户 {TenantId}（{Name}）已被冻结", tenantId, tenant.Name);
}

/// <summary>
/// 解冻租户 — 恢复为 Active 状态
/// </summary>
/// <param name="tenantId">租户 ID</param>
/// <exception cref="KeyNotFoundException">租户不存在</exception>
public async Task UnfreezeTenantAsync(Guid tenantId)
{
    var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
        .FirstOrDefaultAsync(t => t.Id == tenantId)
        ?? throw new KeyNotFoundException($"租户 {tenantId} 不存在");

    tenant.Status = TenantStatus.Active;
    tenant.IsActive = true;
    await _dbContext.SaveChangesAsync();

    _logger.LogInformation("租户 {TenantId}（{Name}）已解冻", tenantId, tenant.Name);
}

/// <summary>
/// 获取租户详情（含用量统计）
/// 用于 system_admin 门户的租户详情页
/// </summary>
/// <param name="tenantId">租户 ID</param>
/// <returns>租户详情，不存在返回 null</returns>
public async Task<TenantDetailDto?> GetTenantDetailAsync(Guid tenantId)
{
    var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
        .FirstOrDefaultAsync(t => t.Id == tenantId);

    if (tenant == null) return null;

    var detail = new TenantDetailDto
    {
        Id = tenant.Id,
        Name = tenant.Name,
        Slug = tenant.Slug,
        Plan = tenant.Plan.ToString(),
        Status = tenant.Status.ToString(),
        MaxDevices = tenant.MaxDevices,
        MaxUsers = tenant.MaxUsers,
        CurrentDeviceCount = tenant.CurrentDeviceCount,
        CurrentUserCount = tenant.CurrentUserCount,
        DataRetentionDays = tenant.DataRetentionDays,
        IsActive = tenant.IsActive,
        TrialEndsAt = tenant.TrialEndsAt,
        SubscriptionEndsAt = tenant.SubscriptionEndsAt,
        CreatedAt = tenant.CreatedAt,
        ActiveAlertCount = await _dbContext.UnfilteredSet<Core.Entities.Alert>()
            .CountAsync(a => a.TenantId == tenantId
                && a.Status == Core.Enums.AlertStatus.Active),
        PendingWorkOrderCount = await _dbContext.UnfilteredSet<Core.Entities.WorkOrder>()
            .CountAsync(w => w.TenantId == tenantId
                && w.Status == Core.Enums.WorkOrderStatus.PendingDispatch),
        MonthlyAnalysisCount = await _dbContext.UnfilteredSet<Core.Entities.Analysis>()
            .CountAsync(a => a.TenantId == tenantId
                && a.CreatedAt >= DateTime.UtcNow.AddDays(-30))
    };

    // 获取管理员信息
    var admin = await _dbContext.UnfilteredSet<Core.Entities.User>()
        .FirstOrDefaultAsync(u => u.TenantId == tenantId
            && u.Role == Core.Enums.UserRole.SystemAdmin);

    if (admin != null)
    {
        detail.AdminUsername = admin.Username;
        detail.AdminEmail = admin.Email;
    }

    return detail;
}
```

在文件顶部添加：
```csharp
using EquipAI.Application.DTOs.Tenants;
using EquipAI.Core.Enums;
```

- [ ] **Step 7: 维护 CurrentDeviceCount / CurrentUserCount**

修改 `src/EquipAI.Application/Services/DeviceService.cs` 中的设备创建方法，在创建设备后递增 CurrentDeviceCount：

```csharp
// 在 SaveChangesAsync 之前添加：
var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
    .FirstOrDefaultAsync(t => t.Id == tenantId);
if (tenant != null)
{
    tenant.CurrentDeviceCount++;
}
await _dbContext.SaveChangesAsync();
```

类似地在删除设备方法中递减。对 `UserService.cs` 的 CreateUserAsync 和 DeactivateUserAsync 做相同处理。

- [ ] **Step 8: 编译确认**

Run: `dotnet build EquipAI.slnx`
Expected: 编译成功

- [ ] **Step 9: 运行全量测试**

Run: `dotnet test --verbosity normal`
Expected: 所有测试通过

- [ ] **Step 10: 提交**

```bash
git add src/EquipAI.Infrastructure/Cache/RedisService.cs \
        src/EquipAI.Infrastructure/Middleware/UsageLimitMiddleware.cs \
        src/EquipAI.Application/Interfaces/ITenantService.cs \
        src/EquipAI.Application/Services/TenantService.cs \
        src/EquipAI.Application/Interfaces/SubscriptionService.cs \
        src/EquipAI.Application/Services/DeviceService.cs \
        src/EquipAI.Application/Services/UserService.cs
git commit -m "feat: 配额中间件增强 — TenantStatus 检查 + 冻结/解冻 + CurrentCount 维护"
```

---

### Task 4: 前端注册页面

**Goal:** 实现 /register 注册页面，包含企业信息、管理员信息和套餐选择三个步骤。

**Pre-requisites:** Task 2 完成（注册 API 已就绪）

**Files:**
- Create: `frontend/src/hooks/useRegister.ts`
- Create: `frontend/src/pages/RegisterPage.tsx`
- Modify: `frontend/src/App.tsx` — 添加注册路由
- Modify: `frontend/src/types/index.ts` — 添加注册和套餐类型
- Modify: `frontend/src/i18n/zh.json` — 添加注册相关翻译
- Modify: `frontend/src/i18n/en.json` — 添加注册相关翻译

- [ ] **Step 1: 扩展 TypeScript 类型**

在 `frontend/src/types/index.ts` 中添加：

```typescript
// ============================================================================
// 注册
// ============================================================================

/** 注册请求参数 */
export interface RegisterRequest {
  /** 企业名称 */
  tenantName: string;
  /** 企业标识（URL Slug） */
  slug: string;
  /** 管理员用户名 */
  username: string;
  /** 管理员密码 */
  password: string;
  /** 管理员显示名称 */
  displayName?: string;
  /** 管理员邮箱 */
  email?: string;
  /** 套餐选择 */
  plan: string;
}

/** 套餐信息 */
export interface PlanInfo {
  /** 套餐标识 */
  planId: string;
  /** 显示名称 */
  displayName: string;
  /** 套餐描述 */
  description: string;
  /** 最大设备数 */
  maxDevices: number;
  /** 最大用户数 */
  maxUsers: number;
  /** 数据保留天数 */
  dataRetentionDays: number;
  /** 月度价格 */
  monthlyPrice: number;
  /** 是否免费 */
  isFree: boolean;
}
```

- [ ] **Step 2: 创建注册 hooks**

```typescript
// frontend/src/hooks/useRegister.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import type { PlanInfo, RegisterRequest, AuthResponse } from '../types';

/** 获取公开套餐列表 */
export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data } = await api.get<PlanInfo[]>('/auth/plans');
      return data;
    },
    // 套餐列表很少变化，缓存 10 分钟
    staleTime: 10 * 60 * 1000,
  });
}

/** 注册新租户 */
export function useRegister() {
  return useMutation({
    mutationFn: async (request: RegisterRequest) => {
      const { data } = await api.post<AuthResponse>('/auth/register', request);
      return data;
    },
  });
}
```

- [ ] **Step 3: 创建注册页面**

```tsx
// frontend/src/pages/RegisterPage.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { usePlans, useRegister } from '../hooks/useRegister';
import { useAuthStore } from '../stores/authStore';
import type { PlanInfo } from '../types';

/** 注册表单数据 */
type RegisterFormData = {
  tenantName: string;
  slug: string;
  username: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  email: string;
};

/**
 * 注册页面组件
 *
 * 三步注册流程：1) 套餐选择 -> 2) 企业信息 -> 3) 管理员账户
 * 注册成功后自动登录并跳转仪表盘。
 */
export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>('Trial');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const { data: plans } = usePlans();
  const registerMutation = useRegister();

  /** 注册表单校验规则 */
  const registerSchema = z.object({
    tenantName: z.string().min(1, t('register.tenantNameRequired')),
    slug: z.string()
      .min(1, t('register.slugRequired'))
      .regex(/^[a-z0-9][a-z0-9\-]*[a-z0-9]$/, t('register.slugFormat')),
    username: z.string().min(1, t('register.usernameRequired')),
    password: z.string()
      .min(8, t('register.passwordMinLength'))
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, t('register.passwordFormat')),
    confirmPassword: z.string().min(1, t('register.confirmPasswordRequired')),
    displayName: z.string().optional(),
    email: z.string().email(t('register.emailFormat')).optional().or(z.literal('')),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('register.passwordMismatch'),
    path: ['confirmPassword'],
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  /** 提交注册 */
  const onSubmit = async (data: RegisterFormData) => {
    setError('');
    try {
      const response = await registerMutation.mutateAsync({
        tenantName: data.tenantName,
        slug: data.slug,
        username: data.username,
        password: data.password,
        displayName: data.displayName || undefined,
        email: data.email || undefined,
        plan: selectedPlan,
      });
      setAuth(response.accessToken, response.userInfo);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || t('register.registerError');
      setError(message);
    }
  };

  /** 套餐卡片渲染 */
  const renderPlanCard = (plan: PlanInfo) => (
    <Card
      key={plan.planId}
      className={`cursor-pointer transition-all hover:shadow-md ${
        selectedPlan === plan.planId ? 'ring-2 ring-primary shadow-md' : ''
      }`}
      onClick={() => setSelectedPlan(plan.planId)}
    >
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold">{plan.displayName}</h3>
        <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
        <div className="mt-3 space-y-1">
          <p className="text-sm">
            {plan.maxDevices === 0 ? t('register.unlimited') : `${plan.maxDevices}`} {t('register.devices')}
          </p>
          <p className="text-sm">
            {plan.maxUsers === 0 ? t('register.unlimited') : `${plan.maxUsers}`} {t('register.users')}
          </p>
          <p className="text-sm">{plan.dataRetentionDays} {t('register.retentionDays')}</p>
        </div>
        <p className="mt-3 text-xl font-bold">
          {plan.isFree ? t('register.free') : `¥${plan.monthlyPrice}/${t('register.month')}`}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{t('register.title')}</CardTitle>
        <CardDescription>{t('register.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* 步骤指示器 */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-colors ${
                step >= s ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step 1: 套餐选择 */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('register.selectPlan')}</h3>
            <div className="grid gap-3 md:grid-cols-3">
              {plans?.map(renderPlanCard)}
            </div>
            <Button className="w-full" onClick={() => setStep(2)}>
              {t('register.next')}
            </Button>
          </div>
        )}

        {/* Step 2: 企业信息 */}
        {step === 2 && (
          <form onSubmit={handleSubmit((_) => setStep(3))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenantName">{t('register.tenantName')}</Label>
              <Input id="tenantName" {...register('tenantName')} placeholder={t('register.tenantNamePlaceholder')} />
              {errors.tenantName && <p className="text-sm text-destructive">{errors.tenantName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">{t('register.slug')}</Label>
              <Input id="slug" {...register('slug')} placeholder={t('register.slugPlaceholder')} />
              {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                {t('register.previous')}
              </Button>
              <Button type="submit" className="flex-1">
                {t('register.next')}
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: 管理员账户 */}
        {step === 3 && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t('register.adminUsername')}</Label>
              <Input id="username" {...register('username')} placeholder={t('register.usernamePlaceholder')} />
              {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">{t('register.password')}</Label>
                <Input id="password" type="password" {...register('password')} />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('register.confirmPassword')}</Label>
                <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="displayName">{t('register.displayName')}</Label>
                <Input id="displayName" {...register('displayName')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('register.email')}</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(2)}>
                {t('register.previous')}
              </Button>
              <Button type="submit" className="flex-1" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? t('common.loading') : t('register.submit')}
              </Button>
            </div>
          </form>
        )}

        {/* 底部登录链接 */}
        <div className="mt-4 text-center text-sm text-muted-foreground">
          {t('register.hasAccount')}{' '}
          <Link to="/login" className="text-primary hover:underline">{t('auth.login')}</Link>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: 添加注册路由**

在 `frontend/src/App.tsx` 中：

1. 导入：`import RegisterPage from './pages/RegisterPage';`
2. 在 AuthLayout 路由组中，`/login` 路由之后添加：

```tsx
<Route path="/register" element={<RegisterPage />} />
```

- [ ] **Step 5: 添加 i18n 翻译**

在 `frontend/src/i18n/zh.json` 中添加 `register` 部分：

```json
"register": {
  "title": "注册新账户",
  "subtitle": "创建您的企业账户，开始使用 EquipSense",
  "selectPlan": "选择套餐",
  "tenantName": "企业名称",
  "tenantNamePlaceholder": "例如：青岛某某科技有限公司",
  "tenantNameRequired": "请输入企业名称",
  "slug": "企业标识",
  "slugPlaceholder": "例如：qingdao-tech（用于访问地址）",
  "slugRequired": "请输入企业标识",
  "slugFormat": "企业标识只能包含小写字母、数字和连字符",
  "adminUsername": "管理员用户名",
  "usernamePlaceholder": "登录用户名",
  "usernameRequired": "请输入用户名",
  "password": "密码",
  "passwordMinLength": "密码至少 8 个字符",
  "passwordFormat": "密码需包含大小写字母和数字",
  "confirmPassword": "确认密码",
  "confirmPasswordRequired": "请再次输入密码",
  "passwordMismatch": "两次输入的密码不一致",
  "displayName": "显示名称",
  "email": "邮箱",
  "emailFormat": "邮箱格式不正确",
  "next": "下一步",
  "previous": "上一步",
  "submit": "完成注册",
  "free": "免费",
  "month": "月",
  "devices": "台设备",
  "users": "位用户",
  "retentionDays": "天数据保留",
  "unlimited": "不限",
  "hasAccount": "已有账户？",
  "registerError": "注册失败，请稍后重试"
}
```

在 `en.json` 中添加对应英文翻译。

- [ ] **Step 6: TypeScript 检查**

Run: `cd frontend && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 7: 提交**

```bash
git add frontend/src/hooks/useRegister.ts \
        frontend/src/pages/RegisterPage.tsx \
        frontend/src/App.tsx \
        frontend/src/types/index.ts \
        frontend/src/i18n/zh.json \
        frontend/src/i18n/en.json
git commit -m "feat: 前端注册页面 — 三步注册流程 + 套餐选择 + 自动登录"
```

---

### Task 5: system_admin 门户 (TenantsPage + TenantDetailPage + 后端 API)

**Goal:** 实现 system_admin 租户管理门户，包括租户列表（搜索/过滤/冻结/解冻）、租户详情（资源统计/套餐升降级）和仪表盘全局统计增强。

**Pre-requisites:** Task 3 完成（TenantService 已有冻结/解冻/详情方法）

**Files:**
- Modify: `src/EquipAI.WebAPI/Controllers/TenantsController.cs` — 新增冻结/解冻/详情端点
- Create: `frontend/src/pages/admin/TenantsPage.tsx`
- Create: `frontend/src/pages/admin/TenantDetailPage.tsx`
- Modify: `frontend/src/pages/DashboardPage.tsx` — system_admin 全局统计增强
- Create: `frontend/src/hooks/useTenantsAdmin.ts`
- Modify: `frontend/src/components/layout/Sidebar.tsx` — system_admin 导航
- Modify: `frontend/src/components/layout/AuthGuard.tsx` — 支持 admin 路由保护
- Modify: `frontend/src/App.tsx` — admin 路由
- Modify: `frontend/src/i18n/zh.json` — admin 翻译
- Modify: `frontend/src/i18n/en.json` — admin 翻译

- [ ] **Step 1: 扩展 TenantsController 后端 API**

在 `src/EquipAI.WebAPI/Controllers/TenantsController.cs` 中添加以下端点：

```csharp
/// <summary>
/// 获取租户详情（含用量统计）
/// </summary>
/// <param name="id">租户 ID</param>
/// <returns>租户详情</returns>
[HttpGet("{id:guid}/detail")]
[RequirePermission("tenant:read")]
[ProducesResponseType(typeof(TenantDetailDto), StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
public async Task<ActionResult<TenantDetailDto>> GetTenantDetail(Guid id)
{
    var detail = await _tenantService.GetTenantDetailAsync(id);
    if (detail == null)
    {
        return NotFound(new { code = 404, message = "租户不存在" });
    }
    return Ok(detail);
}

/// <summary>
/// 冻结租户
/// </summary>
/// <param name="id">租户 ID</param>
[HttpPut("{id:guid}/freeze")]
[RequirePermission("tenant:update")]
[ProducesResponseType(StatusCodes.Status200OK)]
public async Task<ActionResult> FreezeTenant(Guid id)
{
    await _tenantService.FreezeTenantAsync(id);
    return Ok(new { message = "租户已冻结" });
}

/// <summary>
/// 解冻租户
/// </summary>
/// <param name="id">租户 ID</param>
[HttpPut("{id:guid}/unfreeze")]
[RequirePermission("tenant:update")]
[ProducesResponseType(StatusCodes.Status200OK)]
public async Task<ActionResult> UnfreezeTenant(Guid id)
{
    await _tenantService.UnfreezeTenantAsync(id);
    return Ok(new { message = "租户已解冻" });
}

/// <summary>
/// 获取全局统计（system_admin 仪表盘用）
/// </summary>
[HttpGet("stats")]
[RequirePermission("tenant:read")]
[ProducesResponseType(StatusCodes.Status200OK)]
public async Task<ActionResult<Dictionary<string, object>>> GetGlobalStats()
{
    var usage = await _tenantService.GetGlobalStatsAsync();
    return Ok(usage);
}
```

在 `ITenantService` 中添加 `GetGlobalStatsAsync` 并在 `TenantService` 中实现：

```csharp
// ITenantService
/// <summary>
/// 获取全局统计（system_admin 仪表盘）
/// </summary>
Task<Dictionary<string, object>> GetGlobalStatsAsync();
```

```csharp
// TenantService 实现
/// <summary>
/// 获取全局统计信息
/// </summary>
public async Task<Dictionary<string, object>> GetGlobalStatsAsync()
{
    var totalTenants = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
        .CountAsync(t => t.Id != SystemConstants.SystemTenantId);
    var activeTenants = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
        .CountAsync(t => t.Id != SystemConstants.SystemTenantId && t.IsActive);
    var trialTenants = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
        .CountAsync(t => t.Id != SystemConstants.SystemTenantId && t.Status == TenantStatus.Trial);
    var frozenTenants = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
        .CountAsync(t => t.Id != SystemConstants.SystemTenantId && t.Status == TenantStatus.Frozen);

    var totalDevices = await _dbContext.UnfilteredSet<Core.Entities.Device>()
        .CountAsync(d => d.TenantId != SystemConstants.SystemTenantId);
    var totalUsers = await _dbContext.UnfilteredSet<Core.Entities.User>()
        .CountAsync(u => u.TenantId != SystemConstants.SystemTenantId);

    return new Dictionary<string, object>
    {
        ["totalTenants"] = totalTenants,
        ["activeTenants"] = activeTenants,
        ["trialTenants"] = trialTenants,
        ["frozenTenants"] = frozenTenants,
        ["totalDevices"] = totalDevices,
        ["totalUsers"] = totalUsers
    };
}
```

需要在 `TenantService.cs` 中添加 `using EquipAI.Core.Constants;` 和 `using EquipAI.Core.Enums;`。

同时在 `TenantsController.cs` 中添加 `using EquipAI.Application.DTOs.Tenants;`。

- [ ] **Step 2: 创建 admin hooks**

```typescript
// frontend/src/hooks/useTenantsAdmin.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { PagedResult } from '../types';

/** 租户管理列表项 */
export interface TenantAdminItem {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  maxDevices: number;
  maxUsers: number;
  currentDeviceCount: number;
  currentUserCount: number;
  isActive: boolean;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  createdAt: string;
}

/** 租户详情 */
export interface TenantAdminDetail extends TenantAdminItem {
  activeAlertCount: number;
  pendingWorkOrderCount: number;
  monthlyAnalysisCount: number;
  adminUsername: string;
  adminEmail: string | null;
  dataRetentionDays: number;
}

/** 获取租户列表（system_admin） */
export function useTenantsAdmin(params: { page: number; pageSize: number; keyword?: string }) {
  return useQuery({
    queryKey: ['admin-tenants', params],
    queryFn: async () => {
      const { data } = await api.get<PagedResult<TenantAdminItem>>('/admin/tenants', { params });
      return data;
    },
  });
}

/** 获取租户详情 */
export function useTenantDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['admin-tenant-detail', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get<TenantAdminDetail>(`/admin/tenants/${id}/detail`);
      return data;
    },
    enabled: !!id,
  });
}

/** 获取全局统计 */
export function useGlobalStats() {
  return useQuery({
    queryKey: ['admin-global-stats'],
    queryFn: async () => {
      const { data } = await api.get<Record<string, number>>('/admin/tenants/stats');
      return data;
    },
  });
}

/** 冻结租户 */
export function useFreezeTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/admin/tenants/${id}/freeze`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tenants'] });
      qc.invalidateQueries({ queryKey: ['admin-tenant-detail'] });
    },
  });
}

/** 解冻租户 */
export function useUnfreezeTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/admin/tenants/${id}/unfreeze`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tenants'] });
      qc.invalidateQueries({ queryKey: ['admin-tenant-detail'] });
    },
  });
}
```

- [ ] **Step 3: 创建 TenantsPage**

```tsx
// frontend/src/pages/admin/TenantsPage.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { useTenantsAdmin, useFreezeTenant, useUnfreezeTenant } from '../../hooks/useTenantsAdmin';
import { Search, Snowflake, Sun } from 'lucide-react';

/**
 * 租户管理页面（system_admin）
 *
 * 展示所有租户列表，支持搜索、冻结/解冻操作。
 * 点击租户行进入详情页。
 */
export default function TenantsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: tenantsData, isLoading } = useTenantsAdmin({ page, pageSize, keyword });
  const freezeMutation = useFreezeTenant();
  const unfreezeMutation = useUnfreezeTenant();

  /** 状态徽章颜色 */
  const statusVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'default' as const;
      case 'Trial': return 'secondary' as const;
      case 'Frozen': return 'destructive' as const;
      case 'Expired': return 'outline' as const;
      default: return 'outline' as const;
    }
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      Trial: t('admin.trial'), Active: t('admin.active'),
      Expired: t('admin.expired'), Frozen: t('admin.frozen'), Closed: t('admin.closed'),
    };
    return map[status] || status;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('admin.tenantsTitle')}</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 w-64"
              placeholder={t('admin.searchTenants')}
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.tenantName')}</TableHead>
                <TableHead>{t('admin.slug')}</TableHead>
                <TableHead>{t('admin.plan')}</TableHead>
                <TableHead>{t('admin.status')}</TableHead>
                <TableHead>{t('admin.devices')}</TableHead>
                <TableHead>{t('admin.users')}</TableHead>
                <TableHead>{t('common.createdAt')}</TableHead>
                <TableHead>{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {t('common.loading')}
                  </TableCell>
                </TableRow>
              ) : tenantsData?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                tenantsData?.items.map((tenant) => (
                  <TableRow
                    key={tenant.id}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                  >
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell className="text-muted-foreground">{tenant.slug}</TableCell>
                    <TableCell>{tenant.plan}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(tenant.status)}>
                        {statusLabel(tenant.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{tenant.currentDeviceCount}/{tenant.maxDevices === 2147483647 ? '∞' : tenant.maxDevices}</TableCell>
                    <TableCell>{tenant.currentUserCount}/{tenant.maxUsers === 2147483647 ? '∞' : tenant.maxUsers}</TableCell>
                    <TableCell>{new Date(tenant.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {tenant.status === 'Frozen' ? (
                          <Button
                            size="sm" variant="outline"
                            onClick={() => unfreezeMutation.mutate(tenant.id)}
                            disabled={unfreezeMutation.isPending}
                          >
                            <Sun className="mr-1 h-3 w-3" />
                            {t('admin.unfreeze')}
                          </Button>
                        ) : (
                          <Button
                            size="sm" variant="outline"
                            onClick={() => freezeMutation.mutate(tenant.id)}
                            disabled={freezeMutation.isPending}
                          >
                            <Snowflake className="mr-1 h-3 w-3" />
                            {t('admin.freeze')}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 分页 */}
      {tenantsData && tenantsData.total > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('common.totalItems', { count: tenantsData.total })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              {t('common.previous')}
            </Button>
            <Button
              variant="outline" size="sm"
              disabled={page * pageSize >= tenantsData.total}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 创建 TenantDetailPage**

```tsx
// frontend/src/pages/admin/TenantDetailPage.tsx
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { useTenantDetail, useFreezeTenant, useUnfreezeTenant } from '../../hooks/useTenantsAdmin';
import { useChangePlan } from '../../hooks/useSubscription';
import { ArrowLeft, Snowflake, Sun } from 'lucide-react';

const planOptions = [
  { value: 'Trial', label: '试用版' },
  { value: 'Professional', label: '专业版' },
  { value: 'Enterprise', label: '企业版' },
];

/**
 * 租户详情页（system_admin）
 *
 * 展示租户基础信息、资源用量统计、管理员信息和操作按钮（冻结/解冻/套餐升降级）。
 */
export default function TenantDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: detail, isLoading } = useTenantDetail(id);
  const freezeMutation = useFreezeTenant();
  const unfreezeMutation = useUnfreezeTenant();
  const changePlanMutation = useChangePlan();

  if (isLoading) {
    return <p className="text-center text-muted-foreground py-8">{t('common.loading')}</p>;
  }

  if (!detail) {
    return <p className="text-center text-muted-foreground py-8">{t('common.noData')}</p>;
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'default' as const;
      case 'Trial': return 'secondary' as const;
      case 'Frozen': return 'destructive' as const;
      default: return 'outline' as const;
    }
  };

  return (
    <div className="space-y-6">
      {/* 返回按钮 + 标题 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/tenants')}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('admin.backToList')}
        </Button>
        <h1 className="text-2xl font-bold">{detail.name}</h1>
        <Badge variant={statusVariant(detail.status)}>{detail.status}</Badge>
      </div>

      {/* 基础信息 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.basicInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.slug')}</p>
              <p className="font-medium">{detail.slug}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.plan')}</p>
              <p className="font-medium">{detail.plan}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.adminUser')}</p>
              <p className="font-medium">{detail.adminUsername} {detail.adminEmail && `(${detail.adminEmail})`}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.trialEndsAt')}</p>
              <p className="font-medium">{detail.trialEndsAt ? new Date(detail.trialEndsAt).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.subscriptionEndsAt')}</p>
              <p className="font-medium">{detail.subscriptionEndsAt ? new Date(detail.subscriptionEndsAt).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('common.createdAt')}</p>
              <p className="font-medium">{new Date(detail.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 资源用量 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.resourceUsage')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: t('admin.devices'), current: detail.currentDeviceCount, max: detail.maxDevices },
              { label: t('admin.users'), current: detail.currentUserCount, max: detail.maxUsers },
              { label: t('admin.activeAlerts'), current: detail.activeAlertCount, max: null },
              { label: t('admin.pendingWorkOrders'), current: detail.pendingWorkOrderCount, max: null },
            ].map(({ label, current, max }) => (
              <div key={label} className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">
                  {current}
                  {max !== null && (
                    <span className="text-sm font-normal text-muted-foreground">
                      / {max >= 2147483647 ? '∞' : max}
                    </span>
                  )}
                </p>
                {max !== null && max > 0 && (
                  <div className="mt-2 h-2 rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, (current / max) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 操作区 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.operations')}</CardTitle>
          <CardDescription>{t('admin.operationsDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 冻结/解冻 */}
          <div>
            {detail.status === 'Frozen' ? (
              <Button
                variant="outline"
                onClick={() => unfreezeMutation.mutate(detail.id)}
                disabled={unfreezeMutation.isPending}
              >
                <Sun className="mr-2 h-4 w-4" />
                {t('admin.unfreeze')}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={() => freezeMutation.mutate(detail.id)}
                disabled={freezeMutation.isPending}
              >
                <Snowflake className="mr-2 h-4 w-4" />
                {t('admin.freeze')}
              </Button>
            )}
          </div>

          <Separator />

          {/* 套餐升降级 */}
          <div>
            <p className="font-medium mb-2">{t('admin.changePlan')}</p>
            <div className="flex gap-2">
              {planOptions.map((plan) => (
                <Button
                  key={plan.value}
                  variant={detail.plan === plan.value ? 'default' : 'outline'}
                  size="sm"
                  disabled={detail.plan === plan.value || changePlanMutation.isPending}
                  onClick={() => changePlanMutation.mutate({ tenantId: detail.id, plan: plan.value })}
                >
                  {plan.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: 更新 Sidebar 添加 system_admin 导航**

在 `frontend/src/components/layout/Sidebar.tsx` 中修改 navItems，使其根据用户角色动态显示：

```tsx
import { useAuthStore } from '../../stores/authStore';

export function Sidebar() {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const user = useAuthStore((s) => s.user);

  /** system_admin 专属导航项 */
  const adminNavItems = [
    { path: '/admin/tenants', icon: Building2, labelKey: 'admin.tenantsTitle' },
  ];

  return (
    // ... 保持现有结构 ...
    <nav className="flex-1 space-y-1 p-2">
      {/* 普通用户导航 */}
      {navItems.map(({ path, icon: Icon, labelKey }) => (
        <NavLink key={path} to={path} /* ... */>
          <Icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{t(labelKey)}</span>}
        </NavLink>
      ))}

      {/* system_admin 专属导航 */}
      {user?.role === 'SystemAdmin' && (
        <>
          <div className="my-2 border-t border-border" />
          <p className={cn('px-3 py-1 text-xs text-muted-foreground', collapsed && 'text-center')}>
            {!collapsed && t('admin.section')}
          </p>
          {adminNavItems.map(({ path, icon: Icon, labelKey }) => (
            <NavLink key={path} to={path} /* ... */>
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{t(labelKey)}</span>}
            </NavLink>
          ))}
        </>
      )}
    </nav>
  );
}
```

在导入中添加 `Building2` 图标和 `useAuthStore`。

- [ ] **Step 6: 更新 AuthGuard 支持 admin 路由保护**

```tsx
// frontend/src/components/layout/AuthGuard.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export function AuthGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // system_admin 路由保护
  if (location.pathname.startsWith('/admin') && user?.role !== 'SystemAdmin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
```

- [ ] **Step 7: 更新 App.tsx 添加 admin 路由**

在 `frontend/src/App.tsx` 中：

1. 导入：
```tsx
import TenantsPage from './pages/admin/TenantsPage';
import TenantDetailPage from './pages/admin/TenantDetailPage';
```

2. 在业务路由 AuthGuard 内、AppLayout 内添加：
```tsx
{/* system_admin 路由 */}
<Route path="/admin/tenants" element={<TenantsPage />} />
<Route path="/admin/tenants/:id" element={<TenantDetailPage />} />
```

- [ ] **Step 8: 增强 DashboardPage（system_admin 全局统计）**

在 `DashboardPage.tsx` 中，当用户角色为 SystemAdmin 时，额外展示全局统计卡片：

```tsx
import { useGlobalStats } from '../hooks/useTenantsAdmin';

// 在组件内部
const user = useAuthStore((s) => s.user);
const { data: globalStats } = useGlobalStats();

// 如果是 SystemAdmin，在统计卡片区域前插入全局统计
const isSystemAdmin = user?.role === 'SystemAdmin';
```

- [ ] **Step 9: 添加 i18n 翻译**

在 `zh.json` 中添加 `admin` 部分：

```json
"admin": {
  "section": "系统管理",
  "tenantsTitle": "租户管理",
  "tenantName": "企业名称",
  "slug": "企业标识",
  "plan": "套餐",
  "status": "状态",
  "devices": "设备数",
  "users": "用户数",
  "searchTenants": "搜索租户...",
  "trial": "试用中",
  "active": "活跃",
  "expired": "已过期",
  "frozen": "已冻结",
  "closed": "已注销",
  "freeze": "冻结",
  "unfreeze": "解冻",
  "basicInfo": "基础信息",
  "adminUser": "管理员",
  "trialEndsAt": "试用期截止",
  "subscriptionEndsAt": "订阅到期",
  "resourceUsage": "资源用量",
  "activeAlerts": "活跃告警",
  "pendingWorkOrders": "待处理工单",
  "monthlyAnalysis": "月度分析",
  "operations": "操作",
  "operationsDesc": "冻结租户将停用该租户下所有用户的登录和数据写入",
  "changePlan": "套餐变更",
  "backToList": "返回列表"
}
```

在 `en.json` 中添加对应英文翻译。

- [ ] **Step 10: TypeScript 检查**

Run: `cd frontend && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 11: 编译后端确认**

Run: `dotnet build EquipAI.slnx`
Expected: 编译成功

- [ ] **Step 12: 提交**

```bash
git add src/EquipAI.WebAPI/Controllers/TenantsController.cs \
        src/EquipAI.Application/Interfaces/ITenantService.cs \
        src/EquipAI.Application/Services/TenantService.cs \
        frontend/src/pages/admin/ \
        frontend/src/hooks/useTenantsAdmin.ts \
        frontend/src/pages/DashboardPage.tsx \
        frontend/src/components/layout/Sidebar.tsx \
        frontend/src/components/layout/AuthGuard.tsx \
        frontend/src/App.tsx \
        frontend/src/i18n/
git commit -m "feat: system_admin 门户 — 租户列表/详情/冻结解冻/套餐升降级 + 全局统计"
```

---

### Task 6: 数据隔离集成测试

**Goal:** 编写集成测试验证多租户数据隔离的正确性 -- 租户 A 无法访问租户 B 的设备/告警/工单/分析数据，system_admin 可以跨租户访问。

**Pre-requisites:** Task 1-3 完成（Tenant 已有 Status 字段、配额中间件已升级）

**Files:**
- Create: `tests/EquipAI.Tests.Integration/Controllers/TenantIsolationTests.cs`
- Modify: `tests/EquipAI.Tests.Integration/Infrastructure/CustomWebApplicationFactory.cs` — 辅助方法

- [ ] **Step 1: 扩展 CustomWebApplicationFactory 辅助方法**

在 `CustomWebApplicationFactory.cs` 中添加带认证头的 HttpClient 创建方法：

```csharp
/// <summary>
/// 创建带指定用户 JWT 认证头的 HttpClient
/// </summary>
/// <param name="userId">用户 ID</param>
/// <param name="tenantId">租户 ID</param>
/// <param name="role">用户角色</param>
/// <returns>带 Authorization Header 的 HttpClient</returns>
public async Task<HttpClient> CreateAuthenticatedClientAsync(
    Guid userId, Guid tenantId, string role = "MaintenanceLead")
{
    var client = CreateClient();

    // 通过登录获取真实 JWT（依赖种子数据中的 admin 用户）
    // 或者直接通过 JwtTokenService 生成
    using var scope = Services.CreateScope();
    var jwtService = scope.ServiceProvider.GetRequiredService<JwtTokenService>();

    var user = new Core.Entities.User
    {
        Id = userId,
        TenantId = tenantId,
        Role = Enum.Parse<Core.Enums.UserRole>(role),
        Username = $"test-user-{userId:N}",
        TokenVersion = 0
    };

    var token = jwtService.GenerateAccessToken(user);
    client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

    return client;
}
```

在文件顶部添加 `using EquipAI.Infrastructure.Identity;` 和 `using EquipAI.Core.Entities;` 和 `using EquipAI.Core.Enums;`。

- [ ] **Step 2: 编写数据隔离测试**

```csharp
// tests/EquipAI.Tests.Integration/Controllers/TenantIsolationTests.cs
using System.Net;
using System.Net.Http.Json;
using EquipAI.Core.Constants;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Identity;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 多租户数据隔离集成测试
/// 验证租户 A 无法访问租户 B 的数据，system_admin 可以跨租户访问
/// </summary>
[Collection("SharedFactory")]
public class TenantIsolationTests
{
    private readonly CustomWebApplicationFactory _factory;

    public TenantIsolationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    /// <summary>
    /// 验证：租户 A 创建的设备，租户 B 的用户查询不到
    /// </summary>
    [Fact]
    public async Task DeviceList_TenantA_CannotSee_TenantB_Devices()
    {
        // Arrange: 创建两个租户和各自的用户
        var tenantA = Guid.NewGuid();
        var tenantB = Guid.NewGuid();
        var userA = Guid.NewGuid();
        var userB = Guid.NewGuid();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await SeedTwoTenantsAsync(db, tenantA, tenantB);

            // 租户 A 创建 2 台设备
            db.Devices.Add(new Device { TenantId = tenantA, DeviceCode = "A-001", Name = "设备A1", Type = "电机" });
            db.Devices.Add(new Device { TenantId = tenantA, DeviceCode = "A-002", Name = "设备A2", Type = "电机" });
            // 租户 B 创建 1 台设备
            db.Devices.Add(new Device { TenantId = tenantB, DeviceCode = "B-001", Name = "设备B1", Type = "泵" });
            await db.SaveChangesAsync();
        }

        // Act: 租户 B 的用户查询设备列表
        var clientB = await _factory.CreateAuthenticatedClientAsync(userB, tenantB, "MaintenanceLead");
        var response = await clientB.GetAsync("/api/v1/devices?page=1&pageSize=100");

        // Assert: 只能看到自己租户的设备
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PagedResultJson>();
        result!.Total.Should().Be(1);  // 只看到 B-001
        result.Items.Should().HaveCount(1);
    }

    /// <summary>
    /// 验证：冻结的租户无法创建新设备（返回 403）
    /// </summary>
    [Fact]
    public async Task FrozenTenant_CannotCreateDevice_Returns403()
    {
        var tenantId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Tenants.Add(new Tenant
            {
                Id = tenantId,
                Name = "冻结租户",
                Slug = $"frozen-{tenantId:N}",
                Plan = TenantPlan.Basic,
                MaxDevices = 50,
                MaxUsers = 20,
                IsActive = false,  // 冻结状态
                Status = TenantStatus.Frozen,
                DataRetentionDays = 90
            });
            db.Users.Add(new User
            {
                Id = userId,
                TenantId = tenantId,
                Username = $"frozen-user-{userId:N}",
                Role = UserRole.MaintenanceLead,
                PasswordHash = "dummy",
                IsActive = true
            });
            await db.SaveChangesAsync();
        }

        var client = await _factory.CreateAuthenticatedClientAsync(userId, tenantId, "MaintenanceLead");
        var response = await client.PostAsJsonAsync("/api/v1/devices", new
        {
            deviceCode = "FROZEN-001",
            name = "冻结租户设备",
            type = "电机"
        });

        // 冻结租户：中间件或服务层应阻止创建
        // 取决于 UsageLimitMiddleware 的 TenantStatus 检查
        response.StatusCode.Should().BeOneOf(HttpStatusCode.Forbidden, HttpStatusCode.BadRequest);
    }

    /// <summary>
    /// 验证：system_admin 可以查看所有租户列表
    /// </summary>
    [Fact]
    public async Task SystemAdmin_CanListAllTenants()
    {
        var client = await _factory.CreateClientWithSeedAsync();

        // 使用种子数据中的 admin 用户登录获取 JWT
        var loginResponse = await client.PostAsJsonAsync("/api/v1/auth/login",
            new { username = "admin", password = "Admin@123" });
        var loginResult = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();
        var token = loginResult!.AccessToken;

        // 使用 admin JWT 访问租户列表
        var adminClient = _factory.CreateClient();
        adminClient.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await adminClient.GetAsync("/api/v1/admin/tenants?page=1&pageSize=100");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PagedResultJson>();
        result!.Total.Should().BeGreaterThan(0);
    }

    /// <summary>
    /// 辅助：创建两个租户和各自的用户
    /// </summary>
    private static async Task SeedTwoTenantsAsync(AppDbContext db, Guid tenantA, Guid tenantB)
    {
        db.Tenants.Add(new Tenant
        {
            Id = tenantA,
            Name = "租户A",
            Slug = $"tenant-a-{tenantA:N}",
            Plan = TenantPlan.Basic,
            MaxDevices = 50,
            MaxUsers = 20,
            IsActive = true,
            Status = TenantStatus.Active,
            DataRetentionDays = 90
        });
        db.Tenants.Add(new Tenant
        {
            Id = tenantB,
            Name = "租户B",
            Slug = $"tenant-b-{tenantB:N}",
            Plan = TenantPlan.Basic,
            MaxDevices = 50,
            MaxUsers = 20,
            IsActive = true,
            Status = TenantStatus.Active,
            DataRetentionDays = 90
        });

        await db.SaveChangesAsync();
    }

    /// <summary>
    /// 简化的分页结果 JSON 反序列化类型
    /// </summary>
    private class PagedResultJson
    {
        public List<object> Items { get; set; } = new();
        public int Total { get; set; }
    }
}
```

- [ ] **Step 3: 运行隔离测试**

Run: `dotnet test tests/EquipAI.Tests.Integration --filter "TenantIsolationTests" --verbosity normal`
Expected: 3/3 通过

如果 `FrozenTenant_CannotCreateDevice_Returns403` 测试失败，检查 UsageLimitMiddleware 是否在认证之前执行（需要在认证之后），以及 TenantResolutionMiddleware 是否正确设置了 TenantContext。

- [ ] **Step 4: 运行全量测试**

Run: `dotnet test --verbosity normal`
Expected: 所有测试通过

- [ ] **Step 5: 提交**

```bash
git add tests/EquipAI.Tests.Integration/Controllers/TenantIsolationTests.cs \
        tests/EquipAI.Tests.Integration/Infrastructure/CustomWebApplicationFactory.cs
git commit -m "test: 多租户数据隔离集成测试 — 跨租户不可见/冻结不可创建/管理员全量访问"
```

---

## 执行顺序与依赖关系

```
Task 1 (Tenant 实体扩展 + 迁移)
  └── Task 2 (注册 API) — 依赖 Task 1 的 Tenant 新字段
  └── Task 3 (配额增强) — 依赖 Task 1 的 Tenant 新字段
        └── Task 5 (system_admin 门户) — 依赖 Task 3 的冻结/解冻方法
  └── Task 4 (前端注册页) — 依赖 Task 2 的注册 API
  └── Task 6 (隔离测试) — 依赖 Task 1-3 所有后端变更
```

建议并行策略：
- Task 1 先行
- Task 2、Task 3 可并行
- Task 4 依赖 Task 2；Task 5 依赖 Task 3；Task 6 依赖全部

---

## 验证清单

- [ ] `POST /api/v1/auth/register` 成功创建租户 + 管理员 + 返回 JWT
- [ ] `GET /api/v1/auth/plans` 返回三个套餐（Trial/Professional/Enterprise）
- [ ] 重复 Slug 或用户名注册返回 400
- [ ] 冻结租户后，该租户用户无法创建新设备（403）
- [ ] 解冻租户后恢复正常操作
- [ ] system_admin 可查看所有租户列表和详情
- [ ] system_admin 可变更租户套餐（升降级）
- [ ] 前端注册页面三步流程完整可用
- [ ] 前端 system_admin 门户可搜索、冻结/解冻租户
- [ ] 数据隔离测试全部通过
