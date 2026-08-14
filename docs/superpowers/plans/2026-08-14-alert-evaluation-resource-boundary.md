# 告警规则评估资源边界 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将告警评估热路径的规则读取改为稳定主键游标分页，避免规则规模增长导致单次无界加载，同时保持所有匹配规则都被评估。

**Architecture:** `AlertEvaluationService` 保留现有逐规则业务处理逻辑，仅把规则查询包裹为按 `AlertRule.Id` 升序的 500 条批次循环。SQLite 回归测试通过真实 EF Core 查询和数据库命令拦截器验证 `LIMIT` 与跨批完整评估，不通过复制生产查询逻辑的测试替身验证实现。

**Tech Stack:** .NET 8、EF Core 8、SQLite 内存数据库、xUnit、FluentAssertions、Moq、`DbCommandInterceptor`。

## Global Constraints

- 所有新增代码注释、日志和文档使用简体中文。
- 必须先写回归测试并观察旧实现失败，再修改生产代码。
- 每次数据库读取必须有明确上限；规则过滤必须保留租户、启用状态、指标、设备和设备类型条件。
- 不修改真实凭据、部署环境、数据库 Schema，不执行 Git 提交、暂存或推送。
- 完成声明前必须重新运行测试、构建和相关质量门禁，并如实记录仍存在的外部环境阻塞项。

---

### Task 1: 固化设计并建立跨批资源边界回归测试

**Files:**
- Create: `docs/superpowers/specs/2026-08-14-alert-evaluation-resource-boundary-design.md`
- Create: `tests/EquipAI.Tests.Unit/Alerts/AlertEvaluationResourceBoundaryTests.cs`

**Interfaces:**
- Consumes: 现有 `AlertEvaluationService.EvaluateForDeviceAsync`、`AppDbContext`、`IAlertRuleEvaluator`。
- Produces: 一个使用 501 条匹配规则的 SQLite 回归测试，能在旧的无界 `ToListAsync` 下失败。

- [x] **Step 1: 写明方案、边界和验收标准**

  设计文档必须明确 500 条批次、`AlertRule.Id` 游标、`AsNoTracking`、完整评估和非目标范围。

- [x] **Step 2: 编写失败测试**

  测试准备一个内存 SQLite 数据库、一个租户、一个设备和 501 条 `temperature`/`Threshold`/启用规则；评估器返回 `false`，避免测试把告警创建副作用混入资源边界断言。命令拦截器记录规则表的 `SELECT`，并断言评估器调用 501 次、规则查询非空且每次包含 `LIMIT`：

  ```csharp
  [Fact]
  public async Task 规则评估_超过单批大小时应限制每批查询并完整评估()
  {
      _queryInterceptor.Reset();

      using var scope = _serviceProvider.CreateScope();
      var service = scope.ServiceProvider.GetRequiredService<AlertEvaluationService>();

      await service.EvaluateForDeviceAsync(
          _tenantId, _deviceId, "电机", "temperature", 50d, new DeviceContext());

      _evaluatorMock.Verify(
          evaluator => evaluator.Evaluate(
              It.IsAny<double>(), It.IsAny<AlertRule>(), It.IsAny<DeviceContext>()),
          Times.Exactly(501));
      _queryInterceptor.GetRuleSelects()
          .Should().NotBeEmpty()
          .And.OnlyContain(sql => sql.Contains("LIMIT", StringComparison.OrdinalIgnoreCase));
  }
  ```

  数据库查询使用真实 `AppDbContext`；仅将评估器、事件总线和聚合器替换为测试依赖，因为测试需要观察规则是否逐条进入现有业务边界，而不需要触发告警副作用。

- [x] **Step 3: 运行测试确认旧实现按预期失败**

  运行：

  ```bash
  dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~AlertEvaluationResourceBoundaryTests" --logger "console;verbosity=minimal"
  ```

  预期：测试失败在 `LIMIT` 断言；旧实现仍会调用评估器 501 次，但会产生无界规则 `SELECT`，因此失败原因证明测试捕获的是资源边界而非拼写或初始化错误。

### Task 2: 实现告警规则稳定游标分页

**Files:**
- Modify: `src/EquipAI.Application/Alerts/AlertEvaluationService.cs:95-120`
- Test: `tests/EquipAI.Tests.Unit/Alerts/AlertEvaluationResourceBoundaryTests.cs`

**Interfaces:**
- Consumes: Task 1 的 SQLite 回归测试和现有告警评估业务分支。
- Produces: `EvaluateForDeviceAsync` 每次只读取最多 500 条匹配规则，并继续处理全部批次。

