# RabbitMQ 生产可靠性基线设计

**日期：** 2026-08-09

**状态：** 已批准

**范围：** 事件总线生产默认值、投递正确性、消费隔离、运行状态和升级安全

## 1. 背景

项目已经提供 `RabbitMqEventBus`，但生产 Compose 仍默认使用 `InMemoryEventBus`。当前 RabbitMQ 实现还存在以下可靠性缺口：

1. 发布通道未启用 Publisher Confirms，连接中断窗口内不能证明消息已经到达 broker。
2. 单个 `IChannel` 可能被多个请求并发发布，违反 RabbitMQ .NET 客户端的通道并发约束。
3. `mandatory=false`，拓扑配置错误时消息可能无路由而不被发现。
4. 每次调用 `Subscribe` 都会立即启动一个消费者；同一事件注册多个处理器时会重复启动消费者。
5. 第一个消费者可能在其他处理器注册完成前消费历史消息，使后注册处理器永久漏处理。
6. 多个处理器共用一条队列和一次确认：一个处理器失败会让已成功处理器重复执行，并阻止后续处理器执行。
7. 当前用 `x-death` 数组长度估算重试次数，但 RabbitMQ 会按 `{queue, reason}` 合并记录，实际次数位于记录的 `count` 字段。
8. 生产 Compose 固定 RabbitMQ 3.13；该系列已退出社区支持，不能作为新的生产基线。
9. 现有 CI 没有连接真实 RabbitMQ，无法证明持久化、路由、重试和死信行为。

这些问题使“已提供 RabbitMQ 实现”不等于“生产事件链路可靠”。本设计把现有实现加固为可验证的至少一次投递基线。

## 2. 目标与非目标

### 2.1 目标

- Production 默认使用 RabbitMQ；Development 和 Testing 保持 InMemory，避免增加日常开发依赖。
- `PublishAsync` 成功返回时，消息已经被 broker 确认并至少路由到一个目标队列。
- 每个处理器独立消费、确认、重试和死信，互不耦合。
- RabbitMQ 暂时断连后自动恢复；不可用期间服务退出就绪状态，但不触发存活重启循环。
- 配置错误、弱凭证、未知 Provider 和初始连接失败均快速失败，不静默降级。
- 重试次数语义明确且可由真实 broker 集成测试证明。
- 新部署使用受社区支持的 RabbitMQ 版本；已有 3.13 数据卷不会被静默跨版本升级或删除。

### 2.2 非目标

- 本阶段不实现数据库事务 Outbox/Inbox，因此不解决“数据库提交成功但进程在发布前崩溃”的原子性窗口。
- 本阶段不承诺恰好一次投递；网络故障和确认丢失仍可能造成重复投递。
- 本阶段不部署 RabbitMQ 多节点集群。单节点 Compose 提供持久化，不等同于高可用；生产高可用需外部三节点 RabbitMQ 或托管服务。
- 不拆分微服务，不改变业务事件 DTO 和 `IEventBus` 的业务调用方式。

Outbox/Inbox 与消费者幂等是本阶段完成后的下一个独立生产化子项目。

## 3. 方案选择

### 3.1 采用方案

采用“生产默认 RabbitMQ + v2 每处理器独立队列 + 发布确认 + 真实 broker 测试”。

### 3.2 未采用方案

- **只改 Compose 默认值：** 无法修复未确认发布、通道并发和无限重试，不满足生产可靠性目标。
- **继续单事件共享队列，仅延迟启动消费者：** 能消除启动竞态，但仍让多个处理器共享确认和重试，故障隔离不足。
- **本次直接实现 Outbox/Inbox：** 可靠性更强，但会引入数据库迁移、调度器和所有消费者幂等改造，范围过大，应单独设计和验证。

## 4. 架构设计

### 4.1 配置解析与生产保护

新增单一、可测试的 Provider 解析逻辑，只接受 `InMemory` 和 `RabbitMQ`（大小写不敏感）。未知值在所有环境直接抛出配置异常，禁止拼写错误回退到 InMemory。

配置规则如下：

| 环境 | 默认 Provider | 约束 |
|------|----------------|------|
| Development | InMemory | 零外部依赖 |
| Testing | InMemory | 现有测试保持自包含 |
| Production | RabbitMQ | InMemory 默认禁止 |

生产环境仅可通过 `EventBus:AllowInMemoryInProduction=true` 显式启用紧急降级。启用时记录 Critical 日志，清楚说明进程重启会丢事件。该开关默认 `false`，不在 `.env.example` 中给出宽松值。

