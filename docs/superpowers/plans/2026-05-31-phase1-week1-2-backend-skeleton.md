# Phase 1 Week 1-2: Backend Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the foundational .NET 8 backend skeleton with multi-tenant infrastructure, JWT authentication, RBAC authorization, and device management CRUD.

**Architecture:** DDD layered architecture — Core (domain, zero deps), Application (services + DTOs, depends on Core), Infrastructure (EF Core + Redis + JWT, depends on Core), WebAPI (entry point, depends on all three). Multi-tenant from day one via EF Core global query filters, tenant resolution middleware, and JWT claims.

**Tech Stack:** .NET 8, EF Core 8 + Npgsql, PostgreSQL 16 + TimescaleDB, Redis 7, JWT (System.IdentityModel), AutoMapper, Serilog, Swashbuckle, BCrypt.Net, xUnit

---

## File Structure

```
EquipAI.sln
├── Directory.Build.props
├── src/
│   ├── EquipAI.Core/
│   │   └── EquipAI.Core.csproj
│   │   ├── Constants/
│   │   │   └── SystemConstants.cs
│   │   ├── Entities/
│   │   │   ├── BaseEntity.cs
│   │   │   ├── Tenant.cs
│   │   │   ├── User.cs
│   │   │   ├── Device.cs
│   │   │   └── DeviceTypeTemplate.cs
│   │   ├── Enums/
│   │   │   ├── UserRole.cs
│   │   │   ├── DeviceStatus.cs
│   │   │   ├── DeviceCriticality.cs
│   │   │   ├── TenantPlan.cs
│   │   │   ├── TenantIsolationMode.cs
│   │   │   └── WorkOrderMode.cs
│   │   └── Interfaces/
│   │       ├── ITenantContext.cs
│   │       ├── IRepository.cs
│   │       ├── IEventBus.cs
│   │       ├── IIntegrationEvent.cs
│   │       └── IEventHandler.cs
│   ├── EquipAI.Application/
│   │   └── EquipAI.Application.csproj
│   │   ├── DTOs/
│   │   │   ├── Common/
│   │   │   │   ├── PagedQuery.cs
│   │   │   │   ├── PagedResult.cs
│   │   │   │   └── ErrorResponse.cs
│   │   │   ├── Auth/
│   │   │   │   ├── LoginRequest.cs
│   │   │   │   ├── AuthResponse.cs
│   │   │   │   └── ChangePasswordRequest.cs
│   │   │   ├── Users/
│   │   │   │   ├── CreateUserRequest.cs
│   │   │   │   ├── UpdateUserRequest.cs
│   │   │   │   └── UserDto.cs
│   │   │   ├── Devices/
│   │   │   │   ├── CreateDeviceRequest.cs
│   │   │   │   ├── UpdateDeviceRequest.cs
│   │   │   │   └── DeviceDto.cs
│   │   │   └── Tenants/
│   │   │       ├── CreateTenantRequest.cs
│   │   │       ├── UpdateTenantRequest.cs
│   │   │       └── TenantDto.cs
│   │   ├── Eventing/
│   │   │   └── InMemoryEventBus.cs
│   │   ├── Interfaces/
│   │   │   ├── IAuthService.cs
│   │   │   ├── IUserService.cs
│   │   │   ├── ITenantService.cs
│   │   │   ├── IDeviceService.cs
│   │   │   └── IRbacService.cs
│   │   ├── Mapping/
│   │   │   └── MappingProfile.cs
│   │   └── Services/
│   │       ├── AuthService.cs
│   │       ├── UserService.cs
│   │       ├── TenantService.cs
│   │       ├── DeviceService.cs
│   │       └── RbacService.cs
│   ├── EquipAI.Infrastructure/
│   │   └── EquipAI.Infrastructure.csproj
│   │   ├── Data/
│   │   │   ├── AppDbContext.cs
│   │   │   ├── Configurations/
│   │   │   │   ├── TenantConfiguration.cs
│   │   │   │   ├── UserConfiguration.cs
│   │   │   │   ├── DeviceConfiguration.cs
│   │   │   │   └── DeviceTypeTemplateConfiguration.cs
│   │   │   └── Repositories/
│   │   │       └── Repository.cs
│   │   ├── Identity/
│   │   │   ├── JwtTokenService.cs
│   │   │   └── PasswordHasher.cs
│   │   ├── Middleware/
│   │   │   ├── TenantResolutionMiddleware.cs
│   │   │   ├── PermissionMiddleware.cs
│   │   │   └── ExceptionHandlingMiddleware.cs
│   │   ├── Cache/
│   │   │   └── RedisService.cs
│   │   ├── Seeding/
│   │   │   └── DataSeeder.cs
│   │   └── Tenant/
│   │       └── TenantContext.cs
│   └── EquipAI.WebAPI/
│       └── EquipAI.WebAPI.csproj
│       ├── Program.cs
│       ├── appsettings.json
│       ├── appsettings.Development.json
│       ├── Attributes/
│       │   └── RequirePermissionAttribute.cs
│       ├── Controllers/
│       │   ├── AuthController.cs
│       │   ├── UsersController.cs
│       │   ├── TenantsController.cs
│       │   ├── DevicesController.cs
│       │   └── DeviceTypesController.cs
│       └── Extensions/
│           └── ServiceCollectionExtensions.cs
├── tests/
│   ├── EquipAI.Tests.Unit/
│   │   └── EquipAI.Tests.Unit.csproj
│   │   ├── Services/
│   │   │   └── RbacServiceTests.cs
│   │   └── Eventing/
│   │       └── InMemoryEventBusTests.cs
│   └── EquipAI.Tests.Integration/
│       └── EquipAI.Tests.Integration.csproj
│       ├── Infrastructure/
│       │   └── CustomWebApplicationFactory.cs
│       └── Controllers/
│           ├── AuthControllerTests.cs
│           └── DevicesControllerTests.cs
└── docker/
    ├── docker-compose.dev.yml
    └── mosquitto.conf
```

---

### Task 1: Solution Structure & Project Scaffolding

**Files:**
- Create: `EquipAI.sln`
- Create: `Directory.Build.props`
- Create: `src/EquipAI.Core/EquipAI.Core.csproj`
- Create: `src/EquipAI.Application/EquipAI.Application.csproj`
- Create: `src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj`
- Create: `src/EquipAI.WebAPI/EquipAI.WebAPI.csproj`
- Create: `tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj`
- Create: `tests/EquipAI.Tests.Integration/EquipAI.Tests.Integration.csproj`

- [ ] **Step 1: Create solution and class library projects**

```bash
cd /Users/yqgmac/yqg/project/EquipSense
dotnet new sln -n EquipAI
mkdir -p src tests docker
dotnet new classlib -n EquipAI.Core -o src/EquipAI.Core --framework net8.0
dotnet new classlib -n EquipAI.Application -o src/EquipAI.Application --framework net8.0
dotnet new classlib -n EquipAI.Infrastructure -o src/EquipAI.Infrastructure --framework net8.0
dotnet new webapi -n EquipAI.WebAPI -o src/EquipAI.WebAPI --framework net8.0 --no-openapi
dotnet new xunit -n EquipAI.Tests.Unit -o tests/EquipAI.Tests.Unit --framework net8.0
dotnet new xunit -n EquipAI.Tests.Integration -o tests/EquipAI.Tests.Integration --framework net8.0
```

- [ ] **Step 2: Add projects to solution**

```bash
dotnet sln EquipAI.sln add src/EquipAI.Core/EquipAI.Core.csproj
dotnet sln EquipAI.sln add src/EquipAI.Application/EquipAI.Application.csproj
dotnet sln EquipAI.sln add src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj
dotnet sln EquipAI.sln add src/EquipAI.WebAPI/EquipAI.WebAPI.csproj
dotnet sln EquipAI.sln add tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj
dotnet sln EquipAI.sln add tests/EquipAI.Tests.Integration/EquipAI.Tests.Integration.csproj
```

- [ ] **Step 3: Create Directory.Build.props for shared settings**

```xml
<!-- Directory.Build.props -->
<Project>
  <PropertyGroup>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  </PropertyGroup>
</Project>
```

- [ ] **Step 4: Add project references**

```bash
# Application 引用 Core
dotnet add src/EquipAI.Application/EquipAI.Application.csproj reference src/EquipAI.Core/EquipAI.Core.csproj
# Infrastructure 引用 Core
dotnet add src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj reference src/EquipAI.Core/EquipAI.Core.csproj
# WebAPI 引用全部三层
dotnet add src/EquipAI.WebAPI/EquipAI.WebAPI.csproj reference src/EquipAI.Core/EquipAI.Core.csproj
dotnet add src/EquipAI.WebAPI/EquipAI.WebAPI.csproj reference src/EquipAI.Application/EquipAI.Application.csproj
dotnet add src/EquipAI.WebAPI/EquipAI.WebAPI.csproj reference src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj
# 测试项目引用
dotnet add tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj reference src/EquipAI.Core/EquipAI.Core.csproj
dotnet add tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj reference src/EquipAI.Application/EquipAI.Application.csproj
dotnet add tests/EquipAI.Tests.Integration/EquipAI.Tests.Integration.csproj reference src/EquipAI.WebAPI/EquipAI.WebAPI.csproj
```

- [ ] **Step 5: Add NuGet packages**

```bash
# Infrastructure — EF Core + Npgsql + Redis + BCrypt
dotnet add src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj package Microsoft.EntityFrameworkCore --version 8.0
dotnet add src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj package Npgsql.EntityFrameworkCore.PostgreSQL --version 8.0
dotnet add src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj package StackExchange.Redis --version 2.7
dotnet add src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj package BCrypt.Net-Next --version 4.0
dotnet add src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj package Microsoft.AspNetCore.Authentication.JwtBearer --version 8.0
dotnet add src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj package System.IdentityModel.Tokens.Jwt --version 8.0
dotnet add src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj package Microsoft.Extensions.Caching.StackExchangeRedis --version 8.0
# MQTTnet 留到 Week 3-4 再加

# Application — AutoMapper + DI Abstractions
dotnet add src/EquipAI.Application/EquipAI.Application.csproj package AutoMapper --version 13.0
dotnet add src/EquipAI.Application/EquipAI.Application.csproj package Microsoft.Extensions.DependencyInjection.Abstractions --version 8.0

# WebAPI — Swagger + Serilog + Health Checks
dotnet add src/EquipAI.WebAPI/EquipAI.WebAPI.csproj package Swashbuckle.AspNetCore --version 6.5
dotnet add src/EquipAI.WebAPI/EquipAI.WebAPI.csproj package Serilog.AspNetCore --version 8.0
dotnet add src/EquipAI.WebAPI/EquipAI.WebAPI.csproj package AspNetCore.HealthChecks.NpgSql --version 8.0
dotnet add src/EquipAI.WebAPI/EquipAI.WebAPI.csproj package AspNetCore.HealthChecks.Redis --version 8.0
dotnet add src/EquipAI.WebAPI/EquipAI.WebAPI.csproj package Microsoft.AspNetCore.Authentication.JwtBearer --version 8.0

# 测试项目
dotnet add tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj package FluentAssertions --version 6.12
dotnet add tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj package Moq --version 4.20
dotnet add tests/EquipAI.Tests.Integration/EquipAI.Tests.Integration.csproj package FluentAssertions --version 6.12
dotnet add tests/EquipAI.Tests.Integration/EquipAI.Tests.Integration.csproj package Microsoft.AspNetCore.Mvc.Testing --version 8.0
```

- [ ] **Step 6: 删除模板自动生成的 Class1.cs / WeatherForecast.cs 等文件，清理 csproj**

```bash
rm -f src/EquipAI.Core/Class1.cs
rm -f src/EquipAI.Application/Class1.cs
rm -f src/EquipAI.Infrastructure/Class1.cs
rm -f src/EquipAI.WebAPI/Controllers/WeatherForecastController.cs 2>/dev/null
rm -f src/EquipAI.WebAPI/WeatherForecast.cs 2>/dev/null
rm -f tests/EquipAI.Tests.Unit/UnitTest1.cs
rm -f tests/EquipAI.Tests.Integration/UnitTest1.cs
```

- [ ] **Step 7: 验证解决方案可以编译**

```bash
dotnet build EquipAI.sln
```

Expected: `Build succeeded. 0 Warning(s) 0 Error(s)`

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: initialize solution structure with projects and NuGet packages"
```

---

### Task 2: Core Layer — Enums, Constants & Entities

**Files:**
- Create: `src/EquipAI.Core/Constants/SystemConstants.cs`
- Create: `src/EquipAI.Core/Enums/UserRole.cs`
- Create: `src/EquipAI.Core/Enums/DeviceStatus.cs`
- Create: `src/EquipAI.Core/Enums/DeviceCriticality.cs`
- Create: `src/EquipAI.Core/Enums/TenantPlan.cs`
- Create: `src/EquipAI.Core/Enums/TenantIsolationMode.cs`
- Create: `src/EquipAI.Core/Enums/WorkOrderMode.cs`
- Create: `src/EquipAI.Core/Entities/BaseEntity.cs`
- Create: `src/EquipAI.Core/Entities/Tenant.cs`
- Create: `src/EquipAI.Core/Entities/User.cs`
- Create: `src/EquipAI.Core/Entities/Device.cs`
- Create: `src/EquipAI.Core/Entities/DeviceTypeTemplate.cs`
- Create: `src/EquipAI.Core/Interfaces/ITenantContext.cs`
- Create: `src/EquipAI.Core/Interfaces/IRepository.cs`
- Create: `src/EquipAI.Core/Interfaces/IEventBus.cs`
- Create: `src/EquipAI.Core/Interfaces/IIntegrationEvent.cs`
- Create: `src/EquipAI.Core/Interfaces/IEventHandler.cs`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p src/EquipAI.Core/{Constants,Entities,Enums,Interfaces}
```

