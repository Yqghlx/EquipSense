# 知识规则版本服务显式租户边界加固实施计划

> **Goal:** 让知识规则版本历史、回滚和快照创建显式绑定当前租户，防止全局过滤器上下文与服务租户不一致时跨租户读取或修改规则。

**Architecture:** 保留 `AppDbContext` 全局过滤器作为纵深防御；`KnowledgeVersionService` 注入 `ITenantContext`，在版本历史和规则/快照定位中显式匹配当前租户。保留现有版本递增、快照、审计和异常契约。

**Tech Stack:** .NET 8、EF Core 8、xUnit、FluentAssertions、InMemory provider、Moq。

## 约束

- 所有新增注释、测试说明和文档使用简体中文。
- 不修改真实凭据、证书、数据库卷或 `docker/.env`。
- 先用 DbContext 租户 A 与服务租户 B 的跟踪实体复现旧 `FindAsync`/关联查询路径，再修改生产代码。
- 完成前运行聚焦测试、完整单元测试、Release 编译和独立审查。

## Task 1：建立跨租户红测

**Files:**

- Modify: `tests/EquipAI.Tests.Unit/Knowledge/KnowledgeVersionServiceTests.cs`

覆盖版本历史列表、回滚和快照创建。跨租户调用应按规则不存在处理，不返回历史、不改变规则或新增快照。

- [x] 编写测试并运行聚焦测试，确认旧实现失败。

验证证据：先运行新增快照红测，旧实现得到 1 失败、9 通过；完成三条边界测试后回放旧实现，历史、回滚和快照测试均失败（3 失败、9 通过）。

## Task 2：加入显式租户校验

**Files:**

- Modify: `src/EquipAI.Application/Knowledge/KnowledgeVersionService.cs`

为快照创建校验规则租户；版本历史按 `TenantId` 过滤；回滚的规则和目标快照均按 `TenantId` 定位。保留原有状态、版本、审计和 JSON 恢复逻辑。

- [x] 完成最小实现并通过聚焦测试。

验证证据：`KnowledgeVersionServiceTests` 聚焦测试 12/12 通过；跨租户快照创建、历史查询和回滚均被拒绝，回滚测试同时确认未新增快照、未写审计。

## Task 3：完整验证、审查和提交

- [x] 运行完整单元测试。
- [x] 运行 Release 解决方案编译，确认 0 警告、0 错误。
- [x] 独立审查、`git diff --check`，提交 `fix(security): enforce tenant boundary in knowledge versions`。

验证证据：知识导入受影响测试 17/17 通过；完整单元测试 1539/1539 通过；Release 解决方案编译 0 警告、0 错误；独立审查结论 Approved，无阻断项。
