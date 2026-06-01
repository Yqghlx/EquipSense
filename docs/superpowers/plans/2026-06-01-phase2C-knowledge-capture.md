# Phase 2C：知识沉淀闭环 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现知识沉淀闭环：工单关闭时自动生成故障案例；高置信度分析结果自动生成候选规则（pending_rules）；前端提供专家验证界面，批准后移入正式规则库（knowledge_rules）。

**Architecture:** 新增 3 个实体（KnowledgeRule、PendingRule、FaultCase）+ EF 配置 + 数据库迁移。`KnowledgeCaptureService` 监听 `WorkOrderStatusChangedEvent`（状态变为 Closed），创建故障案例并通过 LLM 生成候选规则。`KnowledgeController` 提供 7 个 API 端点。前端知识库管理页面支持浏览、审核候选规则。

**Tech Stack:** .NET 8、EF Core 8、ILLMService（已有）、React 19、TanStack Query、shadcn/ui

---

## 前置：WorkOrder 实体扩展

现有 `WorkOrder` 实体缺少知识沉淀所需的字段，需要添加：
- `ActualHours`（double?）— 实际维修时长
- `ExecutionReport`（string?）— 维修报告
- `RequiredParts`（string?）— 使用零件（JSON 数组）

---

## 文件结构

```
# 后端
src/EquipAI.Core/
├── Entities/
│   ├── KnowledgeRule.cs                -- 正式知识规则
│   ├── PendingRule.cs                  -- 候选规则（待专家验证）
│   └── FaultCase.cs                    -- 故障案例
├── Enums/
│   └── ReviewStatus.cs                -- 审核状态枚举
├── Events/
│   └── WorkOrderStatusChangedEvent.cs -- 已存在，可能需要扩展

src/EquipAI.Infrastructure/Data/
├── Configurations/
│   ├── KnowledgeRuleConfiguration.cs
│   ├── PendingRuleConfiguration.cs
│   └── FaultCaseConfiguration.cs
└── AppDbContext.cs                     -- 添加 DbSet

src/EquipAI.Application/
├── Knowledge/
│   ├── KnowledgeCaptureService.cs      -- 知识沉淀服务（事件处理器）
│   ├── IKnowledgeRepository.cs         -- 仓储接口
│   └── KnowledgeRepository.cs          -- 仓储实现
└── WorkOrders/Handlers/
    └── WorkOrderStatusChangedHandler.cs -- 已有，添加知识沉淀订阅

src/EquipAI.WebAPI/Controllers/
│   └── KnowledgeController.cs          -- 知识库 API（7 个端点）

# 前端
frontend/src/
├── pages/
│   ├── KnowledgePage.tsx               -- 知识库管理主页面
│   └── PendingRulesPage.tsx            -- 候选规则审核页面
├── hooks/
│   └── useKnowledge.ts                 -- 知识库 API hooks
└── types/
    └── index.ts                        -- 添加知识库类型

# 测试
tests/EquipAI.Tests.Unit/Knowledge/
│   └── KnowledgeCaptureServiceTests.cs
tests/EquipAI.Tests.Integration/Controllers/
│   └── KnowledgeControllerTests.cs
```

---

### Task 1: 扩展 WorkOrder 实体 + ReviewStatus 枚举

**Files:**
- Modify: `src/EquipAI.Core/Entities/WorkOrder.cs` — 添加 ActualHours、ExecutionReport、RequiredParts
- Create: `src/EquipAI.Core/Enums/ReviewStatus.cs`
- Modify: `src/EquipAI.Infrastructure/Data/Configurations/WorkOrderConfiguration.cs` — 添加列映射

- [ ] **Step 1: 在 WorkOrder 实体中添加字段**

在 `src/EquipAI.Core/Entities/WorkOrder.cs` 中添加：

```csharp
/// <summary>实际维修时长（小时）</summary>
public double? ActualHours { get; set; }

/// <summary>维修执行报告</summary>
public string? ExecutionReport { get; set; }

/// <summary>使用零件（JSON 数组字符串）</summary>
public string? RequiredParts { get; set; }
```

- [ ] **Step 2: 创建 ReviewStatus 枚举**

```csharp
// src/EquipAI.Core/Enums/ReviewStatus.cs
namespace EquipAI.Core.Enums;

/// <summary>
/// 候选规则审核状态
/// </summary>
public enum ReviewStatus
{
    /// <summary>待审核</summary>
    Pending,
    /// <summary>已批准</summary>
    Approved,
    /// <summary>已驳回</summary>
    Rejected
}
```

- [ ] **Step 3: 编译确认**

Run: `dotnet build src/EquipAI.Core`
Expected: 编译成功

- [ ] **Step 4: 提交**

```bash
git add src/EquipAI.Core/Entities/WorkOrder.cs src/EquipAI.Core/Enums/ReviewStatus.cs src/EquipAI.Infrastructure/Data/Configurations/
git commit -m "feat: 扩展 WorkOrder 实体 + 添加 ReviewStatus 枚举"
```

---

### Task 2: 知识库实体 + EF 配置

**Files:**
- Create: `src/EquipAI.Core/Entities/KnowledgeRule.cs`
- Create: `src/EquipAI.Core/Entities/PendingRule.cs`
- Create: `src/EquipAI.Core/Entities/FaultCase.cs`
- Create: `src/EquipAI.Infrastructure/Data/Configurations/KnowledgeRuleConfiguration.cs`
- Create: `src/EquipAI.Infrastructure/Data/Configurations/PendingRuleConfiguration.cs`
- Create: `src/EquipAI.Infrastructure/Data/Configurations/FaultCaseConfiguration.cs`
- Modify: `src/EquipAI.Infrastructure/Data/AppDbContext.cs` — 添加 DbSet

