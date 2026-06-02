# Phase 2 设计规格：真实协议接入 + 知识沉淀闭环

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 验证边缘网关全链路、可视化设备配置、Modbus RTU 支持、知识沉淀闭环

**Architecture:** 4 个独立子计划，按 2A→2B→2C→2D 顺序执行。2A 是基线（Simulator + 联调），2B 依赖 2A 的 Simulator 做连接测试，2C 独立于 2B，2D 独立于其他三者。

**Tech Stack:** .NET 8 (OPC Foundation SDK, FluentModbus, System.IO.Ports) / React 19 + React Hook Form + Zod / PostgreSQL / MQTT

---

## 子计划 2A：边缘网关联调验证

### 目标

用 Mock 模拟服务器替代真实 PLC，端到端验证 EdgeGateway 的采集→缓冲→MQTT 上传→后端→告警→SignalR 全链路。

### 新增项目：EquipAI.Simulator

独立控制台项目，包含 OPC UA 和 Modbus TCP 两个 Mock Server。

#### SimulatedSensor 类

模拟传感器基类，生成随时间波动的物理量。

```csharp
public class SimulatedSensor
{
    public string Name { get; }          // 指标名：temperature, pressure, vibration
    public double BaseValue { get; }     // 基线值
    public double Amplitude { get; }    // 振幅（控制峰谷范围）
    public double Frequency { get; }    // 频率 Hz
    public double NoiseStdDev { get; }  // 高斯噪声标准差

    public double GetValue(DateTime timestamp);
}
```

内置传感器预设：
- `temperature`: BaseValue=65, Amplitude=30, Frequency=0.01Hz → 周期性从 35°C 升到 95°C，触发阈值告警
- `pressure`: BaseValue=50, Amplitude=15, Frequency=0.008Hz
- `vibration`: BaseValue=5, Amplitude=3, Frequency=0.02Hz

#### OpcUaMockServer

使用 OPC Foundation SDK 创建轻量 OPC UA Server：
- 注册命名空间 `ns=2;s=Simulator.{SensorName}`
- 每个传感器对应一个节点，值由 SimulatedSensor.GetValue(DateTime.UtcNow) 动态计算
- 监听端口 4840

#### ModbusTcpMockServer

使用 FluentModbus 的 `ModbusTcpServer`：
- Holding Registers 起始地址 100，每个传感器占 2 个寄存器（浮点数）
- 读取时返回 SimulatedSensor 当前值
- 监听端口 5020（避免与系统 Modbus 冲突）

#### Simulator 配置

```json
{
  "OpcUa": { "Port": 4840 },
  "ModbusTcp": { "Port": 5020 },
  "Sensors": [
    { "Name": "temperature", "BaseValue": 65, "Amplitude": 30, "Frequency": 0.01, "NoiseStdDev": 1.0 },
    { "Name": "pressure", "BaseValue": 50, "Amplitude": 15, "Frequency": 0.008, "NoiseStdDev": 0.5 },
    { "Name": "vibration", "BaseValue": 5, "Amplitude": 3, "Frequency": 0.02, "NoiseStdDev": 0.2 }
  ]
}
```

### EdgeGateway 测试配置

appsettings.json 中配置两组设备分别连接 OPC UA 和 Modbus TCP Simulator：

```json
{
  "Devices": [
    {
      "DeviceId": "sim-opcua-001",
      "Protocol": "opcua",
      "ConnectionString": "opc.tcp://localhost:4840",
      "DeviceType": "Simulator",
      "DataPoints": {
        "temperature": "ns=2;s=Simulator.temperature",
        "pressure": "ns=2;s=Simulator.pressure"
      },
      "PollIntervalMs": 2000
    },
    {
      "DeviceId": "sim-modbus-001",
      "Protocol": "modbus-tcp",
      "ConnectionString": "localhost:5020",
      "DeviceType": "Simulator",
      "DataPoints": {
        "temperature": "holding_register:100",
        "pressure": "holding_register:102"
      },
      "PollIntervalMs": 2000
    }
  ]
}
```

### 验证脚本

