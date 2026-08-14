# 工单附件删除可靠化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 使用现有事务 Outbox 和 RabbitMQ 重试链路，使工单附件物理删除失败时可自动重试且不会产生无记录的删除任务。

**Architecture:** `WorkOrderAttachmentService` 在删除元数据的同一 DbContext 中发布 `WorkOrderAttachmentDeletedEvent`；生产 `TransactionalEventBus` 将删除与 Outbox 原子提交。独立的 `WorkOrderAttachmentDeletionHandler` 只负责调用 `IFileStorageService`，任何非取消异常继续抛出给 RabbitMQ 的重试/死信逻辑。

**Tech Stack:** .NET 8、EF Core、RabbitMQ/Transactional Outbox、xUnit、Moq、FluentAssertions。

## Global Constraints

- 不新增数据库表、迁移、NuGet 包或附件 API。
- 所有新增代码注释、日志和测试说明使用中文。
- 生产路径必须保持租户 ID 和存储路径来自已验证的附件记录。
- 物理删除处理器不得吞掉非取消异常；幂等删除由现有 Local/S3 存储实现保证。
- 不修改 `docker/.env`，不提交或推送 Git 改动。

---

### Task 1: 建立事件契约和失败回归测试

**Files:**
- Create: `src/EquipAI.Core/Events/WorkOrderAttachmentDeletedEvent.cs`
- Modify: `tests/EquipAI.Tests.Unit/WorkOrders/WorkOrderAttachmentServiceTenantIsolationTests.cs`
- Modify: `tests/EquipAI.Tests.Unit/Web/WorkOrderAttachmentsControllerTests.cs`
- Modify: `tests/EquipAI.Tests.Unit/Eventing/TransactionalOutboxTests.cs`
- Create: `tests/EquipAI.Tests.Unit/WorkOrders/WorkOrderAttachmentDeletionHandlerTests.cs`

**Interfaces:**
- Produces `WorkOrderAttachmentDeletedEvent : IIntegrationEvent` with `EventId`, `OccurredAt`, `TenantId`, `WorkOrderId`, `AttachmentId`, and `StoragePath`.
- The service will accept `IEventBus` and publish the event before its final `SaveChangesAsync`, matching the existing transactional event pattern.

- [x] **Step 1: 为租户边界和服务发布行为写失败测试**

在现有附件服务租户测试中注入严格的 fake/mock `IEventBus`，增加以下断言：其他租户删除抛出 `KeyNotFoundException` 且没有发布事件；同租户删除发布一个事件，事件中的租户、工单、附件和存储路径与实体一致，数据库记录最终删除。

- [x] **Step 2: 为处理器行为写失败测试**

新增处理器测试，使用一个真实的测试替身 `IFileStorageService`：删除成功时记录精确的 `StoragePath`；存储抛出普通异常时 `HandleAsync` 仍抛出；传入已取消令牌时不调用存储并传播取消。

- [x] **Step 3: 为事件安全序列化写失败测试**

在事务 Outbox 测试中构造 `WorkOrderAttachmentDeletedEvent`，断言 `IntegrationEventSerializer.Serialize` 的类型名稳定，反序列化后所有字段一致；未知类型仍被拒绝。

- [x] **Step 4: 运行红灯测试**

运行：

```bash
dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~WorkOrderAttachment|FullyQualifiedName~TransactionalOutbox"
```

预期：编译或断言失败，原因是事件、处理器和新的服务依赖尚未实现；修正测试自身错误后再进入实现。

---

### Task 2: 接入事务事件和删除处理器

**Files:**
- Modify: `src/EquipAI.Application/WorkOrders/WorkOrderAttachmentService.cs`
- Create: `src/EquipAI.Application/WorkOrders/Handlers/WorkOrderAttachmentDeletionHandler.cs`
- Modify: `src/EquipAI.Infrastructure/Messaging/IntegrationEventSerializer.cs`
- Modify: `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs`
- Modify: `src/EquipAI.WebAPI/Program.cs`
- Modify: `src/EquipAI.WebAPI/Controllers/WorkOrderAttachmentsController.cs`

