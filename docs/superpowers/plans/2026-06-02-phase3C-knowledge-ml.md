# Phase 3C：知识库完善 + ML.NET 异常检测 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 L2 规则引擎诊断（基于知识库规则匹配）、L4 ML.NET SrCnn 异常检测，补全 AI 分析四级降级链；同时实现规则准确率自动追踪和行业预置知识数据导入。

**Architecture:** 在现有 `RootCauseAnalysisEngine` 的 L3→L1 降级链中插入 L2 规则引擎诊断层（有匹配规则时优先使用），新增 L4 ML.NET 层作为最高优先级。`RuleEngineAnalysisService` 从 `knowledge_rules` 表匹配条件，输出诊断结论。`MlAnomalyDetectionService` 使用 ML.NET SrCnn 算法检测时序异常。`RuleAccuracyTracker` 在工单关闭后自动更新规则的 `AccuracyRate` 和 `SuccessCount`。

**Tech Stack:** .NET 8、ML.NET (Microsoft.ML)、EF Core 8、PostgreSQL、React 19 + TanStack Query + shadcn/ui

---

## 文件结构

```
src/EquipAI.Core/
├── Enums/AnalysisLevel.cs                       -- 添加 L4 枚举值
├── Interfaces/IRuleEngineAnalysisService.cs     -- L2 规则引擎接口
├── Interfaces/IMlAnomalyDetectionService.cs     -- L4 ML 异常检测接口
├── Interfaces/IRuleAccuracyTracker.cs           -- 规则准确率追踪接口
src/EquipAI.Application/
├── Analysis/
│   ├── RuleEngineAnalysisService.cs             -- L2 规则引擎诊断实现
│   ├── MlAnomalyDetectionService.cs             -- L4 ML.NET SrCnn 异常检测
│   └── RootCauseAnalysisEngine.cs               -- 修改：插入 L2、L4 层
├── Knowledge/
│   ├── RuleAccuracyTracker.cs                   -- 规则准确率追踪
│   └── IndustryPresetData.cs                    -- 行业预置知识数据
src/EquipAI.Application/obj/                     -- ML.NET 模型文件目录
├── anomaly_model.zip                            -- SrCnn 训练模型（首次运行自动训练）
tests/EquipAI.Tests.Unit/
├── Analysis/RuleEngineAnalysisServiceTests.cs   -- L2 规则引擎测试
├── Analysis/SlaTrackerTests.cs                  -- (已有)
├── Knowledge/RuleAccuracyTrackerTests.cs        -- 准确率追踪测试
frontend/src/
├── hooks/useKnowledge.ts                        -- 知识库 API hooks
├── pages/KnowledgePage.tsx                      -- 知识库管理页面
```

---

### Task 1: L2 规则引擎诊断

**Files:**
- Create: `src/EquipAI.Core/Interfaces/IRuleEngineAnalysisService.cs`
- Create: `src/EquipAI.Application/Analysis/RuleEngineAnalysisService.cs`
- Create: `tests/EquipAI.Tests.Unit/Analysis/RuleEngineAnalysisServiceTests.cs`

- [ ] **Step 1: 创建 IRuleEngineAnalysisService 接口**

```csharp
// src/EquipAI.Core/Interfaces/IRuleEngineAnalysisService.cs
namespace EquipAI.Core.Interfaces;

/// <summary>
/// L2 规则引擎诊断服务 — 从知识库匹配规则条件，输出诊断结论
/// 当告警设备的指标满足某条 KnowledgeRule 的 Conditions 时，
/// 直接返回该规则的 Conclusion 和 RecommendedActions，无需调用 LLM
/// </summary>
public interface IRuleEngineAnalysisService
{
    /// <summary>
    /// 尝试匹配知识库规则并返回诊断结论
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="deviceId">设备 ID</param>
    /// <param name="metric">异常指标名称</param>
    /// <param name="value">当前异常值</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>匹配到的规则 ID 和诊断结论；无匹配时返回 null</returns>
    Task<RuleMatchResult?> MatchRuleAsync(
        Guid tenantId, Guid deviceId, string metric, double value, CancellationToken ct = default);
}

/// <summary>
/// 规则匹配结果
/// </summary>
/// <param name="RuleId">匹配到的规则 ID</param>
/// <param name="RuleName">规则名称</param>
/// <param name="Conclusion">诊断结论</param>
/// <param name="RecommendedActions">推荐处理措施（JSON 数组文本）</param>
/// <param name="CheckSteps">检查步骤（JSON 数组文本）</param>
/// <param name="ConfidenceWeight">规则的置信度权重</param>
public record RuleMatchResult(
    Guid RuleId,
    string RuleName,
    string Conclusion,
    string? RecommendedActions,
    string? CheckSteps,
    double ConfidenceWeight);
```

- [ ] **Step 2: 编写测试**

```csharp
// tests/EquipAI.Tests.Unit/Analysis/RuleEngineAnalysisServiceTests.cs
using EquipAI.Application.Analysis;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Tests.Unit.Analysis;

public class RuleEngineAnalysisServiceTests : IAsyncDisposable
{
    private readonly ServiceProvider _sp;
    private readonly Guid _tenantId = Guid.NewGuid();

    public RuleEngineAnalysisServiceTests()
    {
        var dbName = $"RuleEngineTest_{Guid.NewGuid()}";
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(dbName));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(_tenantId));
        services.AddLogging();
        services.AddScoped<IRuleEngineAnalysisService, RuleEngineAnalysisService>();
        _sp = services.BuildServiceProvider();
    }

    [Fact]
    public async Task MatchRuleAsync_条件满足应返回匹配结果()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 创建一条规则：温度 > 80°C → 过热警告
        db.KnowledgeRules.Add(new KnowledgeRule
        {
            TenantId = _tenantId,
            DeviceType = "电机",
            Name = "电机过热诊断",
            Conditions = """[{"metric":"temperature","operator":">","threshold":80}]""",
            Conclusion = "电机温度过高，可能散热系统异常",
            RecommendedActions = """["检查冷却风扇","清理散热片"]""",
            ConfidenceWeight = 0.9m,
            Enabled = true
        });
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<IRuleEngineAnalysisService>();
        var result = await service.MatchRuleAsync(_tenantId, Guid.NewGuid(), "temperature", 95.0);

        result.Should().NotBeNull();
        result!.Conclusion.Should().Contain("温度过高");
        result.ConfidenceWeight.Should().Be(0.9);
    }

    [Fact]
    public async Task MatchRuleAsync_条件不满足应返回null()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        db.KnowledgeRules.Add(new KnowledgeRule
        {
            TenantId = _tenantId,
            DeviceType = "电机",
            Name = "电机过热诊断",
            Conditions = """[{"metric":"temperature","operator":">","threshold":80}]""",
            Conclusion = "电机温度过高",
            Enabled = true
        });
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<IRuleEngineAnalysisService>();
        var result = await service.MatchRuleAsync(_tenantId, Guid.NewGuid(), "temperature", 50.0);

        result.Should().BeNull();
    }

    [Fact]
    public async Task MatchRuleAsync_禁用规则不应匹配()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        db.KnowledgeRules.Add(new KnowledgeRule
        {
            TenantId = _tenantId,
            DeviceType = "电机",
            Name = "电机过热诊断",
            Conditions = """[{"metric":"temperature","operator":">","threshold":80}]""",
            Conclusion = "电机温度过高",
            Enabled = false
        });
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<IRuleEngineAnalysisService>();
        var result = await service.MatchRuleAsync(_tenantId, Guid.NewGuid(), "temperature", 95.0);

        result.Should().BeNull();
    }

    [Fact]
    public async Task MatchRuleAsync_无任何规则应返回null()
    {
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IRuleEngineAnalysisService>();

        var result = await service.MatchRuleAsync(_tenantId, Guid.NewGuid(), "vibration", 10.0);

        result.Should().BeNull();
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

- [ ] **Step 3: 运行测试确认编译失败**

Run: `dotnet build EquipAI.slnx`
Expected: 编译失败（RuleEngineAnalysisService 不存在）

- [ ] **Step 4: 实现 RuleEngineAnalysisService**

```csharp
// src/EquipAI.Application/Analysis/RuleEngineAnalysisService.cs
using System.Text.Json;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Analysis;