- [ ] **Step 1: 创建 KnowledgeRule 实体**

```csharp
// src/EquipAI.Core/Entities/KnowledgeRule.cs
namespace EquipAI.Core.Entities;

/// <summary>
/// 正式知识规则（专家验证后的规则）
/// 行业共享规则归属系统租户，所有租户可见
/// </summary>
public class KnowledgeRule : BaseEntity
{
    /// <summary>所属租户</summary>
    public Guid TenantId { get; set; }

    /// <summary>设备类型</summary>
    public string DeviceType { get; set; } = string.Empty;

    /// <summary>规则名称</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>触发条件（JSONB）</summary>
    public string Conditions { get; set; } = string.Empty;

    /// <summary>诊断结论（JSONB）</summary>
    public string Conclusion { get; set; } = string.Empty;

    /// <summary>建议操作</summary>
    public string? RecommendedActions { get; set; }

    /// <summary>排查步骤</summary>
    public string? CheckSteps { get; set; }

    /// <summary>置信度权重（0-1）</summary>
    public decimal ConfidenceWeight { get; set; } = 0.5m;

    /// <summary>来源（imported/auto_generated/manual）</summary>
    public string Source { get; set; } = "imported";

    /// <summary>准确率</summary>
    public decimal? AccuracyRate { get; set; }

    /// <summary>成功应用次数</summary>
    public int SuccessCount { get; set; }

    /// <summary>是否启用</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>创建人</summary>
    public string? CreatedBy { get; set; }
}
```

- [ ] **Step 2: 创建 PendingRule 实体**

```csharp
// src/EquipAI.Core/Entities/PendingRule.cs
using EquipAI.Core.Enums;

namespace EquipAI.Core.Entities;

/// <summary>
/// 候选规则（AI 自动生成，专家验证前不进入正式规则库）
/// </summary>
public class PendingRule : BaseEntity
{
    /// <summary>所属租户</summary>
    public Guid TenantId { get; set; }

    /// <summary>设备类型</summary>
    public string DeviceType { get; set; } = string.Empty;

    /// <summary>规则名称</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>触发条件（JSONB）</summary>
    public string Conditions { get; set; } = string.Empty;

    /// <summary>诊断结论（JSONB）</summary>
    public string Conclusion { get; set; } = string.Empty;

    /// <summary>建议操作</summary>
    public string? RecommendedActions { get; set; }

    /// <summary>排查步骤</summary>
    public string? CheckSteps { get; set; }

    /// <summary>来源工单 ID</summary>
    public Guid? SourceWorkorderId { get; set; }

    /// <summary>来源案例 ID</summary>
    public Guid? SourceCaseId { get; set; }

    /// <summary>置信度</summary>
    public decimal? Confidence { get; set; }

    /// <summary>审核状态</summary>
    public ReviewStatus ReviewStatus { get; set; } = ReviewStatus.Pending;

    /// <summary>审核人</summary>
    public Guid? ReviewedBy { get; set; }

    /// <summary>审核意见</summary>
    public string? ReviewComment { get; set; }

    /// <summary>审核时间</summary>
    public DateTime? ReviewedAt { get; set; }
}
```

- [ ] **Step 3: 创建 FaultCase 实体**

```csharp
// src/EquipAI.Core/Entities/FaultCase.cs
namespace EquipAI.Core.Entities;

/// <summary>
/// 故障案例库
/// </summary>
public class FaultCase : BaseEntity
{
    /// <summary>所属租户</summary>
    public Guid TenantId { get; set; }

    /// <summary>关联设备</summary>
    public Guid? DeviceId { get; set; }

    /// <summary>设备类型</summary>
    public string DeviceType { get; set; } = string.Empty;

    /// <summary>故障发生时间</summary>
    public DateTime? FaultOccurredAt { get; set; }

    /// <summary>故障描述</summary>
    public string FaultDescription { get; set; } = string.Empty;

    /// <summary>故障现象列表（JSON 数组）</summary>
    public string? Symptoms { get; set; }

    /// <summary>根因</summary>
    public string RootCause { get; set; } = string.Empty;

    /// <summary>解决方案</summary>
    public string Solution { get; set; } = string.Empty;

    /// <summary>维修时长（分钟）</summary>
    public int? RepairDurationMinutes { get; set; }

    /// <summary>使用零件（JSON 数组）</summary>
    public string? PartsUsed { get; set; }

    /// <summary>故障数据快照（JSONB）</summary>
    public string? FaultData { get; set; }

    /// <summary>操作人</summary>
    public string? Operator { get; set; }

    /// <summary>是否已验证</summary>
    public bool IsVerified { get; set; }

    /// <summary>验证人</summary>
    public Guid? VerifiedBy { get; set; }

    /// <summary>来源工单 ID</summary>
    public Guid? SourceWorkorderId { get; set; }

    /// <summary>标签（JSON 数组）</summary>
    public string? Tags { get; set; }
}
```

- [ ] **Step 4: 创建 EF 配置**

```csharp
// src/EquipAI.Infrastructure/Data/Configurations/KnowledgeRuleConfiguration.cs
using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

public class KnowledgeRuleConfiguration : IEntityTypeConfiguration<KnowledgeRule>
{
    public void Configure(EntityTypeBuilder<KnowledgeRule> builder)
    {
        builder.ToTable("knowledge_rules");
        builder.Property(e => e.Conditions).HasColumnType("jsonb");
        builder.Property(e => e.Conclusion).HasColumnType("jsonb");
        builder.HasIndex(e => new { e.TenantId, e.DeviceType });
        builder.HasIndex(e => new { e.TenantId, e.Enabled });
    }
}
```

