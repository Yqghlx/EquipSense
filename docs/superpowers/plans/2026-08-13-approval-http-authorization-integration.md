# 审批 HTTP 授权集成验证实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在真实 HTTP 管道中证明审批链的租户、角色和指定审批人授权不会被 JWT、租户解析或控制器调用点回归破坏。

**Architecture:** 新增独立的控制器集成测试类，复用现有 `CustomWebApplicationFactory` 和生产同源 `JwtTokenService`。测试直接写入最小工单/审批数据，再通过 `WorkOrdersController` 与 `ApprovalChainsController` 发起请求，断言 HTTP 状态和数据库最终状态；仅在红灯证明管道缺陷时修改生产代码。

**Tech Stack:** .NET 8、ASP.NET Core `WebApplicationFactory`、xUnit、FluentAssertions、EF Core SQLite 集成夹具。

## Global Constraints

- 所有新增测试注释和日志使用简体中文。
- 必须使用真实 JWT 声明，不 mock 认证、租户上下文或审批服务。
- 越权场景必须同时断言 `403` 和数据库无副作用。
- 保留当前工作区已有用户变更，不执行破坏性 Git 操作，不提交无关文件。
- PostgreSQL 迁移验证仍以 `production-runtime-smoke.sh` 为准，SQLite 只验证 HTTP 管道组合行为。

---

### Task 1: 建立最小审批 HTTP 集成夹具

**Files:**
- Create: `tests/EquipAI.Tests.Integration/Controllers/ApprovalAuthorizationIntegrationTests.cs`
- Read-only reference: `tests/EquipAI.Tests.Integration/Infrastructure/CustomWebApplicationFactory.cs`
- Read-only reference: `src/EquipAI.Infrastructure/Identity/JwtTokenService.cs`

**Interfaces:**
- Consumes: `CustomWebApplicationFactory.CreateClientWithSeedAsync()`、`JwtTokenService.GenerateAccessToken(User)`、`AppDbContext`。
- Produces: 当前测试类中的 `CreateAuthenticatedClientAsync(Guid userId, Guid tenantId, UserRole role)`、`SeedPendingApprovalAsync(...)` 和数据库快照断言辅助方法。

- [ ] **Step 1: 编写最小成功路径测试**

测试名称：`Approve_WithMatchingRoleAndSpecificApprover_Returns200AndPersistsApproval`

测试准备一个默认租户内的工单、一个 `ExpectedRole = "MaintenanceLead"` 且 `SpecificApproverId` 等于 JWT `sub` 的 Pending 审批记录；使用 `MaintenanceLead` JWT 调用：

```csharp
var response = await client.PostAsJsonAsync(
    $"/api/v1/work-orders/{workOrderId}/approve",
    new ApprovalActionRequest("HTTP 集成测试通过"));

response.StatusCode.Should().Be(HttpStatusCode.OK);
```

随后从 `AppDbContext` 重新读取记录，断言 `Action == ApprovalAction.Approved`、`ApproverId`、意见和 `ActedAt` 已写入，并断言单步骤工单进入 `WorkOrderStatus.Accepted`。

- [ ] **Step 2: 运行测试确认当前实现可通过或暴露真实管道问题**

运行：

```bash
dotnet test tests/EquipAI.Tests.Integration --filter 'FullyQualifiedName~ApprovalAuthorizationIntegrationTests.Approve_WithMatchingRoleAndSpecificApprover_Returns200AndPersistsApproval' --verbosity minimal
```

预期：若当前 HTTP 管道完整，测试通过；若夹具或声明映射存在缺陷，先修正测试准备代码，不能把断言放宽为“非 500”。

- [ ] **Step 3: 仅在红灯证明生产管道缺陷时实施最小修复**

优先检查顺序固定为：JWT `role`/`sub` 声明 → `TenantResolutionMiddleware` → `RequirePermission` → 控制器调用 → 服务层。若是生产代码缺陷，新增对应回归断言后只修改缺陷所在文件，并保留 `403` 语义。

- [ ] **Step 4: 运行成功路径测试确认通过**

运行同一条聚焦命令，预期输出 `Passed: 1, Failed: 0`。

### Task 2: 覆盖 HTTP 越权无副作用

**Files:**
- Modify: `tests/EquipAI.Tests.Integration/Controllers/ApprovalAuthorizationIntegrationTests.cs`

**Interfaces:**
- Consumes: Task 1 的 JWT 客户端、审批数据准备和快照辅助方法。
- Produces: 角色越权、指定审批人越权和跨租户越权的 HTTP 回归证据。

- [ ] **Step 1: 添加角色不匹配测试**

测试名称：`Approve_WithWrongRole_Returns403AndDoesNotMutateState`

准备 `ExpectedRole = "MaintenanceLead"` 的 Pending 记录，使用同租户且具有 `workorder:accept` 权限、但角色与步骤不匹配的 JWT 调用审批接口。断言 `403`，记录仍为 Pending，`ApproverId`、`Comment`、`ActedAt` 为空，工单仍为原状态。