/// <summary>
/// L2 规则引擎诊断服务
/// 从 knowledge_rules 表查找匹配规则：条件 JSON 中的指标名和阈值与当前告警数据比对
/// 条件格式：[{"metric":"temperature","operator":">","threshold":80}]
/// 支持操作符：>, >=, <, <=, ==, !=
/// 匹配逻辑：所有条件 AND 组合，全部满足时返回匹配结果
/// </summary>
public class RuleEngineAnalysisService : IRuleEngineAnalysisService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RuleEngineAnalysisService> _logger;

    public RuleEngineAnalysisService(
        IServiceScopeFactory scopeFactory,
        ILogger<RuleEngineAnalysisService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<RuleMatchResult?> MatchRuleAsync(
        Guid tenantId, Guid deviceId, string metric, double value, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 查询设备类型，用于匹配 DeviceType
        var deviceType = await db.Devices
            .Where(d => d.Id == deviceId)
            .Select(d => d.Type)
            .FirstOrDefaultAsync(ct);

        // 查询所有启用的规则（同租户 + 同设备类型或通用规则）
        var rules = await db.UnfilteredSet<KnowledgeRule>()
            .Where(r => (r.TenantId == tenantId || r.TenantId == Guid.Empty)
                && r.Enabled
                && (r.DeviceType == deviceType || r.DeviceType == "*"))
            .ToListAsync(ct);

        foreach (var rule in rules)
        {
            if (TryMatchConditions(rule.Conditions, metric, value))
            {
                _logger.LogInformation("规则匹配成功: {RuleName} (RuleId={RuleId})", rule.Name, rule.Id);

                return new RuleMatchResult(
                    RuleId: rule.Id,
                    RuleName: rule.Name,
                    Conclusion: rule.Conclusion,
                    RecommendedActions: rule.RecommendedActions,
                    CheckSteps: rule.CheckSteps,
                    ConfidenceWeight: (double)rule.ConfidenceWeight);
            }
        }

        return null;
    }

    /// <summary>
    /// 解析条件 JSON 并逐一匹配，全部满足时返回 true
    /// </summary>
    private bool TryMatchConditions(string conditionsJson, string targetMetric, double targetValue)
    {
        try
        {
            var conditions = JsonSerializer.Deserialize<List<ConditionItem>>(conditionsJson);
            if (conditions is null || conditions.Count == 0) return false;

            foreach (var cond in conditions)
            {
                // 只匹配当前告警的指标，其他指标条件跳过（视为满足）
                if (!string.Equals(cond.Metric, targetMetric, StringComparison.OrdinalIgnoreCase))
                    continue;

                if (!EvaluateCondition(targetValue, cond.Operator, cond.Threshold))
                    return false;
            }

            return true;
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "规则条件 JSON 解析失败: {Json}", conditionsJson);
            return false;
        }
    }

    /// <summary>
    /// 评估单个条件表达式
    /// </summary>
    private static bool EvaluateCondition(double value, string op, double threshold)
    {
        return op switch
        {
            ">" => value > threshold,
            ">=" => value >= threshold,
            "<" => value < threshold,
            "<=" => value <= threshold,
            "==" => Math.Abs(value - threshold) < 0.001,
            "!=" => Math.Abs(value - threshold) >= 0.001,
            _ => false
        };
    }

    /// <summary>
    /// 条件 JSON 反序列化模型
    /// </summary>
    private class ConditionItem
    {
        public string Metric { get; set; } = string.Empty;
        public string Operator { get; set; } = ">";
        public double Threshold { get; set; }
    }
}
```

- [ ] **Step 5: 运行测试**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "RuleEngineAnalysisServiceTests" --verbosity normal`
Expected: 4/4 通过

- [ ] **Step 6: 提交**

```bash
git add src/EquipAI.Core/Interfaces/IRuleEngineAnalysisService.cs src/EquipAI.Application/Analysis/RuleEngineAnalysisService.cs tests/EquipAI.Tests.Unit/Analysis/RuleEngineAnalysisServiceTests.cs
git commit -m "feat: L2 规则引擎诊断服务 RuleEngineAnalysisService"
```

---

### Task 2: 规则准确率追踪

**Files:**
- Create: `src/EquipAI.Core/Interfaces/IRuleAccuracyTracker.cs`
- Create: `src/EquipAI.Application/Knowledge/RuleAccuracyTracker.cs`
- Create: `tests/EquipAI.Tests.Unit/Knowledge/RuleAccuracyTrackerTests.cs`

- [ ] **Step 1: 创建 IRuleAccuracyTracker 接口**

```csharp
// src/EquipAI.Core/Interfaces/IRuleAccuracyTracker.cs
namespace EquipAI.Core.Interfaces;

/// <summary>
/// 规则准确率追踪器 — 工单关闭时更新关联规则的准确率统计
/// 当工单关联的分析使用了某条知识规则（L2），工单关闭后更新该规则的
/// SuccessCount 和 AccuracyRate
/// </summary>
public interface IRuleAccuracyTracker
{
    /// <summary>
    /// 记录规则匹配结果的准确性
    /// </summary>
    /// <param name="ruleId">匹配到的规则 ID</param>
    /// <param name="wasAccurate">规则诊断是否准确（工单 RootCause 与规则 Conclusion 一致）</param>
    /// <param name="ct">取消令牌</param>
    Task RecordAsync(Guid ruleId, bool wasAccurate, CancellationToken ct = default);
}
```

