# 工单附件删除可靠化设计

## 背景与问题

工单附件删除目前先提交数据库元数据删除，再直接调用物理存储删除。数据库提交成功而本地磁盘或 S3 删除失败时，接口仍返回成功，代码只记录一条需要人工清理的日志。此时附件元数据已经消失，后续没有可靠的重试目标，长期运行会产生无法追踪的本地孤儿文件或 S3 孤儿对象。

## 目标

- 删除附件元数据与“删除物理对象”的请求在生产 RabbitMQ + Outbox 模式下可靠关联。
- 物理存储暂时不可用时，事件进入现有 RabbitMQ 重试/死信链路，而不是被控制器吞掉。
- 处理器必须幂等：对象已经不存在时再次删除仍视为成功。
- 保持现有 API 的 `204 No Content` 语义：用户删除成功后不需要等待外部存储完成，但系统必须保留可重试的删除任务。
- 保留上传失败时的同步补偿删除；本次不扩展为上传孤儿扫描器。

## 方案

复用现有事务事件总线，新增 `WorkOrderAttachmentDeletedEvent`：

```text
EventId, OccurredAt, TenantId, WorkOrderId, AttachmentId, StoragePath
```

`WorkOrderAttachmentService.DeleteTrackedAsync` 在校验附件租户归属后移除元数据，并在同一 DbContext 中发布事件。生产 `TransactionalEventBus` 会把待删除实体和 Outbox 记录置于同一数据库事务；数据库提交成功后，即使 RabbitMQ 暂时不可用，Outbox 分发器也会持续重试。控制器不再直接调用物理删除，避免“数据库已提交、事件没有持久化”的第二套删除路径。

新增 `WorkOrderAttachmentDeletionHandler`，仅负责调用 `IFileStorageService.DeleteAsync`。除停机取消外不吞异常：本地存储的幂等删除与 S3 的幂等删除成功后确认事件；权限、网络或其他存储异常向 RabbitMQ 返回失败，使用既有重试次数和死信队列。事件处理器不直接访问数据库，因此不改变租户查询边界。

生产配置已经要求 `EVENTBUS_PROVIDER=RabbitMQ`；InMemory 仅作为开发/测试降级，不承诺跨进程持久化。事件必须加入 `IntegrationEventSerializer` 白名单，并在 WebAPI 启动时登记 RabbitMQ 和 InMemory 的订阅，防止事件只写 Outbox 而没有消费者。

## 错误处理与边界

- 租户不匹配时，服务在发布事件前拒绝删除。
- 物理删除失败必须保留原始异常，让 RabbitMQ 的 Inbox/重试/死信逻辑接管；不能在处理器中记录后返回成功。
- 停机取消向上传播，不启动新的清理动作，也不伪造成功确认。
- `StoragePath` 只来自已校验的附件记录；存储实现继续负责路径/对象键安全校验。
- 上传元数据保存失败时仍执行现有同步补偿删除；若补偿本身失败，本轮不增加无法保证落库的“补偿任务”。

## 测试策略

- 服务测试：租户不匹配不发布事件；正常删除同时保留待提交实体删除和删除事件；事务 Outbox 测试确认事件可序列化/反序列化。
- 处理器测试：成功删除调用正确存储路径；存储失败继续抛出；取消继续传播。
- 控制器回归：删除接口不再同步删除物理文件，避免 API 请求承担外部存储可用性；现有上传补偿、下载和租户隔离测试保持通过。
- 启动契约：处理器已注册到 DI 和事件总线，事件类型已加入白名单。
- 运行 `dotnet test tests/EquipAI.Tests.Unit`、`dotnet build EquipAI.sln -c Release`、`bash tests/scripts/production-scripts-test.sh all` 及 `git diff --check`。

## 非目标

- 不新增数据库表或迁移；可靠任务直接复用现有 Outbox/Inbox。
- 不改变附件 API 响应格式、文件大小限制、下载权限和 S3 配置。
- 不声称解决上传阶段数据库不可用时的永久孤儿文件问题；该问题需要独立的存储扫描/登记设计。
