# 工业遥测模拟器升级设计：全链路真实化

**日期**：2026-06-13
**状态**：已确认，待转入实施计划
**关联阶段**：Phase 2「真实接入 + 知识沉淀」的"工厂试点"前置准备

---

## 一、Context（为什么做这个改动）

### 问题

当前 `tools/EquipAI.Simulator` 生成的遥测数据有三个致命缺陷，导致项目的核心卖点（AI 根因分析、告警引擎、ML 异常检测）全都在"假数据"上运行，从未得到真正验证：

1. **指标名与种子模板脱节**：种子数据为空压机定义的指标是 `discharge_pressure`/`oil_temperature`/`vibration`/`motor_current`/`air_flow`，但模拟器硬编码发送 `temperature`/`vibration`/`pressure`/`humidity`/`rpm`。两者对不上，模拟器发的数据**根本触发不了基于种子模板配置的告警规则**——告警中心、AI 分析、工单自动创建全链路在测试中是断的。

2. **数据无时间相关性**：每个采样点独立生成（基础值 + 高斯噪声），没有真实工业数据的三大特征：
   - **趋势**（磨损渐进、环境温漂）
   - **周期**（昼夜波动、班次负载变化）
   - **故障演化**（瞬时 → 持续 → 恶化）

3. **异常模式单一**：5% 概率每次重新决定是否异常，异常值在区间内均匀分布。真实故障是演化性的（轴承磨损持续数小时渐增），且有明确的多指标联动特征（过载 → 电流阶跃 + 油温升 + 振动升）。

### 目标

升级模拟器，使其生成的数据能**真正走通"采集 → 告警引擎 → AI 根因分析 → 工单创建"全链路**，并通过携带"标准答案"的故障剧本，为后续量化评估 AI 诊断准确率奠定基础。

### 范围决策

经讨论确认：
- **范围**：全链路真实化（数据算法升级 + 指标对齐种子模板 + 告警规则联动 + 故障剧本）
- **设备聚焦**：空压机一类做透（5-6 种详细故障剧本），CNC/注塑机后续复用模式
- **验证闭环**：故障剧本携带标准答案（ground truth），记录到 JSON 日志，为后续评估仪表盘铺路
- **不做**：OPC UA 公开服务器联调（依赖外网，后续单独做）、前端评估仪表盘（方案 C，后续做）

---

## 二、架构与模块边界

### 目录结构

```
tools/EquipAI.Simulator/
├── Program.cs                    # 入口：解析参数、装配引擎、运行循环
├── Profiles/
│   └── AirCompressorProfile.cs   # 空压机设备画像（指标定义、正常工况、周期参数）
├── Faults/
│   ├── IFaultPattern.cs          # 故障模式接口
│   ├── BearingWearFault.cs       # 轴承磨损（振动渐变↑）
│   ├── LubricationFailureFault.cs# 润滑失效（油温阶跃↑、振动↑）
│   ├── ValveLeakFault.cs         # 阀片泄漏（排气压力↓、排气量↓、油温↑）
│   ├── OverloadFault.cs          # 过载（电流↑、油温↑、振动↑）
│   ├── DischargeBlockageFault.cs # 排气堵塞（排气压力↑↑、排气量↓↓、油温↑↑）
│   └── SensorDriftFault.cs       # 传感器漂移（单指标缓漂）
├── Engine/
│   ├── ScenarioEngine.cs         # 剧本引擎：加载JSON、按时间线注入故障
│   ├── TelemetryGenerator.cs     # 数据合成：正常基线 + 故障叠加 + 噪声
│   └── GroundTruthLogger.cs      # 标准答案记录器
├── Models/
│   ├── DeviceProfile.cs          # 设备画像基类
│   ├── FaultScenario.cs          # 剧本JSON模型
│   └── GroundTruthEntry.cs       # 标准答案条目
└── scenarios/                    # 示例剧本
    ├── bearing-wear.json
    ├── lubrication-failure.json
    └── random-mixed.json
```

### 模块职责边界

每个模块单一职责，可独立单元测试：