**Interfaces:**
- `WorkOrderAttachmentService(AppDbContext, ITenantContext, IEventBus, ILogger<WorkOrderAttachmentService>)`。
- `WorkOrderAttachmentDeletionHandler(IFileStorageService, ILogger<WorkOrderAttachmentDeletionHandler>)`。

- [x] **Step 1: 实现事件和序列化白名单**

按 Task 1 的字段定义事件，加入 `IntegrationEventSerializer` 的显式类型白名单，不使用运行时反射反序列化未知类型。

- [x] **Step 2: 让服务把元数据删除和事件登记放在同一变更批次**

在租户校验后先 `Remove(attachment)`，发布 `WorkOrderAttachmentDeletedEvent`，再调用 `SaveChangesAsync`。RabbitMQ 生产路径由 `TransactionalEventBus` 保存 Outbox 与实体删除；测试和 InMemory 路径继续由服务的显式 `SaveChangesAsync` 完成。

- [x] **Step 3: 实现 fail-closed 的物理删除处理器**

处理器在开始时检查取消令牌，调用 `IFileStorageService.DeleteAsync(event.StoragePath)`；成功记录结构化日志。仅对宿主取消传播 `OperationCanceledException`，普通异常记录错误后重新抛出，使 RabbitMQ 触发既有重试/死信。

- [x] **Step 4: 完成 DI 和事件订阅注册**

将处理器注册为 Scoped，并在启动订阅 `WorkOrderAttachmentDeletedEvent -> WorkOrderAttachmentDeletionHandler`。这同时覆盖 RabbitMQ transport 和 InMemory transport，避免生产 Outbox 有事件但没有消费者。

- [x] **Step 5: 移除控制器的第二套物理删除路径**

`DeleteAttachment` 只调用服务并返回 `NoContent`；删除物理对象由事件处理器执行。上传失败补偿删除路径保持不变，因为它发生在元数据事务提交之前。

- [x] **Step 6: 运行绿灯聚焦测试**

运行 Task 1 的命令，确认新增事件、处理器、服务和现有附件控制器测试全部通过；失败时只修改实现，不放宽断言。

---

### Task 3: 完成回归验证和文档证据

**Files:**
- Modify: `docs/LANDING_READINESS_REPORT.md`
- Modify: `docs/evaluation/S09-风险登记册.md`
- Modify: `docs/OPS_RUNBOOK.md`
- Review: all files changed by Tasks 1–2

- [x] **Step 1: 运行后端全量单元测试**

```bash
dotnet test tests/EquipAI.Tests.Unit
```

记录通过、跳过和失败数量；不得把处理器失败测试标为跳过。

- [x] **Step 2: 运行 Release 编译**

```bash
dotnet build EquipAI.sln -c Release --no-restore -m:1 -p:UseSharedCompilation=false
```

确认 0 warning、0 error。

- [x] **Step 3: 运行生产脚本回归和差异检查**

```bash
bash -n docker/production-acceptance.sh docker/deploy-production.sh docker/production-readiness.sh
bash tests/scripts/production-scripts-test.sh all
git diff --check
```

- [x] **Step 4: 更新风险登记和运维说明**

将 R18 的代码缓解说明更新为“删除任务通过事务 Outbox 持久化并由 RabbitMQ 重试/死信”，同时明确生产验收仍需检查死信告警和实际对象存储恢复。运维剧本补充：删除死信消息前必须确认 `StoragePath`、租户和对象存储权限，不得直接删除业务元数据。

- [x] **Step 5: 完成工作区审查**

确认没有修改 `docker/.env`、没有生成凭据、没有新增英文注释或日志、没有触碰无关用户改动；保留实际环境中尚未配置的凭据/证书/外部服务阻塞项，不把代码测试结果写成生产上线证明。