`tests/e2e/run-integration.sh`：
1. 确认 Docker 服务运行（PostgreSQL + Redis + Mosquitto）
2. 启动后端（dotnet run --seed）
3. 启动 Simulator（dotnet run --project EquipAI.Simulator）
4. 启动 EdgeGateway（dotnet run --project EquipAI.EdgeGateway）
5. 等待 30 秒让温度上升到超阈值
6. 调用 API 验证：遥测数据已写入、告警已触发
7. 输出结果：PASS / FAIL

### 测试

- `SimulatorTests`：SimulatedSensor.GetValue 返回值在 [BaseValue - Amplitude - 3σ, BaseValue + Amplitude + 3σ] 范围内
- `OpcUaMockServerTests`：连接 Mock Server 并读取节点值，确认非空且类型正确
- `ModbusMockServerTests`：连接 Mock Server 并读取寄存器，确认返回有效浮点数

### 涉及文件

| 操作 | 文件 |
|------|------|
| 创建 | `src/EquipAI.Simulator/EquipAI.Simulator.csproj` |
| 创建 | `src/EquipAI.Simulator/Program.cs` |
| 创建 | `src/EquipAI.Simulator/SimulatedSensor.cs` |
| 创建 | `src/EquipAI.Simulator/OpcUaMockServer.cs` |
| 创建 | `src/EquipAI.Simulator/ModbusTcpMockServer.cs` |
| 创建 | `src/EquipAI.Simulator/appsettings.json` |
| 创建 | `tests/EquipAI.Tests.Unit/Simulator/SimulatedSensorTests.cs` |
| 创建 | `tests/e2e/run-integration.sh` |
| 修改 | `EquipAI.sln` — 添加 Simulator 项目 |

---

## 子计划 2B：前端设备配置向导

### 目标

React 多步向导替代手动编辑 appsettings.json，配置存储在后端数据库，EdgeGateway 启动时通过 API 拉取。

### 后端改动

#### 数据库：gateway_devices 表

```sql
CREATE TABLE gateway_devices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gateway_id      VARCHAR(64) NOT NULL,       -- 网关标识
    tenant_id       UUID NOT NULL,
    device_id       UUID,                        -- 关联已有设备（可选）
    device_name     VARCHAR(200) NOT NULL,       -- 显示名称
    protocol        VARCHAR(32) NOT NULL,        -- opcua / modbus-tcp / modbus-rtu
    connection_config JSONB NOT NULL,            -- 连接参数（IP/端口/串口等）
    data_points     JSONB NOT NULL,              -- 采集点位映射
    poll_interval_ms INT NOT NULL DEFAULT 3000,
    enabled         BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 实体和配置

- `GatewayDevice` 实体（Core 层）
- `GatewayDeviceConfiguration` EF 配置（Infrastructure 层）
- EF Core 迁移

#### GatewayConfigController

```
GET    /api/v1/gateway/config?gatewayId=xxx     — EdgeGateway 拉取配置（AuthKey 认证）
POST   /api/v1/gateway/devices                  — 创建设备配置（JWT 认证）
PUT    /api/v1/gateway/devices/{id}              — 修改设备配置
DELETE /api/v1/gateway/devices/{id}              — 删除设备配置
POST   /api/v1/gateway/devices/test-connection   — 测试连接（创建临时适配器尝试连接）
```

`test-connection` 端点：接收协议类型 + 连接参数，后端创建临时 `IProtocolAdapter` 尝试连接，返回 `{ success: true/false, message: "..." }`。

`GET /api/v1/gateway/config` 端点：使用 `X-Gateway-Auth-Key` Header 认证（匹配 `GatewayOptions.AuthKey`），返回该 gateway_id 下所有 enabled=true 的设备配置列表。

#### EdgeGateway Program.cs 改造

启动时优先从后端 API 拉取配置，fallback 到本地 appsettings.json：

```csharp
// 优先从后端 API 拉取设备配置
var devices = await LoadDevicesFromBackendAsync(options, logger)
    ?? devicesFromConfig;  // fallback 到本地配置
