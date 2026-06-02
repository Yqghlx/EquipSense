# Phase 3A：工单完整工作流 + 智能派工 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现智能派工算法和工单 SLA 管理，让工单从手动指派升级为基于技能匹配和工作负载均衡的自动推荐派工。

**Architecture:** 新建 `ITechnicianProfile` 技术人员画像实体记录技能和工作负载，`SmartDispatchService` 基于设备类型匹配技能 + 当前负载排序，推荐最佳技术人员。同时添加 SLA 时限管理和逾期预警机制。前端增加派工面板和 SLA 倒计时展示。

**Tech Stack:** .NET 8、EF Core 8、PostgreSQL、React 19 + TanStack Query + shadcn/ui

---

## 文件结构

```
src/EquipAI.Core/
├── Entities/TechnicianProfile.cs           -- 技术人员画像
├── Interfaces/ISmartDispatchService.cs     -- 智能派工接口
src/EquipAI.Application/
├── WorkOrders/
│   ├── SmartDispatchService.cs             -- 智能派工算法
│   ├── SlaTracker.cs                       -- SLA 时限追踪器
│   ├── DTOs/TechnicianProfileDto.cs        -- 技术人员 DTO
│   ├── DTOs/DispatchRecommendationDto.cs   -- 派工推荐 DTO
src/EquipAI.Infrastructure/Data/Configurations/
├── TechnicianProfileConfiguration.cs       -- EF 表映射
src/EquipAI.WebAPI/Controllers/
├── DispatchController.cs                   -- 派工 API
frontend/src/
├── hooks/useDispatch.ts                    -- 派工 hooks
├── pages/DispatchBoardPage.tsx             -- 派工看板页面
```

---

### Task 1: 技术人员画像实体 + EF 配置

**Files:**
- Create: `src/EquipAI.Core/Entities/TechnicianProfile.cs`
- Create: `src/EquipAI.Infrastructure/Data/Configurations/TechnicianProfileConfiguration.cs`
- Modify: `src/EquipAI.Infrastructure/Data/AppDbContext.cs`

- [ ] **Step 1: 创建 TechnicianProfile 实体**

```csharp
// src/EquipAI.Core/Entities/TechnicianProfile.cs
namespace EquipAI.Core.Entities;

/// <summary>
/// 技术人员画像 — 记录技能、工作负载和绩效数据，用于智能派工匹配
/// </summary>
public class TechnicianProfile : BaseEntity
{
    /// <summary>
    /// 所属租户 ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 关联用户 ID（对应 Users 表）
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// 技术人员姓名
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 擅长设备类型列表（JSON 数组，如 ["电机","CNC","注塑机"]）
    /// </summary>
    public string Skills { get; set; } = "[]";

    /// <summary>
    /// 当前进行中的工单数量（用于负载均衡）
    /// </summary>
    public int ActiveWorkCount { get; set; }

    /// <summary>
    /// 历史完成工单总数
    /// </summary>
    public int CompletedCount { get; set; }

    /// <summary>
    /// 平均完成工单时长（小时）
    /// </summary>
    public double? AvgCompletionHours { get; set; }

    /// <summary>
    /// 是否在线/可派工
    /// </summary>
    public bool IsAvailable { get; set; } = true;
}
```

- [ ] **Step 2: 创建 EF 配置**

```csharp
// src/EquipAI.Infrastructure/Data/Configurations/TechnicianProfileConfiguration.cs
using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

public class TechnicianProfileConfiguration : IEntityTypeConfiguration<TechnicianProfile>
{
    public void Configure(EntityTypeBuilder<TechnicianProfile> builder)
    {
        builder.ToTable("technician_profiles");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Name).HasMaxLength(100).IsRequired();
        builder.Property(e => e.Skills).HasColumnType("jsonb");
        builder.HasIndex(e => new { e.TenantId, e.UserId }).IsUnique();
        builder.HasIndex(e => new { e.TenantId, e.IsAvailable });
    }
}
```

- [ ] **Step 3: 在 AppDbContext.cs 添加 DbSet**

在 `AppDbContext.cs` 的 `DbSet` 区域添加：
```csharp
/// <summary>
/// 技术人员画像
/// </summary>
public DbSet<TechnicianProfile> TechnicianProfiles => Set<TechnicianProfile>();
```

- [ ] **Step 4: 编译确认**