```csharp
// src/EquipAI.Infrastructure/Data/Configurations/PendingRuleConfiguration.cs
using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

public class PendingRuleConfiguration : IEntityTypeConfiguration<PendingRule>
{
    public void Configure(EntityTypeBuilder<PendingRule> builder)
    {
        builder.ToTable("pending_rules");
        builder.Property(e => e.Conditions).HasColumnType("jsonb");
        builder.Property(e => e.Conclusion).HasColumnType("jsonb");
        builder.HasIndex(e => new { e.TenantId, e.ReviewStatus });
        builder.HasIndex(e => new { e.TenantId, e.DeviceType });
    }
}
```

```csharp
// src/EquipAI.Infrastructure/Data/Configurations/FaultCaseConfiguration.cs
using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

public class FaultCaseConfiguration : IEntityTypeConfiguration<FaultCase>
{
    public void Configure(EntityTypeBuilder<FaultCase> builder)
    {
        builder.ToTable("fault_cases");
        builder.Property(e => e.FaultData).HasColumnType("jsonb");
        builder.HasIndex(e => new { e.TenantId, e.DeviceType });
        builder.HasIndex(e => new { e.TenantId, e.SourceWorkorderId });
    }
}
```

- [ ] **Step 5: 在 AppDbContext 中添加 DbSet**

在 `src/EquipAI.Infrastructure/Data/AppDbContext.cs` 中添加：

```csharp
public DbSet<KnowledgeRule> KnowledgeRules { get; set; }
public DbSet<PendingRule> PendingRules { get; set; }
public DbSet<FaultCase> FaultCases { get; set; }
```

- [ ] **Step 6: 编译确认**

Run: `dotnet build`
Expected: 编译成功

- [ ] **Step 7: 提交**

```bash
git add src/EquipAI.Core/Entities/KnowledgeRule.cs src/EquipAI.Core/Entities/PendingRule.cs src/EquipAI.Core/Entities/FaultCase.cs src/EquipAI.Infrastructure/Data/
git commit -m "feat: 知识库实体 + EF 配置（knowledge_rules、pending_rules、fault_cases）"
```

---

### Task 3: 知识沉淀服务（事件处理器）

**Files:**
- Create: `src/EquipAI.Application/Knowledge/KnowledgeCaptureService.cs`
- Create: `tests/EquipAI.Tests.Unit/Knowledge/KnowledgeCaptureServiceTests.cs`

- [ ] **Step 1: 编写测试**

```csharp
// tests/EquipAI.Tests.Unit/Knowledge/KnowledgeCaptureServiceTests.cs
using EquipAI.Application.Knowledge;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace EquipAI.Tests.Unit.Knowledge;

public class KnowledgeCaptureServiceTests : IAsyncDisposable
{
    private readonly ServiceProvider _sp;
    private readonly string _dbName;
    private readonly Mock<ILLMService> _llmMock;

    public KnowledgeCaptureServiceTests()
    {
        _dbName = $"KnowledgeTest_{Guid.NewGuid()}";
        _llmMock = new Mock<ILLMService>();

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(_dbName));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(Guid.NewGuid()));
        services.AddLogging();
        services.AddSingleton(_llmMock.Object);
        _sp = services.BuildServiceProvider();
    }

    [Fact]
    public async Task ProcessWorkOrderClosedAsync_应创建故障案例()
    {
        // 安排：创建工单和分析
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();
        var deviceId = Guid.NewGuid();
        var workOrderId = Guid.NewGuid();

        db.Devices.Add(new Device { Id = deviceId, TenantId = tenantId, DeviceCode = "DEV-001", Name = "1号电机", Type = "电机" });
        db.WorkOrders.Add(new WorkOrder
        {
            Id = workOrderId, TenantId = tenantId, DeviceId = deviceId,
            WorkOrderCode = "WO-20260601-0001", Title = "温度异常",
            RootCause = "温度传感器故障", Resolution = "更换传感器",
            ActualHours = 2.0, ExecutionReport = "检查接线并更换温度传感器",
            RequiredParts = """["温度传感器"]""",
            Status = WorkOrderStatus.Closed
        });
        await db.SaveChangesAsync();

        var service = new KnowledgeCaptureService(
            _sp.GetRequiredService<IServiceScopeFactory>(),
            _llmMock.Object,
            _sp.GetRequiredService<ILogger<KnowledgeCaptureService>>());

        // 执行
        await service.ProcessWorkOrderClosedAsync(tenantId, workOrderId, CancellationToken.None);

        // 验证：故障案例已创建
        var cases = await db.FaultCases.Where(f => f.SourceWorkorderId == workOrderId).ToListAsync();
        cases.Should().ContainSingle();
        cases[0].RootCause.Should().Be("温度传感器故障");
        cases[0].Solution.Should().Be("检查接线并更换温度传感器");
        cases[0].RepairDurationMinutes.Should().Be(120);
    }

    [Fact]
    public async Task ProcessWorkOrderClosedAsync_工单时长不足应跳过()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();
        var workOrderId = Guid.NewGuid();

        db.WorkOrders.Add(new WorkOrder
        {
            Id = workOrderId, TenantId = tenantId, DeviceId = Guid.NewGuid(),
            WorkOrderCode = "WO-TEST-002", ActualHours = 0.1, // 不足 0.5 小时
            Status = WorkOrderStatus.Closed
        });
        await db.SaveChangesAsync();

        var service = new KnowledgeCaptureService(
            _sp.GetRequiredService<IServiceScopeFactory>(),
            _llmMock.Object,
            _sp.GetRequiredService<ILogger<KnowledgeCaptureService>>());

        await service.ProcessWorkOrderClosedAsync(tenantId, workOrderId, CancellationToken.None);

        var cases = await db.FaultCases.IgnoreQueryFilters().ToListAsync();
        cases.Should().BeEmpty("工单时长不足 0.5 小时应跳过");
    }

    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }

    public async ValueTask DisposeAsync()
    {
        await _sp.DisposeAsync();
    }
}
```