RabbitMQ 模式启动时校验：

- Host 非空且不是占位符；
- Port 在 `1..65535`；
- Username 非空；
- Password 非空且生产环境不得为 `guest`、`change-me` 或项目占位符；
- `MaxRetryCount >= 1`；
- `RetryIntervalSeconds >= 1`；
- `HandlerTimeoutSeconds >= 1`；
- `PrefetchCount >= 1`。

### 4.2 v2 队列拓扑

采用标准发布订阅语义：一个事件交换机向每个处理器队列广播，每个处理器独立确认。

```text
equipai.v2.events.{event-key}                         fanout 事件交换机
  ├─ equipai.v2.{event-key}.{handler-key}            处理器主队列
  │    ├─ .retry                                     延迟重试队列
  │    └─ .dead                                      处理器死信队列
  └─ 其他处理器拥有各自独立的 main/retry/dead 队列
```

`event-key` 和 `handler-key` 由“CLR 简短类型名 + FullName 的稳定 SHA-256 短摘要”组成。这样既能人工识别，也能避免同名类型冲突和 AMQP 队列名过长。哈希只使用 `Type.FullName`，不包含程序集版本，避免普通版本升级造成队列改名。

拓扑版本使用 `v2` 前缀，与现有 `equipai.events.*` 隔离，避免改变已声明队列参数时触发 `PRECONDITION_FAILED`，也避免新消息继续写入无人消费的旧队列。

多实例部署时，同一个处理器队列在所有实例之间竞争消费；不同处理器队列各自收到一份事件。由此实现：

- 每个处理器至少一次投递；
- 一个处理器失败不阻塞其他处理器；
- 成功处理器不会因为另一个处理器重试而重复执行；
- 同一处理器可通过增加应用实例水平扩展。

### 4.3 订阅与启动生命周期

`Subscribe<TEvent, THandler>` 只登记订阅，不建立消费者。`RabbitMqEventBus` 同时实现托管服务：

1. `Program.cs` 完成全部订阅登记；
2. Host 启动时，事件总线先建立连接；
3. 声明全部 v2 交换机、队列和绑定；
4. 每个处理器队列只启动一个消费者通道；
5. 全部成功后将事件总线状态设为 Ready；
6. 其他会发布事件的后台服务随后启动。

启动后再次调用 `Subscribe` 直接抛出异常，禁止运行期动态订阅产生不完整拓扑。拓扑声明、消费者启动或初始连接任一步骤失败，Host 启动失败，不回退到 InMemory。

### 4.4 发布路径

发布通道创建时启用：

- Publisher Confirms；
- Publisher Confirmation Tracking；
- 自动连接与拓扑恢复。

`PublishAsync` 的处理顺序：

1. 验证事件类型已注册订阅；无订阅视为配置缺陷并抛出异常。
2. 取得发布通道异步互斥锁，确保同一 `IChannel` 不被并发使用。
3. 使用 `DeliveryMode=Persistent` 和 `mandatory=true` 发布。
4. 等待 broker confirm；Nack、Basic.Return、连接中断或取消均向调用方抛出。
5. 仅在确认成功后返回。
6. 在 `finally` 中释放互斥锁。

本项目业务事件吞吐量远低于遥测数据吞吐量，单发布通道串行化优先保证正确性。暂不引入通道池；只有指标证明发布锁成为瓶颈时才扩展。

### 4.5 处理、重试与死信

每个消费者只解析并调用一个处理器。处理器成功后确认原消息；失败时：

1. 从 `x-death` 中查找当前主队列且 `reason=rejected` 的记录；
2. 读取其 `count`，并把本次失败计入总尝试次数；
3. `MaxRetryCount=5` 明确定义为“最多总共尝试五次”，即首次处理加最多四次重新投递；
4. 未达到上限时 `nack(requeue=false)`，消息进入该处理器自己的 retry 队列；
5. retry 队列 TTL 到期后只返回该处理器主队列；
6. 达到上限时，先把原消息以持久化、mandatory 和 publisher confirm 方式写入该处理器 dead 队列，再确认原消息；
7. 死信发布失败时不确认原消息，使连接恢复后可以重新投递，禁止静默丢失。

