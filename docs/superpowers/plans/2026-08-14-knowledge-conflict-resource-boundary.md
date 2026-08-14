# 知识规则冲突检测资源边界 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将知识规则冲突检测的无界规则加载改为稳定主键游标分页，在保持完整冲突结果的前提下控制单批数据库实体内存。

**Architecture:** `KnowledgeConflictService` 保留现有冲突解析与返回模型，只将规则读取改为 `AsNoTracking` + `KnowledgeRule.Id` 升序 + 每批 500 条的 keyset pagination。SQLite 回归测试使用真实 `AppDbContext` 和 SQL 命令拦截器，验证超过批次边界时完整返回结果且数据库侧存在 `LIMIT`。

**Tech Stack:** .NET 8、EF Core 8、SQLite 内存数据库、xUnit、FluentAssertions、`DbCommandInterceptor`。

## Global Constraints

- 所有新增代码注释、日志和文档使用简体中文。
- 必须先写回归测试并观察旧实现失败，再修改生产代码。
- 必须保留租户、设备类型、启用状态和 `excludeRuleId` 过滤条件。
- 不改变现有 API 返回类型，不静默截断冲突结果，不修改真实凭据或部署环境。
- 不执行 Git 暂存、提交或推送。

---

### Task 1: 建立 SQLite 跨批资源边界回归

**Files:**
- Create: `docs/superpowers/specs/2026-08-14-knowledge-conflict-resource-boundary-design.md`
- Create: `tests/EquipAI.Tests.Unit/Knowledge/KnowledgeConflictResourceBoundaryTests.cs`

**Interfaces:**
- Consumes: 现有 `KnowledgeConflictService.DetectConflictsAsync` 和 `AppDbContext`。
- Produces: 501 条规则的真实 SQLite 回归，能在旧无界 `ToListAsync` 下因 SQL 缺失 `LIMIT` 而失败。

- [x] **Step 1: 固化设计边界**

  设计文档明确了 500 条批次、稳定主键游标、完整结果语义、非目标范围和验收标准。

- [x] **Step 2: 编写失败测试**

  使用 SQLite 内存数据库，种子一个租户和 501 条同设备类型、启用、包含 `temperature` 条件的知识规则。调用真实服务检测同一指标的冲突，断言返回 501 个不同规则 ID，并断言拦截到的规则查询恰好两次且每次包含 `LIMIT`：

  ```csharp
  [Fact]
  public async Task DetectConflictsAsync_规则超过单批大小时应限制查询并完整返回冲突()
  {
      _queryInterceptor.Reset();

      using var scope = _serviceProvider.CreateScope();
      var service = scope.ServiceProvider.GetRequiredService<KnowledgeConflictService>();

      var result = await service.DetectConflictsAsync(
          _tenantId,
          "pump",
          "[{\"metric\":\"temperature\",\"operator\":\">\",\"threshold\":80}]",
          null,
          CancellationToken.None);

      result.Should().HaveCount(501);
      result.Select(item => item.RuleId).Should().BeEquivalentTo(_ruleIds);
      _queryInterceptor.GetRuleSelects().Should().HaveCount(2)
          .And.OnlyContain(sql => sql.Contains("LIMIT", StringComparison.OrdinalIgnoreCase));
  }
  ```

- [x] **Step 3: 运行测试确认旧实现失败**

  ```bash
  dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~KnowledgeConflictResourceBoundaryTests" --logger "console;verbosity=minimal"
  ```

  预期旧实现失败在查询次数或 `LIMIT` 断言；如果出现编译/初始化错误，先修复测试本身，直到失败原因明确对应无界规则查询。

### Task 2: 实现稳定游标分页

**Files:**
- Modify: `src/EquipAI.Application/Knowledge/KnowledgeConflictService.cs:50-93`
- Test: `tests/EquipAI.Tests.Unit/Knowledge/KnowledgeConflictResourceBoundaryTests.cs`

**Interfaces:**
- Consumes: Task 1 的真实 SQLite 回归和既有 `KnowledgeConflictResult` 模型。
- Produces: `DetectConflictsAsync` 每次最多读取 500 条规则并处理全部批次。