- [ ] **Step 2: 运行测试确认编译失败**

- [ ] **Step 3: 实现 KnowledgeCaptureService**

```csharp
// src/EquipAI.Application/Knowledge/KnowledgeCaptureService.cs
using System.Text.Json;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Knowledge;

/// <summary>
/// 知识沉淀服务
/// 工单关闭时自动生成故障案例，高置信度时通过 LLM 生成候选规则
/// </summary>
public class KnowledgeCaptureService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILLMService _llmService;
    private readonly ILogger<KnowledgeCaptureService> _logger;

    /// <summary>最低工单时长（小时），低于此值不生成案例</summary>
    private const double MinHoursForCapture = 0.5;

    /// <summary>自动生成候选规则的置信度阈值</summary>
    private const double ConfidenceThreshold = 0.8;

    public KnowledgeCaptureService(
        IServiceScopeFactory scopeFactory,
        ILLMService llmService,
        ILogger<KnowledgeCaptureService> logger)
    {
        _scopeFactory = scopeFactory;
        _llmService = llmService;
        _logger = logger;
    }

    /// <summary>
    /// 处理工单关闭事件：生成故障案例 + 候选规则
    /// </summary>
    public async Task ProcessWorkOrderClosedAsync(
        Guid tenantId, Guid workOrderId, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var wo = await db.WorkOrders
            .Include(wo => wo.Device)
            .FirstOrDefaultAsync(wo => wo.Id == workOrderId, ct);

        if (wo is null)
        {
            _logger.LogWarning("工单不存在: {WorkOrderId}", workOrderId);
            return;
        }

        // 过滤：时长不足或无执行报告
        if ((wo.ActualHours ?? 0) < MinHoursForCapture)
        {
            _logger.LogDebug("工单时长不足，跳过知识沉淀: {WorkOrderId}, {Hours}h", workOrderId, wo.ActualHours);
            return;
        }

        // 1. 创建故障案例
        var faultCase = new FaultCase
        {
            TenantId = tenantId,
            DeviceId = wo.DeviceId,
            DeviceType = wo.Device?.Type ?? "未知",
            FaultOccurredAt = wo.CreatedAt,
            FaultDescription = wo.Title,
            RootCause = wo.RootCause ?? "未记录",
            Solution = wo.ExecutionReport ?? wo.Resolution ?? "未记录",
            RepairDurationMinutes = (int?)((wo.ActualHours ?? 0) * 60),
            PartsUsed = wo.RequiredParts,
            SourceWorkorderId = wo.Id,
            IsVerified = false
        };

        db.FaultCases.Add(faultCase);

        // 2. 查询关联的分析结果
        Analysis? analysis = null;
        if (wo.AnalysisId.HasValue)
        {
            analysis = await db.Analyses.FindAsync([wo.AnalysisId.Value], ct);
        }

        // 3. 高置信度 → 尝试生成候选规则
        if (analysis?.Confidence >= ConfidenceThreshold)
        {
            _logger.LogInformation("分析置信度 {Confidence} >= {Threshold}，生成候选规则",
                analysis.Confidence, ConfidenceThreshold);

            await TryGenerateRuleAsync(db, wo, analysis, faultCase.Id, ct);
        }

        await db.SaveChangesAsync(ct);
        _logger.LogInformation("知识沉淀完成: WorkOrderId={WorkOrderId}, CaseId={CaseId}",
            workOrderId, faultCase.Id);
    }

    /// <summary>
    /// 通过 LLM 从工单中提炼诊断规则
    /// </summary>
    private async Task TryGenerateRuleAsync(
        AppDbContext db, WorkOrder wo, Analysis analysis, Guid caseId, CancellationToken ct)
    {
        var prompt = $"""
            从以下维修工单中提炼一条故障诊断规则：

            故障现象：{wo.Title}
            根因分析：{wo.RootCause}
            处理措施：{wo.ExecutionReport ?? wo.Resolution}
            设备类型：{wo.Device?.Type}

            请输出 JSON 格式：
            {{
              "conditions": [{{"metric": "指标名", "operator": ">", "threshold": 阈值}}],
              "conclusion": "诊断结论",
              "recommendedActions": ["操作1", "操作2"],
              "checkSteps": ["步骤1", "步骤2"]
            }}
            """;

        var response = await _llmService.AnalyzeAsync(
            new LLMRequest("你是工业设备故障诊断专家。请从工单中提炼可复用的诊断规则。", prompt), ct);

        if (!response.Success)
        {
            _logger.LogWarning("LLM 规则生成失败: {Error}", response.ErrorMessage);
            return;
        }

        string conditions;
        string conclusion;
        string? recommendedActions = null;
        string? checkSteps = null;

        try
        {
            var json = JsonDocument.Parse(response.Content);
            var root = json.RootElement;
            conditions = root.TryGetProperty("conditions", out var c) ? c.GetRawText() : "[]";
            conclusion = root.TryGetProperty("conclusion", out var cl) ? cl.GetString() ?? "" : "";
            recommendedActions = root.TryGetProperty("recommendedActions", out var ra) ? ra.GetRawText() : null;
            checkSteps = root.TryGetProperty("checkSteps", out var cs) ? cs.GetRawText() : null;
        }
        catch
        {
            _logger.LogWarning("LLM 响应 JSON 解析失败，跳过规则生成");
            return;
        }

        var pendingRule = new PendingRule
        {
            TenantId = wo.TenantId,
            DeviceType = wo.Device?.Type ?? "未知",
            Name = $"自动生成-{wo.Device?.Type}-{DateTime.UtcNow:yyyyMMdd}",
            Conditions = conditions,
            Conclusion = conclusion,
            RecommendedActions = recommendedActions,
            CheckSteps = checkSteps,
            SourceWorkorderId = wo.Id,
            SourceCaseId = caseId,
            Confidence = analysis.Confidence.HasValue ? (decimal)analysis.Confidence.Value : null,
            ReviewStatus = ReviewStatus.Pending
        };

        db.PendingRules.Add(pendingRule);
    }

    /// <summary>
    /// 批准候选规则：移入正式规则库
    /// </summary>
    public async Task ApproveRuleAsync(Guid pendingRuleId, Guid reviewerId, string? comment, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var pending = await db.PendingRules.FindAsync([pendingRuleId], ct);
        if (pending is null)
            throw new KeyNotFoundException($"候选规则不存在: {pendingRuleId}");

        if (pending.ReviewStatus != ReviewStatus.Pending)
            throw new InvalidOperationException($"规则已审核: {pending.ReviewStatus}");

        // 移入正式规则库
        var rule = new KnowledgeRule
        {
            TenantId = pending.TenantId,
            DeviceType = pending.DeviceType,
            Name = pending.Name,
            Conditions = pending.Conditions,
            Conclusion = pending.Conclusion,
            RecommendedActions = pending.RecommendedActions,
            CheckSteps = pending.CheckSteps,
            Source = "auto_generated",
            CreatedBy = $"AI (专家验证: {reviewerId})"
        };

        db.KnowledgeRules.Add(rule);

        // 更新候选规则状态
        pending.ReviewStatus = ReviewStatus.Approved;
        pending.ReviewedBy = reviewerId;
        pending.ReviewComment = comment;
        pending.ReviewedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        _logger.LogInformation("候选规则已批准: {PendingRuleId} → KnowledgeRule {RuleId}", pendingRuleId, rule.Id);
    }

    /// <summary>
    /// 驳回候选规则
    /// </summary>
    public async Task RejectRuleAsync(Guid pendingRuleId, Guid reviewerId, string? comment, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var pending = await db.PendingRules.FindAsync([pendingRuleId], ct);
        if (pending is null)
            throw new KeyNotFoundException($"候选规则不存在: {pendingRuleId}");

        pending.ReviewStatus = ReviewStatus.Rejected;
        pending.ReviewedBy = reviewerId;
        pending.ReviewComment = comment;
        pending.ReviewedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        _logger.LogInformation("候选规则已驳回: {PendingRuleId}", pendingRuleId);
    }
}
```

