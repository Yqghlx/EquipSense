# 工单附件服务租户边界加固实施计划

> **Goal:** 让工单附件的列表、上传前工单校验、下载/删除定位、创建和删除操作显式绑定当前租户，防止附件元数据或物理文件路径被跨租户访问。

**Architecture:** 保留 `AppDbContext` 全局查询过滤器作为默认隔离层；附件服务在所有资源定位和实体操作中再次匹配 `ITenantContext.TenantId`，并在创建附件前校验所属工单也属于当前租户。

**Tech Stack:** .NET 8、EF Core 8、xUnit、FluentAssertions、InMemory provider。

## 约束

- 所有新增注释、测试说明和文档使用简体中文。
- 不修改真实凭据、证书、数据库卷或 `docker/.env`。
- 先用 DbContext 租户 A 与服务租户 B 的跟踪实体复现旧附件定位路径，再修改生产代码。
- 完成前运行聚焦测试、完整单元测试、Release 编译和独立审查。

## Task 1：建立跨租户红测

**Files:**

- Add: `tests/EquipAI.Tests.Unit/WorkOrders/WorkOrderAttachmentServiceTenantIsolationTests.cs`

覆盖附件列表、工单存在性、附件查询、创建和删除；租户 A 的附件/工单不能被租户 B 读取、创建关联或删除。

- [x] 编写测试并运行聚焦测试，确认旧实现失败。

验证证据：5 条附件租户隔离测试在旧实现回放中全部失败（5 失败、0 通过）；恢复修复后附件隔离与既有控制器流程测试 10/10 通过。

## Task 2：加入显式租户校验

**Files:**

- Modify: `src/EquipAI.Application/WorkOrders/WorkOrderAttachmentService.cs`

为列表、工单存在性、附件定位加入 `TenantId` 条件；创建前验证工单租户，删除时验证实体租户，保持文件存储和正常上传下载删除流程不变。

- [x] 完成最小实现并通过聚焦测试。

验证证据：列表、工单存在性、附件定位、创建前工单校验和实体删除均显式匹配当前租户；跨租户附件不可见、不可关联、不可删除。

## Task 3：完整验证、审查和提交

- [x] 运行完整单元测试。
- [x] 运行 Release 解决方案编译，确认 0 警告、0 错误。
- [x] 独立审查、`git diff --check`，提交 `fix(security): enforce tenant boundary in work order attachments`。

验证证据：完整单元测试 1554/1554 通过；Release 解决方案编译 0 警告、0 错误；独立审查结论 Approved，无阻断项。