- [x] **Step 1: 增加最小实现**

  将规则基础查询声明为 `IQueryable<KnowledgeRule>`，保留全部既有过滤并追加 `AsNoTracking().OrderBy(rule => rule.Id)`；循环中追加 `Id > lastRuleId`、`Take(500)`、只读投影和 `ToListAsync(ct)`。保留原有 JSON 解析、重叠指标计算、结果添加和日志逻辑。

  ```csharp
  const int conflictRuleBatchSize = 500;
  IQueryable<KnowledgeRule> matchedRules = _db.KnowledgeRules
      .AsNoTracking()
      .Where(rule => rule.DeviceType == deviceType && rule.Enabled)
      .Where(rule => excludeRuleId == null || rule.Id != excludeRuleId.Value)
      .OrderBy(rule => rule.Id);
  Guid? lastRuleId = null;

  while (true)
  {
      var batchQuery = matchedRules;
      if (lastRuleId.HasValue)
          batchQuery = batchQuery.Where(rule => rule.Id > lastRuleId.Value);

      var rules = await batchQuery
          .Take(conflictRuleBatchSize)
          .Select(rule => new { rule.Id, rule.Name, rule.Conditions })
          .ToListAsync(ct);
      if (rules.Count == 0)
          break;

      foreach (var rule in rules)
      {
          var existingMetrics = ParseMetricNames(rule.Conditions);
          var overlap = newMetrics.Intersect(existingMetrics, StringComparer.OrdinalIgnoreCase).ToList();
          if (overlap.Count > 0)
          {
              conflicts.Add(new KnowledgeConflictResult
              {
                  RuleId = rule.Id,
                  RuleName = rule.Name,
                  OverlappingMetrics = overlap
              });
          }
      }

      lastRuleId = rules[^1].Id;
      if (rules.Count < conflictRuleBatchSize)
          break;
  }
  ```

- [x] **Step 2: 运行新增测试确认通过**

  重跑 Task 1 的聚焦命令，预期 501 条规则全部返回、两条规则查询均含 `LIMIT`。

- [x] **Step 3: 运行既有知识规则回归**

  ```bash
  dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~KnowledgeConflictServiceTests|FullyQualifiedName~KnowledgeConflictResourceBoundaryTests" --logger "console;verbosity=minimal"
  ```

  预期现有冲突解析、排除自身、无重叠和空规则场景全部通过。

### Task 3: 完整验证并同步生产就绪证据

**Files:**
- Modify: `docs/evaluation/00-INDEX.md`
- Modify: `docs/evaluation/05-代码质量分析.md`
- Modify: `docs/evaluation/08-DevOps与CI_CD分析.md`
- Modify: `docs/evaluation/14-测试策略与金字塔分析.md`
- Modify: `docs/LANDING_READINESS_REPORT.md`

**Interfaces:**
- Consumes: Task 2 的代码和测试输出。
- Produces: 与实际测试数量一致的生产就绪证据，并记录真实环境仍未完成的门禁。

- [x] **Step 1: 运行后端单元、集成、Release 构建**

  ```bash
  dotnet test tests/EquipAI.Tests.Unit --no-restore --logger "console;verbosity=minimal"
  dotnet test tests/EquipAI.Tests.Integration --no-restore --logger "console;verbosity=minimal"
  dotnet build EquipAI.sln --configuration Release --no-restore -m:1 -p:BuildInParallel=false -p:UseSharedCompilation=false
  ```

- [x] **Step 2: 运行生产脚本与差异检查**

  ```bash
  bash tests/scripts/production-scripts-test.sh all
  bash -n docker/deploy-production.sh docker/production-acceptance.sh tests/scripts/production-scripts-test.sh
  git -c core.fsmonitor=false diff --check
  ```

- [x] **Step 3: 更新当前测试基线和资源边界证据**

  将后端单元测试基线、总用例数和“知识规则冲突检测稳定分页”增量写入当前状态段落；保留历史计数和环境门禁的真实状态。

- [x] **Step 4: 复核文档数字和剩余阻塞项**

  ```bash
  rg -n "KnowledgeConflict|知识规则冲突|1769|1765|2960|分页|LIMIT" docs/evaluation docs/LANDING_READINESS_REPORT.md
  git -c core.fsmonitor=false diff --check
  ```

本计划的改动保留在当前工作区供审阅，不执行 Git 暂存、提交或推送。