Run: `dotnet build EquipAI.slnx`
Expected: 编译成功

- [ ] **Step 5: 提交**

```bash
git add src/EquipAI.Core/Entities/TechnicianProfile.cs src/EquipAI.Infrastructure/Data/Configurations/TechnicianProfileConfiguration.cs src/EquipAI.Infrastructure/Data/AppDbContext.cs
git commit -m "feat: 技术人员画像实体 TechnicianProfile + EF 配置"
```

---

### Task 2: 智能派工服务

**Files:**
- Create: `src/EquipAI.Core/Interfaces/ISmartDispatchService.cs`
- Create: `src/EquipAI.Application/WorkOrders/SmartDispatchService.cs`
- Create: `src/EquipAI.Application/WorkOrders/DTOs/DispatchRecommendationDto.cs`
- Create: `tests/EquipAI.Tests.Unit/WorkOrders/SmartDispatchServiceTests.cs`

- [ ] **Step 1: 创建派工推荐 DTO**

```csharp
// src/EquipAI.Application/WorkOrders/DTOs/DispatchRecommendationDto.cs
namespace EquipAI.Application.WorkOrders.DTOs;

/// <summary>
/// 派工推荐结果
/// </summary>
public record DispatchRecommendationDto
{
    /// <summary>推荐技术人员用户 ID</summary>
    public Guid TechnicianUserId { get; init; }

    /// <summary>技术人员姓名</summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>技能匹配分数（0-1）</summary>
    public double SkillScore { get; init; }

    /// <summary>负载分数（0-1，越高表示越空闲）</summary>
    public double LoadScore { get; init; }

    /// <summary>综合评分（0-1）</summary>
    public double TotalScore { get; init; }

    /// <summary>当前进行中工单数</summary>
    public int ActiveWorkCount { get; init; }

    /// <summary>推荐理由</summary>
    public string Reason { get; init; } = string.Empty;
}
```

- [ ] **Step 2: 创建接口**

```csharp
// src/EquipAI.Core/Interfaces/ISmartDispatchService.cs
using EquipAI.Application.WorkOrders.DTOs;

namespace EquipAI.Core.Interfaces;

/// <summary>
/// 智能派工服务 — 基于技能匹配 + 负载均衡推荐最佳技术人员
/// </summary>
public interface ISmartDispatchService
{
    /// <summary>
    /// 为指定工单推荐技术人员列表（按综合评分降序）
    /// </summary>
    Task<List<DispatchRecommendationDto>> RecommendAsync(
        Guid tenantId, Guid workOrderId, int topN = 5, CancellationToken ct = default);
}
```

- [ ] **Step 3: 编写测试**

