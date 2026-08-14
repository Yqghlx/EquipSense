# RabbitMQ 真实集成测试 vhost 隔离设计

**日期：** 2026-08-13

**状态：** 已实施；远端 CI workflow 验收待完成

**范围：** RabbitMQ 集成测试的 broker 隔离、CI 前置配置、故障失败策略和测试证据

## 1. 背景

当前集成测试项目包含 6 条真实 RabbitMQ 测试，覆盖多处理器广播、处理器级重试与死信、并发发布确认、重启恢复、无路由发布失败和 broker 强制断连。CI 已启动固定版本的 RabbitMQ management 服务，并设置
`RUN_RABBITMQ_INTEGRATION_TESTS=true`，因此 CI 具备运行这些测试的条件。

测试夹具目前没有从环境读取虚拟主机，默认使用 RabbitMQ 的 `/` vhost。测试拓扑名称是固定的，清理逻辑会删除队列和交换机；断连测试还通过 management API 按连接名查找并关闭连接。在共享 broker 上显式运行测试时，这会带来两个风险：

1. 清理固定名称的队列或交换机可能影响同一 vhost 中的其他测试或应用流量；
2. 相同连接名可能匹配到非当前测试进程的连接，断连测试可能误关闭其他连接。

本地默认跳过真实 broker 测试是有意设计，但“显式启用后使用共享 `/` vhost”仍然削弱了测试作为生产证据的安全边界。

## 2. 目标与非目标

### 2.1 目标

1. 真实 RabbitMQ 集成测试只在专用测试 vhost 中创建、删除和消费拓扑。
2. CI 在运行测试前显式创建测试 vhost、设置最小范围的测试账号权限，并在该 vhost 配置 v2 可靠死信策略。
3. 开启真实测试后，vhost 缺失、权限不足、broker 不可达或策略未配置都必须使测试失败，不得回退到 `/` 或静默跳过。
4. 断连测试的 management API 操作必须同时限定连接名和测试 vhost。
5. 本地默认测试行为保持不变；未显式设置 `RUN_RABBITMQ_INTEGRATION_TESTS=true` 时仍可不依赖 broker。
6. CI 工作流契约和文档明确记录隔离约束，防止后续修改只更新测试变量而遗漏 broker 初始化。

### 2.2 非目标

- 不修改生产运行时 `RabbitMqOptions.VirtualHost` 的默认值或生产 RabbitMQ 拓扑。
- 不把 RabbitMQ 测试改造成 Testcontainers，也不新增 NuGet 依赖。
- 不在测试中自动创建或修改开发者已有的共享 broker；测试只连接调用方已经准备好的专用 vhost。
- 不把真实 RabbitMQ 测试强制加入所有本地 `dotnet test` 调用。
- 不把测试账号或密码写入仓库的生产配置，不打印密码或 management Basic Auth 内容。

## 3. 方案选择

### 3.1 采用方案：复用 CI broker，使用专用 vhost

在现有 GitHub Actions service container 中继续使用固定 digest 的 RabbitMQ 镜像。集成测试通过 `RABBITMQ_TEST_VHOST` 读取测试 vhost，默认值设为不会与应用默认 vhost 重合的 `/equipai_test`。CI 在运行集成测试前：

1. 等待 service health check 通过；
2. 创建 `/equipai_test` vhost；
3. 只给 `equipai_test` 用户授予该 vhost 的配置、写入和读取权限；
4. 在 `/equipai_test` 设置 `equipai.v2.*` 的 at-least-once dead-letter policy；
5. 通过 `RABBITMQ_TEST_VHOST=/equipai_test` 启动测试。

测试的 management API 查询连接时同时检查 `connection_name=EquipSense.EventBus` 和 `vhost=/equipai_test`。因此即使同一个 management API 服务中存在其他应用连接，也不会被断连测试选中。

该方案不增加依赖、不改变生产进程，且与现有 CI service、policy 检查和 6 条测试直接兼容；代价是本地显式运行者需要自行准备同名 vhost。

### 3.2 未采用方案：Testcontainers 自启动 broker

Testcontainers 可以让每次测试自动创建隔离 broker，进一步降低本地准备成本，但会增加测试项目依赖、Docker 运行时耦合、动态端口和容器生命周期处理。当前 CI 已经有稳定的 service container，新增一套 broker 生命周期没有足够收益。

### 3.3 未采用方案：只更新文档

仅说明“不要使用共享 broker”无法阻止测试代码实际连接 `/`，也无法避免管理 API 误选连接，不能形成可执行的隔离保证。

## 4. 详细设计

### 4.1 测试连接配置

`RabbitMqEventBusIntegrationTests.CreateOptions` 增加 `RABBITMQ_TEST_VHOST` 读取：

- 环境变量存在时使用其值；
- 未设置时使用 `/equipai_test`；
- 不再把测试默认值落到 `/`；
- 其他连接参数继续使用现有 `RABBITMQ_TEST_*` 变量和安全的测试默认值。

当 `RUN_RABBITMQ_INTEGRATION_TESTS=true` 时，专用 vhost 不存在或账号没有权限会由真实连接/拓扑声明直接抛出异常，使测试失败。不得捕获这类异常并改为 xUnit skip，也不得根据连接失败自动切换 vhost。

### 4.2 management API 断连定位

断连测试读取 management API 的 connection 列表时，保留现有固定连接名匹配，并新增 vhost 精确匹配。匹配条件必须同时满足：

```text
client_properties.connection_name == EquipSense.EventBus
vhost == RabbitMqOptions.VirtualHost
```

