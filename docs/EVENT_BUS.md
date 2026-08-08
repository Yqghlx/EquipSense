# 事件总线（EventBus）

> 模块间解耦的核心基础设施。本项目提供两种可配置切换的实现：
> **进程内事件总线**（默认，零依赖）和 **RabbitMQ 持久化事件总线**（生产高可用）。

## 架构

```
发布者(Service) ──PublishAsync──> IEventBus ──> [InMemory: Channel | RabbitMQ: Exchange]
                                                      │
                                                      ▼
                                               消费者循环（后台）
                                                      │
                                          DI 作用域解析 Handler ──> 处理事件
```

两种实现都实现 `EquipAI.Core.Interfaces.IEventBus`，通过配置切换，业务代码（`PublishAsync` / `Subscribe`）零感知。

## 实现对比

| 维度 | InMemoryEventBus（默认） | RabbitMqEventBus |
|------|--------------------------|-------------------|
| 持久化 | ❌ 进程内 Channel，重启丢未消费事件 | ✅ 消息落盘，broker 重启不丢 |
| 重试 | ❌ 处理器抛异常仅记日志 | ✅ 失败进重试队列，TTL 到期重投 |
| 死信 | ❌ 无 | ✅ 超过重试上限进死信队列供排查 |
| 多实例 | ❌ 事件不跨进程（仅当前实例消费者） | ✅ 多实例竞争消费同一队列（work queue） |
| 部署依赖 | 无 | RabbitMQ 服务 |
| 适用场景 | 单实例开发/测试、事件可容忍丢失 | 生产、多实例、事件不可丢（告警/工单/分析） |

## 切换方式

### 配置驱动

```json
// appsettings.json
{
  "EventBus": {
    "Provider": "InMemory",  // 或 "RabbitMQ"
    "RabbitMq": {
      "Host": "localhost",
      "Port": 5672,
      "Username": "guest",
      "Password": "guest",
      "MaxRetryCount": 5,
      "RetryIntervalSeconds": 30
    }
  }
}
```

环境变量覆盖（Docker / CI）：

```bash
EventBus__Provider=RabbitMQ
EventBus__RabbitMq__Host=rabbitmq
EventBus__RabbitMq__Password=s3cret
```

`.env` 模板见 `docker/.env.example` 的 `EVENTBUS_PROVIDER` / `RABBITMQ_*` 段。

### Docker 启用

`docker/docker-compose.yml` 已包含 `rabbitmq` 服务（3.13-management-alpine，含管理 UI）。

```bash
# .env 设置
EVENTBUS_PROVIDER=RabbitMQ
RABBITMQ_PASSWORD=<强密码>

# 启动
docker compose -f docker/docker-compose.yml up -d
```

管理 UI：http://localhost:15672（用户 equipai / .env 中的 RABBITMQ_PASSWORD）

## RabbitMQ 队列拓扑

每个事件类型（按 CLR FullName）一套队列：

```
equipai.events.{EventType}              主队列    — DLX → retry-exchange
equipai.events.{EventType}.retry        重试队列  — TTL=RetryIntervalSeconds, DLX → 主 exchange
equipai.events.{EventType}.dead         死信队列  — 无消费者，堆积供人工排查
```

**重试回路**：处理器抛异常 → `nack(requeue=false)` → 主队列 DLX 投到重试队列 →
TTL 到期 → 重试队列 DLX 投回主队列 → 重新消费。

**死信兜底**：通过 `x-death` header 累计推断重试次数，超过 `MaxRetryCount`（默认 5）
后原样转发到死信队列（附 `x-dead-reason` 异常信息），不再重投。

**队列类型**：`quorum`（quorum queue）—— 跨节点强一致 + 持久化，生产可用性高于 classic。

## 为什么默认 InMemory

1. **单实例部署够用**：Phase 1 模块化单体，单实例下 InMemoryEventBus 功能完整
2. **零额外依赖**：开发/测试无需启动 RabbitMQ
3. **可平滑升级**：配置切 `RabbitMQ` 即启用，业务代码零改动

**何时切 RabbitMQ**：
- 多实例部署（事件需跨进程分发）
- 对事件可靠性要求高（进程重启不能丢告警/工单事件）
- 需要可观测的事件处理状态（RabbitMQ 管理 UI + 死信队列）

## 当前订阅的事件

`Program.cs` 启动时注册（11 个订阅，覆盖告警、工单、分析、遥测全链路）：

| 事件 | 处理器 | 作用 |
|------|--------|------|
| `TelemetryReceivedEvent` | `TelemetryEventHandler` | 触发告警评估 |
| `AlertTriggeredEvent` | `AlertEventHandler` | SignalR 推送告警 |
| `AlertTriggeredEvent` | `RootCauseAnalysisHandler` | AI 根因分析 |
| `AlertTriggeredEvent` | `WorkOrderAutoCreateHandler` | 自动建单 |
| `AlertAcknowledgedEvent` | `AlertStatusNotificationHandler` | 推送确认状态 |
| `AlertResolvedEvent` | `AlertStatusNotificationHandler` | 推送解决状态 |
| `AnalysisCompletedEvent` | `WorkOrderAnalysisHandler` | 工单关联分析 |
| `WorkOrderStatusChangedEvent` | `KnowledgeCaptureHandler` | 知识沉淀 |
| `WorkOrderStatusChangedEvent` | `WorkOrderIntegrationHandler` | 钉钉/飞书/Webhook |
| `WorkOrderCreatedEvent` | `WorkOrderNotificationHandler` | 推送新工单 |
| `WorkOrderStatusChangedEvent` | `WorkOrderNotificationHandler` | 推送状态变更 |

## 测试

### 单元测试（无需 broker）

`tests/EquipAI.Tests.Unit/Eventing/RabbitMqEventBusOptionsTests.cs`：
- `RabbitMqOptions` 默认值验证（13 项生产基线）
- 配置绑定（`EventBus:RabbitMq` 节 → 对象）
- Provider 切换逻辑（大小写不敏感、空值默认 InMemory）
- 队列命名约定（反射验证私有方法，防改名导致孤儿队列）
- 持久化投递常量（`DeliveryModes.Persistent == 2`）

### 集成测试（需 RabbitMQ 容器）

`RabbitMqEventBus` 实例化需真实 broker 连接。端到端交付测试（发布 → 持久化 → 重启消费 → 重试 → 死信）
应在集成层用 Testcontainers.RabbitMq 完成。当前未包含——因本项目默认 InMemory，
集成测试用 InMemoryEventBus 即覆盖业务逻辑；切 RabbitMQ 部署时再补充。

## 文件清单

| 文件 | 作用 |
|------|------|
| `src/EquipAI.Core/Interfaces/IEventBus.cs` | 事件总线接口（PublishAsync / Subscribe） |
| `src/EquipAI.Application/Eventing/InMemoryEventBus.cs` | 默认进程内实现（Channel + 后台消费） |
| `src/EquipAI.Infrastructure/Messaging/RabbitMqEventBus.cs` | RabbitMQ 持久化实现（重试 + 死信） |
| `src/EquipAI.Infrastructure/Messaging/RabbitMqOptions.cs` | RabbitMQ 配置选项 |
| `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs` | DI 切换（配置驱动） |