- [ ] **Step 2: 添加指定审批人不匹配测试**

测试名称：`Approve_WithDifferentSpecificApprover_Returns403AndDoesNotMutateState`

准备角色匹配但 `SpecificApproverId` 指向用户 B 的记录，使用用户 A 的 `MaintenanceLead` JWT 调用审批接口。断言 `403` 和同一组无副作用字段。

- [ ] **Step 3: 添加驳回路径对称测试**

测试名称：`Reject_WithDifferentSpecificApprover_Returns403AndDoesNotMutateState`

沿用指定审批人不匹配夹具调用 `/reject-approval`，断言 `403`，不得把 Pending 改成 Rejected，也不得改变工单状态。

- [ ] **Step 4: 运行聚焦越权测试确认全部通过**

运行：

```bash
dotnet test tests/EquipAI.Tests.Integration --filter 'FullyQualifiedName~ApprovalAuthorizationIntegrationTests' --verbosity minimal
```

预期：成功路径 1 个、角色/指定审批人越权路径 3 个和跨租户资源不可见路径 1 个全部通过；跨租户工单应返回 `404`，同租户存在但无 Pending 步骤仍由现有服务契约返回 `409`，任何 `401` 或 `500` 都视为夹具/管道失败，不降低断言。

### Task 3: 覆盖待审批列表的 HTTP 过滤边界

**Files:**
- Modify: `tests/EquipAI.Tests.Integration/Controllers/ApprovalAuthorizationIntegrationTests.cs`

**Interfaces:**
- Consumes: Task 1 的用户/租户 ID 和审批记录准备方法。
- Produces: `GET /api/v1/approval-chains/pending` 的租户、角色和指定用户过滤证据。

- [ ] **Step 1: 添加列表过滤测试**

测试名称：`PendingApprovals_ReturnsOnlyCurrentTenantRoleAndSpecificUserRecords`

在同一数据库准备至少四条 Pending 记录：当前租户、当前角色、指定当前用户的记录应返回；当前租户同角色但指定其他用户、当前租户其他角色、其他租户同角色同用户的记录均不得返回。使用当前用户请求 `/api/v1/approval-chains/pending`，反序列化为 `List<WorkOrderApprovalDto>`，只断言第一条记录的 ID 出现，并断言其余三条 ID 不出现。

- [ ] **Step 2: 添加缺失角色 fail-closed 保护测试**

使用不带 `role` Claim 但具有有效签名的测试 JWT 请求待审批列表，断言权限中间件返回 `403` 而不是放行到所有角色的待办。服务层缺失角色返回空数组的语义已由单元测试覆盖；HTTP 层必须保留认证授权边界。若认证声明无法构造，则把 JWT 生成辅助方法限定在测试范围内，并保持签名校验；禁止把接口改成返回全部待办。

- [ ] **Step 3: 运行列表测试**

运行：

```bash
dotnet test tests/EquipAI.Tests.Integration --filter 'FullyQualifiedName~ApprovalAuthorizationIntegrationTests.PendingApprovals' --verbosity minimal
```

预期：所有过滤断言通过。

### Task 4: 全量验证并同步证据

**Files:**
- Modify: `docs/LANDING_READINESS_REPORT.md`
- Modify: `docs/evaluation/S09-风险登记册.md`
- Modify: `docs/evaluation/00-INDEX.md`
- Modify: `docs/evaluation/14-测试策略与金字塔分析.md`

**Interfaces:**
- Consumes: 集成测试输出、Release 构建输出和现有生产 smoke 证据。
- Produces: 审批授权“服务单测 + HTTP 集成测试”双层验证记录。

- [ ] **Step 1: 运行后端全量验证**

```bash
dotnet build EquipAI.sln --configuration Release --no-restore -m:1 --disable-build-servers
dotnet test tests/EquipAI.Tests.Unit --configuration Release --no-build --verbosity minimal
dotnet test tests/EquipAI.Tests.Integration --configuration Release --no-build --verbosity minimal
```

- [ ] **Step 2: 运行差异、脚本和必要前端门禁**

```bash
git -c core.fsmonitor=false diff --check
bash -n tests/scripts/production-scripts-test.sh
bash tests/scripts/production-scripts-test.sh all
```

前端只在生产代码被修改时重新运行 TypeScript、Lint、i18n、Vitest 和 build；若仅新增测试，则记录无需重复构建的理由。

- [ ] **Step 3: 更新文档中的实际数量和测试范围**

只使用本轮命令输出填写测试数量；新增审批 HTTP 集成测试文件和具体场景，不把 SQLite 证据描述为 PostgreSQL 迁移证据。

- [ ] **Step 4: 做最终工作区审计**

检查所有审批调用点、测试输出、差异格式和工作区状态；保留用户现有修改，不执行提交、重置或清理。