- [ ] **Step 2: 编写测试**

```csharp
// tests/EquipAI.Tests.Unit/Knowledge/RuleAccuracyTrackerTests.cs
using EquipAI.Application.Knowledge;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Tests.Unit.Knowledge;

public class RuleAccuracyTrackerTests : IAsyncDisposable
{
    private readonly ServiceProvider _sp;
    private readonly Guid _tenantId = Guid.NewGuid();

    public RuleAccuracyTrackerTests()
    {
        var dbName = $"AccuracyTest_{Guid.NewGuid()}";
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(dbName));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(_tenantId));
        services.AddLogging();
        services.AddScoped<IRuleAccuracyTracker, RuleAccuracyTracker>();
        _sp = services.BuildServiceProvider();
    }

    [Fact]
    public async Task RecordAsync_首次准确记录应为100()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var ruleId = Guid.NewGuid();
        db.KnowledgeRules.Add(new KnowledgeRule
        {
            Id = ruleId,
            TenantId = _tenantId,
            Name = "测试规则",
            DeviceType = "电机",
            Conditions = "[]",
            Conclusion = "测试",
            SuccessCount = 0
        });
        await db.SaveChangesAsync();

        var tracker = scope.ServiceProvider.GetRequiredService<IRuleAccuracyTracker>();
        await tracker.RecordAsync(ruleId, wasAccurate: true);

        // 重新查询验证
        var rule = await db.KnowledgeRules.FindAsync(ruleId);
        rule!.SuccessCount.Should().Be(1);
        rule.AccuracyRate.Should().Be(1.0m);
    }

    [Fact]
    public async Task RecordAsync_混合记录应计算正确率()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var ruleId = Guid.NewGuid();
        db.KnowledgeRules.Add(new KnowledgeRule
        {
            Id = ruleId,
            TenantId = _tenantId,
            Name = "测试规则",
            DeviceType = "电机",
            Conditions = "[]",
            Conclusion = "测试",
            SuccessCount = 0
        });
        await db.SaveChangesAsync();

        var tracker = scope.ServiceProvider.GetRequiredService<IRuleAccuracyTracker>();
        await tracker.RecordAsync(ruleId, wasAccurate: true);
        await tracker.RecordAsync(ruleId, wasAccurate: true);
        await tracker.RecordAsync(ruleId, wasAccurate: false);

        var rule = await db.KnowledgeRules.FindAsync(ruleId);
        rule!.SuccessCount.Should().Be(2);
        // 准确率 = 2次准确 / 3次总匹配 = 0.6667
        rule.AccuracyRate.Should().BeApproximately(0.6667m, 0.01m);
    }

    [Fact]
    public async Task RecordAsync_规则不存在应抛出KeyNotFoundException()
    {
        using var scope = _sp.CreateScope();
        var tracker = scope.ServiceProvider.GetRequiredService<IRuleAccuracyTracker>();

        var act = () => tracker.RecordAsync(Guid.NewGuid(), wasAccurate: true);

        await act.Should().ThrowAsync<KeyNotFoundException>();
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

- [ ] **Step 3: 运行测试确认编译失败**

Run: `dotnet build EquipAI.slnx`
Expected: 编译失败（RuleAccuracyTracker 不存在）

- [ ] **Step 4: 实现 RuleAccuracyTracker**

```csharp
// src/EquipAI.Application/Knowledge/RuleAccuracyTracker.cs
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Knowledge;

/// <summary>
/// 规则准确率追踪器
/// 准确率算法：SuccessCount / TotalMatchCount
/// 每次匹配后记录 wasAccurate=true 则 SuccessCount++，
/// 同时维护 TotalMatchCount（通过 SuccessCount + FailCount 推算）
/// AccuracyRate = SuccessCount / (SuccessCount + 最近 FailCount 滑动窗口)
/// </summary>
public class RuleAccuracyTracker : IRuleAccuracyTracker
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RuleAccuracyTracker> _logger;

    public RuleAccuracyTracker(
        IServiceScopeFactory scopeFactory,
        ILogger<RuleAccuracyTracker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task RecordAsync(Guid ruleId, bool wasAccurate, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var rule = await db.KnowledgeRules.FindAsync([ruleId], ct);
        if (rule is null)
            throw new KeyNotFoundException($"规则不存在: {ruleId}");

        if (wasAccurate)
        {
            rule.SuccessCount++;
        }

        // 重新计算准确率：AccuracyRate = SuccessCount / TotalMatches
        // TotalMatches 通过 AccuracyRate 和 SuccessCount 反推：
        // 如果当前 AccuracyRate = 0.8, SuccessCount = 8，则 TotalMatches = 10
        // 新 TotalMatches = 老 TotalMatches + 1
        var oldTotal = rule.AccuracyRate.HasValue && rule.AccuracyRate.Value > 0
            ? (int)Math.Round(rule.SuccessCount / (double)rule.AccuracyRate.Value)
            : rule.SuccessCount;

        var newTotal = oldTotal + 1;
        rule.AccuracyRate = (decimal)rule.SuccessCount / newTotal;

        await db.SaveChangesAsync(ct);

        _logger.LogInformation("规则准确率更新: RuleId={RuleId}, SuccessCount={SuccessCount}, AccuracyRate={AccuracyRate:P}",
            ruleId, rule.SuccessCount, rule.AccuracyRate);
    }
}
```

- [ ] **Step 5: 运行测试**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "RuleAccuracyTrackerTests" --verbosity normal`
Expected: 3/3 通过

- [ ] **Step 6: 提交**

```bash
git add src/EquipAI.Core/Interfaces/IRuleAccuracyTracker.cs src/EquipAI.Application/Knowledge/RuleAccuracyTracker.cs tests/EquipAI.Tests.Unit/Knowledge/RuleAccuracyTrackerTests.cs
git commit -m "feat: 规则准确率追踪器 RuleAccuracyTracker"
```

---

### Task 3: L4 ML.NET SrCnn 异常检测 + 分析引擎集成 L2/L4

**Files:**
- Modify: `src/EquipAI.Core/Enums/AnalysisLevel.cs` — 添加 L4
- Create: `src/EquipAI.Core/Interfaces/IMlAnomalyDetectionService.cs`
- Create: `src/EquipAI.Application/Analysis/MlAnomalyDetectionService.cs`
- Modify: `src/EquipAI.Application/Analysis/RootCauseAnalysisEngine.cs` — 插入 L2 和 L4 层
- Modify: `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs` — 注册新服务