| 模块 | 职责 | 不知道的事 |
|------|------|-----------|
| `DeviceProfile` | 定义"这台空压机正常时各指标该是多少"、周期参数 | 不知道故障存在 |
| `FaultPattern` | 给定故障已持续时间，返回各指标应叠加的偏差 | 不知道设备基线 |
| `TelemetryGenerator` | 合成最终值：`正常基线(t) + Σ 故障偏差(t) + 噪声` | 不决定何时注入故障 |
| `ScenarioEngine` | 管理时间线、按剧本注入/移除故障 | 不碰数据生成细节 |
| `GroundTruthLogger` | 记录"何时注入了什么故障、预期诊断是什么" | 不评估 AI 输出 |

---

## 三、数据生成算法

### 正常工况数学模型

每个指标值由四部分叠加：

```
metric(t) = baseline + trend(t) + periodic(t) + noise(t)
```

- **baseline（基线）**：设备画像里的标准运行值。如空压机 `oil_temperature` 基线 65°C
- **trend（趋势）**：布朗运动（随机游走，步长极小），保证相邻采样点强相关。模拟环境温度缓变或轻微磨损。每个指标有自己的漂移速率
- **periodic（周期）**：
  - 24 小时昼夜周期（环境温度影响）：`amplitude × sin(2π × hour / 24)`
  - 班次负载周期（工厂 8:00-20:00 高负载）：工作时段基线上浮
  - 振幅按指标特性调（`oil_temperature` 受环境影响大，振幅 ±3°C；`discharge_pressure` 几乎不受影响，振幅 ±0.02 MPa）
- **noise（噪声）**：高斯白噪声，标准差按指标精度调（Box-Muller 变换）

### 故障工况数学模型

故障激活后，在正常值基础上叠加故障偏差：

```
metric(t) = normal(t) + Σ active_faults[i].Delta(metric, elapsed)
```

`IFaultPattern` 接口：

```csharp
public interface IFaultPattern
{
    /// <summary>故障类型标识（如 "bearing_wear"）</summary>
    string FaultType { get; }

    /// <summary>受影响的指标列表</summary>
    IReadOnlyList<string> AffectedMetrics { get; }

    /// <summary>预期根因诊断（标准答案）</summary>
    string ExpectedRootCause { get; }

    /// <summary>预期告警严重级别</summary>
    string ExpectedSeverity { get; }

    /// <summary>给定故障已持续时间，返回某指标的叠加偏差</summary>
    double Delta(string metric, TimeSpan elapsed);
}
```

---

## 四、6 种空压机故障演化曲线

每种故障有明确的数学模型、多指标联动模式和预期诊断标签。**多指标联动模式的区分性是验证 AI 能否给出正确诊断的关键**——比如过载和润滑失效都会让油温升高，但过载有电流阶跃而润滑失效没有。

**故障参数已与第五章告警阈值联动校准**，确保每种故障在剧本时间内（加速后约 30 分钟）能触发至少一条告警规则：

| 故障 | 触发的告警规则 | 数学特征 | 受影响指标（方向与曲线） | 预期根因诊断 | 预期严重级别 |
|------|--------------|---------|------------------------|------------|------------|
| **轴承磨损** `bearing_wear` | vibration GT 7.0 | 振动按 `base × 0.02 × hours` 线性渐增（基线 2.5 → 约 90 小时达 7.0，剧本加速后 30 分钟）；油温微升 | vibration↑（线性渐变）, oil_temperature↑（缓慢线性） | "轴承磨损，建议检查润滑和游隙" | High |
| **润滑失效** `lubrication_failure` | oil_temperature GT 90 | 油温在 2 分钟内阶跃 +25°C（65 → 90）后持续；振动随之在 30 分钟内缓升 +1.5 mm/s | oil_temperature↑（阶跃至 90）, vibration↑（渐变） | "润滑系统故障，检查油位和油泵" | Critical |
| **阀片泄漏** `valve_leak` | discharge_pressure LT 0.5 | 排气压力 10 分钟内缓降至 0.5（基线 0.7，降 ~28%）；排气量同步降 20%；油温因效率降而升 +8°C | discharge_pressure↓（渐降至 0.5）, air_flow↓（渐降）, oil_temperature↑（渐升） | "气阀泄漏，检查阀片密封" | High |
| **过载** `overload` | motor_current GT 180 | 电流 1 分钟内阶跃 +60A（120 → 180）；油温 10 分钟内升 +10°C；振动升 +0.8 mm/s | motor_current↑（阶跃至 180）, oil_temperature↑（渐升）, vibration↑（渐升） | "电机过载，检查负载和电压" | High |
| **排气堵塞** `discharge_blockage` | discharge_pressure GT 1.1 | 排气压力 3 分钟内急升 +0.4 MPa（0.7 → 1.1）；排气量骤降 30%；油温急升 +20°C | discharge_pressure↑↑（急升至 1.1）, air_flow↓↓（骤降）, oil_temperature↑↑（急升） | "排气系统堵塞，检查过滤器" | Critical |
| **传感器漂移** `sensor_drift` | discharge_pressure GT 1.1 | 仅 `discharge_pressure` 每分钟偏移 +0.005 MPa（累积），约 80 分钟达 1.1；其他指标全正常 | discharge_pressure↑（单向缓漂至 1.1，仅此一个） | "传感器漂移，建议校准或更换" | Normal |

