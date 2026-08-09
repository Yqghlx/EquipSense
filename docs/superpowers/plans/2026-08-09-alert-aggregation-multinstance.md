# 多实例告警聚合生产化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将告警聚合窗口从单实例内存状态升级为 Redis 原子共享状态，并在 Redis 故障时安全降级。

**Architecture:** Core 定义状态存储与告警决策契约；Application 负责窗口语义和本地降级；Infrastructure 使用 Redis Lua 脚本实现 `INCR + PEXPIRE` 原子计数；WebAPI 通过 Singleton DI 注入共享存储。告警评估调用链改为异步，以避免 Redis I/O 阻塞遥测线程。

**Tech Stack:** .NET 8、ASP.NET Core、StackExchange.Redis、xUnit、FluentAssertions、Moq、EF Core InMemory。

## Global Constraints

- 30 分钟窗口内同设备+同规则+同指标仍然是第 1 次创建、第 2–3 次更新、超过 3 次静默。
- Redis 不可用时必须保留本地降级，不能因为聚合状态存储异常丢失当前告警。
- 所有新增代码注释、日志和文档使用中文。
- 不修改数据库 Schema，不改变已有告警重启兜底规则。
- `TreatWarningsAsErrors=true` 必须保持有效。

---

### Task 1: 定义 Core 聚合契约

**Files:**
- Create: `src/EquipAI.Core/Interfaces/IAlertAggregationStateStore.cs`
- Create: `src/EquipAI.Core/Interfaces/AlertAggregationDecision.cs`
- Modify: `src/EquipAI.Core/Interfaces/IAlertAggregator.cs`

**Interfaces:**
- Produces `IAlertAggregationStateStore.IncrementAsync(string, TimeSpan, CancellationToken)`。
- Produces `AlertAggregationDecision(bool ShouldCreate, bool ShouldUpdate, bool Silenced)`。
- Produces `IAlertAggregator.EvaluateAsync(Guid, Guid, string, CancellationToken)`。

- [ ] **Step 1: 先新增契约测试编译入口**

在 `tests/EquipAI.Tests.Unit/Alerts/AlertAggregatorTests.cs` 增加一个使用 `Task<AlertAggregationDecision>` 的测试方法，断言第一次调用 `ShouldCreate=true`。该测试在契约未实现时必须无法编译，作为本任务的红灯入口。

- [ ] **Step 2: 运行测试确认红灯原因是契约缺失**

Run: `dotnet test tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj --configuration Release --no-restore --filter "FullyQualifiedName~AlertAggregatorTests"`

Expected: FAIL/编译错误，指出 `EvaluateAsync` 或 `AlertAggregationDecision` 尚未定义，而不是运行时断言失败。

- [ ] **Step 3: 写入最小 Core 契约**

```csharp
namespace EquipAI.Core.Interfaces;

/// <summary>告警聚合状态存储，负责跨实例原子递增窗口计数。</summary>
public interface IAlertAggregationStateStore
{
    /// <summary>递增指定窗口并在首次写入时设置过期时间。</summary>
    Task<long> IncrementAsync(string key, TimeSpan window, CancellationToken cancellationToken = default);
}

/// <summary>告警聚合器根据窗口计数返回的处理决策。</summary>
public readonly record struct AlertAggregationDecision(bool ShouldCreate, bool ShouldUpdate, bool Silenced);
```

把 `IAlertAggregator` 的同步 `Evaluate` 替换为带取消令牌的 `EvaluateAsync`。

- [ ] **Step 4: 重新编译 Core 与测试项目，确认进入实现层错误**

Run: `DOTNET_CLI_HOME=/private/tmp/equipsense-dotnet-cli-home dotnet build EquipAI.sln --configuration Release --no-restore`

Expected: 不再报告契约缺失；其余错误只来自尚未迁移的聚合器和调用方。

### Task 2: 实现 Application 聚合器与本地降级

**Files:**
- Modify: `src/EquipAI.Application/Alerts/AlertAggregator.cs`
- Modify: `src/EquipAI.Application/Alerts/AlertEvaluationService.cs`
- Modify: `tests/EquipAI.Tests.Unit/Alerts/AlertAggregatorTests.cs`
- Modify: `tests/EquipAI.Tests.Unit/Alerts/AlertEvaluationServiceTests.cs`

**Interfaces:**
- Consumes `IAlertAggregationStateStore`。
- Produces asynchronous aggregation decisions while preserving existing tuple semantics through named properties.

- [ ] **Step 1: 增加共享状态存储替身并写跨实例失败测试**

在测试文件中增加一个线程安全的 `IAlertAggregationStateStore` 替身，让两个 `AlertAggregator` 实例共享同一字典；断言第一个实例创建、第二个实例更新、第四次调用静默。另加一个抛出 `InvalidOperationException` 的替身，断言同一实例仍能本地创建后更新。