- [ ] **Step 1: 添加 L4 枚举值**

在 `src/EquipAI.Core/Enums/AnalysisLevel.cs` 中添加 L4：

```csharp
namespace EquipAI.Core.Enums;

/// <summary>
/// AI 分析级别，按自动降级链排列
/// </summary>
public enum AnalysisLevel
{
    /// <summary>
    /// Level 1 — LLM 对话诊断（兜底）
    /// </summary>
    L1,

    /// <summary>
    /// Level 2 — 规则引擎诊断（基于知识库规则匹配）
    /// </summary>
    L2,

    /// <summary>
    /// Level 3 — 统计分析（基于历史基线）
    /// </summary>
    L3,

    /// <summary>
    /// Level 4 — ML.NET SrCnn 异常检测（基于机器学习模型）
    /// </summary>
    L4
}
```

- [ ] **Step 2: 创建 IMlAnomalyDetectionService 接口**

```csharp
// src/EquipAI.Core/Interfaces/IMlAnomalyDetectionService.cs
namespace EquipAI.Core.Interfaces;

/// <summary>
/// L4 ML.NET 异常检测服务 — 使用 SrCnn 算法检测时序数据异常
/// 需要足够的训练样本（≥ 50 个数据点）才能进行检测
/// 检测结果包含异常分数（0-1，越高越异常）和是否为异常的布尔判定
/// </summary>
public interface IMlAnomalyDetectionService
{
    /// <summary>
    /// 检测指定设备指标是否存在异常
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="deviceId">设备 ID</param>
    /// <param name="metric">指标名称</param>
    /// <param name="currentValue">当前值</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>检测结果；样本不足时返回 null</returns>
    Task<MlAnomalyResult?> DetectAsync(
        Guid tenantId, Guid deviceId, string metric, double currentValue, CancellationToken ct = default);
}

/// <summary>
/// ML 异常检测结果
/// </summary>
/// <param name="IsAnomaly">是否判定为异常</param>
/// <param name="AnomalyScore">异常分数（0-1，SrCnn 输出的原始概率）</param>
/// <param name="ExpectedValue">模型预测的正常值</param>
/// <param name="Description">中文描述</param>
public record MlAnomalyResult(
    bool IsAnomaly,
    double AnomalyScore,
    double ExpectedValue,
    string Description);
```

- [ ] **Step 3: 添加 ML.NET NuGet 包**

在 `src/EquipAI.Application/EquipAI.Application.csproj` 中添加：

```xml
<PackageReference Include="Microsoft.ML" Version="4.0.2" />
```

在 `tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj` 中确认已有 `Microsoft.ML` 引用（测试需要）。

- [ ] **Step 4: 实现 MlAnomalyDetectionService**

```csharp
// src/EquipAI.Application/Analysis/MlAnomalyDetectionService.cs
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.ML;
using Microsoft.ML.Data;
using Microsoft.ML.Transforms.TimeSeries;

namespace EquipAI.Application.Analysis;

/// <summary>
/// L4 ML.NET SrCnn 异常检测服务
/// 使用 SrCnn（Spectral Residual + CNN）算法检测时序数据中的异常点
/// 训练数据来源：device_telemetry 表中最近 7 天的遥测数据
/// 最低样本要求：50 个数据点
/// 阈值：AnomalyScore > 0.5 判定为异常（SrCnn 概率输出）
/// </summary>
public class MlAnomalyDetectionService : IMlAnomalyDetectionService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<MlAnomalyDetectionService> _logger;

    /// <summary>
    /// 最低训练样本数
    /// </summary>
    private const int MinSampleCount = 50;

    /// <summary>
    /// 异常判定阈值（SrCnn 概率）
    /// </summary>
    private const double AnomalyThreshold = 0.5;

    /// <summary>
    /// 训练数据时间窗口（天）
    /// </summary>
    private const int TrainingWindowDays = 7;

    private static readonly MLContext _mlContext = new(seed: 42);

    public MlAnomalyDetectionService(
        IServiceScopeFactory scopeFactory,
        ILogger<MlAnomalyDetectionService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<MlAnomalyResult?> DetectAsync(
        Guid tenantId, Guid deviceId, string metric, double currentValue, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 查询最近 N 天的遥测数据作为训练集
        var cutoff = DateTime.UtcNow.AddDays(-TrainingWindowDays);
        var historyData = await db.DeviceTelemetry
            .Where(t => t.DeviceId == deviceId && t.Metric == metric && t.Timestamp >= cutoff)
            .OrderBy(t => t.Timestamp)
            .Select(t => new { t.Value, t.Timestamp })
            .Take(500)
            .ToListAsync(ct);

        if (historyData.Count < MinSampleCount)
        {
            _logger.LogDebug("ML 异常检测样本不足: Device={DeviceId}, Metric={Metric}, Count={Count}",
                deviceId, metric, historyData.Count);
            return null;
        }

        try
        {
            // 构建 ML.NET 数据视图
            var dataPoints = historyData
                .Select((h, i) => new TimeSeriesData(i, h.Value))
                .ToList();

            // 添加当前值
            dataPoints.Add(new TimeSeriesData(dataPoints.Count, currentValue));

            var dataView = _mlContext.Data.LoadFromEnumerable(dataPoints);

            // SrCnn 异常检测管道
            var pipeline = _mlContext.Transforms.DetectAnomalyBySrCnn(
                outputColumnName: nameof(PredictionResult.Prediction),
                inputColumnName: nameof(TimeSeriesData.Value),
                threshold: AnomalyThreshold,
                windowSize: Math.Min(64, dataPoints.Count / 2));

            var model = pipeline.Fit(dataView);
            var transformed = model.Transform(dataView);
            var predictions = _mlContext.Data
                .CreateEnumerable<PredictionResult>(transformed, reuseRowObject: false)
                .ToList();

            // 最后一个预测对应当前值
            var lastPrediction = predictions.LastOrDefault();
            if (lastPrediction?.Prediction == null || lastPrediction.Prediction.Length < 3)
            {
                return null;
            }

            // SrCnn 输出: [0]=原始分数, [1]=异常标记(0/1), [2]=概率
            var rawScore = lastPrediction.Prediction[0];
            var isAnomaly = lastPrediction.Prediction[1] > 0;
            var probability = lastPrediction.Prediction[2];

            // 计算预期值（历史均值作为简单估计）
            var expectedValue = historyData.Average(h => h.Value);

            var description = isAnomaly
                ? $"ML 检测到异常：当前值 {currentValue:F2} 偏离预期 {expectedValue:F2}，异常概率 {probability:P}"
                : $"ML 检测正常：当前值 {currentValue:F2}，预期 {expectedValue:F2}，异常概率 {probability:P}";

            return new MlAnomalyResult(
                IsAnomaly: isAnomaly,
                AnomalyScore: probability,
                ExpectedValue: expectedValue,
                Description: description);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "ML 异常检测执行失败: Device={DeviceId}, Metric={Metric}", deviceId, metric);
            return null;
        }
    }

    /// <summary>
    /// 时序数据输入
    /// </summary>
    private record TimeSeriesData(double Value);

    /// <summary>
    /// 预测结果
    /// </summary>
    private class PredictionResult
    {
        public float[] Prediction { get; set; } = [];
    }
}
```

