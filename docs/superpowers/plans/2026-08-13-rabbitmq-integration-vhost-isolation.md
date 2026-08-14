# RabbitMQ 真实集成测试 vhost 隔离实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让真实 RabbitMQ 集成测试始终运行在专用 `/equipai_test` vhost 中，避免清理测试拓扑或强制断连操作误触碰其他 broker 流量，并让 CI 在 broker 初始化不完整时 fail-closed。

**Architecture:** 在集成测试项目中增加纯配置工厂和纯 management connection selector。测试通过 `RABBITMQ_TEST_VHOST` 选择 vhost，未配置时安全默认到 `/equipai_test`；CI service container 在集成测试前创建该 vhost、授予测试账号权限并配置 v2 dead-letter policy。生产 RabbitMQ 运行时配置保持不变。

**Tech Stack:** .NET 8、C#、xUnit、FluentAssertions、RabbitMQ.Client 7.2.2、RabbitMQ 4.3.4 management image、GitHub Actions、Bash、Markdown。

## Global Constraints

- 不修改生产 `RabbitMqOptions.VirtualHost` 默认值 `/`，不修改生产 RabbitMQ 拓扑和生产 Compose 行为。
- 真实测试默认 vhost 必须是 `/equipai_test`，不得回退到 `/`。
- CI 继续使用 `rabbitmq:4.3.4-management-alpine@sha256:44bf7eb50fe1765885659e49ccfdc775f8e531964d979321aee380a071f49f94`。
- 不新增 NuGet 依赖，不自动修改开发者已有 broker，不修改真实 `docker/.env`。
- 密码、Basic Auth 内容和完整事件载荷不得写入日志、文档或测试失败信息。
- 所有新增 C# 注释、日志和文档使用简体中文；继续保持现有命名、nullable 和异步风格。
- 每个行为改动必须遵循 TDD：先写一个能证明需求的失败测试，观察预期失败，再写最小实现并验证通过。
- 当前工作区已有用户改动；本计划不自动 `git add`、`git commit` 或 `git push`，每个任务以可审阅的工作区变更结束。

---

## 文件结构与职责

| 文件 | 职责 |
|------|------|
| `tests/EquipAI.Tests.Integration/Eventing/RabbitMqIntegrationTestConfiguration.cs` | 读取 `RABBITMQ_TEST_*` 环境变量，提供安全的测试 vhost 默认值和 `RabbitMqOptions` 工厂 |
| `tests/EquipAI.Tests.Integration/Eventing/RabbitMqIntegrationTestConfigurationTests.cs` | 验证默认 vhost 与显式 vhost 配置，不连接真实 broker |
| `tests/EquipAI.Tests.Integration/Eventing/RabbitMqManagementConnectionSelector.cs` | 只按连接名和 vhost 从 management API JSON 中选择目标连接，不执行网络或删除操作 |
| `tests/EquipAI.Tests.Integration/Eventing/RabbitMqManagementConnectionSelectorTests.cs` | 验证同名连接跨 vhost、错误 vhost 和缺少 vhost 字段的选择边界 |
| `tests/EquipAI.Tests.Integration/Eventing/RabbitMqEventBusIntegrationTests.cs` | 使用配置工厂，按测试 vhost连接 broker，并调用纯 selector 定位断连目标 |
| `.github/workflows/ci.yml` | 在集成测试前创建专用 vhost、设置账号权限和 policy，并传入测试 vhost变量 |
| `tests/scripts/production-scripts-test.sh` | 用静态契约锁定 CI 初始化顺序、policy vhost 和测试环境变量 |
| `docs/EVENT_BUS.md` | 记录 CI 与本地真实 broker 测试的 vhost 隔离约定 |
| `CHANGELOG.md`、`docs/LANDING_READINESS_REPORT.md`、`docs/evaluation/00-INDEX.md`、`docs/evaluation/14-测试策略与金字塔分析.md`、`docs/evaluation/S09-风险登记册.md`、`docs/evaluation/13-技术债务与改进路线图.md` | 在验证结果真实产生后同步版本、测试数量、风险和发布证据 |

---

### Task 1: 提取专用 vhost 配置工厂

**Files:**
- Create: `tests/EquipAI.Tests.Integration/Eventing/RabbitMqIntegrationTestConfiguration.cs`
- Create: `tests/EquipAI.Tests.Integration/Eventing/RabbitMqIntegrationTestConfigurationTests.cs`
- Modify: `tests/EquipAI.Tests.Integration/Eventing/RabbitMqEventBusIntegrationTests.cs:194-204`