```

### 前端改动

#### DeviceSetupPage 改造为多步向导

4 步表单，使用 React Hook Form + Zod 校验：

**步骤 1 — 选择协议：**
- OPC UA / Modbus TCP / Modbus RTU 三张卡片
- 选中后展示对应连接参数表单

**步骤 2 — 配置连接：**
- OPC UA：服务器地址 opc.tcp://host:port
- Modbus TCP：IP + 端口（默认 502）
- Modbus RTU：串口路径 + 波特率 + 数据位 + 校验位 + 停止位
- "测试连接"按钮 → POST /api/v1/gateway/devices/test-connection

**步骤 3 — 选择数据点：**
- 连接成功后展示"添加数据点"表单
- OPC UA：手动输入 NodeId（如 ns=2;s=Temperature）+ 指标名
- Modbus：选择类型（holding_register/input_register/coil/discrete_input）+ 地址 + 指标名
- 支持添加多个数据点
- 关联已有设备（下拉选择）或创建新设备

**步骤 4 — 确认并保存：**
- 预览完整配置
- 点击"保存" → POST /api/v1/gateway/devices

#### API hooks

```typescript
// useGatewayDevices.ts
export function useGatewayDevices()           // GET /gateway/devices
export function useCreateGatewayDevice()      // POST /gateway/devices
export function useTestConnection()           // POST /gateway/devices/test-connection
export function useDeleteGatewayDevice()      // DELETE /gateway/devices/:id
```

### 涉及文件

| 操作 | 文件 |
|------|------|
| 创建 | `src/EquipAI.Core/Entities/GatewayDevice.cs` |
| 创建 | `src/EquipAI.Infrastructure/Data/Configurations/GatewayDeviceConfiguration.cs` |
| 创建 | `src/EquipAI.WebAPI/Controllers/GatewayConfigController.cs` |
| 创建 | `frontend/src/hooks/useGatewayDevices.ts` |
| 修改 | `src/EquipAI.EdgeGateway/Program.cs` — API 拉取配置逻辑 |
| 修改 | `frontend/src/pages/DeviceSetupPage.tsx` — 多步向导 |
| 修改 | `src/EquipAI.Infrastructure/Data/AppDbContext.cs` — DbSet |

---

## 子计划 2C：Modbus RTU 适配器

### 目标

新增 `ModbusRtuAdapter` 支持 RS485 串口设备，复用现有管线零改动。

### 技术方案

使用 `FluentModbus`（已包含 RTU 支持）+ `System.IO.Ports`（.NET 8 官方串口包）。

#### NuGet 依赖

```xml
<PackageReference Include="System.IO.Ports" Version="9.0.0" />
```

FluentModbus 已在 EdgeGateway.csproj 中，无需额外添加。

#### ModbusRtuAdapter 实现

```csharp
public class ModbusRtuAdapter : IProtocolAdapter
{
    public string ProtocolType => "modbus-rtu";

    // ConnectionString 格式：COM3:9600:8:N:1:slaveAddress
    // 解析：端口:波特率:数据位:校验(N/E/O):停止位:从站地址
    Task ConnectAsync(DeviceConfig config, CancellationToken ct);
    Task<List<DataPoint>> ReadAsync(string[] pointIds, CancellationToken ct);
    bool IsConnected { get; }
}
```

地址解析复用 `ModbusTcpAdapter` 的逻辑（`type:address` 格式），仅传输层从 TCP 改为 Serial RTU。

#### 串口共享

RS485 总线上多设备共享同一串口。实现 `SerialPortManager` 单例管理串口生命周期：

```csharp
public class SerialPortManager : IDisposable
{
    // key: "COM3:9600:8:N:1"
    private readonly ConcurrentDictionary<string, SerialPort> _ports = new();
    public SerialPort GetOrCreatePort(string portConfig);
    public void Release(string portConfig);
}
```

DataCollector 注册时检查 Protocol，RTU 设备共享同一个 SerialPortManager。

### 注册

Program.cs adapterFactory 新增：

```csharp
"modbus-rtu" => new ModbusRtuAdapter(serialPortManager),
```

### 测试

- `ModbusRtuAdapterTests`：使用 FluentModbus 的 `ModbusRtuSerialServer` 创建 RTU Mock，验证读取
- `SerialPortManagerTests`：验证同一端口复用、引用计数释放

### 涉及文件

| 操作 | 文件 |
|------|------|
| 创建 | `src/EquipAI.EdgeGateway/Protocols/ModbusRtuAdapter.cs` |
| 创建 | `src/EquipAI.EdgeGateway/Protocols/SerialPortManager.cs` |
| 创建 | `tests/EquipAI.Tests.Unit/EdgeGateway/ModbusRtuAdapterTests.cs` |
| 修改 | `src/EquipAI.EdgeGateway/EquipAI.EdgeGateway.csproj` — 添加 System.IO.Ports |
| 修改 | `src/EquipAI.EdgeGateway/Program.cs` — 注册 modbus-rtu |

---

## 子计划 2D：知识沉淀闭环

### 目标

完善 AI 分析 → 候选规则生成 → 专家审核 → 规则生效的全链路。

### 后端改动

#### RootCauseAnalysisEngine 扩展

分析完成后，当置信度 >= 0.7 且能提取因果模式时，自动生成候选规则：

```csharp
private async Task GenerateCandidateRuleAsync(
    Guid tenantId, Guid deviceId, string metric,
    string conditions, string conclusion, string recommendedActions,
    decimal confidence, CancellationToken ct)
{
    var rule = new PendingRule
    {
        TenantId = tenantId,
        DeviceType = null,          // 通用规则
        Name = $"AI推荐: {metric} 异常处理规则",
        Conditions = conditions,    // JSONB，如 {"metric":"temperature","operator":">","threshold":90}
        Conclusion = conclusion,    // JSONB，如 {"cause":"过热","probability":0.85}
        RecommendedActions = recommendedActions,
        Confidence = confidence,
        ReviewStatus = ReviewStatus.Pending
    };
    // 写入 pending_rules（通过 UnfilteredSet 绕过租户过滤器）
}
```

触发条件：`RootCauseAnalysisHandler` 处理 `AlertTriggeredEvent` 后，调用 `RootCauseAnalysisEngine`，如果分析结果包含可提取模式则自动生成。

#### KnowledgeController 新增端点

```
PUT /api/v1/knowledge/pending-rules/{id}/approve   — 批准规则
    Body: { "adjustedCondition": "temperature > 95" }  // 可选修改条件
    → 迁移到 knowledge_rules，记录审计日志