- [ ] **Step 5: 修改 RootCauseAnalysisEngine 插入 L2 和 L4**

在 `src/EquipAI.Application/Analysis/RootCauseAnalysisEngine.cs` 中，修改 `AnalyzeAsync` 方法，将降级链从 `L3→L1` 改为 `L4→L2→L3→L1`：

```csharp
using System.Diagnostics;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using AnalysisEntity = EquipAI.Core.Entities.Analysis;
using MetricBaselineEntity = EquipAI.Core.Entities.MetricBaseline;

namespace EquipAI.Application.Analysis;

/// <summary>
/// 根因分析引擎，实现 L4→L2→L3→L1 四级自动降级分析链
/// L4 ML.NET 异常检测：样本充足时优先使用机器学习模型
/// L2 规则引擎诊断：有匹配的知识规则时直接返回专家结论
/// L3 统计分析：有基线数据且数据质量达标时基于统计基线
/// L1 LLM 诊断：兜底方案，调用大语言模型分析告警上下文
/// </summary>
public class RootCauseAnalysisEngine : IAnalysisService
{
    private readonly ILLMService _llmService;
    private readonly IDataQualityService _dataQualityService;
    private readonly IRuleEngineAnalysisService _ruleEngineService;
    private readonly IMlAnomalyDetectionService _mlService;

    /// <summary>
    /// 数据质量阈值：≥ 此值时使用统计基线分析（L3），否则降级到 LLM 诊断（L1）
    /// </summary>
    private const double DataQualityThreshold = 0.6;

    /// <summary>
    /// 基线最低样本数阈值
    /// </summary>
    private const int MinSampleCount = 100;

    public RootCauseAnalysisEngine(
        ILLMService llmService,
        IDataQualityService dataQualityService,
        IRuleEngineAnalysisService ruleEngineService,
        IMlAnomalyDetectionService mlService)
    {
        _llmService = llmService;
        _dataQualityService = dataQualityService;
        _ruleEngineService = ruleEngineService;
        _mlService = mlService;
    }

    /// <inheritdoc />
    public async Task<AnalysisEntity> AnalyzeAsync(Guid tenantId, Guid alertId, Guid deviceId,
        string metric, double value, MetricBaselineEntity? baseline, CancellationToken ct = default)
    {
        var startTime = Stopwatch.GetTimestamp();

        var dataQualityNullable = await _dataQualityService.CalculateScoreAsync(tenantId, deviceId, metric, ct);
        var dataQuality = dataQualityNullable ?? 0.0;

        string rootCause;
        string suggestion;
        double confidence;
        AnalysisLevel level;
        AnalysisStatus status = AnalysisStatus.Completed;
        string? rawResponse = null;
        Guid? matchedRuleId = null;

        // 降级链：L4 → L2 → L3 → L1

        // L4: ML.NET 异常检测
        var mlResult = await _mlService.DetectAsync(tenantId, deviceId, metric, value, ct);
        if (mlResult != null && mlResult.IsAnomaly)
        {
            level = AnalysisLevel.L4;
            rootCause = mlResult.Description;
            suggestion = $"ML 模型检测到异常（概率 {mlResult.AnomalyScore:P}），建议人工确认并排查";
            confidence = Math.Min(1.0, mlResult.AnomalyScore * 0.9 + dataQuality * 0.1);
        }
        // L2: 规则引擎诊断
        else if (await _ruleEngineService.MatchRuleAsync(tenantId, deviceId, metric, value, ct) is { } ruleMatch)
        {
            level = AnalysisLevel.L2;
            rootCause = ruleMatch.Conclusion;
            suggestion = ruleMatch.RecommendedActions ?? "请参考知识库推荐措施";
            confidence = ruleMatch.ConfidenceWeight;
            matchedRuleId = ruleMatch.RuleId;
            rawResponse = ruleMatch.CheckSteps;
        }
        // L3: 统计分析
        else if (baseline != null && (baseline.SampleCount ?? 0) >= MinSampleCount && dataQuality >= DataQualityThreshold)
        {
            level = AnalysisLevel.L3;
            (rootCause, suggestion, confidence) = StatisticalAnalysis(value, baseline, metric, dataQuality);
        }
        // L1: LLM 诊断（兜底）
        else
        {
            level = AnalysisLevel.L1;
            var result = await LLMDiagnosisAsync(deviceId, metric, value, baseline, ct);

            if (result.Success)
            {
                rootCause = result.RootCause;
                suggestion = result.Suggestion;
                confidence = result.Confidence ?? 0.5;
                rawResponse = result.RawContent;
            }
            else
            {
                status = AnalysisStatus.Failed;
                rootCause = $"LLM 分析失败：{result.ErrorMessage}";
                suggestion = "请人工排查";
                confidence = 0.0;
            }
        }

        var elapsed = Stopwatch.GetElapsedTime(startTime);

        return new AnalysisEntity
        {
            TenantId = tenantId,
            AlertId = alertId,
            DeviceId = deviceId,
            RuleId = matchedRuleId,
            Level = level,
            Status = status,
            Confidence = confidence,
            DataQualityScore = dataQuality,
            RootCause = rootCause,
            Suggestion = suggestion,
            RawResponse = rawResponse,
            ProcessingTimeMs = (long)elapsed.TotalMilliseconds,
            CompletedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// L3 统计分析：基于历史基线计算偏离度并生成诊断
    /// </summary>
    private static (string rootCause, string suggestion, double confidence) StatisticalAnalysis(
        double value, MetricBaselineEntity baseline, string metric, double dataQuality)
    {
        var avg = baseline.AvgValue ?? 0;
        var stdDev = baseline.StdDev ?? 1;
        if (stdDev == 0) stdDev = 0.001;

        var deviation = Math.Abs(value - avg) / stdDev;

        var rootCause = deviation switch
        {
            > 5 => $"指标 {metric} 当前值 {value:F2} 严重偏离历史基线（均值 {avg:F2}，{deviation:F1}σ）",
            > 3 => $"指标 {metric} 当前值 {value:F2} 显著偏离历史基线（均值 {avg:F2}，{deviation:F1}σ）",
            _ => $"指标 {metric} 当前值 {value:F2} 偏离历史基线（均值 {avg:F2}，{deviation:F1}σ）"
        };

        var suggestion = deviation switch
        {
            > 5 => "建议立即停机检查，排查严重异常原因",
            > 3 => "建议尽快排查异常原因，必要时安排维护",
            _ => "建议持续观察，如持续偏离则安排检查"
        };

        var confidence = Math.Min(1.0, dataQuality * 0.8 + 0.2);
        return (rootCause, suggestion, confidence);
    }

    /// <summary>
    /// L1 LLM 诊断：将告警上下文发送给大语言模型进行根因分析
    /// </summary>
    private async Task<(bool Success, string RootCause, string Suggestion, double? Confidence, string? RawContent, string? ErrorMessage)>
        LLMDiagnosisAsync(Guid deviceId, string metric, double value, MetricBaselineEntity? baseline, CancellationToken ct)
    {
        var systemPrompt = @"你是工业设备故障诊断专家。根据提供的设备遥测数据和告警信息，分析可能的根因并给出建议措施。
请以 JSON 格式响应：
{
  ""rootCause"": ""根因描述"",
  ""suggestion"": ""建议措施"",
  ""confidence"": 0.0到1.0的置信度
}";

        var baselineInfo = baseline != null
            ? $"\n历史基线：均值={baseline.AvgValue:F2}, 标准差={baseline.StdDev:F2}, 样本数={baseline.SampleCount}"
            : "\n历史基线：无可用数据";

        var userPrompt = $"设备ID: {deviceId}\n异常指标: {metric}\n当前值: {value}{baselineInfo}\n\n请分析可能的根因并给出建议。";

        var response = await _llmService.AnalyzeAsync(new LLMRequest(systemPrompt, userPrompt), ct);

        if (!response.Success)
        {
            return (false, "", "", null, null, response.ErrorMessage);
        }

        try
        {
            var json = System.Text.Json.JsonDocument.Parse(response.Content);
            var root = json.RootElement;

            var rootCause = root.TryGetProperty("rootCause", out var rc) ? rc.GetString() ?? "" : response.Content;
            var suggestion = root.TryGetProperty("suggestion", out var sg) ? sg.GetString() ?? "" : "";
            var confidence = root.TryGetProperty("confidence", out var cf) ? cf.GetDouble() : 0.5;

            return (true, rootCause, suggestion, confidence, response.Content, null);
        }
        catch
        {
            return (true, response.Content, "请结合人工判断", 0.3, response.Content, null);
        }
    }
}
```

