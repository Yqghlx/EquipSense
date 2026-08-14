# 工业协议验收闭环实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 让 OPC UA/Modbus TCP 测试不再静默假绿，并用仓库内固定 Simulator 在 CI 中实际验证边缘协议读取链路。

**架构：** 把协议测试的启用、端点读取和缺失服务的 skip/fail-closed 行为集中到测试辅助类；让 `src/EquipAI.Simulator` 提供与现有适配器一致的字符串 OPC UA 节点、单寄存器 Modbus 保持寄存器和确定性线圈；通过独立脚本编排 Simulator 生命周期和协议测试。生产适配器点位格式保持不变，现场设备验收仍单独保留。

**技术栈：** .NET 8、xUnit 2.9.3、FluentModbus 5.3.2、OPC Foundation SDK 1.5.378.145、Bash、GitHub Actions。

## 全局约束

- 不修改真实 `docker/.env`、生产凭据、TLS/MQTT 证书或数据库卷。
- 不新增 NuGet 依赖，不修改生产 `ModbusTcpAdapter` 点位格式。
- 默认后端单元/集成命令不依赖工业模拟器；显式协议验收命令中 Simulator 缺失必须非零失败。
- 测试未启用且模拟器缺失时只能使用 `Xunit.Sdk.SkipException.ForSkip` 明确跳过，禁止直接 `return`。
- 端口占用时只报告错误，不终止宿主机已有进程；脚本只清理自身启动的 PID 和临时目录。
- 所有新增注释、日志、文档使用简体中文；不输出完整环境变量、密码或证书私钥。
- 每个行为改动先写失败测试并观察预期失败，再写最小实现并验证通过。
- 保留当前工作区上轮 RabbitMQ vhost 隔离改动，不执行 reset、checkout、自动 stage 或 commit。

---

### Task 1：集中协议测试启用边界，消除静默假绿

**文件：**
- 创建：`tests/EquipAI.Tests.Unit/EdgeGateway/ProtocolIntegrationTestEnvironment.cs`
- 创建：`tests/EquipAI.Tests.Unit/EdgeGateway/ProtocolIntegrationTestEnvironmentTests.cs`
- 创建：`tests/EquipAI.Tests.Unit/EdgeGateway/ProtocolFactAttribute.cs`
- 修改：`tests/EquipAI.Tests.Unit/EdgeGateway/OpcUaAdapterIntegrationTests.cs`
- 修改：`tests/EquipAI.Tests.Unit/EdgeGateway/ModbusTcpAdapterIntegrationTests.cs`

**接口：**

```csharp
internal static class ProtocolIntegrationTestEnvironment
{
    internal const string RunEnvironmentVariable = "RUN_PROTOCOL_INTEGRATION_TESTS";

    internal static bool IsEnabled(IReadOnlyDictionary<string, string?>? environment = null);

    internal static string ReadEndpoint(
        string key,
        string defaultValue,
        IReadOnlyDictionary<string, string?>? environment = null);

    internal static void EnsureAvailable(
        string protocol,
        bool enabled,
        bool available);
}
```

- `IsEnabled` 只有环境值大小写不敏感等于 `true` 时返回 `true`。
- `ReadEndpoint` 未配置或为空时使用传入默认值；显式非空值原样返回。
- `EnsureAvailable` 在 `available=true` 时返回；`enabled=false` 且不可用时抛出 `SkipException.ForSkip`；`enabled=true` 且不可用时抛出带协议名的 `InvalidOperationException`。

- [x] **步骤 1：先写启用边界失败测试**

在 `ProtocolIntegrationTestEnvironmentTests.cs` 写入四个纯测试：默认端点、显式端点、未启用且不可用时跳过、已启用且不可用时失败。测试不得修改进程环境，使用字典参数。

- [x] **步骤 2：运行 RED 测试**

运行：

```bash
dotnet test tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj \
  --configuration Release --no-restore \
  --filter "FullyQualifiedName~ProtocolIntegrationTestEnvironmentTests" \
  --verbosity minimal --nologo
```

预期：编译失败，报告辅助类或方法不存在；不能以“模拟器不可用”作为失败原因。

- [x] **步骤 3：实现最小测试环境辅助类**

只实现上述三个接口和 `SkipException.ForSkip`/`InvalidOperationException` 分支，不读取网络、不启动进程、不写日志。

- [x] **步骤 4：运行 GREEN 测试**

重复步骤 2，边界与自定义发现属性共 6 个测试通过、0 失败、0 跳过。