- [ ] **Step 4: 运行测试**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "KnowledgeCaptureServiceTests" --verbosity normal`
Expected: 2/2 通过

- [ ] **Step 5: 提交**

```bash
git add src/EquipAI.Application/Knowledge/ tests/EquipAI.Tests.Unit/Knowledge/
git commit -m "feat: 知识沉淀服务 KnowledgeCaptureService — 故障案例 + 候选规则生成"
```

---

### Task 4: 事件订阅 — 工单关闭触发知识沉淀

**Files:**
- Create: `src/EquipAI.Application/Knowledge/KnowledgeCaptureHandler.cs`
- Modify: `src/EquipAI.WebAPI/Program.cs` — 注册 KnowledgeCaptureService + 订阅事件

- [ ] **Step 1: 创建事件处理器**

```csharp
// src/EquipAI.Application/Knowledge/KnowledgeCaptureHandler.cs
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Knowledge;

/// <summary>
/// 工单状态变更事件处理器
/// 当工单状态变为 Closed 时触发知识沉淀
/// </summary>
public class KnowledgeCaptureHandler : IEventHandler<WorkOrderStatusChangedEvent>
{
    private readonly KnowledgeCaptureService _captureService;
    private readonly ILogger<KnowledgeCaptureHandler> _logger;

    public KnowledgeCaptureHandler(
        KnowledgeCaptureService captureService,
        ILogger<KnowledgeCaptureHandler> logger)
    {
        _captureService = captureService;
        _logger = logger;
    }

    public async Task HandleAsync(WorkOrderStatusChangedEvent @event, CancellationToken ct)
    {
        // 仅在工单关闭时触发知识沉淀
        if (@event.NewStatus != "Closed")
            return;

        _logger.LogInformation("工单关闭，触发知识沉淀: WorkOrderId={WorkOrderId}", @event.WorkOrderId);

        try
        {
            await _captureService.ProcessWorkOrderClosedAsync(
                @event.TenantId, @event.WorkOrderId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "知识沉淀处理失败: WorkOrderId={WorkOrderId}", @event.WorkOrderId);
        }
    }
}
```

- [ ] **Step 2: 在 Program.cs 中注册和订阅**

在 `src/EquipAI.WebAPI/Program.cs` 中添加：

```csharp
// 注册知识沉淀服务
services.AddScoped<KnowledgeCaptureService>();