- [ ] **Step 2: 创建系统常量**

```csharp
// src/EquipAI.Core/Constants/SystemConstants.cs
namespace EquipAI.Core.Constants;

/// <summary>
/// 系统级常量定义
/// </summary>
public static class SystemConstants
{
    /// <summary>
    /// 系统租户 ID，用于存放行业预置模板和共享规则
    /// </summary>
    public static readonly Guid SystemTenantId = Guid.Parse("00000000-0000-0000-0000-000000000000");

    public const string SystemTenantSlug = "system";
}
```

- [ ] **Step 3: 创建所有枚举**

```csharp
// src/EquipAI.Core/Enums/UserRole.cs
namespace EquipAI.Core.Enums;

public enum UserRole
{
    SystemAdmin,
    MaintenanceLead,
    Technician,
    Operator,
    Viewer
}
```

```csharp
// src/EquipAI.Core/Enums/DeviceStatus.cs
namespace EquipAI.Core.Enums;

public enum DeviceStatus
{
    Online,
    Offline,
    Maintenance,
    Warning
}
```

```csharp
// src/EquipAI.Core/Enums/DeviceCriticality.cs
namespace EquipAI.Core.Enums;

public enum DeviceCriticality
{
    Critical,
    High,
    Normal,
    Low
}
```

```csharp
// src/EquipAI.Core/Enums/TenantPlan.cs
namespace EquipAI.Core.Enums;

public enum TenantPlan
{
    Trial,
    Basic,
    Professional,
    Enterprise
}
```

```csharp
// src/EquipAI.Core/Enums/TenantIsolationMode.cs
namespace EquipAI.Core.Enums;

public enum TenantIsolationMode
{
    Shared,
    Schema,
    Database
}
```

```csharp
// src/EquipAI.Core/Enums/WorkOrderMode.cs
namespace EquipAI.Core.Enums;

public enum WorkOrderMode
{
    Independent,
    IntegrationHub,
    TriggerOnly
}
```

- [ ] **Step 4: 创建 BaseEntity**

```csharp
// src/EquipAI.Core/Entities/BaseEntity.cs
namespace EquipAI.Core.Entities;

/// <summary>
/// 所有实体的基类，提供 UUID 主键和创建时间
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

- [ ] **Step 5: 创建 Tenant 实体**

```csharp
// src/EquipAI.Core/Entities/Tenant.cs
using EquipAI.Core.Enums;

namespace EquipAI.Core.Entities;

/// <summary>
/// 租户实体，支持多租户隔离
/// </summary>
public class Tenant : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public TenantPlan Plan { get; set; } = TenantPlan.Basic;
    public TenantIsolationMode IsolationMode { get; set; } = TenantIsolationMode.Shared;
    public int MaxDevices { get; set; } = 50;
    public int MaxUsers { get; set; } = 20;
    public int DataRetentionDays { get; set; } = 90;
    public WorkOrderMode WorkorderMode { get; set; } = WorkOrderMode.Independent;
    public string Settings { get; set; } = "{}";
    public bool IsActive { get; set; } = true;

    // 导航属性
    public ICollection<User> Users { get; set; } = [];
    public ICollection<Device> Devices { get; set; } = [];
    public ICollection<DeviceTypeTemplate> DeviceTypeTemplates { get; set; } = [];
}
```

- [ ] **Step 6: 创建 User 实体**

```csharp
// src/EquipAI.Core/Entities/User.cs
using EquipAI.Core.Enums;

namespace EquipAI.Core.Entities;

/// <summary>
/// 用户实体，支持 RBAC 五角色
/// </summary>
public class User : BaseEntity
{
    public Guid TenantId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public UserRole Role { get; set; } = UserRole.Viewer;
    public List<string> Skills { get; set; } = [];
    public List<string> Locations { get; set; } = [];
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string Language { get; set; } = "zh-CN";
    public string NotificationPrefs { get; set; } = "{}";
    public int TokenVersion { get; set; }
    public bool MustChangePassword { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }

    // 导航属性
    public Tenant Tenant { get; set; } = null!;
}
```

- [ ] **Step 7: 创建 Device 实体**

```csharp
// src/EquipAI.Core/Entities/Device.cs
using EquipAI.Core.Enums;

namespace EquipAI.Core.Entities;

/// <summary>
/// 设备实体，模板化设计
/// </summary>
public class Device : BaseEntity
{
    public Guid TenantId { get; set; }
    public string DeviceCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public Guid? TypeTemplateId { get; set; }
    public string? Manufacturer { get; set; }
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }
    public string Location { get; set; } = "{}";
    public DateOnly? InstallDate { get; set; }
    public string? GatewayId { get; set; }
    public string Connection { get; set; } = "{}";
    public Guid? ResponsibleUserId { get; set; }
    public DeviceCriticality Criticality { get; set; } = DeviceCriticality.Normal;
    public decimal? DowntimeCostPerHour { get; set; }
    public decimal HealthScore { get; set; } = 100;
    public DeviceStatus Status { get; set; } = DeviceStatus.Offline;
    public List<string> Tags { get; set; } = [];
    public string CustomFields { get; set; } = "{}";
    public DateTime? LastDataAt { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // 导航属性
    public Tenant Tenant { get; set; } = null!;
    public DeviceTypeTemplate? TypeTemplate { get; set; }
    public User? ResponsibleUser { get; set; }
}
```

- [ ] **Step 8: 创建 DeviceTypeTemplate 实体**

```csharp
// src/EquipAI.Core/Entities/DeviceTypeTemplate.cs
namespace EquipAI.Core.Entities;

/// <summary>
/// 设备类型模板，支持行业预置和客户自定义
/// 行业预置模板归属系统租户
/// </summary>
public class DeviceTypeTemplate : BaseEntity
{
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Industry { get; set; }
    public string Parameters { get; set; } = "{}";
    public string DefaultAlarmRules { get; set; } = "[]";
    public string DefaultDiagnosisRules { get; set; } = "[]";

    // 导航属性
    public Tenant Tenant { get; set; } = null!;
}
```

- [ ] **Step 9: 创建 ITenantContext 接口**

```csharp
// src/EquipAI.Core/Interfaces/ITenantContext.cs
namespace EquipAI.Core.Interfaces;

/// <summary>
/// 租户上下文（Scoped 生命周期，每个请求独立）
/// </summary>
public interface ITenantContext
{
    Guid TenantId { get; }
    string IsolationMode { get; }
    bool IsSystemAdmin { get; }
}
```

- [ ] **Step 10: 创建 IRepository<T> 接口**

```csharp
// src/EquipAI.Core/Interfaces/IRepository.cs
using System.Linq.Expressions;

namespace EquipAI.Core.Interfaces;

/// <summary>
/// 泛型仓储接口，所有查询自动应用租户过滤器
/// </summary>
public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<T>> GetAllAsync(CancellationToken ct = default);
    Task<(List<T> Items, int Total)> GetPagedAsync(
        int page, int pageSize,
        Expression<Func<T, bool>>? filter = null,
        Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
        CancellationToken ct = default);
    Task<T> AddAsync(T entity, CancellationToken ct = default);
    Task UpdateAsync(T entity, CancellationToken ct = default);
    Task DeleteAsync(T entity, CancellationToken ct = default);
    Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default);
    Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null, CancellationToken ct = default);
    IQueryable<T> Query();
}
```

- [ ] **Step 11: 创建事件相关接口**

```csharp
// src/EquipAI.Core/Interfaces/IIntegrationEvent.cs
namespace EquipAI.Core.Interfaces;

/// <summary>
/// 集成事件标记接口
/// </summary>
public interface IIntegrationEvent
{
    Guid EventId { get; }
    DateTime OccurredAt { get; }
    Guid TenantId { get; }
}
```

```csharp
// src/EquipAI.Core/Interfaces/IEventHandler.cs
namespace EquipAI.Core.Interfaces;

/// <summary>
/// 事件处理器接口
/// </summary>
public interface IEventHandler<in TEvent> where TEvent : IIntegrationEvent
{
    Task HandleAsync(TEvent @event, CancellationToken ct = default);
}
```

```csharp
// src/EquipAI.Core/Interfaces/IEventBus.cs
namespace EquipAI.Core.Interfaces;

/// <summary>
/// 进程内事件总线接口
/// </summary>
public interface IEventBus
{
    Task PublishAsync<TEvent>(TEvent @event, CancellationToken ct = default) where TEvent : IIntegrationEvent;
    void Subscribe<TEvent, THandler>()
        where TEvent : IIntegrationEvent
        where THandler : IEventHandler<TEvent>;
}
```

- [ ] **Step 12: 验证编译**

```bash
dotnet build src/EquipAI.Core/EquipAI.Core.csproj
```

Expected: `Build succeeded. 0 Error(s)`

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: add Core layer — entities, enums, constants, and interfaces"
```

---

### Task 3: Infrastructure — EF Core DbContext & Entity Configurations

**Files:**
- Create: `src/EquipAI.Infrastructure/Data/AppDbContext.cs`
- Create: `src/EquipAI.Infrastructure/Data/Configurations/TenantConfiguration.cs`
- Create: `src/EquipAI.Infrastructure/Data/Configurations/UserConfiguration.cs`
- Create: `src/EquipAI.Infrastructure/Data/Configurations/DeviceConfiguration.cs`
- Create: `src/EquipAI.Infrastructure/Data/Configurations/DeviceTypeTemplateConfiguration.cs`
- Create: `src/EquipAI.Infrastructure/Tenant/TenantContext.cs`
- Create: `src/EquipAI.Infrastructure/Data/Repositories/Repository.cs`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p src/EquipAI.Infrastructure/{Data/{Configurations,Repositories},Tenant}
```

- [ ] **Step 2: 创建 TenantContext 实现**

```csharp
// src/EquipAI.Infrastructure/Tenant/TenantContext.cs
using EquipAI.Core.Constants;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;

namespace EquipAI.Infrastructure.Tenant;

/// <summary>
/// 租户上下文实现，Scoped 生命周期
/// </summary>
public class TenantContext : ITenantContext
{
    private readonly Guid _tenantId;
    private readonly bool _isSystemAdmin;

    public TenantContext(Guid tenantId, string isolationMode, bool isSystemAdmin)
    {
        _tenantId = tenantId;
        _isSystemAdmin = isSystemAdmin;
        IsolationMode = isolationMode;
    }

    public Guid TenantId => _isSystemAdmin && _tenantId == Guid.Empty
        ? SystemConstants.SystemTenantId
        : _tenantId;

    public string IsolationMode { get; }
    public bool IsSystemAdmin => _isSystemAdmin;
}
```

- [ ] **Step 3: 创建 AppDbContext**

```csharp
// src/EquipAI.Infrastructure/Data/AppDbContext.cs
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.Infrastructure.Data;

/// <summary>
/// 主数据库上下文，支持多租户全局查询过滤器
/// </summary>
public class AppDbContext : DbContext
{
    private readonly ITenantContext _tenantContext;

