# 知识库控制器租户资源边界加固实施计划

> **Goal:** 让正式规则和候选规则控制器及候选规则审批服务的列表、ID 定位与存在性检查显式匹配当前租户，防止 DbContext 已跟踪其他租户实体或全局过滤器配置异常时发生越权读写。

**Architecture:** 保留 `AppDbContext` 全局查询过滤器作为默认隔离层；控制器在资源查询中加入 `ITenantContext.TenantId` 条件，审批服务由控制器显式接收并匹配租户 ID，确保 HTTP 资源边界与调用方租户一致。系统预置规则仍通过已有专用导入流程处理，不扩大普通租户列表的可见范围。

**Tech Stack:** .NET 8、ASP.NET Core MVC、EF Core 8、xUnit、FluentAssertions、InMemory provider。

## 约束

- 所有新增注释、测试说明和文档使用简体中文。
- 不修改真实凭据、证书、数据库卷或 `docker/.env`。
- 先用 DbContext 租户 A 与控制器租户 B 的跟踪实体复现旧 `FindAsync` 和列表查询路径，再修改生产代码。
- 完成前运行聚焦测试、完整单元测试、Release 编译和独立审查。

## Task 1：建立跨租户红测

**Files:**

- Add: `tests/EquipAI.Tests.Unit/Web/KnowledgeRulesControllerTests.cs`
- Add: `tests/EquipAI.Tests.Unit/Web/PendingRulesControllerTests.cs`
- Modify: `tests/EquipAI.Tests.Unit/Knowledge/KnowledgeCaptureServiceTests.cs`

覆盖正式规则切换、候选规则删除、两个列表入口以及候选规则审批/驳回；租户 A 的实体不能被租户 B 的控制器或审批服务读取、修改。

- [x] 编写测试并运行聚焦测试，确认旧实现失败。

验证证据：新增 7 条跨租户测试在旧实现回放中全部失败（7 失败、0 通过）；恢复修复后控制器与审批服务聚焦测试 31/31 通过。

## Task 2：加入显式租户条件

**Files:**

- Modify: `src/EquipAI.WebAPI/Controllers/Knowledge/KnowledgeRulesController.cs`
- Modify: `src/EquipAI.WebAPI/Controllers/Knowledge/PendingRulesController.cs`
- Modify: `src/EquipAI.Application/Knowledge/KnowledgeCaptureService.cs`

为列表、`FindAsync` 替代查询、规则存在性检查以及候选规则审批/驳回定位加入 `TenantId` 条件，保持正常租户内 CRUD 与审批行为不变。

- [x] 完成最小实现并通过聚焦测试。

验证证据：正式规则和候选规则列表、更新、启停、版本存在性、删除、编辑后批准、单条/批量审批与驳回均显式绑定租户；跨租户审批不创建正式规则、不改变候选状态。

## Task 3：完整验证、审查和提交

- [x] 运行完整单元测试。
- [x] 运行 Release 解决方案编译，确认 0 警告、0 错误。
- [x] 独立审查、`git diff --check`，提交 `fix(security): enforce tenant boundary in knowledge controllers`。

验证证据：完整单元测试 1549/1549 通过；Release 解决方案编译 0 警告、0 错误；独立审查在补齐审批服务遗漏后复审结论 Approved，无阻断项。