// 事件订阅（添加到已有的订阅列表中）
eventBus.Subscribe<WorkOrderStatusChangedEvent, KnowledgeCaptureHandler>();
```

- [ ] **Step 3: 编译确认**

Run: `dotnet build`
Expected: 编译成功

- [ ] **Step 4: 提交**

```bash
git add src/EquipAI.Application/Knowledge/KnowledgeCaptureHandler.cs src/EquipAI.WebAPI/Program.cs
git commit -m "feat: 工单关闭事件订阅 — 自动触发知识沉淀"
```

---

### Task 5: 知识库 API Controller

**Files:**
- Create: `src/EquipAI.WebAPI/Controllers/KnowledgeController.cs`
- Create: `tests/EquipAI.Tests.Integration/Controllers/KnowledgeControllerTests.cs`

- [ ] **Step 1: 创建 Controller**

```csharp
// src/EquipAI.WebAPI/Controllers/KnowledgeController.cs
using EquipAI.Application.Knowledge;
using EquipAI.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 知识库管理 API
/// </summary>
[ApiController]
[Route("api/v1/knowledge")]
[Authorize]
public class KnowledgeController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly KnowledgeCaptureService _captureService;

    public KnowledgeController(AppDbContext dbContext, KnowledgeCaptureService captureService)
    {
        _dbContext = dbContext;
        _captureService = captureService;
    }

    /// <summary>获取正式规则列表</summary>
    [HttpGet("rules")]
    public async Task<ActionResult> GetRules(
        [FromQuery] string? deviceType, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _dbContext.KnowledgeRules.AsQueryable();
        if (!string.IsNullOrEmpty(deviceType))
            query = query.Where(r => r.DeviceType == deviceType);

        var total = await query.CountAsync();
        var rules = await query
            .OrderByDescending(r => r.SuccessCount)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { total, data = rules });
    }

    /// <summary>手动创建正式规则</summary>
    [HttpPost("rules")]
    public async Task<ActionResult> CreateRule([FromBody] CreateRuleRequest request)
    {
        var rule = new Core.Entities.KnowledgeRule
        {
            TenantId = request.TenantId,
            DeviceType = request.DeviceType,
            Name = request.Name,
            Conditions = request.Conditions,
            Conclusion = request.Conclusion,
            RecommendedActions = request.RecommendedActions,
            CheckSteps = request.CheckSteps,
            Source = "manual",
            CreatedBy = User.Identity?.Name
        };

        _dbContext.KnowledgeRules.Add(rule);
        await _dbContext.SaveChangesAsync();

        return Created($"/api/v1/knowledge/rules/{rule.Id}", rule);
    }

    /// <summary>获取候选规则列表</summary>
    [HttpGet("pending-rules")]
    public async Task<ActionResult> GetPendingRules(
        [FromQuery] string? reviewStatus, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _dbContext.PendingRules.AsQueryable();
        if (!string.IsNullOrEmpty(reviewStatus))
            query = query.Where(r => r.ReviewStatus.ToString() == reviewStatus);

        var total = await query.CountAsync();
        var rules = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { total, data = rules });
    }

    /// <summary>批准候选规则</summary>
    [HttpPut("pending-rules/{id}/approve")]
    public async Task<ActionResult> ApproveRule(Guid id, [FromBody] ReviewRequest request)
    {
        var reviewerId = Guid.Parse(User.FindFirst("sub")?.Value ?? Guid.Empty.ToString());
        await _captureService.ApproveRuleAsync(id, reviewerId, request.Comment, HttpContext.RequestAborted);
        return Ok(new { message = "规则已批准" });
    }

    /// <summary>驳回候选规则</summary>
    [HttpPut("pending-rules/{id}/reject")]
    public async Task<ActionResult> RejectRule(Guid id, [FromBody] ReviewRequest request)
    {
        var reviewerId = Guid.Parse(User.FindFirst("sub")?.Value ?? Guid.Empty.ToString());
        await _captureService.RejectRuleAsync(id, reviewerId, request.Comment, HttpContext.RequestAborted);
        return Ok(new { message = "规则已驳回" });
    }

    /// <summary>获取故障案例列表</summary>
    [HttpGet("cases")]
    public async Task<ActionResult> GetCases(
        [FromQuery] string? deviceType, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _dbContext.FaultCases.AsQueryable();
        if (!string.IsNullOrEmpty(deviceType))
            query = query.Where(c => c.DeviceType == deviceType);

        var total = await query.CountAsync();
        var cases = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { total, data = cases });
    }

    /// <summary>导入行业知识库</summary>
    [HttpPost("import")]
    public async Task<ActionResult> ImportRules([FromBody] List<CreateRuleRequest> rules)
    {
        foreach (var r in rules)
        {
            _dbContext.KnowledgeRules.Add(new Core.Entities.KnowledgeRule
            {
                TenantId = r.TenantId,
                DeviceType = r.DeviceType,
                Name = r.Name,
                Conditions = r.Conditions,
                Conclusion = r.Conclusion,
                RecommendedActions = r.RecommendedActions,
                CheckSteps = r.CheckSteps,
                Source = "imported"
            });
        }

        await _dbContext.SaveChangesAsync();
        return Ok(new { imported = rules.Count });
    }
}