- [x] **步骤 5：把两个协议测试接入显式边界**

两个测试类统一读取：

```csharp
var enabled = ProtocolIntegrationTestEnvironment.IsEnabled();
var endpoint = ProtocolIntegrationTestEnvironment.ReadEndpoint(
    "EQUIPAI_OPCUA_TEST_ENDPOINT",
    "opc.tcp://127.0.0.1:4840");
ProtocolIntegrationTestEnvironment.EnsureAvailable(
    "OPC UA", enabled, IsSimulatorRunning(endpoint));
```

Modbus 测试使用 `EQUIPAI_MODBUS_TEST_ENDPOINT` 和 `127.0.0.1:5020` 默认值。`IsSimulatorRunning` 只探测 endpoint 的 TCP 主机/端口，不再硬编码旧 `/tmp` 模拟器；测试不可用时不得直接 `return`。

- [x] **步骤 6：验证默认运行的诚实边界**

运行：

```bash
env -u RUN_PROTOCOL_INTEGRATION_TESTS \
  dotnet test tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj \
  --configuration Release --no-restore \
  --filter "Category=RequiresSimulator" \
  --verbosity normal --nologo
```

预期：四条测试全部明确显示 `SKIP`，0 失败；使用 `RUN_PROTOCOL_INTEGRATION_TESTS=true` 且无模拟器时同一筛选必须出现失败，而不是跳过。

实际验证：未设置环境变量时 4 条测试明确 `SKIP`、0 失败；显式设置为 `true` 且未启动 Simulator 时 4 条测试失败、0 跳过。由于当前 xUnit 运行器会将测试体内抛出的动态 `SkipException` 记为失败，协议用例使用 `ProtocolFactAttribute` 在发现阶段注入跳过原因；辅助类仍保留纯逻辑的 `SkipException.ForSkip` 分支并由单元测试覆盖。

---

### Task 2：统一 Simulator 的 Modbus 数据契约

**文件：**
- 创建：`src/EquipAI.Simulator/ModbusRegisterEncoding.cs`
- 创建：`tests/EquipAI.Tests.Unit/Simulator/ModbusRegisterEncodingTests.cs`
- 修改：`src/EquipAI.Simulator/ModbusTcpMockServer.cs`
- 修改：`tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj`

**接口：**

```csharp
public static class ModbusRegisterEncoding
{
    public static ushort EncodeHoldingRegister(double value);
}
```

编码规则：NaN/负数映射为 0，正数四舍五入为 `ushort`，超过 `ushort.MaxValue` 时钳制到最大值。Simulator 每个传感器只占一个寄存器，保持寄存器从 100 开始连续分配；线圈 0 写入 1，线圈 1 写入 0。

- [x] **步骤 1：先接入测试项目引用并写寄存器编码失败测试**

先在 `EquipAI.Tests.Unit.csproj` 增加对 `src/EquipAI.Simulator/EquipAI.Simulator.csproj` 的项目引用（只为测试访问仓库 Simulator 类型，保留现有旧 Simulator 引用），再写测试。测试 NaN、负数、普通小数和超过最大值四种边界，直接调用尚不存在的 `ModbusRegisterEncoding.EncodeHoldingRegister`。

- [x] **步骤 2：运行 RED 测试**

运行：

```bash
dotnet test tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj \
  --configuration Release --no-restore \
  --filter "FullyQualifiedName~ModbusRegisterEncodingTests" \
  --verbosity minimal --nologo
```

预期：编译失败，报告类型或方法不存在。

- [x] **步骤 3：实现编码器并接入 mock server**

在 `ModbusTcpMockServer.UpdateRegisters` 中按 `baseIndex = _startAddress + i` 写入编码后的单个寄存器；删除双寄存器浮点拆分。每轮更新通过 `GetCoilBuffer<byte>()` 将线圈 0 设为 1、线圈 1 设为 0；保留越界保护和取消/释放逻辑。

- [x] **步骤 4：运行 GREEN 测试**

重复步骤 2，预期 4 个编码测试通过。

- [x] **步骤 5：验证 Simulator 项目引用和构建**

给 Unit 测试项目增加对 `src/EquipAI.Simulator/EquipAI.Simulator.csproj` 的项目引用，保留旧 `tools/EquipAI.Simulator` 引用供现有故障模拟器测试使用；运行：

```bash
dotnet build EquipAI.sln -c Release --no-restore -m:1 \
  -p:UseSharedCompilation=false --disable-build-servers
```

预期 0 warning、0 error。

