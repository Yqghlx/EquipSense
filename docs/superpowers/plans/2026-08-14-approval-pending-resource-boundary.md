# 审批待办查询资源边界 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将审批待办查询的无界数据库读取改为稳定主键游标分批，同时保持完整待办结果和现有 API 契约。

**Architecture:** `ApprovalChainService.GetPendingApprovalsAsync` 保留现有租户、指定审批人和角色规范化逻辑，只将候选审批记录读取改为 `AsNoTracking`、最小投影、`WorkOrderApproval.Id` keyset pagination 和每批 500 条。SQLite 回归测试拦截真实 SQL，验证 501 条待办跨两批读取且不丢记录。

**Tech Stack:** .NET 8、EF Core 8、SQLite 内存数据库、xUnit、FluentAssertions、`DbCommandInterceptor`。

## Global Constraints

- 所有新增代码注释、日志和文档使用简体中文。
- 必须先写回归测试并观察旧实现失败，再修改生产代码。
- 必须保留显式 `tenantId`、`ApprovalAction.Pending`、指定审批人和角色规范化过滤。
- 不改变 `GET /api/v1/approval-chains/pending` 的路由、返回类型和完整结果语义。
- 不静默截断待办、不修改真实凭据或部署环境。
- 不执行 Git 暂存、提交或推送。

---

### Task 1: 建立 SQLite 跨批资源边界回归

**Files:**
- Create: `docs/superpowers/specs/2026-08-14-approval-pending-resource-boundary-design.md`
- Create: `tests/EquipAI.Tests.Unit/Approvals/ApprovalPendingResourceBoundaryTests.cs`

**Interfaces:**
- Consumes: `IApprovalChainService.GetPendingApprovalsAsync(Guid, Guid, string?, CancellationToken)` 和现有 `AppDbContext`。
- Produces: 501 条待审批记录的真实 SQLite 回归，能在旧无界 `ToListAsync` 下因 SQL 缺失 `LIMIT` 而失败。

- [x] **Step 1: 固化设计边界**

  检查设计文档，确认 500 条批次、稳定 `Id` 游标、完整结果、角色规范化、显式租户边界和非目标范围均已写明。

- [x] **Step 2: 编写失败测试**

  新建 `ApprovalPendingResourceBoundaryTests`，复用真实 `AppDbContext` 和 SQLite `DbCommandInterceptor`。种子 501 条同租户、`Pending`、同角色的记录，至少一条 `SpecificApproverId == null`，其余记录使用目标审批人；在记录中混入 `MaintenanceLead`、`maintenance_lead` 和 `MAINTENANCE-LEAD` 形式。测试调用：

  ```csharp
  var result = await service.GetPendingApprovalsAsync(
      tenantId,
      approverId,
      "maintenance_lead",
      CancellationToken.None);

  result.Should().HaveCount(501);
  result.Select(item => item.Id).Should().BeEquivalentTo(approvalIds);
  interceptor.GetApprovalSelects()
      .Should().HaveCount(2)
      .And.OnlyContain(sql => sql.Contains("LIMIT", StringComparison.OrdinalIgnoreCase));
  ```

  测试必须通过 `IApprovalChainService` 调用公开服务接口，而不是直接测试查询表达式。

- [x] **Step 3: 运行测试确认旧实现失败**

  ```bash
  dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~ApprovalPendingResourceBoundaryTests" --logger "console;verbosity=minimal"
  ```

  预期旧实现只发出一次审批表 SELECT 且不含 `LIMIT`，测试因查询次数或行上限断言失败；若出现编译/数据库初始化错误，先修复测试直到失败原因明确对应无界读取。

### Task 2: 实现稳定游标批次读取

**Files:**
- Modify: `src/EquipAI.Application/Approvals/ApprovalChainService.cs:360-410`
- Test: `tests/EquipAI.Tests.Unit/Approvals/ApprovalPendingResourceBoundaryTests.cs`

**Interfaces:**
- Consumes: Task 1 的 SQLite 资源边界回归和现有 `WorkOrderApprovalDto` 映射。
- Produces: `GetPendingApprovalsAsync` 每批最多读取 500 条审批投影并完整返回角色匹配待办。