主队列和 retry 队列均使用 quorum queue。Compose 随 broker 挂载受版本控制的 definitions/policy，为 `equipai.v2.*` 队列设置 `dead-letter-strategy=at-least-once` 和 `overflow=reject-publish`；外部 RabbitMQ 部署必须执行等价 policy。DLX 目标和 routing key 仍由每个队列的声明参数指定，因为它们随处理器队列而不同。部署前置检查通过 RabbitMQ 管理 API 或容器内 `rabbitmqctl` 验证 policy；应用 readiness 只检查自身连接与拓扑启动状态，不依赖管理插件。这样既能验证可靠重试前提，也不会让业务进程持有 RabbitMQ 管理权限。

处理器超时使用可取消的 `CancellationTokenSource`。反射调用抛出的 `TargetInvocationException` 在日志和死信头中展开到根异常，便于定位真实失败原因；日志不得记录事件中的敏感载荷。

### 4.6 健康检查与可观测性

新增只读连接状态接口和 RabbitMQ 健康检查：

- 仅挂 `ready` 标签，不挂 `liveness`；
- 未完成拓扑启动、连接关闭或发布通道关闭时返回 Unhealthy；
- 自动恢复期间退出就绪状态，恢复后自动回到 Healthy；
- 健康检查不得主动创建额外连接。

启动日志记录 Provider、broker 地址、拓扑版本和订阅数量，但不记录密码。连接关闭、恢复、发布确认失败、重试和死信均使用结构化中文日志，并包含 EventId、事件类型和处理器类型。

### 4.7 Broker 版本与 Compose

生产 Compose 改为：

- `EVENTBUS_PROVIDER` 默认 `RabbitMQ`；
- backend 对 rabbitmq 使用 `condition: service_healthy`；
- `RABBITMQ_IMAGE` 为生产必填变量，`.env.example` 给出带 digest 的当前基线 `rabbitmq:4.3.4-management-alpine@sha256:44bf7eb50fe1765885659e49ccfdc775f8e531964d979321aee380a071f49f94`；
- 继续强制要求 `RABBITMQ_PASSWORD`；
- 挂载只包含 v2 队列策略的 RabbitMQ definitions/policy，不在镜像内硬编码业务密码；
- Development Compose 不强制启动 RabbitMQ，继续使用 InMemory。

把镜像变量设为必填是为了让已有部署在升级时“失败得安全”：旧 `.env` 缺少该变量时，Compose 在修改容器前直接报错，不会把 3.13 数据卷静默挂载到 4.3。

## 5. 旧版本升级策略

### 5.1 从未启用 RabbitMQ 的部署

没有业务队列数据时，备份并删除旧 RabbitMQ 数据卷，然后使用 4.3.4 创建新 broker，是最简单且风险最低的路径。

### 5.2 已启用 RabbitMQ 的部署

不得把 3.13 数据卷直接挂载到 4.3。升级顺序：

1. 使用旧应用停止新事件写入；
2. 等待旧 `equipai.events.*` 主队列和 retry 队列排空；
3. 导出 definitions，备份 RabbitMQ 数据卷；
4. 按官方支持路径从 3.13 升级到 4.2，并启用全部稳定 feature flags；
5. 再从 4.2 升级到 4.3.4；
6. 部署使用 v2 拓扑的新应用；
7. 保留旧 dead 队列供人工检查，确认不再需要后再由运维显式删除。

应用代码和部署脚本不得自动删除旧队列、死信或数据卷。

## 6. 组件边界

| 组件 | 职责 |
|------|------|
| Provider 解析器 | 解析允许值，拒绝未知值，供 DI 和启动校验共同使用 |
| RabbitMQ 配置校验器 | 校验连接、重试和生产安全约束 |
| 拓扑命名器 | 生成稳定、限长、版本化的 exchange/queue 名称 |
| `RabbitMqEventBus` | 订阅登记、生命周期、发布确认、消费与资源释放 |
| 重试头解析器 | 从 `x-death` 精确读取指定队列/原因的 `count` |
| RabbitMQ 健康检查 | 只读取现有连接与启动状态，不创建连接 |
| RabbitMQ definitions/policy | 为 v2 quorum queues 启用 at-least-once DLX，不包含凭证 |
| 部署前置检查 | 通过管理 API 或容器内 CLI 验证 v2 policy，不向业务进程授予管理权限 |
| CI RabbitMQ 集成测试 | 用真实 broker 证明路由、隔离、并发、重试和死信 |

这些组件保持单一职责，纯解析和命名逻辑可用单元测试覆盖，网络行为由真实 broker 测试覆盖。

## 7. 测试设计

### 7.1 单元测试