---

## 五、指标对齐与告警规则联动

### 指标对齐

`AirCompressorProfile` 直接采用种子模板的 5 个指标名，确保模拟器数据能匹配种子告警规则：

| 指标名 | 单位 | 正常基线 | 噪声标准差 | 周期振幅 |
|--------|------|---------|-----------|---------|
| `discharge_pressure` | MPa | 0.7 | 0.01 | 0.02 |
| `oil_temperature` | °C | 65 | 1.0 | 3.0 |
| `vibration` | mm/s | 2.5 | 0.2 | 0.1 |
| `motor_current` | A | 120 | 2.0 | 5.0 |
| `air_flow` | m³/min | 20 | 0.3 | 1.0 |

### 告警规则联动

种子数据里空压机模板的 `DefaultAlarmRules = "[]"` 是空的。本次升级在 `DataSeeder.cs` 中为空压机模板追加合理的默认告警规则，使模拟器数据能真正触发告警引擎：

```json
[
  {"metric": "oil_temperature", "ruleType": "threshold", "operator": "gt", "threshold": 90, "severity": "High", "cooldownSeconds": 300},
  {"metric": "vibration", "ruleType": "threshold", "operator": "gt", "threshold": 7.0, "severity": "Critical", "cooldownSeconds": 600},
  {"metric": "discharge_pressure", "ruleType": "threshold", "operator": "gt", "threshold": 1.1, "severity": "High", "cooldownSeconds": 300},
  {"metric": "discharge_pressure", "ruleType": "threshold", "operator": "lt", "threshold": 0.5, "severity": "High", "cooldownSeconds": 300},
  {"metric": "motor_current", "ruleType": "threshold", "operator": "gt", "threshold": 180, "severity": "High", "cooldownSeconds": 300}
]
```

告警引擎已确认支持 GT/GTE/LT/LTE/EQ 全部操作符（见 `ThresholdEvaluator.cs:27-36`），所以阀片泄漏的排气压力下降用 LT 规则检测。

### 故障-告警校准表

每种故障与触发的告警规则一一对应，确保数据能走通"采集 → 告警 → AI 分析 → 工单"全链路：

| 故障类型 | 触发告警 | 基线 → 故障终值 | 触发时间（剧本加速后） |
|---------|---------|----------------|---------------------|
| 轴承磨损 | vibration GT 7.0 | 2.5 → 7.0+ | ~30 分钟（timeScale=180） |
| 润滑失效 | oil_temperature GT 90 | 65 → 90 | 2 分钟内阶跃 |
| 阀片泄漏 | discharge_pressure LT 0.5 | 0.7 → 0.5 | ~10 分钟渐降 |
| 过载 | motor_current GT 180 | 120 → 180 | 1 分钟内阶跃 |
| 排气堵塞 | discharge_pressure GT 1.1 | 0.7 → 1.1 | 3 分钟内急升 |
| 传感器漂移 | discharge_pressure GT 1.1 | 0.7 → 1.1 | ~80 分钟缓漂 |

---

## 六、运行模式

### 剧本模式（可重复评估）

```bash
dotnet run --project tools/EquipAI.Simulator -- \
  --tenant <id> \
  --scenario scenarios/bearing-wear.json
```

剧本 JSON 格式：