- [x] **Step 1: 增加最小实现**

  保留缺失角色的早期空结果和显式基础过滤，将查询改为 `AsNoTracking()`。循环使用 `Guid? lastApprovalId` 和 `Id > lastApprovalId`，每次按 `Id` 升序 `Take(500)`，只选择 DTO 所需字段；每批在内存中调用既有 `NormalizeRole`，匹配后直接构造 `WorkOrderApprovalDto`：

  ```csharp
  var pendingQuery = dbContext.WorkOrderApprovals
      .AsNoTracking()
      .Where(a => a.TenantId == tenantId
          && a.Action == ApprovalAction.Pending
          && (a.SpecificApproverId == null || a.SpecificApproverId == approverId));

  var normalizedRole = NormalizeRole(role);
  var result = new List<WorkOrderApprovalDto>();
  Guid? lastApprovalId = null;

  while (true)
  {
      var batchQuery = pendingQuery;
      if (lastApprovalId.HasValue)
          batchQuery = batchQuery.Where(a => a.Id > lastApprovalId.Value);

      var batch = await batchQuery
          .OrderBy(a => a.Id)
          .Take(500)
          .Select(a => new
          {
              a.Id, a.WorkOrderId, a.StepOrder, a.ExpectedRole,
              a.SpecificApproverId, a.ApproverId, a.Action,
              a.Comment, a.ActedAt
          })
          .ToListAsync(ct);

      if (batch.Count == 0)
          break;

      result.AddRange(batch
          .Where(a => NormalizeRole(a.ExpectedRole) == normalizedRole)
          .Select(a => new WorkOrderApprovalDto(
              a.Id, a.WorkOrderId, a.StepOrder, a.ExpectedRole,
              a.SpecificApproverId, a.ApproverId, a.Action.ToString(),
              a.Comment, a.ActedAt)));

      lastApprovalId = batch[^1].Id;
      if (batch.Count < 500)
          break;
  }

  return result
      .OrderBy(item => item.StepOrder)
      .ThenBy(item => item.Id)
      .ToList();
  ```

  不调用 `ChangeTracker.Clear`，因为 `AsNoTracking` 和投影已经保证批次实体不会进入跟踪器；不在循环中加入结果上限。最终排序保留既有步骤顺序，并用 ID 消除同一步骤的数据库返回顺序不确定性。

- [x] **Step 2: 运行新增回归确认通过**

  ```bash
  dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~ApprovalPendingResourceBoundaryTests" --logger "console;verbosity=minimal"
  ```

  预期 501 条记录完整返回、角色格式差异全部匹配、拦截到两条带 `LIMIT` 的审批表查询。

- [x] **Step 3: 运行审批服务既有回归**

  ```bash
  dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~ApprovalChainServiceTests|FullyQualifiedName~ApprovalPendingResourceBoundaryTests" --logger "console;verbosity=minimal"
  ```

  预期既有创建/重提/通过/驳回、指定审批人、缺失角色和显式租户隔离场景全部通过。

### Task 3: 完整验证并同步生产就绪证据

**Files:**
- Modify: `docs/evaluation/00-INDEX.md`
- Modify: `docs/evaluation/05-代码质量分析.md`
- Modify: `docs/evaluation/08-DevOps与CI_CD分析.md`
- Modify: `docs/evaluation/11-性能与可扩展性基准分析.md`
- Modify: `docs/evaluation/14-测试策略与金字塔分析.md`
- Modify: `docs/evaluation/S09-风险登记册.md`
- Modify: `docs/LANDING_READINESS_REPORT.md`

**Interfaces:**
- Consumes: Task 2 的代码、聚焦测试和全量门禁输出。
- Produces: 当前测试基线、审批待办资源边界证据和剩余真实环境阻塞项的一致文档记录。

- [x] **Step 1: 运行后端全量验证**

  ```bash
  dotnet test tests/EquipAI.Tests.Unit --no-restore --logger "console;verbosity=minimal"
  dotnet test tests/EquipAI.Tests.Integration --no-restore --logger "console;verbosity=minimal"
  dotnet build EquipAI.sln --configuration Release --no-restore -m:1 -p:BuildInParallel=false -p:UseSharedCompilation=false
  ```

  使用实际输出更新文档中的单元测试、集成测试和总用例数字，不覆盖历史版本条目。

- [x] **Step 2: 运行生产脚本与差异检查**

  ```bash
  bash tests/scripts/production-scripts-test.sh all
  bash -n docker/deploy-production.sh docker/production-acceptance.sh tests/scripts/production-scripts-test.sh
  git -c core.fsmonitor=false diff --check
  ```

- [x] **Step 3: 增加审批待办资源边界证据**

  在当前状态段落、性能复核表、风险登记册和落地就绪报告中说明：待办查询按 `Id` 每批 500 条、角色在租户边界内规范化、完整结果不截断；同时说明真实 PostgreSQL 执行计划、大租户待办响应体和容量基线仍需部署侧验收。

- [x] **Step 4: 复核文档一致性和外部阻塞项**

  ```bash
  rg -n "ApprovalPending|审批待办|1770|1766|分页|LIMIT" docs/evaluation docs/LANDING_READINESS_REPORT.md
  git -c core.fsmonitor=false diff --check
  ```

  复核 `docker/validate-env.sh docker/.env --check-runtime-files`、Production smoke 和 Docker daemon 状态；真实环境失败必须原样记录，不通过修改凭据或放宽门禁来制造绿灯。

本计划的改动保留在当前工作区供审阅，不执行 Git 暂存、提交或推送。
