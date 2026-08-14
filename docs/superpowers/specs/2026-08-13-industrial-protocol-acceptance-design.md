# 工业协议验收闭环设计

**日期：** 2026-08-13

**状态：** 已确认方向；实施中

**范围：** OPC UA、Modbus TCP 适配器的自动化协议验收、Simulator 数据契约和 CI 执行边界

## 1. 背景与问题

当前仓库已经包含 `src/EquipAI.Simulator`，可以启动 OPC UA 和 Modbus TCP 模拟服务；但
`tests/EquipAI.Tests.Unit/EdgeGateway/` 下的两个协议集成测试仍依赖历史的 `/tmp` 脚本和固定旧端点。
模拟器不可用时测试直接 `return`，xUnit 将其计为通过，形成假绿。与此同时，仓库 Simulator 的 OPC UA 节点
使用字符串 NodeId，Modbus mock 将一个传感器拆成两个浮点寄存器，而 `ModbusTcpAdapter` 按一个
`ushort` 寄存器读取，端到端数据契约并不一致。

这会让 CI 和开发者看到“测试通过”，却不能证明边缘网关真的能从仓库提供的模拟工业设备读取有效数据。

## 2. 目标与非目标

### 2.1 目标

1. 协议集成测试在模拟器缺失时必须明确标记为 skipped；显式启用真实协议测试时，模拟器缺失必须使测试失败。
2. OPC UA 测试使用仓库 Simulator 的真实端口和字符串节点；Modbus TCP 测试使用仓库 Simulator 的真实端口、保持寄存器和线圈。
3. Simulator 的 Modbus mock 与现有适配器契约一致：每个传感器占一个 `ushort` 保持寄存器，地址从 100 连续分配；线圈 0 为运行、线圈 1 为报警。
4. 增加可复现的协议验收脚本：只启动本脚本创建的 Simulator，等待两个端点就绪，运行 `RequiresSimulator` 测试，退出时只清理自身进程。
5. CI 显式运行协议验收脚本；普通单元测试仍保持不依赖工业模拟器的快速路径。
6. 文档和发布报告区分“默认测试跳过”“仓库 Simulator 自动验收通过”和“真实现场 PLC/OPC UA/Modbus 联调待完成”。

### 2.2 非目标

- 不伪造真实 PLC、串口设备、现场证书、OPC UA 用户身份或生产凭据。
- 不改变生产 `ModbusTcpAdapter` 的点位格式，不引入新的工业协议数据编码协议。
- 不把 Simulator 或本地协议验收结果当作现场网络隔离、设备兼容性和容量验收。
- 不自动杀死宿主机上已有的 4840、5020 端口进程；端口被占用时脚本必须失败并保留原进程。

## 3. 设计

### 3.1 测试启用和失败边界

协议测试继续保留 `Trait("Category", "RequiresSimulator")`。测试公共辅助逻辑读取
`RUN_PROTOCOL_INTEGRATION_TESTS`：

- 未设置为 `true` 且模拟器不可达：抛出 `Xunit.Sdk.SkipException.ForSkip(...)`，测试报告为明确跳过。
- 设置为 `true` 且模拟器不可达：抛出普通异常，测试失败；不得把连接错误转换为跳过。
- 模拟器可达：执行完整连接、读取、质量和数值断言。

测试端点通过环境变量覆盖，默认值与仓库 Simulator 一致：

| 变量 | 默认值 |
|------|--------|
| `EQUIPAI_OPCUA_TEST_ENDPOINT` | `opc.tcp://127.0.0.1:4840` |
| `EQUIPAI_MODBUS_TEST_ENDPOINT` | `127.0.0.1:5020` |

### 3.2 Simulator 数据契约

`ModbusTcpMockServer` 每 500ms 将传感器当前值四舍五入并限制到 `ushort` 范围，写入一个保持寄存器：

| 传感器序号 | 保持寄存器 |
|------------|------------|
| 0 | 100 |
| 1 | 101 |
| 2 | 102 |

同时每次更新固定写入线圈 0 为 `true`、线圈 1 为 `false`，使适配器已有的线圈读取能力可以被真实模拟服务验证。
该约定与 `tests/e2e/run-integration.sh` 使用的 `holding_register:100` 等点位一致。

OPC UA 测试使用 Simulator 注册的字符串节点：`ns=2;s=temperature`、`ns=2;s=pressure`、
`ns=2;s=vibration`；测试不再依赖过时的整数节点 ID。

### 3.3 协议验收脚本

新增 `tests/e2e/run-protocol-integration.sh`：

1. 检查 Docker/端口占用前置条件和 `dotnet` 可用性；不终止既有进程。
2. 在仓库根目录以 `dotnet run --project src/EquipAI.Simulator --no-build --no-launch-profile` 启动 Simulator，日志写入受控临时目录。
3. 通过 TCP 轮询 4840 和 5020，确认两个服务在限定时间内可用；Simulator 提前退出或超时立即失败。
4. 使用 `RUN_PROTOCOL_INTEGRATION_TESTS=true`、两个端点环境变量运行 `RequiresSimulator` 测试。
5. 使用 EXIT trap 仅停止当前脚本记录的 Simulator PID，并删除临时日志目录；不触碰其他进程。

### 3.4 CI 集成

在 backend job 的普通单元测试之后增加独立步骤运行协议验收脚本。该步骤不依赖真实 PLC，失败时阻断 CI；
普通单元测试命令不负责启动 Simulator。CI 仍单独保留 RabbitMQ 真实集成测试和其 `/equipai_test` vhost 门禁。

## 4. 测试策略

- 先用协议测试证明缺少 Simulator 时显式 skip/fail 边界，再修改实现。
- 为 Modbus mock 的单寄存器映射和线圈状态增加纯逻辑回归，防止再次回到双寄存器浮点契约。
- 运行协议验收脚本，实际执行 OPC UA 两个测试和 Modbus TCP 两个测试。
- 运行默认后端单元测试，确认未启用协议脚本时只有明确跳过而无静默通过。
- 运行 Release 构建、生产脚本契约和差异检查。

## 5. 发布边界

本设计完成后可以声称“仓库 Simulator 驱动的 OPC UA/Modbus TCP 自动验收通过”；仍不能声称真实现场 PLC
联调完成。正式上线依旧需要现场地址、证书/安全策略、寄存器表、串口参数、网络隔离、断线恢复和容量基线验收。
