# 集成路由工单租户边界加固实施计划

> **Goal:** 让 `IntegrationRouter` 在按工单 ID读取创建通知内容时显式匹配调用方租户，防止跨租户工单标题被推送到错误的外部集成并产生错误租户日志。

**Architecture:** 保留后台路由所需的 `UnfilteredSet`，同时在工单定位条件中显式加入 `TenantId`；集成配置、推送参数和 `IntegrationPushLog` 继续使用调用方传入的租户 ID。

**Tech Stack:** .NET 8、EF Core 8、xUnit、FluentAssertions、InMemory provider、Moq。

## 约束

- 所有新增注释、测试说明和文档使用简体中文。
- 不修改真实凭据、证书、数据库卷或 `docker/.env`。
- 先用同一数据库中的两个租户工单复现旧查询跨租户命中，再修改生产代码。
- 完成前运行聚焦测试、完整单元测试、Release 编译和独立审查。

## Task 1：建立跨租户红测

**Files:**

- Modify: `tests/EquipAI.Tests.Unit/WorkOrders/IntegrationRouterTests.cs`

新增租户 A 调用路由、传入租户 B 工单 ID时不应调用任何集成的测试，并确认旧实现会错误推送。

- [x] 编写测试并运行聚焦测试，确认旧实现失败。

验证证据：新增跨租户测试在旧实现下失败，实际调用了 1 次外部推送；聚焦测试首轮为 1 失败、12 通过。

## Task 2：加入显式租户校验

**Files:**

- Modify: `src/EquipAI.Application/WorkOrders/Router/IntegrationRouter.cs`

在创建通知的工单定位查询中同时匹配 `workOrderId` 和 `tenantId`，保持正常推送、重试和日志行为不变。

- [x] 完成最小实现并通过聚焦测试。

验证证据：`IntegrationRouterTests` 13/13 通过；修复后跨租户调用不触发外部推送，也不创建错误租户的 `IntegrationPushLog`。

## Task 3：完整验证、审查和提交

- [x] 运行完整单元测试。
- [x] 运行 Release 解决方案编译，确认 0 警告、0 错误。
- [x] 独立审查、`git diff --check`，提交 `fix(security): enforce tenant boundary in integration router`。

验证证据：完整单元测试 1540/1540 通过；Release 解决方案编译 0 警告、0 错误；独立审查结论 Approved，无阻断项。
