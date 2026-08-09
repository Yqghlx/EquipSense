# EquipSense 事务 Outbox 与幂等 Inbox 设计

## 背景与目标

RabbitMQ v2 已经具备持久化队列、发布确认、有限重试和独立死信队列，但业务数据库提交与消息发布仍是两个独立动作。进程可能在 `SaveChangesAsync` 成功后、消息发布前退出，造成数据库状态已经改变而下游永远收不到事件；消费者也可能在业务副作用提交后、RabbitMQ 确认前退出，随后重复执行同一副作用。

本阶段补齐两个边界：

1. **Outbox**：事件先以业务数据库事务的一部分持久化，后台分发器再可靠发布到 RabbitMQ。
2. **Inbox**：按“事件 ID + 处理器”记录消费进度，重复投递只允许一个处理器实例取得租约，已完成事件直接确认跳过。

本阶段不引入微服务、不改现有事件契约、不改变 InMemory 开发/测试模式；生产 RabbitMQ 模式启用完整链路。

## 设计原则

- 事件 ID 由业务方生成并贯穿 Outbox、RabbitMQ `message_id`、Inbox，重启和重试不生成新 ID。
- 事件类型只能来自代码内置白名单，禁止根据数据库内容调用任意 CLR 类型，避免反序列化扩大攻击面。
- Outbox 和 Inbox 都带 `tenant_id`，后台任务必须显式使用 `IgnoreQueryFilters()`，同时按载荷租户限定处理范围。
- 采用“至少一次投递 + 幂等消费”，不宣称恰好一次；发布确认成功但状态更新前崩溃时，允许同一事件再次发布，由 Inbox 兜底。
- 租约使用带条件的数据库更新，不依赖进程内锁；多实例部署时每个实例都可以安全竞争任务。
- Outbox 发布失败不丢弃记录，采用指数退避持续重试，并保留最后一次错误供日志和运维查询。
- Inbox 只在处理器成功返回后标记完成；处理器异常时释放租约，让 RabbitMQ 现有 retry/dead 拓扑继续接管失败处理。

## 数据模型

### `outbox_messages`

| 字段 | 说明 |
| --- | --- |
| `id` | 事件 ID，主键，防止同一事件重复入箱 |
| `tenant_id` | 事件所属租户 |
| `event_type` | 稳定的白名单类型名 |
| `payload` | 使用固定 JSON 选项序列化的事件载荷 |
| `occurred_at` | 业务事件发生时间 |
| `created_at` | Outbox 入库时间 |
| `available_at` | 下一次可领取时间 |
| `attempt_count` | 已领取/尝试发布次数 |
| `locked_until` | 分发租约过期时间 |
| `lock_token` | 当前租约令牌，防止旧实例覆盖新实例结果 |
| `published_at` | RabbitMQ 发布确认后的时间；为空表示待发布 |
| `last_error` | 最近一次发布失败原因，截断保存 |

索引：`(published_at, available_at, locked_until, created_at)` 用于领取，`(tenant_id, created_at)` 用于租户运维查询。

### `inbox_messages`

| 字段 | 说明 |
| --- | --- |
| `id` | Inbox 记录主键 |
| `event_id` | RabbitMQ 消息对应的事件 ID |
| `handler_key` | 处理器稳定全名；同一事件的不同处理器分别去重 |
| `tenant_id` | 事件所属租户 |
| `received_at` | 首次被当前应用接收的时间 |
| `attempt_count` | Inbox 租约尝试次数 |
| `locked_until` | 当前处理租约过期时间 |
| `lock_token` | 当前租约令牌 |
| `processed_at` | 处理器成功返回后的时间；为空表示未完成 |
| `last_error` | 最近一次处理失败原因，截断保存 |

唯一索引：`(event_id, handler_key)`。该组合而不是单独的事件 ID，是因为一个事件会广播给多个处理器。

## 运行流程

```text
业务修改 + Outbox 入库
          │ 同一个 DbContext/事务
          ▼
     outbox_messages
          │ 带租约领取，失败指数退避
          ▼
     RabbitMQ v2 exchange
          │ 每个处理器独立队列
          ▼
  Inbox 领取事件+处理器租约
       ├─ 已完成：ack，跳过
       ├─ 他实例持有租约：抛出瞬时错误，进入 Rabbit retry
       └─ 当前实例取得租约：执行业务处理，成功后标记 processed，再 ack
```

`TransactionalEventBus.PublishAsync` 会把事件写入当前作用域的 `AppDbContext` 并保存：当调用方仍有未提交业务变更时，两者在同一次 `SaveChangesAsync` 中提交；兼容仍在保存后发布的旧路径时，至少保证事件自身进入持久化 Outbox。关键业务路径将逐步调整为“先登记事件、再保存业务状态”。

## 并发与故障边界

### Outbox

1. 读取候选记录。
2. 使用 `UPDATE ... WHERE` 条件同时检查未发布、租约已过期，并写入新的 `lock_token` 与 `locked_until`。
3. 只有受影响行数为 1 的实例拥有发布权。
4. 发布确认成功后，仅使用相同 `lock_token` 更新 `published_at`；旧实例不能覆盖新租约。
5. 发布失败清除租约，按 `min(2^attempt, maxBackoff)` 安排下一次尝试；不删除记录。
6. 实例在发布成功、状态更新前崩溃时，租约过期后会再次发布同一 `message_id`，由 Inbox 去重。

### Inbox

1. 首次消费插入记录并取得租约；唯一键冲突时重新读取状态。
2. `processed_at` 非空时视为已处理，直接 ack。
3. `processed_at` 为空且租约未过期时视为其他实例正在处理，抛出瞬时错误，交给 Rabbit retry。
4. 租约过期时用条件更新抢占；处理器成功后只允许持有当前 `lock_token` 的实例标记完成。
5. 处理器失败记录错误并释放租约；RabbitMQ 负责重试次数和死信转移。

## 安全边界

- `event_type` 只能解析为内置事件类型映射；未知类型不会被反射实例化，会保留在 Outbox 等待人工修复/回放。
- Inbox/Outbox 后台查询不依赖请求中的租户上下文，所有租户条件来自已验证的事件字段；业务处理器仍须使用事件租户做显式过滤。
- 事件载荷和错误信息均限制长度，避免异常堆栈或恶意 payload 无界增长数据库。
- 不在日志中输出事件完整载荷，日志只记录事件类型、事件 ID、租户 ID 和处理器。

## 测试策略

- 序列化白名单：全部现有事件可往返，未知类型拒绝。
- Outbox：业务状态与事件一起提交；发布失败保留记录并退避；并发领取只有一个租约成功；旧租约不能覆盖新状态。
- Inbox：重复事件不重复调用处理器；未过期租约不能被第二实例抢占；过期租约可恢复；处理失败可重试。
- RabbitMQ：保留现有真实 broker 测试，并增加启用 Inbox 后的重复投递断言。
- 数据库迁移、SQLite 集成测试、全量单元测试、覆盖率和依赖漏洞扫描均必须通过。

## 上线与回滚

1. 先执行迁移，确认两张表和索引存在，再发布启用 RabbitMQ Outbox 的应用。
2. 观察 Outbox 待发布数量、最老消息年龄、发布失败日志和 Inbox 重复跳过日志。
3. Outbox 分发器异常时，业务写入仍保留消息；恢复后自动补发。
4. 可通过配置切回 InMemory 作为 break-glass，但生产环境不得长期使用；数据库表和迁移保留，不执行破坏性回滚。