- [x] **Step 1: 增加最小分页实现**

  将现有规则查询改为 `AsNoTracking().OrderBy(r => r.Id)` 的 `IQueryable`，循环中追加 `Id > lastRuleId`、`Take(500)` 和取消令牌。保留原 `foreach (var rule in rules)` 内的全部评估、锁、聚合、告警和事件逻辑；每批完成后用最后一条规则 ID 推进游标，空批次结束。

  ```csharp
  const int ruleEvaluationBatchSize = 500;
  var matchedRules = dbContext.AlertRules
      .IgnoreQueryFilters()
      .AsNoTracking()
      .Where(/* 保留现有匹配条件 */)
      .OrderBy(rule => rule.Id);
  Guid? lastRuleId = null;

  while (true)
  {
      var batchQuery = matchedRules;
      if (lastRuleId.HasValue)
      {
          batchQuery = batchQuery.Where(rule => rule.Id > lastRuleId.Value);
      }

      var rules = await batchQuery.Take(ruleEvaluationBatchSize)
          .ToListAsync(cancellationToken);
      if (rules.Count == 0)
      {
          break;
      }

      foreach (var rule in rules)
      {
          // 保留现有单条规则处理逻辑
      }

      lastRuleId = rules[^1].Id;
      if (rules.Count < ruleEvaluationBatchSize)
      {
          break;
      }
  }
  ```

  实际代码中使用项目既有字段名和中文注释，不改变规则过滤或下游语义。

- [x] **Step 2: 运行新增测试确认通过**

  运行同 Task 1 的聚焦命令，预期 `AlertEvaluationResourceBoundaryTests` 通过，且没有数据库或取消令牌异常。

- [x] **Step 3: 运行现有告警评估回归测试**

  运行：

  ```bash
  dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~AlertEvaluationServiceTests|FullyQualifiedName~AlertEvaluationResourceBoundaryTests" --logger "console;verbosity=minimal"
  ```

  预期所有告警评估测试通过，既有创建、更新、静默、自动恢复、租户隔离和事件行为不变。

### Task 3: 全量验证并更新生产就绪证据

**Files:**
- Modify: `docs/evaluation/00-INDEX.md`
- Modify: `docs/evaluation/05-代码质量分析.md`
- Modify: `docs/evaluation/08-DevOps与CI_CD分析.md`
- Modify: `docs/evaluation/14-测试策略与金字塔分析.md`
- Modify: `docs/LANDING_READINESS_REPORT.md`

**Interfaces:**
- Consumes: Task 2 的代码和测试结果。
- Produces: 与实际测试数量、质量门禁和剩余生产环境阻塞项一致的文档证据。

- [x] **Step 1: 运行后端单元测试、集成测试和 Release 构建**

  ```bash
  dotnet test tests/EquipAI.Tests.Unit --no-restore --logger "console;verbosity=minimal"
  dotnet test tests/EquipAI.Tests.Integration --no-restore --logger "console;verbosity=minimal"
  dotnet build EquipAI.sln --configuration Release --no-restore -m:1 -p:BuildInParallel=false -p:UseSharedCompilation=false
  ```

  预期：单元测试 1769 个总数、1765 个通过、4 个跳过；集成测试 199 个总数、193 个通过、6 个跳过；Release 构建成功且无警告/错误。若实际计数不同，以命令输出为准并同步文档。

- [x] **Step 2: 运行脚本语法、生产脚本和差异检查**

  ```bash
  bash tests/scripts/production-scripts-test.sh all
  bash -n docker/deploy-production.sh tests/scripts/production-scripts-test.sh
  git -c core.fsmonitor=false diff --check
  ```

  预期脚本测试通过、Shell 语法通过、差异无空白错误。

- [x] **Step 3: 按真实输出更新文档并复核剩余阻塞项**

  更新测试总数及“告警评估热路径已按 500 条稳定游标分页”的证据；保留并明确当前环境校验、运行时镜像、Docker daemon、TLS/凭据和外部验收仍需真实环境完成的阻塞项，不把本地代码验证表述为生产部署已完成。

- [x] **Step 4: 重新运行文档和代码质量检查**

  ```bash
  rg -n "1769|1765|2960|告警评估|分页|无界" docs/evaluation docs/LANDING_READINESS_REPORT.md
  git -c core.fsmonitor=false diff --check
  ```

  预期新增数字与测试输出一致，文档没有旧计数或空白错误。

本计划的改动保留在当前工作区供用户审阅，不执行 Git 暂存、提交或推送。