```csharp
// tests/EquipAI.Tests.Unit/WorkOrders/SmartDispatchServiceTests.cs
using EquipAI.Application.WorkOrders;
using EquipAI.Application.WorkOrders.DTOs;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace EquipAI.Tests.Unit.WorkOrders;

public class SmartDispatchServiceTests : IAsyncDisposable
{
    private readonly ServiceProvider _sp;
    private readonly string _dbName;

    public SmartDispatchServiceTests()
    {
        _dbName = $"DispatchTest_{Guid.NewGuid()}";
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(_dbName));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(Guid.NewGuid()));
        services.AddLogging();
        services.AddScoped<ISmartDispatchService, SmartDispatchService>();
        _sp = services.BuildServiceProvider();
    }

    [Fact]
    public async Task RecommendAsync_应按技能匹配排序()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        // 设备类型为"电机"
        var deviceId = Guid.NewGuid();
        db.Devices.Add(new Device { Id = deviceId, TenantId = tenantId, DeviceCode = "DEV-001", Name = "1号电机", Type = "电机" });
        var woId = Guid.NewGuid();
        db.WorkOrders.Add(new WorkOrder { Id = woId, TenantId = tenantId, DeviceId = deviceId, Title = "电机故障", Status = WorkOrderStatus.PendingDispatch });

        // 技师A擅长电机，技师B擅长CNC
        db.TechnicianProfiles.AddRange(
            new TechnicianProfile { TenantId = tenantId, UserId = Guid.NewGuid(), Name = "张三", Skills = """["电机","泵"]""", IsAvailable = true, ActiveWorkCount = 0 },
            new TechnicianProfile { TenantId = tenantId, UserId = Guid.NewGuid(), Name = "李四", Skills = """["CNC","注塑机"]""", IsAvailable = true, ActiveWorkCount = 0 }
        );
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<ISmartDispatchService>();
        var result = await service.RecommendAsync(tenantId, woId, 5);

        result.Should().NotBeEmpty();
        result[0].Name.Should().Be("张三"); // 张三擅长电机，应排第一
    }

    [Fact]
    public async Task RecommendAsync_负载高应排在后面()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        var deviceId = Guid.NewGuid();
        db.Devices.Add(new Device { Id = deviceId, TenantId = tenantId, DeviceCode = "DEV-002", Name = "2号电机", Type = "电机" });
        var woId = Guid.NewGuid();
        db.WorkOrders.Add(new WorkOrder { Id = woId, TenantId = tenantId, DeviceId = deviceId, Title = "电机维修", Status = WorkOrderStatus.PendingDispatch });

        // 两人都擅长电机，但张三已有很多工单
        db.TechnicianProfiles.AddRange(
            new TechnicianProfile { TenantId = tenantId, UserId = Guid.NewGuid(), Name = "张三", Skills = """["电机"]""", IsAvailable = true, ActiveWorkCount = 5 },
            new TechnicianProfile { TenantId = tenantId, UserId = Guid.NewGuid(), Name = "李四", Skills = """["电机"]""", IsAvailable = true, ActiveWorkCount = 0 }
        );
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<ISmartDispatchService>();
        var result = await service.RecommendAsync(tenantId, woId, 5);

        result.Should().NotBeEmpty();
        result[0].Name.Should().Be("李四"); // 李四空闲，应排第一
    }

    [Fact]
    public async Task RecommendAsync_不可用技师不应出现()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        var deviceId = Guid.NewGuid();
        db.Devices.Add(new Device { Id = deviceId, TenantId = tenantId, DeviceCode = "DEV-003", Name = "3号电机", Type = "电机" });
        var woId = Guid.NewGuid();
        db.WorkOrders.Add(new WorkOrder { Id = woId, TenantId = tenantId, DeviceId = deviceId, Title = "电机检查", Status = WorkOrderStatus.PendingDispatch });

        db.TechnicianProfiles.Add(
            new TechnicianProfile { TenantId = tenantId, UserId = Guid.NewGuid(), Name = "王五", Skills = """["电机"]""", IsAvailable = false, ActiveWorkCount = 0 }
        );
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<ISmartDispatchService>();
        var result = await service.RecommendAsync(tenantId, woId, 5);

        result.Should().BeEmpty(); // 唯一的技师不可用
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

- [ ] **Step 4: 运行测试确认编译失败**

Run: `dotnet build EquipAI.slnx`
Expected: 编译失败（SmartDispatchService 不存在）

- [ ] **Step 5: 实现 SmartDispatchService**

```csharp
// src/EquipAI.Application/WorkOrders/SmartDispatchService.cs
using System.Text.Json;
using EquipAI.Application.WorkOrders.DTOs;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders;