实际验证：编码 RED 测试先因 `ModbusRegisterEncoding` 不存在而编译失败，随后 4 个边界测试通过；正式与遗留 Simulator 项目程序集名冲突已通过将旧测试副本命名为 `EquipAI.LegacySimulator` 消除；Release 解决方案构建为 0 warning、0 error。真实协议验收还发现 FluentModbus 5.3.2 单元模式使用默认单元 0，适配器原实现误用 1，已统一适配器和 Simulator 为单元 0。

---

### Task 3：修正协议断言并建立可复现验收脚本

**文件：**
- 修改：`tests/EquipAI.Tests.Unit/EdgeGateway/OpcUaAdapterIntegrationTests.cs`
- 修改：`tests/EquipAI.Tests.Unit/EdgeGateway/ModbusTcpAdapterIntegrationTests.cs`
- 创建：`tests/e2e/run-protocol-integration.sh`
- 修改：`tests/scripts/production-scripts-test.sh`

- [x] **步骤 1：先更新协议测试契约并运行 RED**

OPC UA 测试使用 `ns=2;s=temperature`、`ns=2;s=pressure`、`ns=2;s=vibration`，断言真实 Simulator 返回 `Good`、时间戳接近当前时间、温度在配置范围内；Modbus 测试读取 `holding_register:100/101/102` 和 `coil:0/1`，断言温度/压力/电流处于 Simulator 配置的非负范围，线圈分别为 1.0/0.0。先启动当前未修正的 Simulator 运行筛选，预期至少一个测试因旧寄存器契约失败，形成 RED 证据。

- [x] **步骤 2：创建协议验收脚本**

脚本必须包含：

```bash
LOG_DIR="$(mktemp -d "${TMPDIR:-/tmp}/equipsense-protocol.XXXXXX")"
SIMULATOR_PID=""
cleanup() {
  local exit_code=$?
  trap - EXIT
  if [[ -n "$SIMULATOR_PID" ]] && kill -0 "$SIMULATOR_PID" 2>/dev/null; then
    kill "$SIMULATOR_PID" 2>/dev/null || true
    wait "$SIMULATOR_PID" 2>/dev/null || true
  fi
  rm -rf "$LOG_DIR"
  exit "$exit_code"
}
trap cleanup EXIT
```

启动 `src/EquipAI.Simulator`，轮询 `127.0.0.1:4840` 与 `127.0.0.1:5020`，端口占用或服务提前退出均返回非零；随后使用 `RUN_PROTOCOL_INTEGRATION_TESTS=true` 运行 `Category=RequiresSimulator`。脚本不得使用宽泛 `pkill`、固定 PID 或终止非自身进程。

- [x] **步骤 3：运行脚本确认 GREEN**

运行：

```bash
bash tests/e2e/run-protocol-integration.sh
```

预期：Simulator 启动成功，OPC UA 2 条和 Modbus TCP 2 条测试均实际执行并通过，脚本退出 0，Simulator 进程和临时目录清理完成。

- [x] **步骤 4：增加脚本静态契约**

在 `production-scripts-test.sh` 增加检查：脚本引用 `src/EquipAI.Simulator`、设置 `RUN_PROTOCOL_INTEGRATION_TESTS=true`、等待 4840/5020、运行 `Category=RequiresSimulator`、包含自身 PID 清理，且不包含 `pkill`/`killall`。将测试加入 `all` 分支；该契约测试只读脚本文本，不启动 Simulator。

实际验证：契约 RED 期间在修正前 Simulator 上得到 OPC UA 2/2 通过、Modbus 2/2 因连接关闭失败；修正证书类型、headless 生命周期、Modbus 异步处理和默认单元后，`bash tests/e2e/run-protocol-integration.sh` 实际执行 4/4 通过、0 失败、0 跳过，并确认脚本退出后自身进程、4840/5020 端口和临时目录均已清理。`production-scripts-test.sh ci` 已覆盖脚本内容、PID 清理、端口、测试筛选和 CI 失败关闭契约。

---

### Task 4：接入 CI 并同步运行文档

**文件：**
- 修改：`.github/workflows/ci.yml`
- 修改：`docs/E2E_SUITE.md`
- 修改：`docs/DEPLOY.md`
- 修改：`docs/LANDING_READINESS_REPORT.md`
- 修改：`docs/evaluation/14-测试策略与金字塔分析.md`
- 修改：`docs/evaluation/S09-风险登记册.md`

- [x] **步骤 1：增加 CI 协议验收步骤**

在 backend job 的普通单元测试之后加入：