**Interfaces:**
- Produces `internal static class RabbitMqIntegrationTestConfiguration`。
- Produces `internal const string DefaultVirtualHost = "/equipai_test"`。
- Produces `internal static RabbitMqOptions CreateOptions(IReadOnlyDictionary<string, string?>? environment = null, int maxRetryCount = 5, int retryIntervalSeconds = 1)`。
- `environment == null` 时读取进程环境；传入字典时只读取字典，用于无 broker 的纯测试。
- `RABBITMQ_TEST_VHOST` 未设置时返回 `/equipai_test`；显式非空值原样传递；不得默认返回 `/`。

- [x] **Step 1: 写默认 vhost 的失败测试**

在 `RabbitMqIntegrationTestConfigurationTests.cs` 写入：

```csharp
using EquipAI.Infrastructure.Messaging;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Eventing;

public sealed class RabbitMqIntegrationTestConfigurationTests
{
    [Fact]
    public void 未配置测试vhost时使用专用vhost而不是默认vhost()
    {
        var options = RabbitMqIntegrationTestConfiguration.CreateOptions(
            new Dictionary<string, string?>());

        options.VirtualHost.Should().Be("/equipai_test");
    }

    [Fact]
    public void 显式配置测试vhost时原样传递()
    {
        var options = RabbitMqIntegrationTestConfiguration.CreateOptions(
            new Dictionary<string, string?>
            {
                ["RABBITMQ_TEST_VHOST"] = "/ci-isolated",
            });

        options.VirtualHost.Should().Be("/ci-isolated");
    }
}
```

- [x] **Step 2: 运行测试确认 RED**

Run:

```bash
dotnet test tests/EquipAI.Tests.Integration/EquipAI.Tests.Integration.csproj \
  --filter "FullyQualifiedName~RabbitMqIntegrationTestConfigurationTests" \
  --no-restore
```

Expected: FAIL，编译器报告 `RabbitMqIntegrationTestConfiguration` 尚不存在；不能因为缺少 Docker 或 broker 而失败。

- [x] **Step 3: 写最小配置工厂实现**

创建 `RabbitMqIntegrationTestConfiguration.cs`，实现以下行为：

```csharp
using EquipAI.Infrastructure.Messaging;

namespace EquipAI.Tests.Integration.Eventing;

internal static class RabbitMqIntegrationTestConfiguration
{
    internal const string DefaultVirtualHost = "/equipai_test";

    internal static RabbitMqOptions CreateOptions(
        IReadOnlyDictionary<string, string?>? environment = null,
        int maxRetryCount = 5,
        int retryIntervalSeconds = 1)
    {
        string? Read(string key) => environment is null
            ? Environment.GetEnvironmentVariable(key)
            : environment.TryGetValue(key, out var value) ? value : null;

        return new RabbitMqOptions
        {
            Host = Read("RABBITMQ_TEST_HOST") ?? "127.0.0.1",
            Port = int.TryParse(Read("RABBITMQ_TEST_PORT"), out var port) ? port : 5672,
            VirtualHost = Read("RABBITMQ_TEST_VHOST") ?? DefaultVirtualHost,
            Username = Read("RABBITMQ_TEST_USERNAME") ?? "equipai_test",
            Password = Read("RABBITMQ_TEST_PASSWORD") ?? "equipai_test_password",
            MaxRetryCount = maxRetryCount,
            RetryIntervalSeconds = retryIntervalSeconds,
            HandlerTimeoutSeconds = 10,
            PrefetchCount = 20,
        };
    }
}
```

- [x] **Step 4: 运行配置测试确认 GREEN**

Run the same focused command from Step 2.

Expected: 2 passed, 0 failed, 0 skipped。

- [x] **Step 5: 让真实 RabbitMQ 测试复用配置工厂**

在 `RabbitMqEventBusIntegrationTests.cs` 中：

1. 删除现有私有 `CreateOptions` 对环境变量的重复读取；
2. 将所有 `CreateOptions(...)` 调用保留不变，让它们调用 `RabbitMqIntegrationTestConfiguration.CreateOptions(...)`；
3. 保持 `CreateFactory` 使用 `options.VirtualHost`，确保队列、交换机、重试队列和死信队列都在同一专用 vhost；
4. 不给 `RabbitMqFactAttribute` 增加新的 skip 分支，显式启用后 vhost 不存在必须由 broker 连接/声明失败。