/// <summary>
/// 智能派工服务
/// 推荐算法：综合评分 = 技能匹配权重(0.6) × 技能分 + 负载权重(0.4) × 负载分
/// 技能分：技术人员 Skills 包含设备类型时为 1.0，否则为 0.3（基础分）
/// 负载分：1.0 - (ActiveWorkCount / MaxLoad)，MaxLoad 默认 10
/// </summary>
public class SmartDispatchService : ISmartDispatchService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SmartDispatchService> _logger;

    private const double SkillWeight = 0.6;
    private const double LoadWeight = 0.4;
    private const int MaxLoad = 10;

    public SmartDispatchService(IServiceScopeFactory scopeFactory, ILogger<SmartDispatchService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<List<DispatchRecommendationDto>> RecommendAsync(
        Guid tenantId, Guid workOrderId, int topN = 5, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 查询工单和设备信息
        var workOrder = await db.WorkOrders
            .Where(wo => wo.Id == workOrderId)
            .Select(wo => new { wo.Id, wo.DeviceId, wo.Title })
            .FirstOrDefaultAsync(ct);

        if (workOrder is null)
            throw new KeyNotFoundException($"工单不存在: {workOrderId}");

        // 查询设备类型
        var deviceType = await db.Devices
            .Where(d => d.Id == workOrder.DeviceId)
            .Select(d => d.Type)
            .FirstOrDefaultAsync(ct);

        // 查询所有可用技术人员
        var technicians = await db.TechnicianProfiles
            .Where(t => t.TenantId == tenantId && t.IsAvailable)
            .ToListAsync(ct);

        if (technicians.Count == 0)
        {
            _logger.LogWarning("租户 {TenantId} 无可用技术人员", tenantId);
            return [];
        }

        // 计算评分并排序
        var recommendations = technicians
            .Select(t =>
            {
                var skills = ParseSkills(t.Skills);
                var skillScore = skills.Contains(deviceType) ? 1.0 : 0.3;
                var loadScore = Math.Max(0, 1.0 - (double)t.ActiveWorkCount / MaxLoad);
                var totalScore = SkillWeight * skillScore + LoadWeight * loadScore;

                return new DispatchRecommendationDto
                {
                    TechnicianUserId = t.UserId,
                    Name = t.Name,
                    SkillScore = skillScore,
                    LoadScore = loadScore,
                    TotalScore = Math.Round(totalScore, 3),
                    ActiveWorkCount = t.ActiveWorkCount,
                    Reason = skills.Contains(deviceType)
                        ? $"擅长{deviceType}，当前负载 {t.ActiveWorkCount}/{MaxLoad}"
                        : $"通用技术人员，当前负载 {t.ActiveWorkCount}/{MaxLoad}"
                };
            })
            .OrderByDescending(r => r.TotalScore)
            .Take(topN)
            .ToList();

        _logger.LogInformation("工单 {WorkOrderId} 推荐了 {Count} 名技术人员（设备类型: {DeviceType}）",
            workOrderId, recommendations.Count, deviceType);

        return recommendations;
    }

    private static List<string> ParseSkills(string skillsJson)
    {
        try
        {
            return JsonSerializer.Deserialize<List<string>>(skillsJson) ?? [];
        }
        catch
        {
            return [];
        }
    }
}
```

- [ ] **Step 6: 运行测试**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "SmartDispatchServiceTests" --verbosity normal`
Expected: 3/3 通过

- [ ] **Step 7: 提交**

```bash
git add src/EquipAI.Core/Interfaces/ISmartDispatchService.cs src/EquipAI.Application/WorkOrders/SmartDispatchService.cs src/EquipAI.Application/WorkOrders/DTOs/DispatchRecommendationDto.cs tests/EquipAI.Tests.Unit/WorkOrders/SmartDispatchServiceTests.cs
git commit -m "feat: 智能派工服务 SmartDispatchService — 技能匹配 + 负载均衡"
```

---

### Task 3: SLA 时限追踪

**Files:**
- Create: `src/EquipAI.Application/WorkOrders/SlaTracker.cs`
- Create: `tests/EquipAI.Tests.Unit/WorkOrders/SlaTrackerTests.cs`

- [ ] **Step 1: 编写测试**

```csharp
// tests/EquipAI.Tests.Unit/WorkOrders/SlaTrackerTests.cs
using EquipAI.Application.WorkOrders;
using FluentAssertions;

namespace EquipAI.Tests.Unit.WorkOrders;

public class SlaTrackerTests
{
    [Fact]
    public void CalculateDueDate_Critical应为2小时()
    {
        var createdAt = new DateTime(2026, 6, 1, 8, 0, 0, DateTimeKind.Utc);
        var due = SlaTracker.CalculateDueDate("Critical", createdAt);
        due.Should().Be(createdAt.AddHours(2));
    }

    [Fact]
    public void CalculateDueDate_High应为8小时()
    {
        var createdAt = new DateTime(2026, 6, 1, 8, 0, 0, DateTimeKind.Utc);
        var due = SlaTracker.CalculateDueDate("High", createdAt);
        due.Should().Be(createdAt.AddHours(8));
    }

    [Fact]
    public void CalculateDueDate_Medium应为24小时()
    {
        var createdAt = DateTime.UtcNow;
        var due = SlaTracker.CalculateDueDate("Medium", createdAt);
        due.Should().Be(createdAt.AddHours(24));
    }

    [Fact]
    public void CalculateDueDate_Unknown默认应为24小时()
    {
        var createdAt = DateTime.UtcNow;
        var due = SlaTracker.CalculateDueDate("Unknown", createdAt);
        due.Should().Be(createdAt.AddHours(24));
    }

    [Fact]
    public void IsOverdue_超过DueDate应为true()
    {
        var dueDate = DateTime.UtcNow.AddHours(-1);
        SlaTracker.IsOverdue(dueDate).Should().BeTrue();
    }

    [Fact]
    public void IsOverdue_未到DueDate应为false()
    {
        var dueDate = DateTime.UtcNow.AddHours(5);
        SlaTracker.IsOverdue(dueDate).Should().BeFalse();
    }

    [Fact]
    public void GetRemainingText_超过应返回负数分钟()
    {
        var dueDate = DateTime.UtcNow.AddMinutes(-30);
        var text = SlaTracker.GetRemainingText(dueDate);
        text.Should().Contain("逾期");
    }
}
```