```yaml
- name: 运行 OPC UA/Modbus 协议验收
  run: bash tests/e2e/run-protocol-integration.sh
```

保持该步骤无 `continue-on-error`，并确保它位于后端构建成功之后；普通 RabbitMQ vhost 初始化和真实 RabbitMQ 测试继续使用原有独立步骤。

- [x] **步骤 2：增加 workflow 契约测试**

静态断言协议验收步骤存在、位于 `运行单元测试` 之后，并且没有 `continue-on-error` 或宽泛进程清理。

- [x] **步骤 3：同步本地运行说明**

在 E2E/部署文档中记录默认测试的四条明确跳过、`bash tests/e2e/run-protocol-integration.sh` 的真实 Simulator 验收命令、端口和失败边界；明确仓库 Simulator 不能替代现场 PLC/证书/网络隔离/容量验收。

- [x] **步骤 4：只根据实际输出更新发布证据**

将协议测试结果分为“默认跳过”和“Simulator 4/4 实际通过”，新增风险记录说明此前静默假绿已关闭；不得把本地模拟器结果写成现场联调完成，也不得覆盖上轮 RabbitMQ 远端 CI 待验收状态。

实际验证：CI 步骤位于后端单元测试之后且无 `continue-on-error`；`production-scripts-test.sh ci` 静态契约通过；E2E、部署说明和 S09 风险登记已记录默认跳过、显式失败和 Simulator 4/4 证据，并保留现场联调、正式凭据/证书、容量和远端 CI 未完成状态。

---

### Task 5：分层验证

**文件：** 无新增设计文件；验证 Tasks 1–4 的全部变更。

- [x] **步骤 1：Shell 和纯单元验证**

```bash
bash -n tests/e2e/run-protocol-integration.sh \
  tests/scripts/production-scripts-test.sh
dotnet test tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj \
  --configuration Release --no-restore --filter "FullyQualifiedName~ProtocolIntegrationTestEnvironmentTests|FullyQualifiedName~ModbusRegisterEncodingTests"
```

- [x] **步骤 2：默认协议筛选验证**

未设置 `RUN_PROTOCOL_INTEGRATION_TESTS` 运行 `Category=RequiresSimulator`，确认四条都显示明确 skip；设置为 true 且不启动 Simulator，确认失败关闭。

- [x] **步骤 3：真实仓库 Simulator 验证**

运行 `bash tests/e2e/run-protocol-integration.sh`，确认四条协议测试实际通过、无隐藏 return、脚本清理自身资源。

- [x] **步骤 4：全量门禁**

运行后端 Unit、默认 Integration、Release build、生产脚本 `all`、前端现有 typecheck/lint/i18n/Vitest/build（如工作区依赖可用），并执行 `git -c core.fsmonitor=false diff --check`。记录实际数量，不用历史报告数字替代。

实际验证：后端 Unit 1704 总计（1700 通过、4 跳过、0 失败）；默认 Integration 197 总计（191 通过、6 跳过、0 失败）；Release build 0 warning/0 error；生产脚本 `all` 通过；前端 TypeScript、Lint、i18n（1110 键）和生产构建通过，Vitest 494/494 行为测试通过，但覆盖率门禁退出码 1（行 71%、函数 58.76%，要求 80%/80%）。该失败暴露出覆盖率基线随前端业务面扩展而漂移，未降低门禁，已记录为当前发布阻断项。

- [x] **步骤 5：工作区边界审查**

确认 `docker/.env`、证书、密钥日志和非本任务文件未被修改；确认当前报告仍明确列出真实生产凭据、现场联调、容量和远端 CI 的未完成门禁。

实际验证：`docker/.env`、`docker/mqtt-certs`、`docker/certs` 和敏感扩展名文件均未出现在工作区变更中；协议脚本退出后 4840/5020 端口均空闲且无协议临时目录；`git diff --check`、Shell 语法检查和生产脚本契约检查通过。macOS 进程枚举受宿主权限限制，但脚本已按自身 PID 清理，端口复核为空闲。

## 完成判定

1. 默认协议测试不再静默通过，缺失 Simulator 明确 skip；显式启用时缺失 Simulator 非零失败。
2. 仓库 Simulator 与适配器实际读取契约一致，协议脚本中的四条测试真实执行并通过。
3. CI 无条件运行协议验收并在 Simulator/测试失败时阻断。
4. 文档只记录已获得的 Simulator 证据，现场工业设备验收仍保持未完成。
5. 所有分层门禁和工作区边界检查均有新鲜命令输出。