- [x] **Step 6: 验证配置工厂与现有测试兼容**

Run:

```bash
dotnet test tests/EquipAI.Tests.Integration/EquipAI.Tests.Integration.csproj \
  --filter "FullyQualifiedName~RabbitMq" \
  --no-restore
```

Expected on a machine without the explicit enable variable: 2 configuration tests passed, 6 real RabbitMQ tests skipped, 0 failed。此时跳过必须仍来自 `RabbitMqFactAttribute`，不能来自连接异常。

---

### Task 2: 提取并锁定 management connection vhost 选择

**Files:**
- Create: `tests/EquipAI.Tests.Integration/Eventing/RabbitMqManagementConnectionSelector.cs`
- Create: `tests/EquipAI.Tests.Integration/Eventing/RabbitMqManagementConnectionSelectorTests.cs`
- Modify: `tests/EquipAI.Tests.Integration/Eventing/RabbitMqEventBusIntegrationTests.cs:244-274`

**Interfaces:**
- Produces `internal static string? RabbitMqManagementConnectionSelector.FindConnectionName(JsonElement connections, string expectedConnectionName, string expectedVirtualHost)`。
- 输入不是 JSON 数组、元素没有 `client_properties.connection_name`、连接名不匹配、缺少字符串 `vhost` 或 vhost 不匹配时返回 `null`。
- 只有连接名和 vhost 同时精确匹配时，才返回 connection object 的非空字符串 `name`。

- [x] **Step 1: 写同名跨 vhost 的失败测试**

在 `RabbitMqManagementConnectionSelectorTests.cs` 写入一个不访问网络的测试：

```csharp
using System.Text.Json;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Eventing;

public sealed class RabbitMqManagementConnectionSelectorTests
{
    [Fact]
    public void 同名连接存在多个vhost时只选择目标vhost()
    {
        using var document = JsonDocument.Parse("""
            [
              {"name":"wrong","vhost":"/","client_properties":{"connection_name":"EquipSense.EventBus"}},
              {"name":"target","vhost":"/equipai_test","client_properties":{"connection_name":"EquipSense.EventBus"}}
            ]
            """);

        RabbitMqManagementConnectionSelector.FindConnectionName(
                document.RootElement,
                "EquipSense.EventBus",
                "/equipai_test")
            .Should().Be("target");
    }

    [Fact]
    public void 缺少vhost时不得选择连接()
    {
        using var document = JsonDocument.Parse("""
            [{"name":"unknown","client_properties":{"connection_name":"EquipSense.EventBus"}}]
            """);

        RabbitMqManagementConnectionSelector.FindConnectionName(
                document.RootElement,
                "EquipSense.EventBus",
                "/equipai_test")
            .Should().BeNull();
    }
}
```

- [x] **Step 2: 运行 selector 测试确认 RED**

Run:

```bash
dotnet test tests/EquipAI.Tests.Integration/EquipAI.Tests.Integration.csproj \
  --filter "FullyQualifiedName~RabbitMqManagementConnectionSelectorTests" \
  --no-restore
```

Expected: FAIL，编译器报告 selector 类型或方法不存在。

- [x] **Step 3: 写最小纯 selector 实现**

创建 `RabbitMqManagementConnectionSelector.cs`，只遍历 `JsonElement`，不创建 `HttpClient`，不读取环境，不输出日志。实现必须先使用 `TryGetProperty` 验证 `vhost`，再读取 connection object 的 `name`；任何缺失字段返回 `null`。

- [x] **Step 4: 运行 selector 测试确认 GREEN**

Run the same focused command from Step 2.

Expected: 2 passed, 0 failed, 0 skipped。

- [x] **Step 5: 接入真实断连测试**

在 `CloseEventBusConnectionThroughManagementApiAsync` 中保留现有 management API URL、Basic Auth 和 10 秒超时，仅替换内嵌的 LINQ 选择逻辑：

```csharp
connectionName = RabbitMqManagementConnectionSelector.FindConnectionName(
    document.RootElement,
    "EquipSense.EventBus",
    options.VirtualHost);
```

当 selector 返回 `null` 时继续现有 50ms 轮询；超时仍抛出 `OperationCanceledException`，不得选择缺少 vhost 或 vhost 不匹配的连接。

- [x] **Step 6: 验证真实测试筛选结果**

Run:

```bash
dotnet test tests/EquipAI.Tests.Integration/EquipAI.Tests.Integration.csproj \
  --filter "FullyQualifiedName~RabbitMq" \
  --no-restore
```

Expected on a machine without broker enablement: 4 pure configuration/selector tests passed, 6 broker tests skipped, 0 failed。

---

### Task 3: 在 CI 中创建专用 vhost 并锁定 fail-closed 顺序

**Files:**
- Modify: `tests/scripts/production-scripts-test.sh` near `test_release_waits_for_quality_gates` and the `ci`/`all` dispatch lists
- Modify: `.github/workflows/ci.yml:124-147`

**Interfaces:**
- CI service container 用户仍为 `equipai_test`，密码仍只来自 job 环境变量。
- CI 测试 vhost 固定为 `/equipai_test`。
- policy 只在 `/equipai_test` vhost 验证：`equipai-v2-at-least-once-dlx`、`dead-letter-strategy=at-least-once`、`overflow=reject-publish`。

- [x] **Step 1: 先写 CI 契约失败测试**

在 `production-scripts-test.sh` 增加：

```bash
test_ci_rabbitmq_integration_uses_isolated_vhost() {
  local backend_block setup_line test_line
  backend_block="$(sed -n '/^  backend:/,/^  backup-restore-rehearsal:/p' "$PROJECT_ROOT/.github/workflows/ci.yml")"

  assert_contains "$backend_block" 'rabbitmqctl add_vhost /equipai_test'
  assert_contains "$backend_block" 'rabbitmqctl set_permissions -p /equipai_test equipai_test'
  assert_contains "$backend_block" 'rabbitmqctl set_policy -p /equipai_test'
  assert_contains "$backend_block" 'RABBITMQ_TEST_VHOST: /equipai_test'

  setup_line="$(printf '%s\n' "$backend_block" | grep -n 'rabbitmqctl add_vhost /equipai_test' | head -n 1 | cut -d: -f1)"
  test_line="$(printf '%s\n' "$backend_block" | grep -n '运行集成测试（采集覆盖率）' | head -n 1 | cut -d: -f1)"
  [[ -n "$setup_line" && -n "$test_line" && "$setup_line" -lt "$test_line" ]] \
    || fail "RabbitMQ 专用 vhost 必须在集成测试前初始化"
}
```

把 `test_ci_rabbitmq_integration_uses_isolated_vhost` 加入 `ci)` 和 `all)` 分支，保证单独运行 CI 契约和完整脚本测试都会执行它。

- [x] **Step 2: 运行契约测试确认 RED**

Run:

```bash
bash tests/scripts/production-scripts-test.sh ci
```

Expected: FAIL，报告当前 workflow 没有 `/equipai_test` 初始化或 `RABBITMQ_TEST_VHOST` 变量；不能因为 Docker 未运行而失败，因为该测试只读取 workflow 文本。

- [x] **Step 3: 修改 CI broker 初始化**

在现有 `配置并验证 RabbitMQ v2 可靠死信策略` 步骤中，保留 service container 定位和 health 依赖，按以下顺序增加命令：

```bash
docker exec "$container_id" rabbitmqctl add_vhost /equipai_test
docker exec "$container_id" rabbitmqctl set_permissions -p /equipai_test equipai_test '.*' '.*' '.*'
docker exec "$container_id" rabbitmqctl set_policy -p /equipai_test --priority 20 --apply-to queues \
  equipai-v2-at-least-once-dlx '^equipai\.v2\.' \
  '{"dead-letter-strategy":"at-least-once","overflow":"reject-publish"}'
policies=$(docker exec "$container_id" rabbitmqctl list_policies -p /equipai_test --formatter json)
[[ "$policies" == *'equipai-v2-at-least-once-dlx'* ]]
[[ "$policies" == *'at-least-once'* ]]
[[ "$policies" == *'reject-publish'* ]]
```

为支持重复运行，使用以下确定性的幂等创建方式；`add_vhost` 只在 `list_vhosts` 未找到目标时执行，任何真实创建失败都会中止 step，不得使用 `|| true` 静默吞掉。权限设置仍需每次执行，确保测试账号权限不会漂移：

```bash
if ! docker exec "$container_id" rabbitmqctl list_vhosts --silent \
    | grep -Fqx '/equipai_test'; then
  docker exec "$container_id" rabbitmqctl add_vhost /equipai_test
fi
docker exec "$container_id" rabbitmqctl set_permissions -p /equipai_test equipai_test '.*' '.*' '.*'
```