public record CreateRuleRequest
{
    public Guid TenantId { get; init; }
    public string DeviceType { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string Conditions { get; init; } = string.Empty;
    public string Conclusion { get; init; } = string.Empty;
    public string? RecommendedActions { get; init; }
    public string? CheckSteps { get; init; }
}

public record ReviewRequest
{
    public string? Comment { get; init; }
}
```

- [ ] **Step 2: 编写集成测试**

```csharp
// tests/EquipAI.Tests.Integration/Controllers/KnowledgeControllerTests.cs
using FluentAssertions;
using System.Net;
using System.Net.Http.Json;

namespace EquipAI.Tests.Integration.Controllers;

[Collection(SharedTestCollection.Name)]
public class KnowledgeControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public KnowledgeControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateClient()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _factory.GetTestToken());
        return client;
    }

    [Fact]
    public async Task GetRules_应返回200()
    {
        var client = CreateClient();
        var response = await client.GetAsync("/api/v1/knowledge/rules");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetPendingRules_应返回200()
    {
        var client = CreateClient();
        var response = await client.GetAsync("/api/v1/knowledge/pending-rules");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCases_应返回200()
    {
        var client = CreateClient();
        var response = await client.GetAsync("/api/v1/knowledge/cases");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CreateRule_应返回201()
    {
        var client = CreateClient();
        var request = new
        {
            TenantId = _factory.TestTenantId,
            DeviceType = "电机",
            Name = "测试规则",
            Conditions = """[{"metric":"temperature","operator":">","threshold":90}]""",
            Conclusion = "温度过高"
        };

        var response = await client.PostAsJsonAsync("/api/v1/knowledge/rules", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task ImportRules_应返回200()
    {
        var client = CreateClient();
        var rules = new[]
        {
            new
            {
                TenantId = _factory.TestTenantId,
                DeviceType = "CNC",
                Name = "振动异常规则",
                Conditions = """[{"metric":"vibration","operator":">","threshold":5}]""",
                Conclusion = "轴承磨损"
            }
        };

        var response = await client.PostAsJsonAsync("/api/v1/knowledge/import", rules);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
```

- [ ] **Step 3: 运行测试**

Run: `dotnet test tests/EquipAI.Tests.Integration --filter "KnowledgeControllerTests" --verbosity normal`
Expected: 5/5 通过

- [ ] **Step 4: 提交**

```bash
git add src/EquipAI.WebAPI/Controllers/KnowledgeController.cs tests/EquipAI.Tests.Integration/Controllers/KnowledgeControllerTests.cs
git commit -m "feat: 知识库 API — 7 个端点（规则 CRUD + 候选规则审核 + 案例查询）"
```

---

### Task 6: 前端知识库管理页面

**Files:**
- Create: `frontend/src/hooks/useKnowledge.ts`
- Create: `frontend/src/pages/KnowledgePage.tsx`
- Create: `frontend/src/pages/PendingRulesPage.tsx`
- Modify: `frontend/src/types/index.ts` — 添加知识库类型

- [ ] **Step 1: 添加 TypeScript 类型**

在 `frontend/src/types/index.ts` 中添加：

```typescript
// 知识规则
export interface KnowledgeRule {
  id: string;
  tenantId: string;
  deviceType: string;
  name: string;
  conditions: string;
  conclusion: string;
  recommendedActions?: string;
  checkSteps?: string;
  confidenceWeight: number;
  source: string;
  accuracyRate?: number;
  successCount: number;
  enabled: boolean;
  createdBy?: string;
  createdAt: string;
}

// 候选规则
export interface PendingRule {
  id: string;
  tenantId: string;
  deviceType: string;
  name: string;
  conditions: string;
  conclusion: string;
  recommendedActions?: string;
  checkSteps?: string;
  sourceWorkorderId?: string;
  sourceCaseId?: string;
  confidence?: number;
  reviewStatus: 'Pending' | 'Approved' | 'Rejected';
  reviewedBy?: string;
  reviewComment?: string;
  reviewedAt?: string;
  createdAt: string;
}

// 故障案例
export interface FaultCase {
  id: string;
  tenantId: string;
  deviceId?: string;
  deviceType: string;
  faultOccurredAt?: string;
  faultDescription: string;
  symptoms?: string;
  rootCause: string;
  solution: string;
  repairDurationMinutes?: number;
  partsUsed?: string;
  isVerified: boolean;
  sourceWorkorderId?: string;
  createdAt: string;
}
```

- [ ] **Step 2: 创建 API hooks**

```typescript
// frontend/src/hooks/useKnowledge.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { KnowledgeRule, PendingRule, FaultCase } from '../types';

/** 获取正式规则 */
export function useKnowledgeRules(deviceType?: string) {
  return useQuery({
    queryKey: ['knowledge-rules', deviceType],
    queryFn: async () => {
      const params = deviceType ? `?deviceType=${deviceType}` : '';
      const { data } = await api.get(`/knowledge/rules${params}`);
      return data as { total: number; data: KnowledgeRule[] };
    },
  });
}

/** 获取候选规则 */
export function usePendingRules(reviewStatus?: string) {
  return useQuery({
    queryKey: ['pending-rules', reviewStatus],
    queryFn: async () => {
      const params = reviewStatus ? `?reviewStatus=${reviewStatus}` : '';
      const { data } = await api.get(`/knowledge/pending-rules${params}`);
      return data as { total: number; data: PendingRule[] };
    },
  });
}

/** 批准候选规则 */
export function useApproveRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
      await api.put(`/knowledge/pending-rules/${id}/approve`, { comment });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-rules'] });
      qc.invalidateQueries({ queryKey: ['knowledge-rules'] });
    },
  });
}

/** 驳回候选规则 */
export function useRejectRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
      await api.put(`/knowledge/pending-rules/${id}/reject`, { comment });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-rules'] });
    },
  });
}