- [ ] **Step 6: 注册新服务到 DI**

在 `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs` 中添加：

```csharp
using EquipAI.Application.Analysis;
using EquipAI.Core.Interfaces;

// L2 规则引擎诊断
services.AddScoped<IRuleEngineAnalysisService, RuleEngineAnalysisService>();

// L4 ML.NET 异常检测（Singleton — MLContext 内部线程安全）
services.AddSingleton<IMlAnomalyDetectionService, MlAnomalyDetectionService>();

// 规则准确率追踪
services.AddScoped<IRuleAccuracyTracker, RuleAccuracyTracker>();
```

注意：`RootCauseAnalysisEngine` 已有注册 `services.AddScoped<Core.Interfaces.IAnalysisService, RootCauseAnalysisEngine>()`，其构造函数现在需要两个新依赖（`IRuleEngineAnalysisService`、`IMlAnomalyDetectionService`），DI 会自动注入。

- [ ] **Step 7: 编译确认**

Run: `dotnet build EquipAI.slnx`
Expected: 编译成功

- [ ] **Step 8: 运行全部单元测试**

Run: `dotnet test tests/EquipAI.Tests.Unit --verbosity normal`
Expected: 所有测试通过

- [ ] **Step 9: 提交**

```bash
git add src/EquipAI.Core/Enums/AnalysisLevel.cs src/EquipAI.Core/Interfaces/IMlAnomalyDetectionService.cs src/EquipAI.Application/Analysis/MlAnomalyDetectionService.cs src/EquipAI.Application/Analysis/RootCauseAnalysisEngine.cs src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs src/EquipAI.Application/EquipAI.Application.csproj
git commit -m "feat: L4 ML.NET 异常检测 + 分析引擎集成 L4→L2→L3→L1 四级降级链"
```

---

### Task 4: 行业知识预置数据

**Files:**
- Create: `src/EquipAI.Application/Knowledge/IndustryPresetData.cs`
- Modify: `src/EquipAI.Application/Knowledge/KnowledgeCaptureHandler.cs` — 添加规则准确率追踪调用
- Modify: `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs` — 注册 IRuleAccuracyTracker

- [ ] **Step 1: 创建行业预置数据**