- [ ] **Step 2: 实现 SlaTracker**

```csharp
// src/EquipAI.Application/WorkOrders/SlaTracker.cs
namespace EquipAI.Application.WorkOrders;

/// <summary>
/// SLA 时限追踪器
/// 根据工单优先级计算响应时限，提供逾期检测和剩余时间展示
/// </summary>
public static class SlaTracker
{
    /// <summary>
    /// 各优先级对应的 SLA 响应时长（小时）
    /// </summary>
    private static readonly Dictionary<string, int> SlaHours = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Critical"] = 2,
        ["High"] = 8,
        ["Medium"] = 24,
        ["Low"] = 72
    };

    /// <summary>
    /// 根据优先级计算工单到期时间
    /// </summary>
    public static DateTime CalculateDueDate(string priority, DateTime createdAt)
    {
        var hours = SlaHours.GetValueOrDefault(priority, 24);
        return createdAt.AddHours(hours);
    }

    /// <summary>
    /// 判断工单是否已逾期
    /// </summary>
    public static bool IsOverdue(DateTime? dueDate)
    {
        return dueDate.HasValue && DateTime.UtcNow > dueDate.Value;
    }

    /// <summary>
    /// 获取剩余时间的中文文本描述
    /// </summary>
    public static string GetRemainingText(DateTime? dueDate)
    {
        if (!dueDate.HasValue) return "无期限";

        var remaining = dueDate.Value - DateTime.UtcNow;
        if (remaining.TotalMinutes <= 0)
        {
            return $"逾期 {Math.Abs((int)remaining.TotalHours)}h{Math.Abs(remaining.Minutes)}m";
        }

        if (remaining.TotalHours < 1)
            return $"剩余 {(int)remaining.TotalMinutes}m";

        return $"剩余 {(int)remaining.TotalHours}h{remaining.Minutes}m";
    }
}
```

- [ ] **Step 3: 运行测试**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "SlaTrackerTests" --verbosity normal`
Expected: 7/7 通过

- [ ] **Step 4: 提交**

```bash
git add src/EquipAI.Application/WorkOrders/SlaTracker.cs tests/EquipAI.Tests.Unit/WorkOrders/SlaTrackerTests.cs
git commit -m "feat: SLA 时限追踪器 SlaTracker"
```

---

### Task 4: 派工 API Controller

**Files:**
- Create: `src/EquipAI.WebAPI/Controllers/DispatchController.cs`
- Modify: `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs` — 注册 SmartDispatchService

- [ ] **Step 1: 创建 DispatchController**

```csharp
// src/EquipAI.WebAPI/Controllers/DispatchController.cs
using EquipAI.Application.WorkOrders.DTOs;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 智能派工 API
/// </summary>
[ApiController]
[Route("api/v1/dispatch")]
[Authorize]
public class DispatchController : ControllerBase
{
    private readonly ISmartDispatchService _dispatchService;
    private readonly AppDbContext _dbContext;

    public DispatchController(ISmartDispatchService dispatchService, AppDbContext dbContext)
    {
        _dispatchService = dispatchService;
        _dbContext = dbContext;
    }

    /// <summary>
    /// 为工单推荐技术人员
    /// </summary>
    [HttpGet("{workOrderId}/recommendations")]
    public async Task<ActionResult> GetRecommendations(Guid workOrderId, [FromQuery] int topN = 5)
    {
        var tenantId = Guid.Parse(User.FindFirst("tenant_id")?.Value ?? Guid.Empty.ToString());
        var recommendations = await _dispatchService.RecommendAsync(tenantId, workOrderId, topN, HttpContext.RequestAborted);
        return Ok(recommendations);
    }