PUT /api/v1/knowledge/pending-rules/{id}/reject    — 拒绝规则
    Body: { "reason": "阈值过高，实际 80°C 就需要告警" }
    → 标记 Status=Rejected，记录拒绝原因
```

批准逻辑：
1. 从 `pending_rules` 读取规则
2. 创建对应的 `knowledge_rules` 记录
3. 更新 `pending_rules.Status = Approved`
4. 记录审计日志（Action="KnowledgeRuleApproved"）

#### IAuditLogService 调用

所有审核操作通过 `IAuditLogService.LogFromContextAsync` 记录：
- 批准：记录规则内容、操作者、置信度
- 拒绝：记录拒绝原因

### 前端改动

#### PendingRulesPage 完善

列表展示：
- 规则条件（如 "temperature > 90°C"）
- 来源：显示 "AI 自动推荐" + 置信度百分比 + 来源分析 ID（可点击跳转分析详情）
- 创建时间
- 状态标签（Pending / Approved / Rejected）

操作按钮：
- **批准**：弹窗确认，直接迁移到 knowledge_rules
- **修改后批准**：弹窗中可编辑条件（阈值、指标等），确认后迁移
- **拒绝**：弹窗填写拒绝原因（必填），提交后标记 Rejected

#### KnowledgePage 规则列表增强

规则来源标识列：
- 人工创建：显示用户名 + 创建时间
- AI 推荐：显示 "AI 推荐" + 原始置信度 + 审核通过时间

### 涉及文件

| 操作 | 文件 |
|------|------|
| 修改 | `src/EquipAI.Application/Analysis/RootCauseAnalysisEngine.cs` — 生成候选规则 |
| 修改 | `src/EquipAI.Application/Analysis/Handlers/RootCauseAnalysisHandler.cs` — 触发生成 |
| 修改 | `src/EquipAI.WebAPI/Controllers/KnowledgeController.cs` — 审核端点 |
| 修改 | `frontend/src/pages/PendingRulesPage.tsx` — 审核操作 UI |
| 修改 | `frontend/src/pages/KnowledgePage.tsx` — 来源标识 |
| 修改 | `frontend/src/hooks/useKnowledge.ts` — 新增审核 API hooks |

---

## 执行顺序

```
2A（Simulator + 联调）→ 2B（前端配置向导，依赖 2A 的 test-connection）
2C（Modbus RTU，独立）可并行
2D（知识沉淀，独立）可并行
```

推荐：先串行完成 2A 和 2B，然后 2C 和 2D 并行执行。
