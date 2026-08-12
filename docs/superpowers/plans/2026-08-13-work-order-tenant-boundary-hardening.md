# 工单服务显式租户边界加固实施计划

> **Goal:** 让工单列表、详情和全部状态变更命令显式绑定传入的 `tenantId`，防止全局过滤器上下文与业务租户不一致时发生跨租户读取、派工或状态篡改。

**Architecture:** 保留 `AppDbContext` 全局过滤器作为纵深防御；`WorkOrderService` 的所有业务资源定位查询同时使用 `id + TenantId`，列表查询使用 `TenantId`。不改变工单状态机、事件类型、错误契约或创建事务语义。

**Tech Stack:** .NET 8、EF Core 8、xUnit、FluentAssertions、InMemory provider、Moq。

## 约束

- 所有新增注释、测试说明和文档使用简体中文。
- 不修改真实凭据、证书、数据库卷或 `docker/.env`。
- 先用 DbContext 租户 A、服务参数租户 B 的跟踪实体复现旧实现，再修改生产代码。
- 完成前运行聚焦测试、完整单元测试、Release 编译和独立审查。

## Task 1：建立跨租户红测

**Files:**

- Create: `tests/EquipAI.Tests.Unit/WorkOrders/WorkOrderServiceTenantIsolationTests.cs`

覆盖 `ListAsync`、`GetByIdAsync`、`AssignAsync`、`StartAsync`、`CompleteAsync`、`AcceptAsync`、`RejectAsync`、`CloseAsync`、`CancelAsync`、`SubmitAsync`。每个测试均要求其他租户按不存在处理，并确认原工单状态不变；列表/详情不得返回数据。

- [x] 编写测试并运行聚焦测试，确认旧实现的资源定位忽略了传入 `tenantId`。

结果：旧实现下列表、详情和 8 个状态命令共 10 条测试全部失败；列表/详情会返回其他租户工单，状态命令会命中其他租户工单（派工进一步暴露执行人校验错误）。

## Task 2：在工单服务中加入显式租户谓词

**Files:**

- Modify: `src/EquipAI.Application/WorkOrders/WorkOrderService.cs`

将列表查询改为 `.Where(wo => wo.TenantId == tenantId)`，将全部按 ID 定位改为 `FirstOrDefaultAsync(wo => wo.Id == id && wo.TenantId == tenantId, ct)`。保持创建、日志查询、状态校验和事件发布行为不变。

- [x] 完成最小实现并通过聚焦回归测试。

结果：所有工单定位查询均加入 `id + TenantId`，列表查询加入 `TenantId`；聚焦回归 10/10 通过。跨租户命令统一按 `KeyNotFoundException` 处理，状态不变且不发布状态事件。

## Task 3：完整验证、审查和提交

- [x] 运行完整单元测试。

结果：1,536/1,536 通过，0 失败；原有 `WorkOrderServiceTests` 30/30 通过。

- [x] 运行 Release 解决方案编译，确认 0 警告、0 错误。

结果：`Build succeeded`，0 errors，0 warnings。

- [x] 运行 `git diff --check`，完成独立审查后提交 `fix(security): enforce tenant boundary in work order service`。

结果：独立审查 Approved、无 Blocker；审查指出的派工测试随机执行人盲点已改为工单租户内有效技术员，`git diff --check` 通过。提交待完成。