    /// <summary>
    /// 获取技术人员列表
    /// </summary>
    [HttpGet("technicians")]
    public async Task<ActionResult> GetTechnicians([FromQuery] bool? availableOnly)
    {
        var query = _dbContext.TechnicianProfiles.AsQueryable();
        if (availableOnly == true)
            query = query.Where(t => t.IsAvailable);

        var technicians = await query
            .OrderBy(t => t.ActiveWorkCount)
            .Select(t => new
            {
                t.Id,
                t.UserId,
                t.Name,
                t.Skills,
                t.ActiveWorkCount,
                t.CompletedCount,
                t.AvgCompletionHours,
                t.IsAvailable
            })
            .ToListAsync();

        return Ok(technicians);
    }

    /// <summary>
    /// 创建或更新技术人员画像
    /// </summary>
    [HttpPut("technicians/{userId}")]
    public async Task<ActionResult> UpsertTechnician(Guid userId, [FromBody] UpsertTechnicianRequest request)
    {
        var tenantId = Guid.Parse(User.FindFirst("tenant_id")?.Value ?? Guid.Empty.ToString());

        var profile = await _dbContext.TechnicianProfiles
            .FirstOrDefaultAsync(t => t.TenantId == tenantId && t.UserId == userId);

        if (profile is null)
        {
            profile = new Core.Entities.TechnicianProfile
            {
                TenantId = tenantId,
                UserId = userId
            };
            _dbContext.TechnicianProfiles.Add(profile);
        }

        profile.Name = request.Name;
        profile.Skills = request.Skills;
        profile.IsAvailable = request.IsAvailable;

        await _dbContext.SaveChangesAsync();
        return Ok(new { profile.Id, profile.Name, profile.Skills });
    }
}

/// <summary>
/// 创建/更新技术人员请求
/// </summary>
public record UpsertTechnicianRequest
{
    public string Name { get; init; } = string.Empty;
    public string Skills { get; init; } = "[]";
    public bool IsAvailable { get; init; } = true;
}
```

- [ ] **Step 2: 注册 SmartDispatchService 到 DI**

在 `ServiceCollectionExtensions.cs` 的服务注册区域添加：
```csharp
services.AddScoped<ISmartDispatchService, SmartDispatchService>();
```
以及 `using EquipAI.Application.WorkOrders;` 和 `using EquipAI.Core.Interfaces;`

- [ ] **Step 3: 编译确认**

Run: `dotnet build EquipAI.slnx`
Expected: 编译成功

- [ ] **Step 4: 提交**

```bash
git add src/EquipAI.WebAPI/Controllers/DispatchController.cs src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs
git commit -m "feat: 智能派工 API — 推荐技术人员 + 技术人员管理"
```

---

### Task 5: 前端派工看板页面

**Files:**
- Create: `frontend/src/hooks/useDispatch.ts`
- Create: `frontend/src/pages/DispatchBoardPage.tsx`
- Modify: `frontend/src/App.tsx` — 添加路由
- Modify: `frontend/src/i18n/zh.json` and `en.json` — 添加翻译

- [ ] **Step 1: 创建 API hooks**

```typescript
// frontend/src/hooks/useDispatch.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface DispatchRecommendation {
  technicianUserId: string;
  name: string;
  skillScore: number;
  loadScore: number;
  totalScore: number;
  activeWorkCount: number;
  reason: string;
}

export interface TechnicianProfile {
  id: string;
  userId: string;
  name: string;
  skills: string[];
  activeWorkCount: number;
  completedCount: number;
  avgCompletionHours?: number;
  isAvailable: boolean;
}

/** 获取工单派工推荐 */
export function useDispatchRecommendations(workOrderId: string | undefined) {
  return useQuery({
    queryKey: ['dispatch-recommendations', workOrderId],
    queryFn: async () => {
      if (!workOrderId) return [];
      const { data } = await api.get(`/dispatch/${workOrderId}/recommendations`);
      return data as DispatchRecommendation[];
    },
    enabled: !!workOrderId,
  });
}