在集成测试步骤的 `env` 中增加：

```yaml
RABBITMQ_TEST_VHOST: /equipai_test
```

保留 `RUN_RABBITMQ_INTEGRATION_TESTS: 'true'`，不在 CI 中增加任何 skip 或 `continue-on-error`。

- [x] **Step 4: 运行 CI 契约确认 GREEN**

Run:

```bash
bash tests/scripts/production-scripts-test.sh ci
```

Expected: `生产脚本测试通过`，且新增 vhost 初始化契约通过。

- [x] **Step 5: 检查 Shell 与 YAML 变更边界**

Run:

```bash
bash -n tests/scripts/production-scripts-test.sh
git -c core.fsmonitor=false diff --check
```

Expected: 两条命令均以 0 退出；diff 中不出现 `docker/.env`、测试密码或生产 vhost 默认值修改。

---

### Task 4: 同步运行说明与发布证据

**Files:**
- Modify: `docs/EVENT_BUS.md:70-75`
- Modify: `CHANGELOG.md` 的 `Unreleased/Changed`
- Modify: `docs/LANDING_READINESS_REPORT.md` 当前状态和本轮增量段落
- Modify: `docs/evaluation/14-测试策略与金字塔分析.md` 测试总量、夹具说明和版本尾注
- Modify: `docs/evaluation/00-INDEX.md` 最新候选摘要、测试报告摘要和更新日志
- Modify: `docs/evaluation/S09-风险登记册.md` 增加隔离风险关闭记录并更新版本
- Modify: `docs/evaluation/13-技术债务与改进路线图.md` 版本尾注
- Modify: `docs/superpowers/specs/2026-08-13-rabbitmq-integration-vhost-isolation-design.md` 在实现和验证完成后将状态更新为已实施

- [x] **Step 1: 更新事件总线运行说明**

在 `docs/EVENT_BUS.md` 的测试章节明确写出：普通本地运行仍允许 6 条 RabbitMQ 条件跳过；显式运行必须准备 `/equipai_test`，通过 `RABBITMQ_TEST_VHOST` 传入；CI 会在测试前创建 vhost、权限和 policy；缺少 vhost/权限/broker 时测试失败而不是回退到 `/`。

加入以下可复制命令，并保持密码不出现在命令中：

```bash
RUN_RABBITMQ_INTEGRATION_TESTS=true \
RABBITMQ_TEST_VHOST=/equipai_test \
RABBITMQ_TEST_HOST=127.0.0.1 \
RABBITMQ_TEST_PORT=5672 \
RABBITMQ_TEST_MANAGEMENT_PORT=15672 \
dotnet test tests/EquipAI.Tests.Integration/EquipAI.Tests.Integration.csproj
```

- [x] **Step 2: 根据当前本地默认测试结果更新数量**

新增 4 个纯配置/selector 测试后，默认不启用 broker 的集成测试预期为 **197 总数（191 通过、6 跳过、0 失败）**；单元测试仍为 **1692/1692**，前端仍为 **494/494**，E2E 仍为 **435（434 通过、1 条架构性跳过）**，本轮统计合计为 **2818**。只在实际命令输出确认后写入这些数字。

在报告中明确区分：本地默认结果包含 6 个预期跳过；只有可用专用 broker 且设置 `RUN_RABBITMQ_INTEGRATION_TESTS=true` 的远端 CI 运行，才能声称 6 条真实 RabbitMQ 测试通过。

- [x] **Step 3: 增加风险登记记录**

在 `S09-风险登记册.md` 的已关闭风险中增加一条 C44，说明原先真实 RabbitMQ 测试共享 `/` vhost、固定拓扑清理和连接名断连可能越界；现在改为专用 `/equipai_test`、账号权限、policy 和 connection selector 双重过滤，且 CI 契约锁定初始化顺序。不要把“远端 197/197”写入风险记录，除非远端日志已经实际取得。

- [x] **Step 4: 同步变更日志与文档版本**

把当前文档版本从 v4.12 更新为 v4.13，新增本轮条目，内容只陈述已运行的本地/仓库门禁结果；将远端 CI 197/197 留作待真实 workflow 运行确认的发布前置条件。

---

### Task 5: 分层验证并形成真实证据

**Files:**
- No source changes; verify all files from Tasks 1–4.

- [x] **Step 1: 运行配置与 selector 聚焦测试**