    public AppDbContext(DbContextOptions<AppDbContext> options, ITenantContext tenantContext)
        : base(options)
    {
        _tenantContext = tenantContext;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Device> Devices => Set<Device>();
    public DbSet<DeviceTypeTemplate> DeviceTypeTemplates => Set<DeviceTypeTemplate>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // 应用所有 IEntityTypeConfiguration<>
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // 多租户全局查询过滤器：所有含 TenantId 的实体自动过滤
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (entityType.ClrType.GetProperty("TenantId") != null)
            {
                modelBuilder.Entity(entityType.ClrType)
                    .HasQueryFilter(
                        EF.Property<Guid>(entityType.ClrType, "TenantId") == _tenantContext.TenantId);
            }
        }
    }

    /// <summary>
    /// 获取不带租户过滤器的查询集（system_admin 跨租户操作时使用）
    /// </summary>
    public IQueryable<T> UnfilteredSet<T>() where T : class
    {
        return Set<T>().IgnoreQueryFilters();
    }
}
```

- [ ] **Step 4: 创建 TenantConfiguration**

```csharp
// src/EquipAI.Infrastructure/Data/Configurations/TenantConfiguration.cs
using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// Tenant 实体的 EF Core 配置
/// </summary>
public class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.ToTable("tenants");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(t => t.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
        builder.Property(t => t.Slug).HasColumnName("slug").HasMaxLength(50).IsRequired();
        builder.Property(t => t.Plan).HasColumnName("plan").HasConversion<string>().HasMaxLength(20).HasDefaultValue("basic");
        builder.Property(t => t.IsolationMode).HasColumnName("isolation_mode").HasConversion<string>().HasMaxLength(20).HasDefaultValue("shared");
        builder.Property(t => t.MaxDevices).HasColumnName("max_devices").HasDefaultValue(50);
        builder.Property(t => t.MaxUsers).HasColumnName("max_users").HasDefaultValue(20);
        builder.Property(t => t.DataRetentionDays).HasColumnName("data_retention_days").HasDefaultValue(90);
        builder.Property(t => t.WorkorderMode).HasColumnName("workorder_mode").HasConversion<string>().HasMaxLength(20).HasDefaultValue("independent");
        builder.Property(t => t.Settings).HasColumnName("settings").HasColumnType("jsonb").HasDefaultValue("{}");
        builder.Property(t => t.IsActive).HasColumnName("is_active").HasDefaultValue(true);
        builder.Property(t => t.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");

        builder.HasIndex(t => t.Slug).IsUnique();
    }
}
```

- [ ] **Step 5: 创建 UserConfiguration**

```csharp
// src/EquipAI.Infrastructure/Data/Configurations/UserConfiguration.cs
using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");
        builder.HasKey(u => u.Id);

        builder.Property(u => u.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(u => u.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(u => u.Username).HasColumnName("username").HasMaxLength(100).IsRequired();
        builder.Property(u => u.PasswordHash).HasColumnName("password_hash").HasMaxLength(256).IsRequired();
        builder.Property(u => u.DisplayName).HasColumnName("display_name").HasMaxLength(100);
        builder.Property(u => u.Role).HasColumnName("role").HasConversion<string>().HasMaxLength(20).HasDefaultValue("viewer");
        builder.Property(u => u.Skills).HasColumnName("skills");
        builder.Property(u => u.Locations).HasColumnName("locations");
        builder.Property(u => u.Phone).HasColumnName("phone").HasMaxLength(20);
        builder.Property(u => u.Email).HasColumnName("email").HasMaxLength(200);
        builder.Property(u => u.Language).HasColumnName("language").HasMaxLength(10).HasDefaultValue("zh-CN");
        builder.Property(u => u.NotificationPrefs).HasColumnName("notification_prefs").HasColumnType("jsonb").HasDefaultValue("{}");
        builder.Property(u => u.TokenVersion).HasColumnName("token_version").HasDefaultValue(0);
        builder.Property(u => u.MustChangePassword).HasColumnName("must_change_password").HasDefaultValue(false);
        builder.Property(u => u.IsActive).HasColumnName("is_active").HasDefaultValue(true);
        builder.Property(u => u.LastLoginAt).HasColumnName("last_login_at");
        builder.Property(u => u.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");

        // 唯一约束：同一租户内用户名唯一
        builder.HasIndex(u => new { u.TenantId, u.Username }).IsUnique();

        // 外键
        builder.HasOne(u => u.Tenant)
            .WithMany(t => t.Users)
            .HasForeignKey(u => u.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
```

- [ ] **Step 6: 创建 DeviceConfiguration**

```csharp
// src/EquipAI.Infrastructure/Data/Configurations/DeviceConfiguration.cs
using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

public class DeviceConfiguration : IEntityTypeConfiguration<Device>
{
    public void Configure(EntityTypeBuilder<Device> builder)
    {
        builder.ToTable("devices");
        builder.HasKey(d => d.Id);

        builder.Property(d => d.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(d => d.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(d => d.DeviceCode).HasColumnName("device_code").HasMaxLength(50).IsRequired();
        builder.Property(d => d.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
        builder.Property(d => d.Type).HasColumnName("type").HasMaxLength(100).IsRequired();
        builder.Property(d => d.TypeTemplateId).HasColumnName("type_template_id");
        builder.Property(d => d.Manufacturer).HasColumnName("manufacturer").HasMaxLength(200);
        builder.Property(d => d.Model).HasColumnName("model").HasMaxLength(200);
        builder.Property(d => d.SerialNumber).HasColumnName("serial_number").HasMaxLength(200);
        builder.Property(d => d.Location).HasColumnName("location").HasColumnType("jsonb").HasDefaultValue("{}");
        builder.Property(d => d.InstallDate).HasColumnName("install_date");
        builder.Property(d => d.GatewayId).HasColumnName("gateway_id").HasMaxLength(64);
        builder.Property(d => d.Connection).HasColumnName("connection").HasColumnType("jsonb").HasDefaultValue("{}");
        builder.Property(d => d.ResponsibleUserId).HasColumnName("responsible_user_id");
        builder.Property(d => d.Criticality).HasColumnName("criticality").HasConversion<string>().HasMaxLength(20).HasDefaultValue("normal");
        builder.Property(d => d.DowntimeCostPerHour).HasColumnName("downtime_cost_per_hour").HasPrecision(10, 2);
        builder.Property(d => d.HealthScore).HasColumnName("health_score").HasPrecision(5, 2).HasDefaultValue(100);
        builder.Property(d => d.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(20).HasDefaultValue("offline");
        builder.Property(d => d.Tags).HasColumnName("tags");
        builder.Property(d => d.CustomFields).HasColumnName("custom_fields").HasColumnType("jsonb").HasDefaultValue("{}");
        builder.Property(d => d.LastDataAt).HasColumnName("last_data_at");
        builder.Property(d => d.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
        builder.Property(d => d.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("NOW()");

        // 唯一约束：同一租户内设备编码唯一
        builder.HasIndex(d => new { d.TenantId, d.DeviceCode }).IsUnique();

        // 外键
        builder.HasOne(d => d.Tenant)
            .WithMany(t => t.Devices)
            .HasForeignKey(d => d.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.TypeTemplate)
            .WithMany()
            .HasForeignKey(d => d.TypeTemplateId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(d => d.ResponsibleUser)
            .WithMany()
            .HasForeignKey(d => d.ResponsibleUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
```

- [ ] **Step 7: 创建 DeviceTypeTemplateConfiguration**

```csharp
// src/EquipAI.Infrastructure/Data/Configurations/DeviceTypeTemplateConfiguration.cs
using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

public class DeviceTypeTemplateConfiguration : IEntityTypeConfiguration<DeviceTypeTemplate>
{
    public void Configure(EntityTypeBuilder<DeviceTypeTemplate> builder)
    {
        builder.ToTable("device_type_templates");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(t => t.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(t => t.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
        builder.Property(t => t.Industry).HasColumnName("industry").HasMaxLength(50);
        builder.Property(t => t.Parameters).HasColumnName("parameters").HasColumnType("jsonb").IsRequired();
        builder.Property(t => t.DefaultAlarmRules).HasColumnName("default_alarm_rules").HasColumnType("jsonb").HasDefaultValue("[]");
        builder.Property(t => t.DefaultDiagnosisRules).HasColumnName("default_diagnosis_rules").HasColumnType("jsonb").HasDefaultValue("[]");
        builder.Property(t => t.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");

        // 外键
        builder.HasOne(t => t.Tenant)
            .WithMany(t => t.DeviceTypeTemplates)
            .HasForeignKey(t => t.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
```

- [ ] **Step 8: 创建 Repository<T> 实现**

```csharp
// src/EquipAI.Infrastructure/Data/Repositories/Repository.cs
using System.Linq.Expressions;
using EquipAI.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.Infrastructure.Data.Repositories;

/// <summary>
/// 泛型仓储实现，所有查询自动应用租户过滤器
/// </summary>
public class Repository<T> : IRepository<T> where T : class
{
    protected readonly AppDbContext DbContext;
    protected readonly DbSet<T> DbSet;

    public Repository(AppDbContext dbContext)
    {
        DbContext = dbContext;
        DbSet = dbContext.Set<T>();
    }

    public async Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await DbSet.FindAsync([id], ct);
    }

    public async Task<List<T>> GetAllAsync(CancellationToken ct = default)
    {
        return await DbSet.ToListAsync(ct);
    }

    public async Task<(List<T> Items, int Total)> GetPagedAsync(
        int page, int pageSize,
        Expression<Func<T, bool>>? filter = null,
        Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
        CancellationToken ct = default)
    {
        IQueryable<T> query = DbSet;

        if (filter != null)
            query = query.Where(filter);

        var total = await query.CountAsync(ct);

        if (orderBy != null)
            query = orderBy(query);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, total);
    }

    public async Task<T> AddAsync(T entity, CancellationToken ct = default)
    {
        await DbSet.AddAsync(entity, ct);
        await DbContext.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(T entity, CancellationToken ct = default)
    {
        DbSet.Update(entity);
        await DbContext.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(T entity, CancellationToken ct = default)
    {
        DbSet.Remove(entity);
        await DbContext.SaveChangesAsync(ct);
    }

    public async Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default)
    {
        return await DbSet.AnyAsync(predicate, ct);
    }

    public async Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null, CancellationToken ct = default)
    {
        return predicate == null
            ? await DbSet.CountAsync(ct)
            : await DbSet.CountAsync(predicate, ct);
    }

    public IQueryable<T> Query() => DbSet;
}
```

- [ ] **Step 9: 验证编译**

```bash
dotnet build src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add Infrastructure layer — AppDbContext, entity configurations, repository"
```

---

### Task 4: Infrastructure — Identity Services, Cache & Middleware

**Files:**
- Create: `src/EquipAI.Infrastructure/Identity/JwtTokenService.cs`
- Create: `src/EquipAI.Infrastructure/Identity/PasswordHasher.cs`
- Create: `src/EquipAI.Infrastructure/Cache/RedisService.cs`
- Create: `src/EquipAI.Infrastructure/Middleware/TenantResolutionMiddleware.cs`
- Create: `src/EquipAI.Infrastructure/Middleware/PermissionMiddleware.cs`
- Create: `src/EquipAI.Infrastructure/Middleware/ExceptionHandlingMiddleware.cs`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p src/EquipAI.Infrastructure/{Identity,Cache,Middleware}
```

- [ ] **Step 2: 创建 JwtTokenService**

```csharp
// src/EquipAI.Infrastructure/Identity/JwtTokenService.cs
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EquipAI.Core.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace EquipAI.Infrastructure.Identity;

/// <summary>
/// JWT Token 生成与验证服务
/// </summary>
public class JwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    /// <summary>
    /// 生成 Access Token（24h 有效）
    /// </summary>
    public string GenerateAccessToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["Jwt:Secret"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim("tenant_id", user.TenantId.ToString()),
            new Claim("role", user.Role.ToString()),
            new Claim("username", user.Username),
            new Claim("token_version", user.TokenVersion.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// 生成 Refresh Token（随机 GUID）
    /// </summary>
    public string GenerateRefreshToken()
    {
        return Guid.NewGuid().ToString("N");
    }

    /// <summary>
    /// 从 JWT Token 中提取 ClaimsPrincipal（用于中间件解析）
    /// </summary>
    public ClaimsPrincipal? GetPrincipalFromToken(string token)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["Jwt:Secret"]!));

        var validation = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = false, // 中间件解析时不过期检查
            ValidateIssuerSigningKey = true,
            ValidIssuer = _configuration["Jwt:Issuer"],
            ValidAudience = _configuration["Jwt:Audience"],
            IssuerSigningKey = key
        };

        try
        {
            return new JwtSecurityTokenHandler().ValidateToken(token, validation, out _);
        }
        catch
        {
            return null;
        }
    }
}
```

- [ ] **Step 3: 创建 PasswordHasher**

```csharp
// src/EquipAI.Infrastructure/Identity/PasswordHasher.cs
using BCrypt.Net;

namespace EquipAI.Infrastructure.Identity;

/// <summary>
/// 密码哈希服务，使用 BCrypt
/// </summary>
public static class PasswordHasher
{
    /// <summary>
    /// 对密码进行哈希
    /// </summary>
    public static string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    /// <summary>
    /// 验证密码是否匹配
    /// </summary>
    public static bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }
}
```

- [ ] **Step 4: 创建 RedisService**

```csharp
// src/EquipAI.Infrastructure/Cache/RedisService.cs
using Microsoft.Extensions.Configuration;
using StackExchange.Redis;

namespace EquipAI.Infrastructure.Cache;

/// <summary>
/// Redis 缓存服务，主要用于 Refresh Token 存储和告警冷却
/// </summary>
public class RedisService
{
    private readonly IDatabase _database;

    public RedisService(IConfiguration configuration)
    {
        var connectionStr = configuration["Redis:ConnectionString"] ?? "localhost:6379";
        var redis = ConnectionMultiplexer.Connect(connectionStr);
        _database = redis.GetDatabase();
    }

    /// <summary>
    /// 存储 Refresh Token，设置过期时间
    /// </summary>
    public async Task SetRefreshTokenAsync(string userId, string refreshToken, TimeSpan expiry)
    {
        await _database.StringSetAsync($"refresh:{userId}", refreshToken, expiry);
    }

    /// <summary>
    /// 获取 Refresh Token
    /// </summary>
    public async Task<string?> GetRefreshTokenAsync(string userId)
    {
        return await _database.StringGetAsync($"refresh:{userId}");
    }

    /// <summary>
    /// 删除 Refresh Token（登出时使用）
    /// </summary>
    public async Task RemoveRefreshTokenAsync(string userId)
    {
        await _database.KeyDeleteAsync($"refresh:{userId}");
    }
}
```

- [ ] **Step 5: 创建 TenantResolutionMiddleware**

```csharp
// src/EquipAI.Infrastructure/Middleware/TenantResolutionMiddleware.cs
using System.Security.Claims;
using EquipAI.Core.Constants;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Tenant;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

namespace EquipAI.Infrastructure.Middleware;

/// <summary>
/// 租户解析中间件，按优先级解析 tenant_id：
/// 1. JWT Token 中的 tenant_id claim
/// 2. 请求头 X-Tenant-Id
/// 3. 子域名（Phase 3 实现）
/// </summary>
public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;

    public TenantResolutionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        Guid tenantId = Guid.Empty;
        string isolationMode = "shared";
        bool isSystemAdmin = false;

        // 优先从 JWT claims 解析
        var user = context.User;
        if (user.Identity?.IsAuthenticated == true)
        {
            var tenantClaim = user.FindFirst("tenant_id")?.Value;
            if (tenantClaim != null && Guid.TryParse(tenantClaim, out var tid))
                tenantId = tid;

            var roleClaim = user.FindFirst("role")?.Value;
            isSystemAdmin = roleClaim == "SystemAdmin";

            var isolationClaim = user.FindFirst("isolation_mode")?.Value;
            if (!string.IsNullOrEmpty(isolationClaim))
                isolationMode = isolationClaim;
        }

        // 其次从请求头解析
        if (tenantId == Guid.Empty)
        {
            var headerTenant = context.Request.Headers["X-Tenant-Id"].FirstOrDefault();
            if (headerTenant != null && Guid.TryParse(headerTenant, out var headerTid))
                tenantId = headerTid;
        }

        // 创建租户上下文并注入 DI
        var tenantContext = new TenantContext(tenantId, isolationMode, isSystemAdmin);
        context.RequestServices.GetRequiredService<ITenantContext>();
        // 通过替换 Scoped 服务实现
        context.Items["TenantContext"] = tenantContext;

        await _next(context);
    }
}
```

- [ ] **Step 6: 创建 PermissionMiddleware**

```csharp
// src/EquipAI.Infrastructure/Middleware/PermissionMiddleware.cs
using System.Reflection;
using Microsoft.AspNetCore.Http;

namespace EquipAI.Infrastructure.Middleware;

/// <summary>
/// 权限检查中间件
/// 配合 RequirePermissionAttribute 使用
/// </summary>
public class PermissionMiddleware
{
    private readonly RequestDelegate _next;

    public PermissionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var endpoint = context.GetEndpoint();
        if (endpoint == null)
        {
            await _next(context);
            return;
        }

        // 检查控制器方法上的 RequirePermissionAttribute
        var permissionAttr = endpoint.Metadata.GetMetadata<RequirePermissionAttribute>();
        if (permissionAttr == null)
        {
            await _next(context);
            return;
        }

        // 从 JWT claims 获取角色
        var roleClaim = context.User.FindFirst("role")?.Value;
        if (string.IsNullOrEmpty(roleClaim))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsJsonAsync(new { code = "UNAUTHORIZED", message = "未认证" });
            return;
        }

        // 通过 DI 获取 RBAC 服务检查权限
        var rbacService = context.RequestServices.GetRequiredService<EquipAI.Application.Interfaces.IRbacService>();
        if (!rbacService.HasPermission(roleClaim, permissionAttr.Permission))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(new { code = "FORBIDDEN", message = $"缺少权限: {permissionAttr.Permission}" });
            return;
        }

        await _next(context);
    }
}

/// <summary>
/// 权限标记特性，标注在控制器方法上
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class RequirePermissionAttribute : Attribute
{
    public string Permission { get; }
    public RequirePermissionAttribute(string permission) => Permission = permission;
}
```

- [ ] **Step 7: 创建 ExceptionHandlingMiddleware**

```csharp
// src/EquipAI.Infrastructure/Middleware/ExceptionHandlingMiddleware.cs
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace EquipAI.Infrastructure.Middleware;

/// <summary>
/// 全局异常处理中间件，统一错误响应格式
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "未授权访问");
            await WriteErrorAsync(context, StatusCodes.Status401Unauthorized, "UNAUTHORIZED", ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "资源不存在");
            await WriteErrorAsync(context, StatusCodes.Status404NotFound, "NOT_FOUND", ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "操作无效");
            await WriteErrorAsync(context, StatusCodes.Status409Conflict, "CONFLICT", ex.Message);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "参数错误");
            await WriteErrorAsync(context, StatusCodes.Status400BadRequest, "INVALID_PARAMETER", ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "未处理的异常");
            await WriteErrorAsync(context, StatusCodes.Status500InternalServerError, "INTERNAL_ERROR", "服务器内部错误");
        }
    }

    private static async Task WriteErrorAsync(HttpContext context, int statusCode, string code, string message)
    {
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { code, message, details = (string?)null });
    }
}
```

- [ ] **Step 8: 验证编译**

```bash
dotnet build src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add identity services (JWT, bcrypt), Redis cache, and middleware pipeline"
```

---

### Task 5: Application — DTOs, Event Bus & RBAC Service

**Files:**
- Create: `src/EquipAI.Application/DTOs/Common/PagedQuery.cs`
- Create: `src/EquipAI.Application/DTOs/Common/PagedResult.cs`
- Create: `src/EquipAI.Application/DTOs/Common/ErrorResponse.cs`
- Create: `src/EquipAI.Application/DTOs/Auth/LoginRequest.cs`
- Create: `src/EquipAI.Application/DTOs/Auth/AuthResponse.cs`
- Create: `src/EquipAI.Application/DTOs/Auth/ChangePasswordRequest.cs`
- Create: `src/EquipAI.Application/DTOs/Users/CreateUserRequest.cs`
- Create: `src/EquipAI.Application/DTOs/Users/UpdateUserRequest.cs`
- Create: `src/EquipAI.Application/DTOs/Users/UserDto.cs`
- Create: `src/EquipAI.Application/DTOs/Devices/CreateDeviceRequest.cs`
- Create: `src/EquipAI.Application/DTOs/Devices/UpdateDeviceRequest.cs`
- Create: `src/EquipAI.Application/DTOs/Devices/DeviceDto.cs`
- Create: `src/EquipAI.Application/DTOs/Tenants/CreateTenantRequest.cs`
- Create: `src/EquipAI.Application/DTOs/Tenants/UpdateTenantRequest.cs`
- Create: `src/EquipAI.Application/DTOs/Tenants/TenantDto.cs`
- Create: `src/EquipAI.Application/Interfaces/IRbacService.cs`
- Create: `src/EquipAI.Application/Interfaces/IAuthService.cs`
- Create: `src/EquipAI.Application/Interfaces/IUserService.cs`
- Create: `src/EquipAI.Application/Interfaces/ITenantService.cs`
- Create: `src/EquipAI.Application/Interfaces/IDeviceService.cs`
- Create: `src/EquipAI.Application/Eventing/InMemoryEventBus.cs`
- Create: `src/EquipAI.Application/Mapping/MappingProfile.cs`
- Create: `src/EquipAI.Application/Services/RbacService.cs`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p src/EquipAI.Application/{DTOs/{Common,Auth,Users,Devices,Tenants},Interfaces,Eventing,Mapping,Services}
```

- [ ] **Step 2: 创建通用 DTOs**

```csharp
// src/EquipAI.Application/DTOs/Common/PagedQuery.cs
namespace EquipAI.Application.DTOs.Common;

/// <summary>
/// 通用分页查询参数
/// </summary>
public class PagedQuery
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string Sort { get; set; } = "created_at";
    public string Order { get; set; } = "desc";
    public string? Keyword { get; set; }
}
```

```csharp
// src/EquipAI.Application/DTOs/Common/PagedResult.cs
namespace EquipAI.Application.DTOs.Common;

/// <summary>
/// 通用分页响应
/// </summary>
public class PagedResult<T>
{
    public List<T> Items { get; set; } = [];
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)Total / PageSize) : 0;
}
```

```csharp
// src/EquipAI.Application/DTOs/Common/ErrorResponse.cs
namespace EquipAI.Application.DTOs.Common;

/// <summary>
/// 统一错误响应格式
/// </summary>
public class ErrorResponse
{
    public string Code { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public object? Details { get; set; }
}
```

- [ ] **Step 3: 创建 Auth DTOs**

```csharp
// src/EquipAI.Application/DTOs/Auth/LoginRequest.cs
using System.ComponentModel.DataAnnotations;

namespace EquipAI.Application.DTOs.Auth;

public class LoginRequest
{
    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}
```

```csharp
// src/EquipAI.Application/DTOs/Auth/AuthResponse.cs
namespace EquipAI.Application.DTOs.Auth;

public class AuthResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public UserDto UserInfo { get; set; } = null!;
}
```

```csharp
// src/EquipAI.Application/DTOs/Auth/ChangePasswordRequest.cs
using System.ComponentModel.DataAnnotations;

namespace EquipAI.Application.DTOs.Auth;

public class ChangePasswordRequest
{
    [Required]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string NewPassword { get; set; } = string.Empty;
}
```

- [ ] **Step 4: 创建 User DTOs**

```csharp
// src/EquipAI.Application/DTOs/Users/UserDto.cs
namespace EquipAI.Application.DTOs.Users;

public class UserDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string Role { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

```csharp
// src/EquipAI.Application/DTOs/Users/CreateUserRequest.cs
using System.ComponentModel.DataAnnotations;

namespace EquipAI.Application.DTOs.Users;

public class CreateUserRequest
{
    [Required]
    [StringLength(100)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;

    public string? DisplayName { get; set; }
    public string Role { get; set; } = "viewer";
    public string? Email { get; set; }
    public string? Phone { get; set; }
}
```

```csharp
// src/EquipAI.Application/DTOs/Users/UpdateUserRequest.cs
namespace EquipAI.Application.DTOs.Users;

public class UpdateUserRequest
{
    public string? DisplayName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
}
```

- [ ] **Step 5: 创建 Device DTOs**

```csharp
// src/EquipAI.Application/DTOs/Devices/DeviceDto.cs
namespace EquipAI.Application.DTOs.Devices;

public class DeviceDto
{
    public Guid Id { get; set; }
    public string DeviceCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? Manufacturer { get; set; }
    public string? Model { get; set; }
    public string Status { get; set; } = "offline";
    public string Criticality { get; set; } = "normal";
    public decimal HealthScore { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

```csharp
// src/EquipAI.Application/DTOs/Devices/CreateDeviceRequest.cs
using System.ComponentModel.DataAnnotations;

namespace EquipAI.Application.DTOs.Devices;

public class CreateDeviceRequest
{
    [Required]
    [StringLength(50)]
    public string DeviceCode { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Type { get; set; } = string.Empty;

    public string? Manufacturer { get; set; }
    public string? Model { get; set; }
    public string Criticality { get; set; } = "normal";
}
```

```csharp
// src/EquipAI.Application/DTOs/Devices/UpdateDeviceRequest.cs
namespace EquipAI.Application.DTOs.Devices;

public class UpdateDeviceRequest
{
    public string? Name { get; set; }
    public string? Manufacturer { get; set; }
    public string? Model { get; set; }
    public string? Criticality { get; set; }
}
```

- [ ] **Step 6: 创建 Tenant DTOs**

```csharp
// src/EquipAI.Application/DTOs/Tenants/TenantDto.cs
namespace EquipAI.Application.DTOs.Tenants;

public class TenantDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Plan { get; set; } = "basic";
    public int MaxDevices { get; set; }
    public int MaxUsers { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

```csharp
// src/EquipAI.Application/DTOs/Tenants/CreateTenantRequest.cs
using System.ComponentModel.DataAnnotations;

namespace EquipAI.Application.DTOs.Tenants;

public class CreateTenantRequest
{
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Slug { get; set; } = string.Empty;

    public string Plan { get; set; } = "basic";
    public int MaxDevices { get; set; } = 50;
    public int MaxUsers { get; set; } = 20;
}
```

```csharp
// src/EquipAI.Application/DTOs/Tenants/UpdateTenantRequest.cs
namespace EquipAI.Application.DTOs.Tenants;

public class UpdateTenantRequest
{
    public string? Name { get; set; }
    public int? MaxDevices { get; set; }
    public int? MaxUsers { get; set; }
    public string? Plan { get; set; }
}
```

- [ ] **Step 7: 创建服务接口**

```csharp
// src/EquipAI.Application/Interfaces/IAuthService.cs
using EquipAI.Application.DTOs.Auth;

namespace EquipAI.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<AuthResponse> RefreshTokenAsync(string refreshToken, CancellationToken ct = default);
    Task LogoutAsync(Guid userId, CancellationToken ct = default);
    Task ChangePasswordAsync(Guid userId, string currentPassword, string newPassword, CancellationToken ct = default);
}
```

```csharp
// src/EquipAI.Application/Interfaces/IUserService.cs
using EquipAI.Application.DTOs.Common;
using EquipAI.Application.DTOs.Users;

namespace EquipAI.Application.Interfaces;

public interface IUserService
{
    Task<PagedResult<UserDto>> GetUsersAsync(PagedQuery query, CancellationToken ct = default);
    Task<UserDto> GetUserByIdAsync(Guid id, CancellationToken ct = default);
    Task<UserDto> CreateUserAsync(CreateUserRequest request, Guid tenantId, CancellationToken ct = default);
    Task<UserDto> UpdateUserAsync(Guid id, UpdateUserRequest request, CancellationToken ct = default);
    Task DeactivateUserAsync(Guid id, CancellationToken ct = default);
    Task ChangeUserRoleAsync(Guid id, string newRole, CancellationToken ct = default);
}
```

```csharp
// src/EquipAI.Application/Interfaces/ITenantService.cs
using EquipAI.Application.DTOs.Common;
using EquipAI.Application.DTOs.Tenants;

namespace EquipAI.Application.Interfaces;

public interface ITenantService
{
    Task<PagedResult<TenantDto>> GetTenantsAsync(PagedQuery query, CancellationToken ct = default);
    Task<TenantDto> GetTenantByIdAsync(Guid id, CancellationToken ct = default);
    Task<TenantDto> CreateTenantAsync(CreateTenantRequest request, CancellationToken ct = default);
    Task<TenantDto> UpdateTenantAsync(Guid id, UpdateTenantRequest request, CancellationToken ct = default);
    Task<object> GetTenantUsageAsync(Guid id, CancellationToken ct = default);
}
```

```csharp
// src/EquipAI.Application/Interfaces/IDeviceService.cs
using EquipAI.Application.DTOs.Common;
using EquipAI.Application.DTOs.Devices;

namespace EquipAI.Application.Interfaces;

public interface IDeviceService
{
    Task<PagedResult<DeviceDto>> GetDevicesAsync(PagedQuery query, string? status = null, string? type = null, CancellationToken ct = default);
    Task<DeviceDto> GetDeviceByIdAsync(Guid id, CancellationToken ct = default);
    Task<DeviceDto> CreateDeviceAsync(CreateDeviceRequest request, Guid tenantId, CancellationToken ct = default);
    Task<DeviceDto> UpdateDeviceAsync(Guid id, UpdateDeviceRequest request, CancellationToken ct = default);
    Task DeleteDeviceAsync(Guid id, CancellationToken ct = default);
}
```

```csharp
// src/EquipAI.Application/Interfaces/IRbacService.cs
namespace EquipAI.Application.Interfaces;

/// <summary>
/// RBAC 权限校验服务
/// </summary>
public interface IRbacService
{
    bool HasPermission(string role, string permission);
}
```

- [ ] **Step 8: 创建 InMemoryEventBus**

```csharp
// src/EquipAI.Application/Eventing/InMemoryEventBus.cs
using System.Threading.Channels;
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Eventing;

/// <summary>
/// 进程内事件总线实现，使用 Channel&lt;T&gt; 异步分发
/// </summary>
public class InMemoryEventBus : IEventBus, IDisposable
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<InMemoryEventBus> _logger;

    // 事件处理器注册表：事件类型 → 处理器类型列表
    private readonly Dictionary<Type, List<Type>> _handlerRegistry = new();
    private readonly Channel<object> _channel = Channel.CreateBounded<object>(new BoundedChannelOptions(1000)
    {
        FullMode = BoundedChannelFullMode.DropOldest,
        SingleReader = false,
        SingleWriter = false
    });

    private bool _disposed;

    public InMemoryEventBus(IServiceProvider serviceProvider, ILogger<InMemoryEventBus> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        // 启动后台消费任务
        _ = ConsumeAsync();
    }

    public void Subscribe<TEvent, THandler>()
        where TEvent : IIntegrationEvent
        where THandler : IEventHandler<TEvent>
    {
        var eventType = typeof(TEvent);
        if (!_handlerRegistry.TryGetValue(eventType, out var handlers))
        {
            handlers = [];
            _handlerRegistry[eventType] = handlers;
        }
        handlers.Add(typeof(THandler));
    }

    public async Task PublishAsync<TEvent>(TEvent @event, CancellationToken ct = default) where TEvent : IIntegrationEvent
    {
        await _channel.Writer.WriteAsync(@event, ct);
        _logger.LogDebug("事件已发布: {EventType}, EventId: {EventId}", typeof(TEvent).Name, @event.EventId);
    }

    private async Task ConsumeAsync()
    {
        await foreach (var evt in _channel.Reader.ReadAllAsync())
        {
            try
            {
                await DispatchAsync(evt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "事件分发失败: {EventType}", evt.GetType().Name);
            }
        }
    }

    private async Task DispatchAsync(object evt)
    {
        var eventType = evt.GetType();
        if (!_handlerRegistry.TryGetValue(eventType, out var handlerTypes))
            return;

        using var scope = _serviceProvider.CreateScope();
        foreach (var handlerType in handlerTypes)
        {
            try
            {
                var handler = scope.ServiceProvider.GetRequiredService(handlerType);
                var handleMethod = handlerType.GetMethod("HandleAsync");
                if (handleMethod != null)
                {
                    var task = (Task?)handleMethod.Invoke(handler, [evt, CancellationToken.None]);
                    if (task != null)
                        await task;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "事件处理器执行失败: {HandlerType}", handlerType.Name);
            }
        }
    }

    public void Dispose()
    {
        if (!_disposed)
        {
            _channel.Writer.TryComplete();
            _disposed = true;
        }
    }
}
```

- [ ] **Step 9: 创建 MappingProfile**

```csharp
// src/EquipAI.Application/Mapping/MappingProfile.cs
using AutoMapper;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Application.DTOs.Devices;
using EquipAI.Application.DTOs.Tenants;
using EquipAI.Application.DTOs.Users;
using EquipAI.Core.Entities;

namespace EquipAI.Application.Mapping;

/// <summary>
/// AutoMapper 映射配置
/// </summary>
public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // User 映射
        CreateMap<User, UserDto>()
            .ForMember(d => d.Role, opt => opt.MapFrom(s => s.Role.ToString()));
        CreateMap<CreateUserRequest, User>()
            .ForMember(d => d.Role, opt => opt.MapFrom(s => Enum.Parse<UserRole>(s.Role, true)));

        // Device 映射
        CreateMap<Device, DeviceDto>()
            .ForMember(d => d.Status, opt => opt.MapFrom(s => s.Status.ToString()))
            .ForMember(d => d.Criticality, opt => opt.MapFrom(s => s.Criticality.ToString()));

        // Tenant 映射
        CreateMap<Tenant, TenantDto>()
            .ForMember(d => d.Plan, opt => opt.MapFrom(s => s.Plan.ToString()));
        CreateMap<CreateTenantRequest, Tenant>();

        // Auth 映射
        CreateMap<User, AuthResponse>()
            .ForCtorParam("UserInfo", opt => opt.MapFrom(src => src));
    }
}
```

- [ ] **Step 10: 创建 RbacService**

```csharp
// src/EquipAI.Application/Services/RbacService.cs
using EquipAI.Application.Interfaces;

namespace EquipAI.Application.Services;

/// <summary>
/// RBAC 权限矩阵校验服务
/// Week 1-2 实现设备、用户、租户相关权限
/// </summary>
public class RbacService : IRbacService
{
    // 权限矩阵：角色 → 允许的权限集合
    private static readonly Dictionary<string, HashSet<string>> _permissionMatrix = new()
    {
        ["SystemAdmin"] =
        [
            "device:create", "device:read", "device:update", "device:delete",
            "user:create", "user:read", "user:update", "user:delete", "user:role",
            "tenant:create", "tenant:read", "tenant:update",
            "alert:create", "alert:read", "alert:update", "alert:delete",
            "workorder:create", "workorder:read", "workorder:update", "workorder:delete",
            "knowledge:create", "knowledge:read", "knowledge:update", "knowledge:delete",
            "report:read", "ai:create", "ai:read", "ai:update", "ai:delete"
        ],
        ["MaintenanceLead"] =
        [
            "device:read", "device:update",
            "user:read",
            "alert:read", "alert:update", "alert:config",
            "workorder:create", "workorder:read", "workorder:update", "workorder:assign", "workorder:accept",
            "knowledge:read", "knowledge:update", "knowledge:verify",
            "report:read", "ai:read"
        ],
        ["Technician"] =
        [
            "device:read",
            "alert:read", "alert:acknowledge",
            "workorder:read", "workorder:execute",
            "knowledge:read",
            "ai:read", "ai:query"
        ],
        ["Operator"] =
        [
            "device:read",
            "alert:read", "alert:acknowledge",
            "workorder:read",
            "report:read", "ai:read", "ai:query"
        ],
        ["Viewer"] =
        [
            "device:read", "alert:read", "workorder:read",
            "knowledge:read", "report:read"
        ]
    };

    public bool HasPermission(string role, string permission)
    {
        return _permissionMatrix.TryGetValue(role, out var permissions)
            && permissions.Contains(permission);
    }
}
```

- [ ] **Step 11: 验证编译**

```bash
dotnet build src/EquipAI.Application/EquipAI.Application.csproj
```

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: add Application layer — DTOs, event bus, RBAC service, and mapping"
```

---

### Task 6: Application — Business Services

**Files:**
- Create: `src/EquipAI.Application/Services/AuthService.cs`
- Create: `src/EquipAI.Application/Services/UserService.cs`
- Create: `src/EquipAI.Application/Services/TenantService.cs`
- Create: `src/EquipAI.Application/Services/DeviceService.cs`

- [ ] **Step 1: 创建 AuthService**

```csharp
// src/EquipAI.Application/Services/AuthService.cs
using AutoMapper;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Application.DTOs.Users;
using EquipAI.Application.Interfaces;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Cache;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _dbContext;
    private readonly JwtTokenService _jwtTokenService;
    private readonly RedisService _redisService;
    private readonly IMapper _mapper;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        AppDbContext dbContext,
        JwtTokenService jwtTokenService,
        RedisService redisService,
        IMapper mapper,
        ILogger<AuthService> logger)
    {
        _dbContext = dbContext;
        _jwtTokenService = jwtTokenService;
        _redisService = redisService;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        // 查找用户（需跨租户，因为登录时还没有租户上下文）
        var user = await _dbContext.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Username == request.Username && u.IsActive, ct);

        if (user == null || !PasswordHasher.VerifyPassword(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("用户名或密码错误");

        // 生成 Token
        var accessToken = _jwtTokenService.GenerateAccessToken(user);
        var refreshToken = _jwtTokenService.GenerateRefreshToken();

        // 存储 Refresh Token 到 Redis（7天有效）
        await _redisService.SetRefreshTokenAsync(
            user.Id.ToString(), refreshToken, TimeSpan.FromDays(7));

        // 更新最后登录时间
        user.LastLoginAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("用户 {Username} 登录成功", user.Username);

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            UserInfo = _mapper.Map<UserDto>(user)
        };
    }

    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken, CancellationToken ct = default)
    {
        // 从 Redis 中查找匹配的 Refresh Token
        // 简化实现：需要遍历（生产环境建议用反向映射）
        throw new NotImplementedException("Refresh Token 将在集成测试阶段完善");
    }

    public async Task LogoutAsync(Guid userId, CancellationToken ct = default)
    {
        await _redisService.RemoveRefreshTokenAsync(userId.ToString());
        _logger.LogInformation("用户 {UserId} 已登出", userId);
    }

    public async Task ChangePasswordAsync(Guid userId, string currentPassword, string newPassword, CancellationToken ct = default)
    {
        var user = await _dbContext.Users.FindAsync([userId], ct)
            ?? throw new KeyNotFoundException("用户不存在");

        if (!PasswordHasher.VerifyPassword(currentPassword, user.PasswordHash))
            throw new UnauthorizedAccessException("当前密码错误");

        user.PasswordHash = PasswordHasher.HashPassword(newPassword);
        user.TokenVersion++; // 使所有已发放的 Token 失效
        user.MustChangePassword = false;

        await _dbContext.SaveChangesAsync(ct);

        // 删除 Refresh Token
        await _redisService.RemoveRefreshTokenAsync(userId.ToString());
    }
}
```

- [ ] **Step 2: 创建 UserService**

```csharp
// src/EquipAI.Application/Services/UserService.cs
using AutoMapper;
using EquipAI.Application.DTOs.Common;
using EquipAI.Application.DTOs.Users;
using EquipAI.Application.Interfaces;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _dbContext;
    private readonly ITenantContext _tenantContext;
    private readonly IMapper _mapper;
    private readonly ILogger<UserService> _logger;

    public UserService(AppDbContext dbContext, ITenantContext tenantContext, IMapper mapper, ILogger<UserService> logger)
    {
        _dbContext = dbContext;
        _tenantContext = tenantContext;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<PagedResult<UserDto>> GetUsersAsync(PagedQuery query, CancellationToken ct = default)
    {
        var (items, total) = await _dbContext.Users
            .ToPagedAsync(query, ct);

        return new PagedResult<UserDto>
        {
            Items = _mapper.Map<List<UserDto>>(items),
            Total = total,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }

    public async Task<UserDto> GetUserByIdAsync(Guid id, CancellationToken ct = default)
    {
        var user = await _dbContext.Users.FindAsync([id], ct)
            ?? throw new KeyNotFoundException("用户不存在");
        return _mapper.Map<UserDto>(user);
    }

    public async Task<UserDto> CreateUserAsync(CreateUserRequest request, Guid tenantId, CancellationToken ct = default)
    {
        // 检查用户名是否重复
        var exists = await _dbContext.Users
            .IgnoreQueryFilters()
            .AnyAsync(u => u.TenantId == tenantId && u.Username == request.Username, ct);
        if (exists)
            throw new InvalidOperationException("用户名已存在");

        var user = _mapper.Map<User>(request);
        user.TenantId = tenantId;
        user.PasswordHash = PasswordHasher.HashPassword(request.Password);
        user.MustChangePassword = true;

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("创建用户 {Username}, 租户 {TenantId}", user.Username, tenantId);
        return _mapper.Map<UserDto>(user);
    }

    public async Task<UserDto> UpdateUserAsync(Guid id, UpdateUserRequest request, CancellationToken ct = default)
    {
        var user = await _dbContext.Users.FindAsync([id], ct)
            ?? throw new KeyNotFoundException("用户不存在");

        if (request.DisplayName != null) user.DisplayName = request.DisplayName;
        if (request.Email != null) user.Email = request.Email;
        if (request.Phone != null) user.Phone = request.Phone;

        await _dbContext.SaveChangesAsync(ct);
        return _mapper.Map<UserDto>(user);
    }

    public async Task DeactivateUserAsync(Guid id, CancellationToken ct = default)
    {
        var user = await _dbContext.Users.FindAsync([id], ct)
            ?? throw new KeyNotFoundException("用户不存在");

        user.IsActive = false;
        await _dbContext.SaveChangesAsync(ct);
    }

    public async Task ChangeUserRoleAsync(Guid id, string newRole, CancellationToken ct = default)
    {
        var user = await _dbContext.Users.FindAsync([id], ct)
            ?? throw new KeyNotFoundException("用户不存在");

        user.Role = Enum.Parse<UserRole>(newRole, true);
        await _dbContext.SaveChangesAsync(ct);
    }
}
```

- [ ] **Step 3: 创建 TenantService**

```csharp
// src/EquipAI.Application/Services/TenantService.cs
using AutoMapper;
using EquipAI.Application.DTOs.Common;
using EquipAI.Application.DTOs.Tenants;
using EquipAI.Application.Interfaces;
using EquipAI.Core.Entities;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Services;

public class TenantService : ITenantService
{
    private readonly AppDbContext _dbContext;
    private readonly IMapper _mapper;
    private readonly ILogger<TenantService> _logger;

    public TenantService(AppDbContext dbContext, IMapper mapper, ILogger<TenantService> logger)
    {
        _dbContext = dbContext;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<PagedResult<TenantDto>> GetTenantsAsync(PagedQuery query, CancellationToken ct = default)
    {
        // 租户列表需要跨租户查询
        var queryable = _dbContext.Tenants.IgnoreQueryFilters().Where(t => t.IsActive);

        var total = await queryable.CountAsync(ct);
        var items = await queryable
            .OrderByDescending(t => t.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(ct);

        return new PagedResult<TenantDto>
        {
            Items = _mapper.Map<List<TenantDto>>(items),
            Total = total,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }

    public async Task<TenantDto> GetTenantByIdAsync(Guid id, CancellationToken ct = default)
    {
        var tenant = await _dbContext.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == id, ct)
            ?? throw new KeyNotFoundException("租户不存在");
        return _mapper.Map<TenantDto>(tenant);
    }

    public async Task<TenantDto> CreateTenantAsync(CreateTenantRequest request, CancellationToken ct = default)
    {
        // 检查 Slug 唯一性
        var exists = await _dbContext.Tenants.IgnoreQueryFilters()
            .AnyAsync(t => t.Slug == request.Slug, ct);
        if (exists)
            throw new InvalidOperationException("租户标识已存在");

        var tenant = _mapper.Map<Tenant>(request);
        _dbContext.Tenants.Add(tenant);
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("创建租户 {Slug}", tenant.Slug);
        return _mapper.Map<TenantDto>(tenant);
    }

    public async Task<TenantDto> UpdateTenantAsync(Guid id, UpdateTenantRequest request, CancellationToken ct = default)
    {
        var tenant = await _dbContext.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == id, ct)
            ?? throw new KeyNotFoundException("租户不存在");

        if (request.Name != null) tenant.Name = request.Name;
        if (request.MaxDevices.HasValue) tenant.MaxDevices = request.MaxDevices.Value;
        if (request.MaxUsers.HasValue) tenant.MaxUsers = request.MaxUsers.Value;
        if (request.Plan != null) tenant.Plan = Enum.Parse<TenantPlan>(request.Plan, true);

        await _dbContext.SaveChangesAsync(ct);
        return _mapper.Map<TenantDto>(tenant);
    }

    public async Task<object> GetTenantUsageAsync(Guid id, CancellationToken ct = default)
    {
        var deviceCount = await _dbContext.Devices.IgnoreQueryFilters()
            .CountAsync(d => d.TenantId == id, ct);
        var userCount = await _dbContext.Users.IgnoreQueryFilters()
            .CountAsync(u => u.TenantId == id && u.IsActive, ct);

        return new { DeviceCount = deviceCount, UserCount = userCount };
    }
}
```

- [ ] **Step 4: 创建 DeviceService**

```csharp
// src/EquipAI.Application/Services/DeviceService.cs
using AutoMapper;
using EquipAI.Application.DTOs.Common;
using EquipAI.Application.DTOs.Devices;
using EquipAI.Application.Interfaces;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Services;

public class DeviceService : IDeviceService
{
    private readonly AppDbContext _dbContext;
    private readonly ITenantContext _tenantContext;
    private readonly IMapper _mapper;
    private readonly ILogger<DeviceService> _logger;

    public DeviceService(AppDbContext dbContext, ITenantContext tenantContext, IMapper mapper, ILogger<DeviceService> logger)
    {
        _dbContext = dbContext;
        _tenantContext = tenantContext;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<PagedResult<DeviceDto>> GetDevicesAsync(
        PagedQuery query, string? status = null, string? type = null, CancellationToken ct = default)
    {
        var queryable = _dbContext.Devices.AsQueryable();

        // 过滤条件
        if (!string.IsNullOrEmpty(status))
            queryable = queryable.Where(d => d.Status == Enum.Parse<DeviceStatus>(status, true));
        if (!string.IsNullOrEmpty(type))
            queryable = queryable.Where(d => d.Type == type);
        if (!string.IsNullOrEmpty(query.Keyword))
            queryable = queryable.Where(d =>
                d.Name.Contains(query.Keyword) ||
                d.DeviceCode.Contains(query.Keyword) ||
                (d.Manufacturer != null && d.Manufacturer.Contains(query.Keyword)));

        // 排序
        queryable = query.Order.Equals("asc", StringComparison.OrdinalIgnoreCase)
            ? queryable.OrderBy(d => EF.Property<object>(d, query.Sort))
            : queryable.OrderByDescending(d => EF.Property<object>(d, query.Sort));

        var total = await queryable.CountAsync(ct);
        var items = await queryable
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(ct);

        return new PagedResult<DeviceDto>
        {
            Items = _mapper.Map<List<DeviceDto>>(items),
            Total = total,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }

    public async Task<DeviceDto> GetDeviceByIdAsync(Guid id, CancellationToken ct = default)
    {
        var device = await _dbContext.Devices.FindAsync([id], ct)
            ?? throw new KeyNotFoundException("设备不存在");
        return _mapper.Map<DeviceDto>(device);
    }

    public async Task<DeviceDto> CreateDeviceAsync(CreateDeviceRequest request, Guid tenantId, CancellationToken ct = default)
    {
        // 检查设备编码唯一性
        var exists = await _dbContext.Devices
            .AnyAsync(d => d.DeviceCode == request.DeviceCode, ct);
        if (exists)
            throw new InvalidOperationException($"设备编码 {request.DeviceCode} 已存在");

        var device = new Device
        {
            TenantId = tenantId,
            DeviceCode = request.DeviceCode,
            Name = request.Name,
            Type = request.Type,
            Manufacturer = request.Manufacturer,
            Model = request.Model,
            Criticality = Enum.Parse<DeviceCriticality>(request.Criticality, true),
            Status = DeviceStatus.Offline
        };

        _dbContext.Devices.Add(device);
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("创建设备 {DeviceCode}, 租户 {TenantId}", device.DeviceCode, tenantId);
        return _mapper.Map<DeviceDto>(device);
    }

    public async Task<DeviceDto> UpdateDeviceAsync(Guid id, UpdateDeviceRequest request, CancellationToken ct = default)
    {
        var device = await _dbContext.Devices.FindAsync([id], ct)
            ?? throw new KeyNotFoundException("设备不存在");

        if (request.Name != null) device.Name = request.Name;
        if (request.Manufacturer != null) device.Manufacturer = request.Manufacturer;
        if (request.Model != null) device.Model = request.Model;
        if (request.Criticality != null)
            device.Criticality = Enum.Parse<DeviceCriticality>(request.Criticality, true);

        device.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(ct);
        return _mapper.Map<DeviceDto>(device);
    }

    public async Task DeleteDeviceAsync(Guid id, CancellationToken ct = default)
    {
        var device = await _dbContext.Devices.FindAsync([id], ct)
            ?? throw new KeyNotFoundException("设备不存在");

        _dbContext.Devices.Remove(device);
        await _dbContext.SaveChangesAsync(ct);
    }
}
```

- [ ] **Step 5: 添加 IQueryable 分页扩展方法**

在 `UserService.cs` 中使用了 `ToPagedAsync`，需要在 Application 层创建扩展方法：

```csharp
// src/EquipAI.Application/DTOs/Common/QueryableExtensions.cs
using EquipAI.Application.DTOs.Common;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.Application.DTOs.Common;

/// <summary>
/// IQueryable 分页扩展
/// </summary>
public static class QueryableExtensions
{
    public static async Task<(List<T> Items, int Total)> ToPagedAsync<T>(
        this IQueryable<T> query, PagedQuery pagedQuery, CancellationToken ct = default)
    {
        var total = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(e => EF.Property<object>(e, pagedQuery.Sort))
            .Skip((pagedQuery.Page - 1) * pagedQuery.PageSize)
            .Take(pagedQuery.PageSize)
            .ToListAsync(ct);

        return (items, total);
    }
}
```

- [ ] **Step 6: 验证编译**

```bash
dotnet build src/EquipAI.Application/EquipAI.Application.csproj
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add business services — auth, user, tenant, and device"
```

---

### Task 7: WebAPI — Program.cs, Controllers & Seed Data

**Files:**
- Create: `src/EquipAI.WebAPI/Program.cs`
- Create: `src/EquipAI.WebAPI/appsettings.json`
- Create: `src/EquipAI.WebAPI/appsettings.Development.json`
- Create: `src/EquipAI.WebAPI/Controllers/AuthController.cs`
- Create: `src/EquipAI.WebAPI/Controllers/UsersController.cs`
- Create: `src/EquipAI.WebAPI/Controllers/TenantsController.cs`
- Create: `src/EquipAI.WebAPI/Controllers/DevicesController.cs`
- Create: `src/EquipAI.WebAPI/Controllers/DeviceTypesController.cs`
- Create: `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs`
- Create: `src/EquipAI.Infrastructure/Seeding/DataSeeder.cs`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p src/EquipAI.WebAPI/{Controllers,Attributes,Extensions}
mkdir -p src/EquipAI.Infrastructure/Seeding
```

- [ ] **Step 2: 创建 appsettings.json**

```json
// src/EquipAI.WebAPI/appsettings.json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=equipai_dev;Username=postgres;Password=dev123"
  },
  "Redis": {
    "ConnectionString": "localhost:6379"
  },
  "Jwt": {
    "Secret": "EquipAI-Dev-Secret-Key-Must-Be-32-Chars-Minimum!!",
    "Issuer": "EquipAI",
    "Audience": "EquipAI"
  },
  "AllowedHosts": "*"
}
```

```json
// src/EquipAI.WebAPI/appsettings.Development.json
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Debug",
      "Override": {
        "Microsoft": "Warning",
        "Microsoft.Hosting.Lifetime": "Information"
      }
    }
  }
}
```

- [ ] **Step 3: 创建 ServiceCollectionExtensions（DI 注册）**

```csharp
// src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs
using EquipAI.Application.Eventing;
using EquipAI.Application.Interfaces;
using EquipAI.Application.Mapping;
using EquipAI.Application.Services;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Cache;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Identity;
using EquipAI.Infrastructure.Middleware;
using EquipAI.Infrastructure.Tenant;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

namespace EquipAI.WebAPI.Extensions;

/// <summary>
/// DI 服务注册扩展方法
/// </summary>
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // EF Core
        services.AddDbContext<AppDbContext>((sp, options) =>
        {
            var tenantContext = sp.GetRequiredService<ITenantContext>();
            options.UseNpgsql(configuration.GetConnectionString("Default"));
        });

        // Redis
        services.AddSingleton<RedisService>();

        // JWT Token 服务
        services.AddSingleton<JwtTokenService>();

        // 仓储注册
        services.AddScoped(typeof(IRepository<>), typeof(Infrastructure.Data.Repositories.Repository<>));

        // 租户上下文 — 使用工厂模式支持中间件注入
        services.AddScoped<ITenantContext>(sp =>
        {
            var httpContext = sp.GetRequiredService<IHttpContextAccessor>().HttpContext;
            if (httpContext?.Items["TenantContext"] is ITenantContext tc)
                return tc;
            // 默认返回系统租户上下文
            return new TenantContext(Guid.Empty, "shared", false);
        });

        return services;
    }

    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ITenantService, TenantService>();
        services.AddScoped<IDeviceService, DeviceService>();
        services.AddSingleton<IRbacService, RbacService>();
        services.AddSingleton<IEventBus, InMemoryEventBus>();
        services.AddAutoMapper(typeof(MappingProfile));
        return services;
    }

    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var key = Encoding.UTF8.GetBytes(configuration["Jwt:Secret"]!);

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = configuration["Jwt:Issuer"],
                    ValidAudience = configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ClockSkew = TimeSpan.Zero
                };
            });

        return services;
    }

    public static IServiceCollection AddSwagger(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo { Title = "EquipAI API", Version = "v1" });
            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Description = "JWT Authorization header using the Bearer scheme",
                Name = "Authorization",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.Http,
                Scheme = "bearer"
            });
            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                    },
                    Array.Empty<string>()
                }
            });
        });
        return services;
    }
}
```

- [ ] **Step 4: 创建 AuthController**

```csharp
// src/EquipAI.WebAPI/Controllers/AuthController.cs
using EquipAI.Application.DTOs.Auth;
using EquipAI.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EquipAI.WebAPI.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// 用户登录
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var result = await _authService.LoginAsync(request, ct);
        return Ok(result);
    }

    /// <summary>
    /// 刷新 Token
    /// </summary>
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> RefreshToken([FromBody] RefreshTokenRequest request, CancellationToken ct)
    {
        var result = await _authService.RefreshTokenAsync(request.RefreshToken, ct);
        return Ok(result);
    }

    /// <summary>
    /// 用户登出
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId != null)
            await _authService.LogoutAsync(Guid.Parse(userId), ct);
        return Ok(new { message = "已登出" });
    }

    /// <summary>
    /// 修改密码
    /// </summary>
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        await _authService.ChangePasswordAsync(Guid.Parse(userId), request.CurrentPassword, request.NewPassword, ct);
        return Ok(new { message = "密码已修改" });
    }
}

public class RefreshTokenRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}
```

- [ ] **Step 5: 创建 UsersController**

```csharp
// src/EquipAI.WebAPI/Controllers/UsersController.cs
using EquipAI.Application.DTOs.Common;
using EquipAI.Application.DTOs.Users;
using EquipAI.Application.Interfaces;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EquipAI.WebAPI.Controllers;

[ApiController]
[Route("api/v1/admin/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ITenantContext _tenantContext;

    public UsersController(IUserService userService, ITenantContext tenantContext)
    {
        _userService = userService;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    [RequirePermission("user:read")]
    public async Task<ActionResult<PagedResult<UserDto>>> GetUsers([FromQuery] PagedQuery query, CancellationToken ct)
    {
        var result = await _userService.GetUsersAsync(query, ct);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [RequirePermission("user:read")]
    public async Task<ActionResult<UserDto>> GetUser(Guid id, CancellationToken ct)
    {
        var result = await _userService.GetUserByIdAsync(id, ct);
        return Ok(result);
    }

    [HttpPost]
    [RequirePermission("user:create")]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserRequest request, CancellationToken ct)
    {
        var result = await _userService.CreateUserAsync(request, _tenantContext.TenantId, ct);
        return CreatedAtAction(nameof(GetUser), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    [RequirePermission("user:update")]
    public async Task<ActionResult<UserDto>> UpdateUser(Guid id, [FromBody] UpdateUserRequest request, CancellationToken ct)
    {
        var result = await _userService.UpdateUserAsync(id, request, ct);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [RequirePermission("user:delete")]
    public async Task<IActionResult> DeactivateUser(Guid id, CancellationToken ct)
    {
        await _userService.DeactivateUserAsync(id, ct);
        return NoContent();
    }

    [HttpPut("{id}/role")]
    [RequirePermission("user:role")]
    public async Task<IActionResult> ChangeRole(Guid id, [FromBody] ChangeRoleRequest request, CancellationToken ct)
    {
        await _userService.ChangeUserRoleAsync(id, request.Role, ct);
        return Ok(new { message = "角色已更新" });
    }
}

public class ChangeRoleRequest
{
    public string Role { get; set; } = string.Empty;
}
```

- [ ] **Step 6: 创建 TenantsController**

```csharp
// src/EquipAI.WebAPI/Controllers/TenantsController.cs
using EquipAI.Application.DTOs.Common;
using EquipAI.Application.DTOs.Tenants;
using EquipAI.Application.Interfaces;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

[ApiController]
[Route("api/v1/admin/tenants")]
[Authorize]
public class TenantsController : ControllerBase
{
    private readonly ITenantService _tenantService;

    public TenantsController(ITenantService tenantService)
    {
        _tenantService = tenantService;
    }

    [HttpGet]
    [RequirePermission("tenant:read")]
    public async Task<ActionResult<PagedResult<TenantDto>>> GetTenants([FromQuery] PagedQuery query, CancellationToken ct)
    {
        var result = await _tenantService.GetTenantsAsync(query, ct);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [RequirePermission("tenant:read")]
    public async Task<ActionResult<TenantDto>> GetTenant(Guid id, CancellationToken ct)
    {
        var result = await _tenantService.GetTenantByIdAsync(id, ct);
        return Ok(result);
    }

    [HttpPost]
    [RequirePermission("tenant:create")]
    public async Task<ActionResult<TenantDto>> CreateTenant([FromBody] CreateTenantRequest request, CancellationToken ct)
    {
        var result = await _tenantService.CreateTenantAsync(request, ct);
        return CreatedAtAction(nameof(GetTenant), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    [RequirePermission("tenant:update")]
    public async Task<ActionResult<TenantDto>> UpdateTenant(Guid id, [FromBody] UpdateTenantRequest request, CancellationToken ct)
    {
        var result = await _tenantService.UpdateTenantAsync(id, request, ct);
        return Ok(result);
    }

    [HttpGet("{id}/usage")]
    [RequirePermission("tenant:read")]
    public async Task<ActionResult<object>> GetTenantUsage(Guid id, CancellationToken ct)
    {
        var result = await _tenantService.GetTenantUsageAsync(id, ct);
        return Ok(result);
    }
}
```

- [ ] **Step 7: 创建 DevicesController**

```csharp
// src/EquipAI.WebAPI/Controllers/DevicesController.cs
using EquipAI.Application.DTOs.Common;
using EquipAI.Application.DTOs.Devices;
using EquipAI.Application.Interfaces;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

[ApiController]
[Route("api/v1/devices")]
[Authorize]
public class DevicesController : ControllerBase
{
    private readonly IDeviceService _deviceService;
    private readonly ITenantContext _tenantContext;

    public DevicesController(IDeviceService deviceService, ITenantContext tenantContext)
    {
        _deviceService = deviceService;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    [RequirePermission("device:read")]
    public async Task<ActionResult<PagedResult<DeviceDto>>> GetDevices(
        [FromQuery] PagedQuery query,
        [FromQuery] string? status,
        [FromQuery] string? type,
        CancellationToken ct)
    {
        var result = await _deviceService.GetDevicesAsync(query, status, type, ct);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [RequirePermission("device:read")]
    public async Task<ActionResult<DeviceDto>> GetDevice(Guid id, CancellationToken ct)
    {
        var result = await _deviceService.GetDeviceByIdAsync(id, ct);
        return Ok(result);
    }

    [HttpPost]
    [RequirePermission("device:create")]
    public async Task<ActionResult<DeviceDto>> CreateDevice([FromBody] CreateDeviceRequest request, CancellationToken ct)
    {
        var result = await _deviceService.CreateDeviceAsync(request, _tenantContext.TenantId, ct);
        return CreatedAtAction(nameof(GetDevice), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    [RequirePermission("device:update")]
    public async Task<ActionResult<DeviceDto>> UpdateDevice(Guid id, [FromBody] UpdateDeviceRequest request, CancellationToken ct)
    {
        var result = await _deviceService.UpdateDeviceAsync(id, request, ct);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [RequirePermission("device:delete")]
    public async Task<IActionResult> DeleteDevice(Guid id, CancellationToken ct)
    {
        await _deviceService.DeleteDeviceAsync(id, ct);
        return NoContent();
    }
}
```

- [ ] **Step 8: 创建 DeviceTypesController**

```csharp
// src/EquipAI.WebAPI/Controllers/DeviceTypesController.cs
using EquipAI.Application.Interfaces;
using EquipAI.Core.Constants;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Controllers;

[ApiController]
[Route("api/v1/device-types")]
[Authorize]
public class DeviceTypesController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly ITenantContext _tenantContext;

    public DeviceTypesController(AppDbContext dbContext, ITenantContext tenantContext)
    {
        _dbContext = dbContext;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 获取设备类型模板列表（含系统租户预置模板）
    /// </summary>
    [HttpGet]
    [RequirePermission("device:read")]
    public async Task<ActionResult<List<DeviceTypeTemplate>>> GetDeviceTypes(CancellationToken ct)
    {
        // 查询当前租户 + 系统租户的模板
        var templates = await _dbContext.DeviceTypeTemplates
            .IgnoreQueryFilters()
            .Where(t => t.TenantId == _tenantContext.TenantId
                     || t.TenantId == SystemConstants.SystemTenantId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(ct);
        return Ok(templates);
    }

    [HttpPost]
    [RequirePermission("device:create")]
    public async Task<ActionResult<DeviceTypeTemplate>> CreateDeviceType(
        [FromBody] CreateDeviceTypeRequest request, CancellationToken ct)
    {
        var template = new DeviceTypeTemplate
        {
            TenantId = _tenantContext.TenantId,
            Name = request.Name,
            Industry = request.Industry,
            Parameters = request.Parameters ?? "{}"
        };

        _dbContext.DeviceTypeTemplates.Add(template);
        await _dbContext.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetDeviceTypes), new { id = template.Id }, template);
    }
}

public class CreateDeviceTypeRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Industry { get; set; }
    public string? Parameters { get; set; }
}
```

- [ ] **Step 9: 创建 DataSeeder**

```csharp
// src/EquipAI.Infrastructure/Seeding/DataSeeder.cs
using EquipAI.Core.Constants;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Infrastructure.Seeding;

/// <summary>
/// 种子数据初始化器
/// </summary>
public class DataSeeder
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<DataSeeder> _logger;

    public DataSeeder(AppDbContext dbContext, ILogger<DataSeeder> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        // 确保数据库已创建
        await _dbContext.Database.EnsureCreatedAsync();

        // 种子：系统租户
        if (!await _dbContext.Tenants.IgnoreQueryFilters().AnyAsync(t => t.Id == SystemConstants.SystemTenantId))
        {
            _dbContext.Tenants.Add(new Tenant
            {
                Id = SystemConstants.SystemTenantId,
                Name = "系统租户",
                Slug = SystemConstants.SystemTenantSlug,
                Plan = TenantPlan.Enterprise,
                IsolationMode = TenantIsolationMode.Shared,
                MaxDevices = 0,
                MaxUsers = 0,
                IsActive = true
            });
            _logger.LogInformation("种子数据：创建系统租户");
        }

        // 种子：默认演示租户
        var defaultTenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        if (!await _dbContext.Tenants.IgnoreQueryFilters().AnyAsync(t => t.Slug == "default"))
        {
            _dbContext.Tenants.Add(new Tenant
            {
                Id = defaultTenantId,
                Name = "演示工厂",
                Slug = "default",
                Plan = TenantPlan.Trial,
                MaxDevices = 50,
                MaxUsers = 20
            });
            _logger.LogInformation("种子数据：创建默认租户");
        }

        await _dbContext.SaveChangesAsync();

        // 种子：admin 用户
        if (!await _dbContext.Users.IgnoreQueryFilters().AnyAsync(u => u.Username == "admin"))
        {
            _dbContext.Users.Add(new User
            {
                TenantId = defaultTenantId,
                Username = "admin",
                PasswordHash = PasswordHasher.HashPassword("Admin@123"),
                DisplayName = "系统管理员",
                Role = UserRole.SystemAdmin,
                MustChangePassword = true
            });
            _logger.LogInformation("种子数据：创建 admin 用户（首次登录需修改密码）");
        }

        await _dbContext.SaveChangesAsync();

        // 种子：行业预置设备类型模板
        if (!await _dbContext.DeviceTypeTemplates.IgnoreQueryFilters().AnyAsync())
        {
            var templates = new[]
            {
                new DeviceTypeTemplate
                {
                    TenantId = SystemConstants.SystemTenantId,
                    Name = "CNC 数控机床",
                    Industry = "机械制造",
                    Parameters = """{"temperature":{"unit":"°C","range":[-20,120]},"vibration":{"unit":"mm/s","range":[0,50]},"spindle_speed":{"unit":"rpm","range":[0,20000]},"power":{"unit":"W","range":[0,30000]}}"""
                },
                new DeviceTypeTemplate
                {
                    TenantId = SystemConstants.SystemTenantId,
                    Name = "注塑机",
                    Industry = "塑料加工",
                    Parameters = """{"temperature":{"unit":"°C","range":[0,400]},"pressure":{"unit":"MPa","range":[0,250]},"injection_speed":{"unit":"mm/s","range":[0,500]}}"""
                },
                new DeviceTypeTemplate
                {
                    TenantId = SystemConstants.SystemTenantId,
                    Name = "空压机",
                    Industry = "通用",
                    Parameters = """{"pressure":{"unit":"MPa","range":[0,1.5]},"temperature":{"unit":"°C","range":[0,120]},"vibration":{"unit":"mm/s","range":[0,30]}}"""
                }
            };

            _dbContext.DeviceTypeTemplates.AddRange(templates);
            _logger.LogInformation("种子数据：创建 {Count} 个行业预置设备类型模板", templates.Length);
        }

        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("种子数据初始化完成");
    }
}
```

- [ ] **Step 10: 创建 Program.cs**

```csharp
// src/EquipAI.WebAPI/Program.cs
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Middleware;
using EquipAI.Infrastructure.Seeding;
using EquipAI.WebAPI.Extensions;
using Serilog;

// 配置 Serilog
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // 使用 Serilog
    builder.Host.UseSerilog((context, config) =>
    {
        config.ReadFrom.Configuration(context.Configuration);
    });

    // 注册服务
    builder.Services.AddHttpContextAccessor();
    builder.Services.AddInfrastructure(builder.Configuration);
    builder.Services.AddApplication();
    builder.Services.AddJwtAuthentication(builder.Configuration);
    builder.Services.AddSwagger();
    builder.Services.AddControllers();
    builder.Services.AddHealthChecks()
        .AddNpgSql(builder.Configuration.GetConnectionString("Default")!)
        .AddRedis(builder.Configuration["Redis:ConnectionString"]!);

    // CORS
    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
    });

    var app = builder.Build();

    // 中间件管线（顺序很重要）
    app.UseMiddleware<ExceptionHandlingMiddleware>();
    app.UseSerilogRequestLogging();
    app.UseCors();
    app.UseMiddleware<TenantResolutionMiddleware>();
    app.UseAuthentication();
    app.UseMiddleware<PermissionMiddleware>();
    app.UseAuthorization();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.MapControllers();
    app.MapHealthChecks("/health");

    // 种子数据
    if (args.Contains("--seed") || app.Environment.IsDevelopment())
    {
        using (var scope = app.Services.CreateScope())
        {
            // 种子数据需要忽略租户过滤器，创建特殊的 context
            var seeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
            await seeder.SeedAsync();
        }
    }

    Log.Information("EquipAI 后端服务启动成功");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "服务启动失败");
}
finally
{
    Log.CloseAndFlush();
}
```

- [ ] **Step 11: 验证编译**

```bash
dotnet build EquipAI.sln
```

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: add WebAPI layer — controllers, DI registration, seed data, and Program.cs"
```

---

### Task 8: Docker Dev Environment

**Files:**
- Create: `docker/docker-compose.dev.yml`
- Create: `docker/mosquitto.conf`

- [ ] **Step 1: 创建 docker-compose.dev.yml**

```yaml
# docker/docker-compose.dev.yml
# 开发环境依赖服务：PostgreSQL + TimescaleDB, Redis, Mosquitto
services:
  postgres:
    image: timescale/timescaledb:latest-pg16
    container_name: equipai-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: equipai_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: dev123
    volumes:
      - pgdev:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d equipai_dev"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: equipai-redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  mosquitto:
    image: eclipse-mosquitto:2
    container_name: equipai-mosquitto
    ports:
      - "1883:1883"
    volumes:
      - ./mosquitto.conf:/mosquitto/config/mosquitto.conf

volumes:
  pgdev:
```

- [ ] **Step 2: 创建 mosquitto.conf**

```
# docker/mosquitto.conf
# 开发环境 MQTT 配置（允许匿名连接）
listener 1883
allow_anonymous true
max_connections -1
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Docker dev environment — PostgreSQL, Redis, Mosquitto"
```

---

### Task 9: EF Core Migration & Database Setup

**前置条件：** Docker 开发环境已启动

- [ ] **Step 1: 启动开发依赖服务**

```bash
docker compose -f docker/docker-compose.dev.yml up -d
```

Expected: 三个容器全部 Running

- [ ] **Step 2: 创建初始迁移**

```bash
cd src/EquipAI.WebAPI
dotnet ef migrations add InitialCreate --startup-project . --project ../EquipAI.Infrastructure --output-dir Data/Migrations
```

Expected: 迁移文件生成成功

- [ ] **Step 3: 应用迁移并创建数据库**

```bash
dotnet ef database update --startup-project . --project ../EquipAI.Infrastructure
```

Expected: `Done.`

- [ ] **Step 4: 运行种子数据**

```bash
dotnet run --seed
```

Expected: 控制台输出种子数据创建日志

- [ ] **Step 5: 验证 Swagger 可访问**

```bash
# 在另一个终端运行
cd src/EquipAI.WebAPI
dotnet run
```

打开浏览器访问 `http://localhost:5000/swagger`，应看到 Swagger UI。

- [ ] **Step 6: Commit 迁移文件**

```bash
git add -A
git commit -m "feat: add initial EF Core migration and database setup"
```

---

### Task 10: Unit Tests

**Files:**
- Create: `tests/EquipAI.Tests.Unit/Services/RbacServiceTests.cs`
- Create: `tests/EquipAI.Tests.Unit/Eventing/InMemoryEventBusTests.cs`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p tests/EquipAI.Tests.Unit/{Services,Eventing}
```

- [ ] **Step 2: 创建 RbacService 单元测试**

```csharp
// tests/EquipAI.Tests.Unit/Services/RbacServiceTests.cs
using EquipAI.Application.Services;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Services;

public class RbacServiceTests
{
    private readonly RbacService _sut = new();

    [Fact]
    public void SystemAdmin_HasAllDevicePermissions()
    {
        _sut.HasPermission("SystemAdmin", "device:create").Should().BeTrue();
        _sut.HasPermission("SystemAdmin", "device:read").Should().BeTrue();
        _sut.HasPermission("SystemAdmin", "device:update").Should().BeTrue();
        _sut.HasPermission("SystemAdmin", "device:delete").Should().BeTrue();
    }

    [Fact]
    public void Viewer_CanOnlyReadDevices()
    {
        _sut.HasPermission("Viewer", "device:read").Should().BeTrue();
        _sut.HasPermission("Viewer", "device:create").Should().BeFalse();
        _sut.HasPermission("Viewer", "device:delete").Should().BeFalse();
    }

    [Fact]
    public void Technician_CannotDeleteDevices()
    {
        _sut.HasPermission("Technician", "device:read").Should().BeTrue();
        _sut.HasPermission("Technician", "device:delete").Should().BeFalse();
    }

    [Fact]
    public void MaintenanceLead_CanUpdateDevicesButNotDelete()
    {
        _sut.HasPermission("MaintenanceLead", "device:update").Should().BeTrue();
        _sut.HasPermission("MaintenanceLead", "device:delete").Should().BeFalse();
    }

    [Fact]
    public void Operator_CanReadAndAcknowledgeAlerts()
    {
        _sut.HasPermission("Operator", "alert:read").Should().BeTrue();
        _sut.HasPermission("Operator", "alert:acknowledge").Should().BeTrue();
        _sut.HasPermission("Operator", "alert:delete").Should().BeFalse();
    }

    [Fact]
    public void UnknownRole_HasNoPermissions()
    {
        _sut.HasPermission("Unknown", "device:read").Should().BeFalse();
    }

    [Fact]
    public void EmptyPermission_ReturnsFalse()
    {
        _sut.HasPermission("SystemAdmin", "nonexistent:permission").Should().BeFalse();
    }
}
```

- [ ] **Step 3: 运行 RbacService 测试**

```bash
dotnet test tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj --filter "RbacServiceTests" -v normal
```

Expected: 7 tests passed

- [ ] **Step 4: 创建 InMemoryEventBus 单元测试**

```csharp
// tests/EquipAI.Tests.Unit/Eventing/InMemoryEventBusTests.cs
using EquipAI.Application.Eventing;
using EquipAI.Core.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace EquipAI.Tests.Unit.Eventing;

// 测试用事件
public record TestEvent(
    Guid EventId,
    DateTime OccurredAt,
    Guid TenantId,
    string Message
) : IIntegrationEvent;

// 测试用处理器
public class TestEventHandler : IEventHandler<TestEvent>
{
    public static List<TestEvent> ReceivedEvents { get; } = [];

    public Task HandleAsync(TestEvent @event, CancellationToken ct = default)
    {
        ReceivedEvents.Add(@event);
        return Task.CompletedTask;
    }
}

public class InMemoryEventBusTests : IDisposable
{
    private readonly ServiceProvider _serviceProvider;
    private readonly InMemoryEventBus _eventBus;

    public InMemoryEventBusTests()
    {
        TestEventHandler.ReceivedEvents.Clear();

        var services = new ServiceCollection();
        services.AddSingleton<TestEventHandler>();
        services.AddLogging();

        _serviceProvider = services.BuildServiceProvider();
        var logger = _serviceProvider.GetRequiredService<ILogger<InMemoryEventBus>>();
        _eventBus = new InMemoryEventBus(_serviceProvider, logger);
    }

    [Fact]
    public async Task PublishAsync_ShouldDeliverToSubscribedHandler()
    {
        // Arrange
        _eventBus.Subscribe<TestEvent, TestEventHandler>();
        var testEvent = new TestEvent(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid(), "测试消息");

        // Act
        await _eventBus.PublishAsync(testEvent);

        // 等待异步处理完成
        await Task.Delay(500);

        // Assert
        TestEventHandler.ReceivedEvents.Should().ContainSingle()
            .Which.Message.Should().Be("测试消息");
    }

    [Fact]
    public async Task PublishAsync_WithNoSubscribers_ShouldNotThrow()
    {
        // Arrange
        var testEvent = new TestEvent(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid(), "无订阅者");

        // Act
        var act = () => _eventBus.PublishAsync(testEvent);

        // Assert
        await act.Should().NotThrowAsync();
    }

    public void Dispose()
    {
        _eventBus.Dispose();
        _serviceProvider.Dispose();
    }
}
```

- [ ] **Step 5: 运行 EventBus 测试**

```bash
dotnet test tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj --filter "InMemoryEventBusTests" -v normal
```

Expected: 2 tests passed

- [ ] **Step 6: 运行所有单元测试**

```bash
dotnet test tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj -v normal
```

Expected: 9 tests passed, 0 failed

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "test: add unit tests for RBAC service and event bus"
```

---

### Task 11: Integration Tests (Smoke Test)

**Files:**
- Create: `tests/EquipAI.Tests.Integration/Infrastructure/CustomWebApplicationFactory.cs`
- Create: `tests/EquipAI.Tests.Integration/Controllers/AuthControllerTests.cs`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p tests/EquipAI.Tests.Integration/{Infrastructure,Controllers}
```

- [ ] **Step 2: 创建 CustomWebApplicationFactory**

```csharp
// tests/EquipAI.Tests.Integration/Infrastructure/CustomWebApplicationFactory.cs
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Seeding;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace EquipAI.Tests.Integration.Infrastructure;

/// <summary>
/// 集成测试的 WebApplicationFactory，使用内存数据库
/// </summary>
public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // 替换真实的 DbContext 为内存数据库
            services.RemoveAll(typeof(DbContextOptions<AppDbContext>));
            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseInMemoryDatabase("EquipAI_TestDb");
            });

            // 注册种子数据服务
            services.AddScoped<DataSeeder>();
        });
    }

    /// <summary>
    /// 初始化种子数据并返回 HttpClient
    /// </summary>
    public async Task<HttpClient> CreateClientWithSeedAsync()
    {
        var client = CreateClient();
        using var scope = Services.CreateScope();
        var seeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
        await seeder.SeedAsync();
        return client;
    }
}
```

- [ ] **Step 3: 创建 Auth 集成测试**

```csharp
// tests/EquipAI.Tests.Integration/Controllers/AuthControllerTests.cs
using System.Net;
using System.Net.Http.Json;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Controllers;

public class AuthControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public AuthControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsTokens()
    {
        // Arrange
        var client = await _factory.CreateClientWithSeedAsync();
        var request = new LoginRequest { Username = "admin", Password = "Admin@123" };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<AuthResponse>();
        result.Should().NotBeNull();
        result!.AccessToken.Should().NotBeEmpty();
        result.RefreshToken.Should().NotBeEmpty();
        result.UserInfo.Username.Should().Be("admin");
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_Returns401()
    {
        // Arrange
        var client = await _factory.CreateClientWithSeedAsync();
        var request = new LoginRequest { Username = "admin", Password = "wrong-password" };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_WithNonexistentUser_Returns401()
    {
        // Arrange
        var client = await _factory.CreateClientWithSeedAsync();
        var request = new LoginRequest { Username = "nonexistent", Password = "password" };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
```

- [ ] **Step 4: 运行集成测试**

```bash
dotnet test tests/EquipAI.Tests.Integration/EquipAI.Tests.Integration.csproj -v normal
```

Expected: 3 tests passed

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: add integration tests for auth controller"
```

---

### Task 12: Smoke Test — End-to-End Verification

- [ ] **Step 1: 启动完整的开发环境**

```bash
# 确保 Docker 服务运行
docker compose -f docker/docker-compose.dev.yml up -d

# 应用迁移
cd src/EquipAI.WebAPI
dotnet ef database update --startup-project . --project ../EquipAI.Infrastructure

# 启动后端
dotnet run --seed
```

- [ ] **Step 2: 使用 curl 测试登录**

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'
```

Expected: 200 OK，返回 `accessToken` 和 `refreshToken`

- [ ] **Step 3: 使用 Token 测试设备 API**

```bash
# 替换 {TOKEN} 为上一步返回的 accessToken
curl http://localhost:5000/api/v1/devices \
  -H "Authorization: Bearer {TOKEN}"
```

Expected: 200 OK，返回空分页列表 `{"items":[],"total":0,"page":1,"pageSize":20,"totalPages":0}`

- [ ] **Step 4: 测试创建设备**

```bash
curl -X POST http://localhost:5000/api/v1/devices \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"deviceCode":"CNC-001","name":"CNC 数控机床 1号","type":"CNC","manufacturer":"西门子"}'
```

Expected: 201 Created，返回设备 DTO

- [ ] **Step 5: 测试健康检查**

```bash
curl http://localhost:5000/health
```

Expected: 200 OK（Healthy）

- [ ] **Step 6: Final Commit**

```bash
git add -A
git commit -m "feat: complete Week 1-2 backend skeleton — multi-tenant auth + device CRUD ready"
```