- Provider：大小写、空值、未知值、Production InMemory 禁止和紧急开关。
- 配置：端口、空凭证、弱密码、重试次数、超时和预取边界。
- 命名：稳定性、不同 FullName 不冲突、长度不超过 AMQP 限制、v2 前缀。
- 生命周期：重复订阅幂等、启动后订阅失败、每个订阅只生成一个消费者定义。
- 重试解析：压缩的 `x-death` 多记录、不同 queue/reason、`count` 的常见数值类型和非法头。
- 健康检查：未启动、已连接、恢复中和已关闭状态。

### 7.2 真实 RabbitMQ 集成测试

CI backend job 启动 `rabbitmq:4.3.4-alpine` 服务并等待 `rabbitmq-diagnostics -q check_running`。测试通过专用环境变量启用；本地没有 broker 时明确标记 Skip，不影响常规开发测试。

必须覆盖：

1. 一个事件的三个处理器都各收到一次。
2. 一个处理器持续失败时，其他处理器只成功执行一次。
3. `MaxRetryCount=3` 时总共调用三次，随后消息进入该处理器 dead 队列。
4. 并发发布至少 100 条消息，无通道帧错误且全部被消费。
5. 无绑定路由和 broker Nack/断连会让 `PublishAsync` 失败，而不是返回成功。
6. 应用重新创建后能继续消费重启前已确认进入 broker 的消息。

所有等待使用有界超时，失败时输出队列名、消息数和最后日志，禁止无期限轮询。

### 7.3 回归验证

- `dotnet build EquipAI.sln -c Release` 零错误、零警告；
- 全部后端单元测试和现有集成测试通过；
- CI RabbitMQ 集成测试通过；
- v2 队列 policy 已加载，真实 broker 测试证明 at-least-once DLX 前提生效；
- 生产与开发 Compose `config --quiet` 通过；
- 生产配置解析结果为 RabbitMQ，开发配置解析结果为 InMemory；
- `git diff --check` 通过；
- NuGet 漏洞扫描无已知漏洞。

## 8. 文档同步

实施时同步更新：

- `docs/EVENT_BUS.md`；
- `docs/DEPLOY.md`；
- `docs/OPS_RUNBOOK.md`；
- `docs/environment-variables.md`；
- `docker/.env.example`；
- `README.md`；
- 风险登记册与技术债务路线图中对 R03/事件总线“已修复”的证据描述；
- `CHANGELOG.md`。

文档必须明确区分“单节点持久化”和“多节点高可用”，不得把单节点 quorum queue 描述为集群高可用。

## 9. 验收标准

满足以下全部条件才可认为本阶段完成：

1. Production 默认 RabbitMQ，且未知 Provider、弱凭证和未授权 InMemory 均拒绝启动。
2. Development/Testing 默认 InMemory，现有本地开发和测试无需 RabbitMQ。
3. 每个处理器拥有独立 v2 队列，启动前完成所有订阅登记。
4. 发布使用持久化消息、mandatory、Publisher Confirms 和通道互斥。
5. 重试次数按 `x-death.count` 精确计算，达到上限后可靠进入处理器独立死信队列。
6. RabbitMQ 故障只影响 readiness，不错误触发 liveness 重启。
7. CI 用 RabbitMQ 4.3.4 真实验证多处理器隔离、并发发布、重试、死信和重启恢复。
8. 已有 3.13 数据卷有明确、非破坏性的迁移步骤，代码不自动删除任何旧数据。
9. 所有编译、测试、Compose、格式和依赖安全门禁通过。

## 10. 官方依据

- RabbitMQ .NET 客户端发布确认、通道并发和自动恢复：<https://www.rabbitmq.com/client-libraries/dotnet-api-guide>
- `x-death` 压缩规则、`count` 字段及 at-least-once dead-lettering：<https://www.rabbitmq.com/docs/dlx>
- RabbitMQ 支持生命周期：<https://www.rabbitmq.com/release-information>
- RabbitMQ 3.13 → 4.2 → 4.3 升级路径：<https://www.rabbitmq.com/docs/upgrade>
- RabbitMQ 官方 Docker 镜像标签：<https://hub.docker.com/_/rabbitmq/tags>

## 11. 后续阶段

本阶段完成后，下一优先级为事务 Outbox/Inbox：

- 业务数据与 Outbox 事件同事务提交；
- 后台发布器带租约和失败重试；
- Inbox 以 `(ConsumerName, EventId)` 唯一约束实现消费者幂等；
- 对自动建单、分析、通知和外部集成逐一补充重复投递测试。

完成 Outbox/Inbox 后，事件链路才能覆盖“数据库提交—broker—消费者副作用”的完整生产可靠性边界。