/** 获取技术人员列表 */
export function useTechnicians(availableOnly = true) {
  return useQuery({
    queryKey: ['technicians', availableOnly],
    queryFn: async () => {
      const { data } = await api.get(`/dispatch/technicians?availableOnly=${availableOnly}`);
      return data as TechnicianProfile[];
    },
  });
}

/** 快速派工（将推荐结果应用到工单） */
export function useAssignFromRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ workOrderId, technicianUserId }: { workOrderId: string; technicianUserId: string }) => {
      const { data } = await api.put(`/work-orders/${workOrderId}/assign`, {
        assignedTo: technicianUserId,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-orders'] });
      qc.invalidateQueries({ queryKey: ['dispatch-recommendations'] });
    },
  });
}
```

- [ ] **Step 2: 创建派工看板页面**

```tsx
// frontend/src/pages/DispatchBoardPage.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { useDispatchRecommendations, useAssignFromRecommendation } from '../hooks/useDispatch';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

export default function DispatchBoardPage() {
  const { t } = useTranslation();
  const [selectedWoId, setSelectedWoId] = useState<string>();
  const { data: workOrdersData } = useWorkOrders({ status: 'PendingDispatch', page: 1, pageSize: 20 });
  const { data: recommendations } = useDispatchRecommendations(selectedWoId);
  const assignMutation = useAssignFromRecommendation();

  const pendingOrders = workOrdersData?.items ?? [];

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">{t('dispatch.title', '智能派工看板')}</h1>

      <div className="grid grid-cols-2 gap-6">
        {/* 左侧：待派工工单列表 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t('dispatch.pendingOrders', '待派工工单')}</h2>
          {pendingOrders.map((wo) => (
            <Card
              key={wo.id}
              className={`cursor-pointer transition-colors ${selectedWoId === wo.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedWoId(wo.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{wo.title}</p>
                    <p className="text-sm text-muted-foreground">{wo.workOrderCode}</p>
                  </div>
                  <Badge variant={wo.priority === 'Critical' ? 'destructive' : wo.priority === 'High' ? 'default' : 'secondary'}>
                    {wo.priority}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {pendingOrders.length === 0 && (
            <p className="text-center text-muted-foreground py-8">{t('dispatch.noPending', '暂无待派工工单')}</p>
          )}
        </div>

        {/* 右侧：推荐技术人员 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t('dispatch.recommendations', '推荐技术人员')}</h2>
          {!selectedWoId ? (
            <p className="text-center text-muted-foreground py-8">{t('dispatch.selectOrder', '请先选择工单')}</p>
          ) : !recommendations?.length ? (
            <p className="text-center text-muted-foreground py-8">{t('dispatch.noTechnicians', '无可用技术人员')}</p>
          ) : (
            recommendations.map((rec, idx) => (
              <Card key={rec.technicianUserId}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-muted-foreground">#{idx + 1}</span>
                      <span className="font-medium">{rec.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold">{(rec.totalScore * 100).toFixed(0)}%</span>
                      <span className="text-xs text-muted-foreground ml-1">{t('dispatch.match', '匹配')}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>{t('dispatch.skillScore', '技能')}：{(rec.skillScore * 100).toFixed(0)}%</div>
                    <div>{t('dispatch.loadScore', '空闲')}：{(rec.loadScore * 100).toFixed(0)}%</div>
                    <div>{t('dispatch.activeWork', '进行中')}：{rec.activeWorkCount}</div>
                  </div>
                  <p className="text-xs text-muted-foreground">{rec.reason}</p>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => assignMutation.mutate({
                      workOrderId: selectedWoId,
                      technicianUserId: rec.technicianUserId,
                    })}
                    disabled={assignMutation.isPending}
                  >
                    {t('dispatch.assign', '派工')}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 添加路由**

在 `App.tsx` 路由配置中添加：
```tsx
{ path: '/dispatch', element: <DispatchBoardPage /> }
```

- [ ] **Step 4: 添加 i18n 翻译键**

在 `zh.json` 添加 `dispatch.*` 翻译键，在 `en.json` 添加对应英文翻译。

- [ ] **Step 5: 编译确认**

Run: `cd frontend && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 6: 提交**

```bash
git add frontend/src/hooks/useDispatch.ts frontend/src/pages/DispatchBoardPage.tsx frontend/src/App.tsx frontend/src/i18n/
git commit -m "feat: 前端智能派工看板 — 工单选择 + 技术人员推荐 + 一键派工"
```