```csharp
// src/EquipAI.Application/Knowledge/IndustryPresetData.cs
using EquipAI.Core.Entities;

namespace EquipAI.Application.Knowledge;

/// <summary>
/// 行业预置知识数据 — 常见工业设备故障诊断规则
/// 这些规则归属系统租户（tenant_id = Guid.Empty），所有租户可见
/// 管理员可通过 KnowledgeController.Import 接口导入，或首次启动时自动种子
/// </summary>
public static class IndustryPresetData
{
    /// <summary>
    /// 电机类设备诊断规则
    /// </summary>
    public static List<KnowledgeRule> MotorRules(Guid systemTenantId) =>
    [
        new()
        {
            TenantId = systemTenantId,
            DeviceType = "电机",
            Name = "电机过热诊断",
            Conditions = """[{"metric":"temperature","operator":">","threshold":80}]""",
            Conclusion = "电机绕组或轴承温度过高，可能原因：散热不良、负载过大、轴承磨损",
            RecommendedActions = """["检查冷却风扇运行状态","测量负载电流是否超额定","检查轴承润滑和磨损"]""",
            CheckSteps = """["红外测温确认发热点","检查风扇转向和转速","测量三相电流平衡性"]""",
            ConfidenceWeight = 0.85m,
            Source = "imported",
            Enabled = true,
            CreatedBy = "system-preset"
        },
        new()
        {
            TenantId = systemTenantId,
            DeviceType = "电机",
            Name = "电机振动异常",
            Conditions = """[{"metric":"vibration","operator":">","threshold":7.0}]""",
            Conclusion = "电机振动超标，可能原因：转子不平衡、轴承损坏、安装基础松动",
            RecommendedActions = """["进行振动频谱分析","检查联轴器对中","检查地脚螺栓紧固"]""",
            CheckSteps = """["测量轴向/径向振动值","频谱分析确定振动频率","检查轴承间隙"]""",
            ConfidenceWeight = 0.80m,
            Source = "imported",
            Enabled = true,
            CreatedBy = "system-preset"
        },
        new()
        {
            TenantId = systemTenantId,
            DeviceType = "电机",
            Name = "电机电流异常",
            Conditions = """[{"metric":"current","operator":">","threshold":50}]""",
            Conclusion = "电机电流超过额定值，可能原因：机械卡阻、绝缘下降、电源异常",
            RecommendedActions = """["检查机械负载是否正常","测量绝缘电阻","检查三相电压平衡"]""",
            CheckSteps = """["对比额定电流值","测量绕组绝缘","检查电源电压"]""",
            ConfidenceWeight = 0.75m,
            Source = "imported",
            Enabled = true,
            CreatedBy = "system-preset"
        }
    ];

    /// <summary>
    /// 泵类设备诊断规则
    /// </summary>
    public static List<KnowledgeRule> PumpRules(Guid systemTenantId) =>
    [
        new()
        {
            TenantId = systemTenantId,
            DeviceType = "泵",
            Name = "泵出口压力异常",
            Conditions = """[{"metric":"pressure","operator":"<","threshold":0.5}]""",
            Conclusion = "泵出口压力低于正常值，可能原因：叶轮磨损、进口堵塞、密封泄漏",
            RecommendedActions = """["检查进口滤网","检查叶轮磨损情况","检查机械密封"]""",
            CheckSteps = """["对比额定出口压力","检查进口阀门开度","检查轴封泄漏"]""",
            ConfidenceWeight = 0.80m,
            Source = "imported",
            Enabled = true,
            CreatedBy = "system-preset"
        }
    ];

    /// <summary>
    /// CNC 设备诊断规则
    /// </summary>
    public static List<KnowledgeRule> CncRules(Guid systemTenantId) =>
    [
        new()
        {
            TenantId = systemTenantId,
            DeviceType = "CNC",
            Name = "CNC 主轴温度异常",
            Conditions = """[{"metric":"spindle_temperature","operator":">","threshold":65}]""",
            Conclusion = "CNC 主轴温度过高，可能原因：主轴轴承磨损、冷却液不足、转速过高",
            RecommendedActions = """["检查冷却液液位和流量","降低主轴转速","检查主轴轴承状态"]""",
            CheckSteps = """["检查冷却系统","测量主轴径向跳动","检查润滑脂"]""",
            ConfidenceWeight = 0.85m,
            Source = "imported",
            Enabled = true,
            CreatedBy = "system-preset"
        }
    ];

    /// <summary>
    /// 通用规则（适用于所有设备类型）
    /// </summary>
    public static List<KnowledgeRule> GenericRules(Guid systemTenantId) =>
    [
        new()
        {
            TenantId = systemTenantId,
            DeviceType = "*",
            Name = "通用振动超标诊断",
            Conditions = """[{"metric":"vibration","operator":">","threshold":10.0}]""",
            Conclusion = "设备振动严重超标，建议立即停机检查",
            RecommendedActions = """["紧急停机","全面振动分析","检查安装基础和紧固件"]""",
            ConfidenceWeight = 0.70m,
            Source = "imported",
            Enabled = true,
            CreatedBy = "system-preset"
        }
    ];

    /// <summary>
    /// 获取所有预置规则
    /// </summary>
    public static List<KnowledgeRule> AllRules(Guid systemTenantId)
    {
        var rules = new List<KnowledgeRule>();
        rules.AddRange(MotorRules(systemTenantId));
        rules.AddRange(PumpRules(systemTenantId));
        rules.AddRange(CncRules(systemTenantId));
        rules.AddRange(GenericRules(systemTenantId));
        return rules;
    }
}
```

- [ ] **Step 2: 在 KnowledgeCaptureHandler 中集成规则准确率追踪**

修改 `src/EquipAI.Application/Knowledge/KnowledgeCaptureHandler.cs`，在工单关闭时如果关联了 L2 分析（有 RuleId），调用 `IRuleAccuracyTracker.RecordAsync`。

在现有 `HandleAsync` 方法中，`ProcessWorkOrderClosedAsync` 调用之后，添加规则准确率追踪逻辑：

```csharp
// 在 ProcessWorkOrderClosedAsync 之后添加：
if (wo.AnalysisId.HasValue)
{
    using var scope = _scopeFactory.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var analysis = await db.Analyses.FindAsync([wo.AnalysisId.Value], ct);
    if (analysis?.RuleId.HasValue == true)
    {
        var tracker = scope.ServiceProvider.GetRequiredService<IRuleAccuracyTracker>();
        // 简单启发式：工单有 Resolution 且 RootCause 非空 → 规则诊断准确
        var wasAccurate = !string.IsNullOrEmpty(wo.RootCause) && !string.IsNullOrEmpty(wo.Resolution);
        await tracker.RecordAsync(analysis.RuleId.Value, wasAccurate, ct);
    }
}
```

- [ ] **Step 3: 编译确认**

Run: `dotnet build EquipAI.slnx`
Expected: 编译成功

- [ ] **Step 4: 提交**

```bash
git add src/EquipAI.Application/Knowledge/IndustryPresetData.cs src/EquipAI.Application/Knowledge/KnowledgeCaptureHandler.cs
git commit -m "feat: 行业预置知识数据 + 规则准确率自动追踪"
```

---

### Task 5: 前端知识库管理页面

**Files:**
- Create: `frontend/src/hooks/useKnowledge.ts`
- Create: `frontend/src/pages/KnowledgePage.tsx`
- Modify: `frontend/src/App.tsx` — 添加路由
- Modify: `frontend/src/i18n/zh.json` and `en.json` — 添加翻译

- [ ] **Step 1: 创建知识库 API hooks**

