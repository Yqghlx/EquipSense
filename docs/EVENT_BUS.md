# 事件总线（EventBus）

EquipSense 通过 `IEventBus` 解耦告警、分析、工单和通知模块。生产环境默认使用 RabbitMQ；Development 和 Testing 默认使用 InMemory，避免本地开发被外部 broker 阻塞。

## 运行模式

| 维度 | InMemoryEventBus | RabbitMqEventBus |
|---|---|---|
| 适用环境 | 开发、测试、生产紧急降级 | 生产默认 |
| 持久化 | 无，进程重启会丢未处理事件 | 持久化消息 + quorum queue |
| 多处理器语义 | 进程内广播 | 每个处理器独立队列和确认 |
| 失败处理 | 日志记录 | 有限重试 + 独立死信队列 |
| 发布成功语义 | 已写入进程内队列 | broker 已确认且至少路由到一个队列 |

只接受 `InMemory` 和 `RabbitMQ` 两个 Provider，拼写错误会拒绝启动。生产环境使用 InMemory 还必须显式设置：

```env
EventBus__Provider=InMemory
EventBus__AllowInMemoryInProduction=true
```

该开关只用于故障期间的 break-glass，启用后日志会记录最高级别告警；进程重启仍会丢失未处理事件。

## RabbitMQ v2 拓扑

应用启动时先登记全部订阅，再由 `RabbitMqEventBus` 托管服务统一连接并启动消费者。每个事件使用一个 fanout exchange，每个处理器使用独立队列：

```text
equipai.v2.events.{event-key}                      事件广播交换机
equipai.v2.{event-key}.{handler-key}              处理器主队列
equipai.v2.{event-key}.{handler-key}.retry        处理器重试队列
equipai.v2.{event-key}.{handler-key}.dead         处理器死信队列
```

类型键由可读类型简称和 `Type.FullName` 的稳定 SHA-256 摘要组成，不包含程序集版本。v2 前缀与旧 `equipai.events.*` 拓扑隔离，避免队列参数变化触发声明冲突。

主队列处理失败后执行 `nack(requeue=false)`，消息进入自己的 retry 队列；TTL 到期后返回原主队列。`MaxRetryCount=5` 表示包括首次处理在内总共最多执行五次。计数来自当前主队列、`reason=rejected` 的 `x-death.count`，不是 `x-death` 数组长度。

达到上限时，应用先用持久化、mandatory 和 publisher confirm 把消息写入该处理器 dead 队列，确认成功后才 ack 原消息。死信发布失败时原消息保持未确认，避免静默丢失。

## 发布和连接保证

- 发布通道启用 Publisher Confirms 和确认跟踪。
- 所有发布使用 `mandatory=true`；无路由、broker Nack、断连或取消会向调用方报错。
- 共享发布通道由异步信号量串行保护，避免 AMQP 帧交错。
- 消费处理通过 `WaitAsync` 强制执行 `HandlerTimeoutSeconds`。
- RabbitMQ 连接、发布通道或消费者未就绪时，`/health/ready` 返回失败；`/health` liveness 不受影响。

## 配置

```env
EVENTBUS_PROVIDER=RabbitMQ
RABBITMQ_IMAGE=rabbitmq:4.3.4-management-alpine
RABBITMQ_USER=equipai
RABBITMQ_PASSWORD=<至少16字符的强密码>
EventBus__RabbitMq__Host=rabbitmq
EventBus__RabbitMq__Port=5672
EventBus__RabbitMq__MaxRetryCount=5
EventBus__RabbitMq__RetryIntervalSeconds=30
```

生产 Compose 会加载 `docker/rabbitmq/definitions.json`，为 `equipai.v2.*` quorum 队列设置 `dead-letter-strategy=at-least-once` 和 `overflow=reject-publish`。外部 RabbitMQ 部署必须应用等价策略。应用不需要 management 权限，策略验证由部署前置检查完成。

## 版本升级和旧队列

RabbitMQ 镜像变量是必填项，目的是让已有部署在变更容器前安全失败。不得把 3.13 数据卷直接挂载到 4.3；保留消息时必须按官方支持路径 `3.13 -> 4.2 -> 4.3` 升级，并在每一步启用稳定 feature flags。

切换 v2 后先排空旧 `equipai.events.*` 主队列和 retry 队列，旧 dead 队列保留供人工检查。应用和部署脚本不会自动删除旧队列、死信或 RabbitMQ 数据卷。详细步骤见 [`OPS_RUNBOOK.md`](OPS_RUNBOOK.md)。

## 测试

- 单元测试覆盖 Provider 安全校验、拓扑命名、压缩 `x-death` 解析、总尝试次数边界、生命周期和 readiness。
- `tests/EquipAI.Tests.Integration/Eventing/RabbitMqEventBusIntegrationTests.cs` 使用真实 RabbitMQ 验证多处理器隔离、有限重试、并发确认发布和重启恢复。
- 本地默认跳过真实 broker 测试；CI 设置 `RUN_RABBITMQ_INTEGRATION_TESTS=true` 并强制执行。

## 可靠性边界

当前实现提供 RabbitMQ 内的 at-least-once 投递，不提供恰好一次。单节点 quorum queue 只增强重启恢复能力，不等同于多节点高可用。业务数据库提交和消息发布仍不是同一原子事务；下一阶段必须通过事务 Outbox、幂等 Inbox 和消费者副作用去重补齐这一窗口。