```json
{
  "name": "bearing-wear-scenario",
  "deviceCode": "AC-001",
  "description": "模拟轴承磨损渐进故障",
  "timeScale": 60,
  "timeline": [
    {
      "at": "00:00:00",
      "action": "start",
      "faultType": "bearing_wear"
    },
    {
      "at": "02:00:00",
      "action": "stop",
      "faultType": "bearing_wear"
    }
  ]
}
```

`timeScale: 60` 表示 1 秒真实时间 = 1 分钟模拟时间（用于加速长周期故障测试）。

### 随机模式（长期运行测试）

```bash
dotnet run --project tools/EquipAI.Simulator -- \
  --tenant <id> \
  --mode random \
  --fault-rate 0.05 \
  --devices 3
```

按 `fault-rate` 概率随机从 6 种故障中选一种注入，每次故障持续 10-60 分钟随机，用于测试告警风暴和 AI 分析在持续运行下的稳定性。

---

## 七、标准答案（Ground Truth）记录

每次注入故障时，`GroundTruthLogger` 写一条记录到 `ground-truth-{runId}.json`：

```json
{
  "runId": "2026-06-13T14-30-00",
  "deviceCode": "AC-001",
  "scenario": "bearing-wear",
  "startedAt": "2026-06-13T14:30:00Z",
  "events": [
    {
      "injectedAt": "2026-06-13T14:35:00Z",
      "faultType": "bearing_wear",
      "affectedMetrics": ["vibration", "oil_temperature"],
      "expectedRootCause": "轴承磨损，建议检查润滑和游隙",
      "expectedSeverity": "High",
      "duration": "ongoing"
    },
    {
      "injectedAt": "2026-06-13T16:35:00Z",
      "faultType": "bearing_wear",
      "action": "stopped",
      "duration": "PT2H"
    }
  ]
}
```

后续做评估仪表盘（方案 C）时，拿此文件与 `analyses` 表按时间窗匹配，计算 AI 诊断与预期根因的匹配率。

---

## 八、测试策略

### 单元测试（`tests/EquipAI.Tests.Unit`）

新增 `Simulator/` 测试目录：

1. **每个 `FaultPattern` 的 `Delta()` 函数**：给定持续时间，验证各指标偏差符合预期曲线
   - 轴承磨损：10 小时后振动增量 ≈ `base × 0.2`
   - 润滑失效：2 分钟后油温增量 = 15°C（阶跃完成）
   - 排气堵塞：3 分钟后排气压力增量 = +0.14 MPa（+20%）
2. **`TelemetryGenerator`**：注入已知故障，验证生成的数据确实触发告警阈值
3. **`ScenarioEngine`**：加载 JSON 剧本，验证时间线注入/移除故障的正确性
4. **`AirCompressorProfile`**：验证指标名与种子模板一致（防回归）

### 集成验证（手动）

1. 启动后端 + Mosquitto + 前端
2. 跑 `bearing-wear.json` 剧本
3. 观察告警中心在预期时间触发 `High` 级别振动告警
4. 观察 AI 分析给出接近"轴承磨损"的诊断
5. 观察工单自动创建

### 回归保护

- 现有 560 个后端单元测试必须全过
- 现有 293 个前端测试必须全过
- `DataSeeder` 告警规则变更不影响其他设备类型模板

---

## 九、验收标准

1. 模拟器发送的 5 个指标名与种子空压机模板完全一致
2. 跑 `bearing-wear.json` 剧本，2 小时内（模拟时间）告警中心出现 `vibration` 的 `High` 级别告警
3. 跑 `overload.json` 剧本，AI 分析输出的根因包含"过载"或"电流"关键词
4. `ground-truth-{runId}.json` 文件正确记录每次故障注入的标准答案
5. 6 种故障的单元测试全部通过
6. 现有 853 个测试（560 后端 + 293 前端）无回归

---

## 十、后续工作（不在本次范围）

1. **方案 C：评估仪表盘**——前端页面展示 AI 诊断命中率/误报率/漏报率，基于 ground truth JSON 与 analyses 表匹配
2. **CNC/注塑机故障剧本**——复用本次的模块化模式，为另外两类设备添加故障剧本
3. **OPC UA 公开服务器联调**——接 Sterfive/UnifiedAutomation 演示服务器，验证真实协议链路
4. **ML.NET 模型真实样本训练**——用本次生成的带标签数据训练 SrCnn 模型，替换默认参数