/** 获取故障案例 */
export function useFaultCases(deviceType?: string) {
  return useQuery({
    queryKey: ['fault-cases', deviceType],
    queryFn: async () => {
      const params = deviceType ? `?deviceType=${deviceType}` : '';
      const { data } = await api.get(`/knowledge/cases${params}`);
      return data as { total: number; data: FaultCase[] };
    },
  });
}
```

- [ ] **Step 3: 创建知识库主页面**

```tsx
// frontend/src/pages/KnowledgePage.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useKnowledgeRules, useFaultCases } from '../hooks/useKnowledge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export default function KnowledgePage() {
  const { t } = useTranslation();
  const [deviceType] = useState<string>();
  const { data: rulesData, isLoading: rulesLoading } = useKnowledgeRules(deviceType);
  const { data: casesData, isLoading: casesLoading } = useFaultCases(deviceType);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">{t('knowledge.title', '知识库管理')}</h1>

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">{t('knowledge.rules', '诊断规则')}</TabsTrigger>
          <TabsTrigger value="cases">{t('knowledge.cases', '故障案例')}</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {rulesLoading ? (
            <p className="text-muted-foreground">{t('common.loading')}</p>
          ) : (
            <div className="grid gap-4">
              {rulesData?.data.map((rule) => (
                <Card key={rule.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{rule.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t('knowledge.deviceType', '设备类型')}：</span>
                        {rule.deviceType}
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('knowledge.source', '来源')}：</span>
                        {rule.source}
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('knowledge.successCount', '应用次数')}：</span>
                        {rule.successCount}
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('knowledge.enabled', '状态')}：</span>
                        {rule.enabled ? t('common.enabled', '启用') : t('common.disabled', '禁用')}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{rule.conclusion}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cases" className="space-y-4">
          {casesLoading ? (
            <p className="text-muted-foreground">{t('common.loading')}</p>
          ) : (
            <div className="grid gap-4">
              {casesData?.data.map((c) => (
                <Card key={c.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{c.faultDescription}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t('knowledge.deviceType', '设备类型')}：</span>
                        {c.deviceType}
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('knowledge.rootCause', '根因')}：</span>
                        {c.rootCause}
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('knowledge.duration', '维修时长')}：</span>
                        {c.repairDurationMinutes ? `${c.repairDurationMinutes}min` : '-'}
                      </div>
                    </div>
                    <p className="mt-2 text-sm">{c.solution}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 4: 创建候选规则审核页面**

```tsx
// frontend/src/pages/PendingRulesPage.tsx
import { useTranslation } from 'react-i18next';
import { usePendingRules, useApproveRule, useRejectRule } from '../hooks/useKnowledge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

export default function PendingRulesPage() {
  const { t } = useTranslation();
  const { data, isLoading } = usePendingRules('Pending');
  const approveRule = useApproveRule();
  const rejectRule = useRejectRule();

  if (isLoading) return <p className="p-6 text-muted-foreground">{t('common.loading')}</p>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('pendingRules.title', '候选规则审核')}</h1>
        <Badge variant="secondary">{data?.total ?? 0} {t('pendingRules.pending', '待审核')}</Badge>
      </div>

      <div className="grid gap-4">
        {data?.data.map((rule) => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{rule.name}</CardTitle>
                <Badge variant="outline">
                  {t('pendingRules.confidence', '置信度')}: {(rule.confidence ?? 0).toString()}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('knowledge.deviceType')}：</span>
                  {rule.deviceType}
                </div>
                <div>
                  <span className="text-muted-foreground">{t('pendingRules.conclusion', '结论')}：</span>
                  {rule.conclusion}
                </div>
              </div>

              {rule.checkSteps && (
                <div className="text-sm">
                  <span className="text-muted-foreground">{t('pendingRules.checkSteps', '排查步骤')}：</span>
                  <pre className="mt-1 whitespace-pre-wrap text-xs">{rule.checkSteps}</pre>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => approveRule.mutate({ id: rule.id })}
                  disabled={approveRule.isPending}
                >
                  {t('pendingRules.approve', '批准')}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => rejectRule.mutate({ id: rule.id, comment: '不符合要求' })}
                  disabled={rejectRule.isPending}
                >
                  {t('pendingRules.reject', '驳回')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {data?.data.length === 0 && (
          <p className="text-center text-muted-foreground">
            {t('pendingRules.empty', '暂无待审核规则')}
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 添加路由和侧边栏导航**

在路由配置中添加：
```tsx
{ path: '/knowledge', element: <KnowledgePage /> }
{ path: '/pending-rules', element: <PendingRulesPage /> }
```

在侧边栏导航中添加知识库和候选规则审核入口。

- [ ] **Step 6: 添加 i18n 翻译键**

在 `frontend/src/i18n/zh.json` 和 `en.json` 中添加 `knowledge.*` 和 `pendingRules.*` 翻译键。

- [ ] **Step 7: 编译确认**

Run: `cd frontend && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 8: 提交**

```bash
git add frontend/src/pages/KnowledgePage.tsx frontend/src/pages/PendingRulesPage.tsx frontend/src/hooks/useKnowledge.ts frontend/src/types/index.ts
git commit -m "feat: 前端知识库管理页面 — 规则浏览 + 候选规则审核"
```

---

## 自检

1. **规格覆盖**: 故障案例自动生成 ✅、候选规则 LLM 生成 ✅、专家批准/驳回 ✅、7 个 API 端点 ✅、前端知识库管理 ✅
2. **占位符扫描**: 无 TBD/TODO/FIXME
3. **类型一致性**: KnowledgeRule、PendingRule、FaultCase 实体与前端类型一致