```bash
dotnet test tests/EquipAI.Tests.Integration/EquipAI.Tests.Integration.csproj \
  --filter "FullyQualifiedName~RabbitMqIntegrationTestConfiguration|FullyQualifiedName~RabbitMqManagementConnectionSelector" \
  --no-restore
```

Expected: 4 passed, 0 failed, 0 skipped。

- [x] **Step 2: 运行默认集成测试并核对跳过原因**

```bash
env -u RUN_RABBITMQ_INTEGRATION_TESTS \
  dotnet test tests/EquipAI.Tests.Integration/EquipAI.Tests.Integration.csproj \
  --configuration Release --no-build --no-restore --verbosity normal
```

Expected: 197 total，191 passed，6 skipped，0 failed；6 条 skipped 的原因全部是 `RabbitMqFactAttribute` 的显式开关提示，不得出现连接异常被转成 skip。

- [x] **Step 3: 在专用 broker 可用时运行真实 RabbitMQ 测试**

```bash
RUN_RABBITMQ_INTEGRATION_TESTS=true \
RABBITMQ_TEST_VHOST=/equipai_test \
RABBITMQ_TEST_HOST=127.0.0.1 \
RABBITMQ_TEST_PORT=5672 \
RABBITMQ_TEST_USERNAME=equipai_test \
RABBITMQ_TEST_MANAGEMENT_PORT=15672 \
dotnet test tests/EquipAI.Tests.Integration/EquipAI.Tests.Integration.csproj \
  --configuration Release --no-build --no-restore --verbosity normal
```

本地已用固定 digest 临时 broker、随机宿主端口和 `/equipai_test` vhost 实际运行 `RabbitMqEventBusIntegrationTests`：6 passed，0 skipped，0 failed。远端 CI 仍需运行完整 workflow，作为发布前的唯一远程 broker 证据；不得把本地 6/6 扩写为远端 197/197。

- [x] **Step 4: 运行后端全量门禁**

```bash
dotnet test tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj \
  --configuration Release --no-restore --verbosity normal
dotnet build EquipAI.sln -c Release --no-restore -m:1 -p:UseSharedCompilation=false
```

Expected: 单元测试 1692/1692 通过；Release build 0 warning、0 error。

- [x] **Step 5: 运行脚本与差异门禁**

```bash
bash -n docker/production-readiness.sh docker/deploy-production.sh \
  tests/scripts/production-scripts-test.sh
bash tests/scripts/production-scripts-test.sh all
git -c core.fsmonitor=false diff --check
```

Expected: Shell 语法、生产脚本全量契约和 diff 检查均通过；真实 `docker/.env` 不被修改。

- [x] **Step 6: 核对发布报告没有超前宣称**

```bash
rg -n "197|191|equipai_test|RABBITMQ_TEST_VHOST|193/193|197/197|RabbitMQ" \
  CHANGELOG.md docs/EVENT_BUS.md docs/LANDING_READINESS_REPORT.md \
  docs/evaluation/00-INDEX.md docs/evaluation/14-测试策略与金字塔分析.md \
  docs/evaluation/S09-风险登记册.md
```

Expected: 本地报告使用已验证的 197/191/6 数字；只有取得真实 CI 输出后才新增 197/197 远端证据；生产环境已有 27 项配置/证书阻断项仍保持明确未关闭。

---

## 完成判定

本计划只有在以下证据全部存在时才算完成：

1. 配置工厂测试证明默认 vhost 为 `/equipai_test`，显式 vhost 原样传递。
2. selector 测试证明同名连接跨 vhost 不会误选，缺少 vhost 不会被选中。
3. 真实 RabbitMQ 测试代码的所有连接、队列、交换机和管理断连操作均使用 options 中的测试 vhost。
4. CI 契约证明 vhost、权限和 policy 在集成测试前初始化，并且 `RUN_RABBITMQ_INTEGRATION_TESTS=true` 与 `RABBITMQ_TEST_VHOST=/equipai_test` 同时存在。
5. 默认集成测试为 197 总数、191 通过、6 预期跳过、0 失败；单元、构建和脚本门禁全部通过。
6. 至少一次真实可用 broker 的 CI 运行证明 6 条 RabbitMQ 测试实际执行且全通过，未因 vhost、权限或 policy 缺失而静默跳过。（当前未完成：本地临时 broker 已通过 6/6，远端 GitHub Actions 尚未运行。）
7. 文档只记录已获得的当前工作区证据，未把生产凭据、证书和其他部署阻断项误标为完成。