响应缺少 vhost 字段时视为无法证明目标连接属于测试环境，继续等待直至超时失败，不采用宽松匹配。

为使这个安全边界可以脱离网络确定性验证，将连接选择逻辑提取为集成测试项目内的纯辅助类
`RabbitMqManagementConnectionSelector`。真实 management API 调用只负责读取 JSON 并调用该选择器；选择器不执行删除操作，也不记录凭据。回归测试覆盖：同名连接存在于多个 vhost 时只返回测试 vhost 的连接，以及缺少 vhost 字段时返回空结果。

### 4.3 CI broker 初始化

在现有“配置并验证 RabbitMQ v2 可靠死信策略”步骤中完成测试 vhost 初始化。初始化逻辑必须：

- 使用 service container 的 `rabbitmqctl`，不通过业务应用管理 API 创建 vhost；
- 对 vhost 创建和权限设置使用显式的 `/equipai_test`；
- policy 使用 `-p /equipai_test`，匹配 `^equipai\.v2\.`，并保留 `dead-letter-strategy=at-least-once` 与 `overflow=reject-publish`；
- 只有 vhost、权限和 policy 校验全部成功后才进入集成测试；
- 测试步骤显式传入 `RABBITMQ_TEST_VHOST: /equipai_test`；
- 不在日志中打印密码，已有 CI service 环境变量保持不变。

CI 契约测试增加以下断言：

1. 后端 job 定义了 `/equipai_test` vhost；
2. policy 检查针对 `/equipai_test` 而不是默认 `/`；
3. 集成测试环境包含 `RUN_RABBITMQ_INTEGRATION_TESTS=true` 和 `RABBITMQ_TEST_VHOST=/equipai_test`；
4. vhost 初始化发生在集成测试命令之前。

### 4.4 本地运行约定

普通本地集成测试继续允许显示 6 条 RabbitMQ 条件跳过。需要运行真实 broker 测试时，开发者必须使用专用 vhost，并显式传入：

```bash
RUN_RABBITMQ_INTEGRATION_TESTS=true \
RABBITMQ_TEST_VHOST=/equipai_test \
RABBITMQ_TEST_HOST=127.0.0.1 \
RABBITMQ_TEST_PORT=5672 \
RABBITMQ_TEST_MANAGEMENT_PORT=15672 \
dotnet test tests/EquipAI.Tests.Integration/EquipAI.Tests.Integration.csproj
```

该命令假设 broker 管理员已创建 vhost 并授予测试账号权限；项目不自动改动现有本地 broker。

## 5. 安全与故障边界

- 专用 vhost 限制测试拓扑的命名空间；测试账号不应获得 RabbitMQ 管理 API 的业务生产权限。
- 测试 policy 仅作用于 `/equipai_test`，不会改变默认 `/` 或生产 vhost 的策略。
- 测试密码只由 CI service 环境变量和进程环境传递，不写入日志、规格文档或生产 `.env`。
- vhost、账号权限和 policy 任一初始化失败，CI 必须在集成测试前失败；不能通过增加测试跳过数量来保持绿灯。
- 测试清理仍然是显式队列/交换机删除，但其作用域被 vhost 限定；不声称能防护同一测试 vhost 内的并发外部写入，因此 CI broker 必须是隔离实例。

## 6. 测试与验收

### 6.1 代码测试

- 增加集成测试配置断言，证明未设置变量时使用 `/equipai_test`，而不是 `/`；显式配置仍原样传递。
- 增加 `RabbitMqManagementConnectionSelector` 纯逻辑回归测试，证明 management API 响应包含多个 vhost/相同连接名时只选择测试 vhost，缺少 vhost 时不选择任何连接。
- 运行现有 6 条 RabbitMQ 测试时，错误凭据、错误 vhost 或 broker 不可用必须报告失败。

### 6.2 CI 与仓库验证

- `bash -n tests/scripts/production-scripts-test.sh`；
- `bash tests/scripts/production-scripts-test.sh all`；
- 相关集成测试在可用专用 broker 上运行；
- 后端单元测试、全部集成测试和 Release 构建通过；
- `git diff --check` 通过。

### 6.3 远端验收证据

首次 GitHub Actions 运行必须确认：

- 当前 193 条集成测试基线加上本次新增的纯逻辑配置/选择器回归全部通过；
- RabbitMQ 6 条真实测试全部通过且不再显示 skipped；
- vhost 初始化和 policy 校验步骤成功；
- 测试日志没有密码、Basic Auth 或完整事件载荷。

本地未运行 Docker 或未准备 broker 时，只能报告静态契约和非 RabbitMQ 测试结果，不得把 193/193 远端证据提前写入发布报告。

## 7. 交付物

1. `tests/EquipAI.Tests.Integration/Eventing/RabbitMqEventBusIntegrationTests.cs`：专用 vhost 配置和 management API vhost 过滤。
2. `tests/EquipAI.Tests.Integration/Eventing/RabbitMqManagementConnectionSelector.cs` 及其回归测试：安全连接选择纯逻辑。
3. `.github/workflows/ci.yml`：vhost/权限/policy 初始化以及集成测试环境变量。
4. `tests/scripts/production-scripts-test.sh`：CI 初始化顺序和变量契约。
5. `docs/EVENT_BUS.md`：真实 broker 测试隔离与本地运行说明。
6. 测试策略、风险登记册和变更日志：仅在实际验证后同步证据，不提前宣称远端测试已全部通过。