- [ ] **Step 2: 运行聚合器测试确认红灯**

Run: `dotnet test tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj --configuration Release --no-restore --filter "FullyQualifiedName~AlertAggregatorTests"`

Expected: 新增跨实例测试失败，因为当前实现没有状态存储注入和异步接口。

- [ ] **Step 3: 实现最小异步聚合器**

实现以下行为：有状态存储时以 `alert:aggregate:{deviceId:N}:{ruleId:N}:{Uri.EscapeDataString(metric.Trim())}` 作为键并递增 30 分钟窗口；无状态存储或存储异常时使用现有 `AlertWindow`；异常日志按至少 60 秒限频。

- [ ] **Step 4: 迁移告警评估调用**

把 `AlertEvaluationService` 的 `_aggregator.Evaluate(...)` 改为 `await _aggregator.EvaluateAsync(..., cancellationToken)`，并让该段代码在取消时传播 `OperationCanceledException`。

- [ ] **Step 5: 运行聚合器与告警评估测试确认绿灯**

Run: `dotnet test tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj --configuration Release --no-restore --filter "FullyQualifiedName~AlertAggregatorTests|FullyQualifiedName~AlertEvaluationServiceTests"`

Expected: 新旧聚合语义全部通过，且没有编译警告。

### Task 3: 实现 Redis 原子状态存储

**Files:**
- Create: `src/EquipAI.Infrastructure/Cache/RedisAlertAggregationStateStore.cs`
- Create: `tests/EquipAI.Tests.Unit/Cache/RedisAlertAggregationStateStoreTests.cs`

**Interfaces:**
- Consumes `IConnectionMultiplexer`。
- Produces `IAlertAggregationStateStore`。

- [ ] **Step 1: 写 Redis 脚本行为测试**

使用 `Mock<IDatabase>` 让 `ScriptEvaluateAsync` 返回 `RedisResult.Create(2, ResultType.Integer)`，断言状态存储传入一个 Redis key、一个窗口毫秒参数，并返回 `2`。

- [ ] **Step 2: 运行测试确认 Redis 实现缺失**

Run: `dotnet test tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj --configuration Release --no-restore --filter "FullyQualifiedName~RedisAlertAggregationStateStoreTests"`

Expected: FAIL/编译错误，因为 `RedisAlertAggregationStateStore` 尚未定义。

- [ ] **Step 3: 实现 Lua 原子计数**

```csharp
private const string IncrementScript = """
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
return count
""";
```

在调用前检查取消令牌，执行 `ScriptEvaluateAsync`，把整数结果转换为 `long`，并拒绝非正窗口时长。

- [ ] **Step 4: 运行 Redis 存储测试确认绿灯**

Run: `dotnet test tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj --configuration Release --no-restore --filter "FullyQualifiedName~RedisAlertAggregationStateStoreTests"`

Expected: 全部通过。

### Task 4: 接入 DI 与回归验证

**Files:**
- Modify: `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs`
- Modify: `tests/EquipAI.Tests.Unit/Pipeline/FullPipelineTests.cs`
- Modify: `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs:282-284`

- [ ] **Step 1: 注册 Redis 状态存储**

在已有 `IConnectionMultiplexer` Singleton 注册后增加：

```csharp
services.AddSingleton<IAlertAggregationStateStore, RedisAlertAggregationStateStore>();
services.AddSingleton<IAlertAggregator, AlertAggregator>();
```

并把“内存状态”注释改为“Redis 共享状态 + 本地降级”。

- [ ] **Step 2: 更新无 Redis 的测试容器注册**

让流水线测试继续显式注册无状态构造的 `AlertAggregator`，或提供内存替身，确保测试不尝试连接真实 Redis。

- [ ] **Step 3: 运行完整 Release 构建**

Run: `DOTNET_CLI_HOME=/private/tmp/equipsense-dotnet-cli-home DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1 dotnet build EquipAI.sln --configuration Release --no-restore --disable-build-servers`

Expected: 0 警告、0 错误。

- [ ] **Step 4: 运行完整单元测试**

Run: `DOTNET_CLI_HOME=/private/tmp/equipsense-dotnet-cli-home DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1 dotnet test tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj --configuration Release --no-build --no-restore`

Expected: 所有单元测试通过，测试宿主需要允许本地通信端口。

- [ ] **Step 5: 检查差异与多租户键隔离**

Run: `git diff --check` 和 `rg -n "alert:aggregate|EvaluateAsync|IAlertAggregationStateStore" src tests`

Expected: 无空白错误；聚合键包含设备 ID、规则 ID 和指标，且没有把租户 ID 省略到可能跨租户冲突的共享键空间中（设备/规则 UUID 全局唯一；如后续允许非全局 ID，应再加入 tenantId）。
