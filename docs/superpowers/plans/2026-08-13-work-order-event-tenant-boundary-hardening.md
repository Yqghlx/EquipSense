# 工单后台事件租户边界加固实施计划

> **Goal:** 让告警自动建单和分析结果回写严格匹配事件载荷中的租户，防止后台处理器因 `IgnoreQueryFilters` 按全局 ID/告警 ID 命中其他租户资源。

**Architecture:** 后台处理器继续使用 `IgnoreQueryFilters` 兼容无 HttpContext 的异步事件场景，但所有规则、工单资源定位都显式加入事件 `TenantId`；保持自动建单幂等、事务、分析回写和 SignalR 推送语义不变。

**Tech Stack:** .NET 8、EF Core 8、xUnit、FluentAssertions、InMemory provider。

## 约束

- 所有新增注释、测试说明和文档使用简体中文。
- 不修改真实凭据、证书、数据库卷或 `docker/.env`。
- 先在同一数据库中用资源租户 A 和事件租户 B 复现后台 `IgnoreQueryFilters` 跨租户命中，再修改生产代码。
- 完成前运行聚焦测试、完整单元测试、Release 编译和独立审查。

## Task 1：建立跨租户红测

**Files:**

- Modify: `tests/EquipAI.Tests.Unit/WorkOrders/WorkOrderAutoCreateHandlerTests.cs`
- Modify: `tests/EquipAI.Tests.Unit/WorkOrders/WorkOrderAnalysisHandlerTests.cs`

新增事件租户与规则/工单租户不一致的测试；自动建单不得创建工单或事件，分析处理器不得修改工单或推送通知。

- [x] 编写测试并运行聚焦测试，确认旧实现失败。

验证证据：自动建单与分析回写两条跨租户测试在旧实现回放中均失败（2 失败、16 通过）；恢复修复后处理器聚焦测试 18/18 通过。

## Task 2：加入事件租户条件

**Files:**

- Modify: `src/EquipAI.Application/WorkOrders/Handlers/WorkOrderAutoCreateHandler.cs`
- Modify: `src/EquipAI.Application/WorkOrders/Handlers/WorkOrderAnalysisHandler.cs`

为规则和工单定位查询加入 `TenantId` 条件，保留既有自动建单、事务、幂等、分析更新和通知逻辑。

- [x] 完成最小实现并通过聚焦测试。

验证证据：规则查询和活跃工单幂等查询、分析回写查询均显式匹配事件 `TenantId`；跨租户事件不创建工单、不发布创建事件、不更新工单或推送通知。

## Task 3：完整验证、审查和提交

- [x] 运行完整单元测试。
- [x] 运行 Release 解决方案编译，确认 0 警告、0 错误。
- [x] 独立审查、`git diff --check`，提交 `fix(security): enforce tenant boundary in work order event handlers`。

验证证据：完整单元测试 1556/1556 通过；Release 解决方案编译 0 警告、0 错误；独立审查结论 Approved，无阻断项。