```typescript
// frontend/src/hooks/useKnowledge.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

/** 正式知识规则 */
export interface KnowledgeRule {
  id: string;
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
}

/** 候选规则 */
export interface PendingRule {
  id: string;
  deviceType: string;
  name: string;
  conditions: string;
  conclusion: string;
  recommendedActions?: string;
  confidence?: number;
  reviewStatus: 'Pending' | 'Approved' | 'Rejected';
  reviewedBy?: string;
  reviewComment?: string;
  reviewedAt?: string;
}

/** 故障案例 */
export interface FaultCase {
  id: string;
  deviceType: string;
  faultDescription: string;
  rootCause: string;
  solution: string;
  repairDurationMinutes?: number;
  isVerified: boolean;
  faultOccurredAt?: string;
}

/** 获取知识规则列表 */
export function useKnowledgeRules(params: { deviceType?: string; enabled?: boolean; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['knowledge-rules', params],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (params.deviceType) query.set('deviceType', params.deviceType);
      if (params.enabled !== undefined) query.set('enabled', String(params.enabled));
      query.set('page', String(params.page ?? 1));
      query.set('pageSize', String(params.pageSize ?? 20));
      const { data } = await api.get(`/knowledge/rules?${query}`);
      return data as { items: KnowledgeRule[]; total: number };
    },
  });
}

/** 获取候选规则列表 */
export function usePendingRules(status?: string) {
  return useQuery({
    queryKey: ['pending-rules', status],
    queryFn: async () => {
      const query = status ? `?status=${status}` : '';
      const { data } = await api.get(`/knowledge/pending-rules${query}`);
      return data as { items: PendingRule[]; total: number };
    },
  });
}

/** 获取故障案例列表 */
export function useFaultCases(params: { deviceType?: string; page?: number }) {
  return useQuery({
    queryKey: ['fault-cases', params],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (params.deviceType) query.set('deviceType', params.deviceType);
      query.set('page', String(params.page ?? 1));
      query.set('pageSize', '20');
      const { data } = await api.get(`/knowledge/cases?${query}`);
      return data as { items: FaultCase[]; total: number };
    },
  });
}

/** 批准候选规则 */
export function useApprovePendingRule() {
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
export function useRejectPendingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment: string }) => {
      await api.put(`/knowledge/pending-rules/${id}/reject`, { comment });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-rules'] });
    },
  });
}

/** 导入行业预置数据 */
export function useImportPresetData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/knowledge/import', {
        source: 'industry-preset',
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['knowledge-rules'] });
    },
  });
}
```

- [ ] **Step 2: 创建知识库管理页面**

```tsx
// frontend/src/pages/KnowledgePage.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useKnowledgeRules, usePendingRules, useFaultCases, useApprovePendingRule, useRejectPendingRule, useImportPresetData } from '../hooks/useKnowledge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export default function KnowledgePage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('rules');
  const { data: rulesData } = useKnowledgeRules({ page: 1, pageSize: 50 });
  const { data: pendingData } = usePendingRules('Pending');
  const { data: casesData } = useFaultCases({});
  const approveMutation = useApprovePendingRule();
  const rejectMutation = useRejectPendingRule();
  const importMutation = useImportPresetData();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('knowledge.title', '知识库管理')}</h1>
        <Button
          onClick={() => importMutation.mutate()}
          disabled={importMutation.isPending}
          variant="outline"
        >
          {t('knowledge.importPreset', '导入行业预置数据')}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="rules">{t('knowledge.rules', '正式规则')}</TabsTrigger>
          <TabsTrigger value="pending">
            {t('knowledge.pending', '待审核')}
            {pendingData?.total ? (
              <Badge variant="secondary" className="ml-2">{pendingData.total}</Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="cases">{t('knowledge.cases', '故障案例')}</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {rulesData?.items.map((rule) => (
            <Card key={rule.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{rule.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                      {rule.enabled ? t('knowledge.enabled', '启用') : t('knowledge.disabled', '禁用')}
                    </Badge>
                    <Badge variant="outline">{rule.deviceType}</Badge>
                    {rule.accuracyRate != null && (
                      <span className="text-sm text-muted-foreground">
                        {t('knowledge.accuracy', '准确率')}：{(rule.accuracyRate * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{rule.conclusion}</p>
                {rule.recommendedActions && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('knowledge.actions', '措施')}：{rule.recommendedActions}
                  </p>
                )}
                <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                  <span>{t('knowledge.confidence', '置信度')}：{(rule.confidenceWeight * 100).toFixed(0)}%</span>
                  <span>{t('knowledge.matches', '匹配次数')}：{rule.successCount}</span>
                  <span>{t('knowledge.source', '来源')}：{rule.source}</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!rulesData?.items?.length) && (
            <p className="text-center text-muted-foreground py-8">{t('knowledge.noRules', '暂无知识规则')}</p>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingData?.items.map((rule) => (
            <Card key={rule.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{rule.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{rule.deviceType}</Badge>
                    {rule.confidence != null && (
                      <span className="text-sm text-muted-foreground">
                        AI {t('knowledge.confidence', '置信度')}：{(rule.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{rule.conclusion}</p>
                {rule.recommendedActions && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('knowledge.actions', '措施')}：{rule.recommendedActions}
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => approveMutation.mutate({ id: rule.id })}
                    disabled={approveMutation.isPending}
                  >
                    {t('knowledge.approve', '批准')}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => rejectMutation.mutate({ id: rule.id, comment: '不适用' })}
                    disabled={rejectMutation.isPending}
                  >
                    {t('knowledge.reject', '驳回')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!pendingData?.items?.length) && (
            <p className="text-center text-muted-foreground py-8">{t('knowledge.noPending', '暂无待审核规则')}</p>
          )}
        </TabsContent>

        <TabsContent value="cases" className="space-y-4">
          {casesData?.items.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{c.faultDescription}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{c.deviceType}</Badge>
                    <Badge variant={c.isVerified ? 'default' : 'secondary'}>
                      {c.isVerified ? t('knowledge.verified', '已验证') : t('knowledge.unverified', '待验证')}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm"><strong>{t('knowledge.rootCause', '根因')}：</strong>{c.rootCause}</p>
                <p className="text-sm"><strong>{t('knowledge.solution', '解决方案')}：</strong>{c.solution}</p>
                {c.repairDurationMinutes && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('knowledge.duration', '维修耗时')}：{c.repairDurationMinutes} 分钟
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
          {(!casesData?.items?.length) && (
            <p className="text-center text-muted-foreground py-8">{t('knowledge.noCases', '暂无故障案例')}</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 3: 添加路由**

在 `App.tsx` 路由配置中添加：
```tsx
{ path: '/knowledge', element: <KnowledgePage /> }
```

- [ ] **Step 4: 添加 i18n 翻译键**

在 `zh.json` 添加 `knowledge.*` 翻译键，在 `en.json` 添加对应英文翻译。

- [ ] **Step 5: 编译确认**

Run: `cd frontend && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 6: 提交**

```bash
git add frontend/src/hooks/useKnowledge.ts frontend/src/pages/KnowledgePage.tsx frontend/src/App.tsx frontend/src/i18n/
git commit -m "feat: 前端知识库管理页面 — 规则/候选/案例三标签页 + 审核操作"
```
