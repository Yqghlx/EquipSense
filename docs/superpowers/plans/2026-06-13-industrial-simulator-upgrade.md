# 工业遥测模拟器升级实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将遥测模拟器从独立同分布随机数升级为工业级时序特征（趋势+周期+故障演化），聚焦空压机 6 种故障剧本，携带标准答案用于 AI 诊断准确率评估。

**Architecture:** 模块化拆分为 DeviceProfile（设备画像）/ FaultPattern（故障模式）/ TelemetryGenerator（数据合成）/ ScenarioEngine（剧本引擎）/ GroundTruthLogger（标准答案记录）。故障剧本用 JSON 配置，支持剧本模式和随机模式。

**Tech Stack:** .NET 8, xUnit, FluentAssertions, MQTTnet

**Spec:** `docs/superpowers/specs/2026-06-13-industrial-simulator-upgrade-design.md`

---

## File Structure

**新建文件（tools/EquipAI.Simulator/）：**

| 文件 | 职责 |
|------|------|
| `Models/DeviceProfile.cs` | 设备画像基类 + MetricSpec 记录 |
| `Models/MetricSpec.cs` | 单指标规格（基线/噪声/周期振幅） |
| `Models/FaultScenario.cs` | 剧本 JSON 模型 |
| `Models/GroundTruthEntry.cs` | 标准答案条目 |
| `Models/ActiveFault.cs` | 运行时活跃故障（模式 + 注入时刻） |
| `Profiles/AirCompressorProfile.cs` | 空压机画像（5 指标） |
| `Faults/IFaultPattern.cs` | 故障模式接口 |
| `Faults/BearingWearFault.cs` | 轴承磨损 |
| `Faults/LubricationFailureFault.cs` | 润滑失效 |
| `Faults/ValveLeakFault.cs` | 阀片泄漏 |
| `Faults/OverloadFault.cs` | 过载 |
| `Faults/DischargeBlockageFault.cs` | 排气堵塞 |
| `Faults/SensorDriftFault.cs` | 传感器漂移 |
| `Faults/FaultRegistry.cs` | 故障名→实例映射 |
| `Engine/TelemetryGenerator.cs` | 数据合成（基线+趋势+周期+噪声+故障） |
| `Engine/ScenarioEngine.cs` | 剧本时间线调度 |
| `Engine/GroundTruthLogger.cs` | 标准答案 JSON 记录 |
| `Engine/RandomFaultScheduler.cs` | 随机模式故障调度 |
| `scenarios/bearing-wear.json` | 轴承磨损剧本 |
| `scenarios/lubrication-failure.json` | 润滑失效剧本 |
| `scenarios/overload.json` | 过载剧本 |
| `scenarios/random-mixed.json` | 随机混合剧本 |

**修改文件：**
| 文件 | 改动 |
|------|------|
| `tools/EquipAI.Simulator/Program.cs` | 重写入口，装配新引擎，保留 MQTT 发送和 CLI |
| `src/EquipAI.Infrastructure/Seeding/DataSeeder.cs` | 为空压机模板追加 5 条默认告警规则 |

**新建测试（tests/EquipAI.Tests.Unit/Simulator/）：**
| 文件 | 覆盖 |
|------|------|
| `AirCompressorProfileTests.cs` | 指标名与种子模板一致 |
| `FaultPatternsTests.cs` | 6 种故障的 Delta 曲线 |
| `TelemetryGeneratorTests.cs` | 正常值范围、故障叠加触发阈值 |
| `ScenarioEngineTests.cs` | 剧本加载、时间线注入/移除 |
| `FaultRegistryTests.cs` | 按名查找、未知故障处理 |

---

## Task 1: 基础模型与接口

**Files:**
- Create: `tools/EquipAI.Simulator/Models/MetricSpec.cs`
- Create: `tools/EquipAI.Simulator/Models/DeviceProfile.cs`
- Create: `tools/EquipAI.Simulator/Models/ActiveFault.cs`
- Create: `tools/EquipAI.Simulator/Models/FaultScenario.cs`
- Create: `tools/EquipAI.Simulator/Models/GroundTruthEntry.cs`
- Create: `tools/EquipAI.Simulator/Faults/IFaultPattern.cs`

- [ ] **Step 1: 创建 MetricSpec 记录**

```csharp
// tools/EquipAI.Simulator/Models/MetricSpec.cs
namespace EquipAI.Simulator.Models;

/// <summary>
/// 单个遥测指标的规格定义
/// </summary>
/// <param name="Baseline">正常工况下的基线值</param>
/// <param name="NoiseStdDev">高斯噪声标准差</param>
/// <param name="PeriodicAmplitude">昼夜周期振幅</param>
/// <param name="TrendStep">布朗运动步长（每采样点的随机游走幅度）</param>
public sealed record MetricSpec(double Baseline, double NoiseStdDev, double PeriodicAmplitude, double TrendStep);
```

- [ ] **Step 2: 创建 DeviceProfile 基类**

```csharp
// tools/EquipAI.Simulator/Models/DeviceProfile.cs
using System.Collections.ObjectModel;

namespace EquipAI.Simulator.Models;

/// <summary>
/// 设备画像基类 — 定义某类设备的指标规格和设备类型标识
/// 子类（如 AirCompressorProfile）填充具体指标参数
/// </summary>
public abstract class DeviceProfile
{
    /// <summary>设备类型标识（与种子模板的 Name 对应）</summary>
    public abstract string DeviceType { get; }

    /// <summary>该设备类型的所有遥测指标规格</summary>
    public abstract IReadOnlyDictionary<string, MetricSpec> Metrics { get; }
}
```

- [ ] **Step 3: 创建 ActiveFault 模型**

```csharp
// tools/EquipAI.Simulator/Models/ActiveFault.cs
using EquipAI.Simulator.Faults;

namespace EquipAI.Simulator.Models;

/// <summary>
/// 运行时活跃故障 — 记录某个故障模式及其注入时刻
/// </summary>
public sealed class ActiveFault
{
    /// <summary>故障模式实例</summary>
    public IFaultPattern Pattern { get; }

    /// <summary>故障注入时刻（模拟时间）</summary>
    public TimeSpan InjectedAt { get; }

    public ActiveFault(IFaultPattern pattern, TimeSpan injectedAt)
    {
        Pattern = pattern;
        InjectedAt = injectedAt;
    }

    /// <summary>故障已持续时间（给定当前模拟时间）</summary>
    public TimeSpan ElapsedAt(TimeSpan currentSimulatedTime) =>
        currentSimulatedTime >= InjectedAt ? currentSimulatedTime - InjectedAt : TimeSpan.Zero;
}
```

- [ ] **Step 4: 创建 FaultScenario 剧本模型**

```csharp
// tools/EquipAI.Simulator/Models/FaultScenario.cs
using System.Text.Json.Serialization;

namespace EquipAI.Simulator.Models;

/// <summary>
/// 故障剧本 JSON 模型 — 定义按时间线注入/移除故障的序列
/// </summary>
public sealed class FaultScenario
{
    /// <summary>剧本名称</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>目标设备编码</summary>
    public string DeviceCode { get; set; } = string.Empty;

    /// <summary>剧本描述</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>时间加速倍率（1 秒真实 = N 秒模拟）</summary>
    public int TimeScale { get; set; } = 1;

    /// <summary>时间线条目列表</summary>
    public List<ScenarioTimelineEntry> Timeline { get; set; } = [];
}

/// <summary>剧本时间线单条目</summary>
public sealed class ScenarioTimelineEntry
{
    /// <summary>触发时刻（格式 HH:MM:SS）</summary>
    public string At { get; set; } = "00:00:00";

    /// <summary>动作：start 或 stop</summary>
    [JsonPropertyName("action")]
    public string Action { get; set; } = "start";

    /// <summary>故障类型标识</summary>
    [JsonPropertyName("faultType")]
    public string FaultType { get; set; } = string.Empty;

    /// <summary>将 At 字符串解析为 TimeSpan</summary>
    public TimeSpan ParseAt() =>
        TimeSpan.TryParseExact(At, @"hh\:mm\:ss", null, out var ts) ? ts : TimeSpan.Zero;
}
```

- [ ] **Step 5: 创建 GroundTruthEntry 模型**

```csharp
// tools/EquipAI.Simulator/Models/GroundTruthEntry.cs
using System.Text.Json.Serialization;

namespace EquipAI.Simulator.Models;

/// <summary>
/// 标准答案日志的顶层结构 — 一个运行批次对应一个文件
/// </summary>
public sealed class GroundTruthLog
{
    /// <summary>运行批次 ID（时间戳）</summary>
    public string RunId { get; set; } = string.Empty;

    /// <summary>设备编码</summary>
    public string DeviceCode { get; set; } = string.Empty;

    /// <summary>剧本名称（随机模式为 "random"）</summary>
    public string Scenario { get; set; } = string.Empty;

    /// <summary>运行开始时间（UTC ISO 8601）</summary>
    public string StartedAt { get; set; } = string.Empty;

    /// <summary>事件列表</summary>
    public List<GroundTruthEvent> Events { get; set; } = [];
}

/// <summary>单个故障注入/移除事件</summary>
public sealed class GroundTruthEvent
{
    /// <summary>事件发生的真实时间（UTC ISO 8601）</summary>
    public string InjectedAt { get; set; } = string.Empty;

    /// <summary>故障类型标识</summary>
    public string FaultType { get; set; } = string.Empty;

    /// <summary>受影响的指标列表</summary>
    public List<string> AffectedMetrics { get; set; } = [];

    /// <summary>预期根因诊断</summary>
    public string ExpectedRootCause { get; set; } = string.Empty;

    /// <summary>预期严重级别</summary>
    public string ExpectedSeverity { get; set; } = string.Empty;

    /// <summary>动作：started 或 stopped</summary>
    public string Action { get; set; } = "started";

    /// <summary>故障持续时间（仅 stop 事件填写）</summary>
    public string Duration { get; set; } = string.Empty;
}
```

- [ ] **Step 6: 创建 IFaultPattern 接口**

```csharp
// tools/EquipAI.Simulator/Faults/IFaultPattern.cs
namespace EquipAI.Simulator.Faults;

/// <summary>
/// 故障模式接口 — 定义某种故障对各指标的叠加偏差曲线
/// 实现类只关心"故障已持续多久时给某指标加多少"，不关心设备基线
/// </summary>
public interface IFaultPattern
{
    /// <summary>故障类型标识（如 "bearing_wear"）</summary>
    string FaultType { get; }

    /// <summary>受影响的指标名列表</summary>
    IReadOnlyList<string> AffectedMetrics { get; }

    /// <summary>预期根因诊断（标准答案）</summary>
    string ExpectedRootCause { get; }

    /// <summary>预期告警严重级别</summary>
    string ExpectedSeverity { get; }

    /// <summary>
    /// 给定故障已持续时间，返回某指标的叠加偏差值
    /// 正值表示升高，负值表示降低
    /// </summary>
    double Delta(string metric, TimeSpan elapsed);
}
```

- [ ] **Step 7: 验证编译**

Run: `dotnet build tools/EquipAI.Simulator/EquipAI.Simulator.csproj`
Expected: 编译成功，0 错误

- [ ] **Step 8: 提交**

```bash
git add tools/EquipAI.Simulator/Models/ tools/EquipAI.Simulator/Faults/IFaultPattern.cs
git commit -m "feat(simulator): add base models and IFaultPattern interface"
```

---

## Task 2: 空压机设备画像

**Files:**
- Create: `tools/EquipAI.Simulator/Profiles/AirCompressorProfile.cs`
- Test: `tests/EquipAI.Tests.Unit/Simulator/AirCompressorProfileTests.cs`

- [ ] **Step 1: 写失败测试 — 指标名与种子模板一致**

```csharp
// tests/EquipAI.Tests.Unit/Simulator/AirCompressorProfileTests.cs
using EquipAI.Simulator.Profiles;
using FluentAssertions;
using Xunit;

namespace EquipAI.Tests.Unit.Simulator;

public class AirCompressorProfileTests
{
    [Fact]
    public void 指标名应与种子空压机模板完全一致()
    {
        var profile = new AirCompressorProfile();

        profile.Metrics.Keys.Should().BeEquivalentTo(new[]
        {
            "discharge_pressure",
            "oil_temperature",
            "vibration",
            "motor_current",
            "air_flow"
        });
    }

    [Fact]
    public void 设备类型应为空压机()
    {
        var profile = new AirCompressorProfile();
        profile.DeviceType.Should().Be("空压机");
    }

    [Fact]
    public void 油温基线应为65度()
    {
        var profile = new AirCompressorProfile();
        profile.Metrics["oil_temperature"].Baseline.Should().Be(65.0);
    }
}
```

- [ ] **Step 2: 运行测试验证失败**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~AirCompressorProfileTests"`
Expected: FAIL — `AirCompressorProfile` 类型不存在

- [ ] **Step 3: 实现 AirCompressorProfile**

```csharp
// tools/EquipAI.Simulator/Profiles/AirCompressorProfile.cs
using System.Collections.ObjectModel;
using EquipAI.Simulator.Models;

namespace EquipAI.Simulator.Profiles;

/// <summary>
/// 空压机设备画像 — 指标定义对齐种子 DataSeeder 中的空压机模板
/// 参数依据：spec 第五章"指标对齐与告警规则联动"
/// </summary>
public sealed class AirCompressorProfile : DeviceProfile
{
    public override string DeviceType => "空压机";

    public override IReadOnlyDictionary<string, MetricSpec> Metrics { get; } =
        new ReadOnlyDictionary<string, MetricSpec>(new Dictionary<string, MetricSpec>
        {
            // 排气压力：基线 0.7 MPa，几乎不受昼夜影响
            ["discharge_pressure"] = new(0.7, 0.01, 0.02, 0.001),
            // 油温：基线 65°C，受环境温度影响大
            ["oil_temperature"] = new(65.0, 1.0, 3.0, 0.05),
            // 振动：基线 2.5 mm/s
            ["vibration"] = new(2.5, 0.2, 0.1, 0.01),
            // 电机电流：基线 120 A
            ["motor_current"] = new(120.0, 2.0, 5.0, 0.1),
            // 排气量：基线 20 m³/min
            ["air_flow"] = new(20.0, 0.3, 1.0, 0.02),
        });
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~AirCompressorProfileTests"`
Expected: 3 个测试全过

- [ ] **Step 5: 提交**

```bash
git add tools/EquipAI.Simulator/Profiles/AirCompressorProfile.cs tests/EquipAI.Tests.Unit/Simulator/AirCompressorProfileTests.cs
git commit -m "feat(simulator): add AirCompressorProfile with seed-aligned metrics"
```

---

## Task 3: 轴承磨损故障

**Files:**
- Create: `tools/EquipAI.Simulator/Faults/BearingWearFault.cs`
- Test: `tests/EquipAI.Tests.Unit/Simulator/FaultPatternsTests.cs` (本任务只写轴承磨损用例)

- [ ] **Step 1: 写失败测试 — 振动线性渐增**

```csharp
// tests/EquipAI.Tests.Unit/Simulator/FaultPatternsTests.cs
using EquipAI.Simulator.Faults;
using FluentAssertions;
using Xunit;

namespace EquipAI.Tests.Unit.Simulator;

public class FaultPatternsTests
{
    [Fact]
    public void 轴承磨损_振动应按小时线性渐增()
    {
        var fault = new BearingWearFault();

        // 10 小时后增量应为 0.5（基线 2.5 × 0.02 × 10）
        var delta10h = fault.Delta("vibration", TimeSpan.FromHours(10));
        delta10h.Should().BeApproximately(0.5, 0.01);

        // 90 小时后增量应为 4.5（达阈值 7.0 = 基线 2.5 + 增量 4.5）
        var delta90h = fault.Delta("vibration", TimeSpan.FromHours(90));
        delta90h.Should().BeApproximately(4.5, 0.01);
    }

    [Fact]
    public void 轴承磨损_油温应缓慢线性上升()
    {
        var fault = new BearingWearFault();
        var delta = fault.Delta("oil_temperature", TimeSpan.FromHours(10));
        delta.Should().BeApproximately(1.0, 0.01); // 0.1 × 10
    }

    [Fact]
    public void 轴承磨损_未受影响指标应返回零()
    {
        var fault = new BearingWearFault();
        fault.Delta("motor_current", TimeSpan.FromHours(10)).Should().Be(0);
    }

    [Fact]
    public void 轴承磨损_元数据应正确()
    {
        var fault = new BearingWearFault();
        fault.FaultType.Should().Be("bearing_wear");
        fault.AffectedMetrics.Should().BeEquivalentTo(new[] { "vibration", "oil_temperature" });
        fault.ExpectedSeverity.Should().Be("High");
        fault.ExpectedRootCause.Should().Contain("轴承磨损");
    }
}
```

- [ ] **Step 2: 运行测试验证失败**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~FaultPatternsTests"`
Expected: FAIL — `BearingWearFault` 类型不存在

- [ ] **Step 3: 实现 BearingWearFault**

```csharp
// tools/EquipAI.Simulator/Faults/BearingWearFault.cs
namespace EquipAI.Simulator.Faults;

/// <summary>
/// 轴承磨损故障 — 振动按 base × 0.02 × hours 线性渐增
/// 空压机振动基线 2.5，约 90 小时达阈值 7.0
/// </summary>
public sealed class BearingWearFault : IFaultPattern
{
    /// <summary>振动基线（空压机）</summary>
    private const double VibrationBaseline = 2.5;

    /// <summary>每小时振动增长率</summary>
    private const double VibrationRatePerHour = 0.02;

    /// <summary>每小时油温上升速率</summary>
    private const double OilTempRatePerHour = 0.1;

    public string FaultType => "bearing_wear";

    public IReadOnlyList<string> AffectedMetrics { get; } = new[] { "vibration", "oil_temperature" };

    public string ExpectedRootCause => "轴承磨损，建议检查润滑和游隙";

    public string ExpectedSeverity => "High";

    public double Delta(string metric, TimeSpan elapsed)
    {
        var hours = elapsed.TotalHours;
        return metric switch
        {
            "vibration" => VibrationBaseline * VibrationRatePerHour * hours,
            "oil_temperature" => OilTempRatePerHour * hours,
            _ => 0
        };
    }
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~FaultPatternsTests"`
Expected: 4 个测试全过

- [ ] **Step 5: 提交**

```bash
git add tools/EquipAI.Simulator/Faults/BearingWearFault.cs tests/EquipAI.Tests.Unit/Simulator/FaultPatternsTests.cs
git commit -m "feat(simulator): add BearingWearFault pattern with linear vibration increase"
```

---

## Task 4: 润滑失效故障

**Files:**
- Create: `tools/EquipAI.Simulator/Faults/LubricationFailureFault.cs`
- Modify: `tests/EquipAI.Tests.Unit/Simulator/FaultPatternsTests.cs` (追加润滑失效用例)

- [ ] **Step 1: 追加失败测试 — 油温阶跃至 90**

在 `FaultPatternsTests.cs` 类中追加：

```csharp
    [Fact]
    public void 润滑失效_油温应在2分钟内阶跃至25度增量()
    {
        var fault = new LubricationFailureFault();

        // 1 分钟时，增量应为 12.5（线性过渡中点）
        var delta1min = fault.Delta("oil_temperature", TimeSpan.FromMinutes(1));
        delta1min.Should().BeApproximately(12.5, 0.1);

        // 2 分钟时，增量应为 25（阶跃完成）
        var delta2min = fault.Delta("oil_temperature", TimeSpan.FromMinutes(2));
        delta2min.Should().BeApproximately(25.0, 0.01);

        // 10 分钟后仍维持 25
        var delta10min = fault.Delta("oil_temperature", TimeSpan.FromMinutes(10));
        delta10min.Should().BeApproximately(25.0, 0.01);
    }

    [Fact]
    public void 润滑失效_振动应在30分钟内缓升()
    {
        var fault = new LubricationFailureFault();
        var delta30min = fault.Delta("vibration", TimeSpan.FromMinutes(30));
        delta30min.Should().BeApproximately(1.5, 0.01);
    }

    [Fact]
    public void 润滑失效_元数据应正确()
    {
        var fault = new LubricationFailureFault();
        fault.FaultType.Should().Be("lubrication_failure");
        fault.ExpectedSeverity.Should().Be("Critical");
        fault.ExpectedRootCause.Should().Contain("润滑");
    }
```

- [ ] **Step 2: 运行测试验证失败**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~FaultPatternsTests"`
Expected: 新增 3 个测试 FAIL — `LubricationFailureFault` 不存在

- [ ] **Step 3: 实现 LubricationFailureFault**

```csharp
// tools/EquipAI.Simulator/Faults/LubricationFailureFault.cs
namespace EquipAI.Simulator.Faults;

/// <summary>
/// 润滑失效故障 — 油温在 2 分钟内阶跃 +25°C（65→90），振动随之缓升
/// 阶跃完成后油温增量恒定 25，触发 oil_temperature GT 90 告警
/// </summary>
public sealed class LubricationFailureFault : IFaultPattern
{
    /// <summary>油温阶跃目标增量</summary>
    private const double OilTempStep = 25.0;

    /// <summary>油温阶跃完成时间</summary>
    private static readonly TimeSpan OilTempStepDuration = TimeSpan.FromMinutes(2);

    /// <summary>振动缓升目标增量</summary>
    private const double VibrationStep = 1.5;

    /// <summary>振动缓升完成时间</summary>
    private static readonly TimeSpan VibrationRampDuration = TimeSpan.FromMinutes(30);

    public string FaultType => "lubrication_failure";

    public IReadOnlyList<string> AffectedMetrics { get; } = new[] { "oil_temperature", "vibration" };

    public string ExpectedRootCause => "润滑系统故障，检查油位和油泵";

    public string ExpectedSeverity => "Critical";

    public double Delta(string metric, TimeSpan elapsed)
    {
        return metric switch
        {
            "oil_temperature" => RampValue(elapsed, OilTempStepDuration, OilTempStep),
            "vibration" => RampValue(elapsed, VibrationRampDuration, VibrationStep),
            _ => 0
        };
    }

    /// <summary>线性过渡：在 rampDuration 内从 0 线性增至 target，之后恒定</summary>
    private static double RampValue(TimeSpan elapsed, TimeSpan rampDuration, double target)
    {
        if (elapsed >= rampDuration) return target;
        return target * (elapsed.TotalSeconds / rampDuration.TotalSeconds);
    }
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~FaultPatternsTests"`
Expected: 7 个测试全过（轴承磨损 4 + 润滑失效 3）

- [ ] **Step 5: 提交**

```bash
git add tools/EquipAI.Simulator/Faults/LubricationFailureFault.cs tests/EquipAI.Tests.Unit/Simulator/FaultPatternsTests.cs
git commit -m "feat(simulator): add LubricationFailureFault with step oil temperature rise"
```

---

## Task 5: 阀片泄漏故障

**Files:**
- Create: `tools/EquipAI.Simulator/Faults/ValveLeakFault.cs`
- Modify: `tests/EquipAI.Tests.Unit/Simulator/FaultPatternsTests.cs`

- [ ] **Step 1: 追加失败测试 — 排气压力降至 0.5**

```csharp
    [Fact]
    public void 阀片泄漏_排气压力应在10分钟内降至负0点2()
    {
        var fault = new ValveLeakFault();

        // 10 分钟时，压力增量应为 -0.2（0.7 → 0.5）
        var delta = fault.Delta("discharge_pressure", TimeSpan.FromMinutes(10));
        delta.Should().BeApproximately(-0.2, 0.001);
    }

    [Fact]
    public void 阀片泄漏_排气量应同步下降()
    {
        var fault = new ValveLeakFault();
        var delta = fault.Delta("air_flow", TimeSpan.FromMinutes(10));
        delta.Should().BeApproximately(-4.0, 0.1); // 降 20%
    }

    [Fact]
    public void 阀片泄漏_油温应因效率降而上升()
    {
        var fault = new ValveLeakFault();
        var delta = fault.Delta("oil_temperature", TimeSpan.FromMinutes(10));
        delta.Should().BeApproximately(8.0, 0.1);
    }

    [Fact]
    public void 阀片泄漏_元数据应正确()
    {
        var fault = new ValveLeakFault();
        fault.FaultType.Should().Be("valve_leak");
        fault.ExpectedSeverity.Should().Be("High");
    }
```

- [ ] **Step 2: 运行测试验证失败**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~FaultPatternsTests"`
Expected: 新增 4 个测试 FAIL

- [ ] **Step 3: 实现 ValveLeakFault**

```csharp
// tools/EquipAI.Simulator/Faults/ValveLeakFault.cs
namespace EquipAI.Simulator.Faults;

/// <summary>
/// 阀片泄漏故障 — 排气压力 10 分钟内缓降 0.2（0.7→0.5），触发 LT 0.5 告警
/// 排气量同步降 20%，油温因效率降而升 +8°C
/// </summary>
public sealed class ValveLeakFault : IFaultPattern
{
    private static readonly TimeSpan RampDuration = TimeSpan.FromMinutes(10);

    public string FaultType => "valve_leak";

    public IReadOnlyList<string> AffectedMetrics { get; } = new[] { "discharge_pressure", "air_flow", "oil_temperature" };

    public string ExpectedRootCause => "气阀泄漏，检查阀片密封";

    public string ExpectedSeverity => "High";

    public double Delta(string metric, TimeSpan elapsed)
    {
        var progress = Math.Min(elapsed.TotalSeconds / RampDuration.TotalSeconds, 1.0);
        return metric switch
        {
            "discharge_pressure" => -0.2 * progress,  // 降至 0.5
            "air_flow" => -4.0 * progress,             // 降 20%（20 × 0.2）
            "oil_temperature" => 8.0 * progress,
            _ => 0
        };
    }
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~FaultPatternsTests"`
Expected: 11 个测试全过

- [ ] **Step 5: 提交**

```bash
git add tools/EquipAI.Simulator/Faults/ValveLeakFault.cs tests/EquipAI.Tests.Unit/Simulator/FaultPatternsTests.cs
git commit -m "feat(simulator): add ValveLeakFault with pressure drop and flow decrease"
```

---

## Task 6: 过载故障

**Files:**
- Create: `tools/EquipAI.Simulator/Faults/OverloadFault.cs`
- Modify: `tests/EquipAI.Tests.Unit/Simulator/FaultPatternsTests.cs`

- [ ] **Step 1: 追加失败测试 — 电流阶跃至 180**

```csharp
    [Fact]
    public void 过载_电流应在1分钟内阶跃至60增量()
    {
        var fault = new OverloadFault();
        var delta = fault.Delta("motor_current", TimeSpan.FromMinutes(1));
        delta.Should().BeApproximately(60.0, 0.1); // 120 → 180
    }

    [Fact]
    public void 过载_油温应在10分钟内升10度()
    {
        var fault = new OverloadFault();
        var delta = fault.Delta("oil_temperature", TimeSpan.FromMinutes(10));
        delta.Should().BeApproximately(10.0, 0.1);
    }

    [Fact]
    public void 过载_振动应缓升()
    {
        var fault = new OverloadFault();
        var delta = fault.Delta("vibration", TimeSpan.FromMinutes(10));
        delta.Should().BeApproximately(0.8, 0.05);
    }

    [Fact]
    public void 过载_元数据应正确()
    {
        var fault = new OverloadFault();
        fault.FaultType.Should().Be("overload");
        fault.ExpectedRootCause.Should().Contain("过载");
    }
```

- [ ] **Step 2: 运行测试验证失败**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~FaultPatternsTests"`
Expected: 新增 4 个测试 FAIL

- [ ] **Step 3: 实现 OverloadFault**

```csharp
// tools/EquipAI.Simulator/Faults/OverloadFault.cs
namespace EquipAI.Simulator.Faults;

/// <summary>
/// 过载故障 — 电流 1 分钟内阶跃 +60A（120→180），触发 GT 180 告警
/// 油温 10 分钟内升 +10°C，振动升 +0.8 mm/s
/// </summary>
public sealed class OverloadFault : IFaultPattern
{
    public string FaultType => "overload";

    public IReadOnlyList<string> AffectedMetrics { get; } = new[] { "motor_current", "oil_temperature", "vibration" };

    public string ExpectedRootCause => "电机过载，检查负载和电压";

    public string ExpectedSeverity => "High";

    public double Delta(string metric, TimeSpan elapsed)
    {
        return metric switch
        {
            "motor_current" => RampValue(elapsed, TimeSpan.FromMinutes(1), 60.0),
            "oil_temperature" => RampValue(elapsed, TimeSpan.FromMinutes(10), 10.0),
            "vibration" => RampValue(elapsed, TimeSpan.FromMinutes(10), 0.8),
            _ => 0
        };
    }

    private static double RampValue(TimeSpan elapsed, TimeSpan rampDuration, double target)
    {
        if (elapsed >= rampDuration) return target;
        return target * (elapsed.TotalSeconds / rampDuration.TotalSeconds);
    }
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~FaultPatternsTests"`
Expected: 15 个测试全过

- [ ] **Step 5: 提交**

```bash
git add tools/EquipAI.Simulator/Faults/OverloadFault.cs tests/EquipAI.Tests.Unit/Simulator/FaultPatternsTests.cs
git commit -m "feat(simulator): add OverloadFault with current step and multi-metric rise"
```

---

## Task 7: 排气堵塞故障

**Files:**
- Create: `tools/EquipAI.Simulator/Faults/DischargeBlockageFault.cs`
- Modify: `tests/EquipAI.Tests.Unit/Simulator/FaultPatternsTests.cs`

- [ ] **Step 1: 追加失败测试 — 排气压力急升至 1.1**

```csharp
    [Fact]
    public void 排气堵塞_排气压力应在3分钟内急升至正0点4()
    {
        var fault = new DischargeBlockageFault();
        var delta = fault.Delta("discharge_pressure", TimeSpan.FromMinutes(3));
        delta.Should().BeApproximately(0.4, 0.001); // 0.7 → 1.1
    }

    [Fact]
    public void 排气堵塞_排气量应骤降()
    {
        var fault = new DischargeBlockageFault();
        var delta = fault.Delta("air_flow", TimeSpan.FromMinutes(3));
        delta.Should().BeApproximately(-6.0, 0.1); // 降 30%
    }

    [Fact]
    public void 排气堵塞_油温应急升()
    {
        var fault = new DischargeBlockageFault();
        var delta = fault.Delta("oil_temperature", TimeSpan.FromMinutes(3));
        delta.Should().BeApproximately(20.0, 0.1);
    }

    [Fact]
    public void 排气堵塞_元数据应为Critical()
    {
        var fault = new DischargeBlockageFault();
        fault.FaultType.Should().Be("discharge_blockage");
        fault.ExpectedSeverity.Should().Be("Critical");
    }
```

- [ ] **Step 2: 运行测试验证失败**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~FaultPatternsTests"`
Expected: 新增 4 个测试 FAIL

- [ ] **Step 3: 实现 DischargeBlockageFault**

```csharp
// tools/EquipAI.Simulator/Faults/DischargeBlockageFault.cs
namespace EquipAI.Simulator.Faults;

/// <summary>
/// 排气堵塞故障 — 排气压力 3 分钟内急升 +0.4（0.7→1.1），触发 GT 1.1 告警
/// 排气量骤降 30%，油温急升 +20°C
/// </summary>
public sealed class DischargeBlockageFault : IFaultPattern
{
    private static readonly TimeSpan RampDuration = TimeSpan.FromMinutes(3);

    public string FaultType => "discharge_blockage";

    public IReadOnlyList<string> AffectedMetrics { get; } = new[] { "discharge_pressure", "air_flow", "oil_temperature" };

    public string ExpectedRootCause => "排气系统堵塞，检查过滤器";

    public string ExpectedSeverity => "Critical";

    public double Delta(string metric, TimeSpan elapsed)
    {
        var progress = Math.Min(elapsed.TotalSeconds / RampDuration.TotalSeconds, 1.0);
        return metric switch
        {
            "discharge_pressure" => 0.4 * progress,
            "air_flow" => -6.0 * progress,
            "oil_temperature" => 20.0 * progress,
            _ => 0
        };
    }
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~FaultPatternsTests"`
Expected: 19 个测试全过

- [ ] **Step 5: 提交**

```bash
git add tools/EquipAI.Simulator/Faults/DischargeBlockageFault.cs tests/EquipAI.Tests.Unit/Simulator/FaultPatternsTests.cs
git commit -m "feat(simulator): add DischargeBlockageFault with pressure spike"
```

---

## Task 8: 传感器漂移故障

**Files:**
- Create: `tools/EquipAI.Simulator/Faults/SensorDriftFault.cs`
- Modify: `tests/EquipAI.Tests.Unit/Simulator/FaultPatternsTests.cs`

- [ ] **Step 1: 追加失败测试 — 排气压力缓漂**

```csharp
    [Fact]
    public void 传感器漂移_排气压力应每分钟漂移0点005()
    {
        var fault = new SensorDriftFault();

        // 80 分钟时漂移 0.4（0.7 → 1.1）
        var delta80 = fault.Delta("discharge_pressure", TimeSpan.FromMinutes(80));
        delta80.Should().BeApproximately(0.4, 0.001);
    }

    [Fact]
    public void 传感器漂移_仅影响排气压力()
    {
        var fault = new SensorDriftFault();
        fault.Delta("oil_temperature", TimeSpan.FromMinutes(80)).Should().Be(0);
        fault.Delta("vibration", TimeSpan.FromMinutes(80)).Should().Be(0);
        fault.AffectedMetrics.Should().ContainSingle().Which.Should().Be("discharge_pressure");
    }

    [Fact]
    public void 传感器漂移_元数据应为Normal()
    {
        var fault = new SensorDriftFault();
        fault.FaultType.Should().Be("sensor_drift");
        fault.ExpectedSeverity.Should().Be("Normal");
        fault.ExpectedRootCause.Should().Contain("传感器");
    }
```

- [ ] **Step 2: 运行测试验证失败**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~FaultPatternsTests"`
Expected: 新增 3 个测试 FAIL

- [ ] **Step 3: 实现 SensorDriftFault**

```csharp
// tools/EquipAI.Simulator/Faults/SensorDriftFault.cs
namespace EquipAI.Simulator.Faults;

/// <summary>
/// 传感器漂移故障 — 仅 discharge_pressure 每分钟偏移 +0.005，约 80 分钟达阈值 1.1
/// 其他指标全正常，用于验证 AI 能识别"单指标异常"模式
/// </summary>
public sealed class SensorDriftFault : IFaultPattern
{
    private const double DriftPerMinute = 0.005;

    public string FaultType => "sensor_drift";

    public IReadOnlyList<string> AffectedMetrics { get; } = new[] { "discharge_pressure" };

    public string ExpectedRootCause => "传感器漂移，建议校准或更换";

    public string ExpectedSeverity => "Normal";

    public double Delta(string metric, TimeSpan elapsed)
    {
        return metric == "discharge_pressure"
            ? DriftPerMinute * elapsed.TotalMinutes
            : 0;
    }
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~FaultPatternsTests"`
Expected: 22 个测试全过（6 种故障全部覆盖）

- [ ] **Step 5: 提交**

```bash
git add tools/EquipAI.Simulator/Faults/SensorDriftFault.cs tests/EquipAI.Tests.Unit/Simulator/FaultPatternsTests.cs
git commit -m "feat(simulator): add SensorDriftFault with single-metric slow drift"
```

---

## Task 9: 故障注册表

**Files:**
- Create: `tools/EquipAI.Simulator/Faults/FaultRegistry.cs`
- Test: `tests/EquipAI.Tests.Unit/Simulator/FaultRegistryTests.cs`

- [ ] **Step 1: 写失败测试 — 按名查找与未知处理**

```csharp
// tests/EquipAI.Tests.Unit/Simulator/FaultRegistryTests.cs
using EquipAI.Simulator.Faults;
using FluentAssertions;
using Xunit;

namespace EquipAI.Tests.Unit.Simulator;

public class FaultRegistryTests
{
    [Fact]
    public void 注册表应包含全部6种故障()
    {
        var registry = new FaultRegistry();
        var allTypes = registry.GetAllFaultTypes();

        allTypes.Should().BeEquivalentTo(new[]
        {
            "bearing_wear", "lubrication_failure", "valve_leak",
            "overload", "discharge_blockage", "sensor_drift"
        });
    }

    [Fact]
    public void 按名查找应返回正确故障实例()
    {
        var registry = new FaultRegistry();
        var fault = registry.Get("bearing_wear");
        fault.FaultType.Should().Be("bearing_wear");
    }

    [Fact]
    public void 未知故障类型应抛出KeyNotFoundException()
    {
        var registry = new FaultRegistry();
        var act = () => registry.Get("nonexistent_fault");
        act.Should().Throw<KeyNotFoundException>();
    }

    [Fact]
    public void 随机选取应返回已注册故障之一()
    {
        var registry = new FaultRegistry();
        var fault = registry.GetRandom();
        registry.GetAllFaultTypes().Should().Contain(fault.FaultType);
    }
}
```

- [ ] **Step 2: 运行测试验证失败**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~FaultRegistryTests"`
Expected: FAIL — `FaultRegistry` 不存在

- [ ] **Step 3: 实现 FaultRegistry**

```csharp
// tools/EquipAI.Simulator/Faults/FaultRegistry.cs
namespace EquipAI.Simulator.Faults;

/// <summary>
/// 故障注册表 — 按类型标识查找故障实例，供剧本引擎和随机调度器使用
/// </summary>
public sealed class FaultRegistry
{
    private readonly Dictionary<string, IFaultPattern> _faults;
    private readonly Random _random = new();

    public FaultRegistry()
    {
        _faults = new Dictionary<string, IFaultPattern>(StringComparer.OrdinalIgnoreCase)
        {
            ["bearing_wear"] = new BearingWearFault(),
            ["lubrication_failure"] = new LubricationFailureFault(),
            ["valve_leak"] = new ValveLeakFault(),
            ["overload"] = new OverloadFault(),
            ["discharge_blockage"] = new DischargeBlockageFault(),
            ["sensor_drift"] = new SensorDriftFault(),
        };
    }

    /// <summary>按故障类型标识查找</summary>
    public IFaultPattern Get(string faultType)
    {
        if (!_faults.TryGetValue(faultType, out var fault))
            throw new KeyNotFoundException($"未知故障类型: {faultType}");
        return fault;
    }

    /// <summary>获取全部已注册故障类型</summary>
    public IReadOnlyList<string> GetAllFaultTypes() => _faults.Keys.ToList();

    /// <summary>随机返回一个故障实例（用于随机模式）</summary>
    public IFaultPattern GetRandom()
    {
        var values = _faults.Values.ToList();
        return values[_random.Next(values.Count)];
    }
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~FaultRegistryTests"`
Expected: 4 个测试全过

- [ ] **Step 5: 提交**

```bash
git add tools/EquipAI.Simulator/Faults/FaultRegistry.cs tests/EquipAI.Tests.Unit/Simulator/FaultRegistryTests.cs
git commit -m "feat(simulator): add FaultRegistry for fault lookup and random selection"
```

---

## Task 10: 数据生成器

**Files:**
- Create: `tools/EquipAI.Simulator/Engine/TelemetryGenerator.cs`
- Test: `tests/EquipAI.Tests.Unit/Simulator/TelemetryGeneratorTests.cs`

- [ ] **Step 1: 写失败测试 — 正常值范围与故障叠加**

```csharp
// tests/EquipAI.Tests.Unit/Simulator/TelemetryGeneratorTests.cs
using EquipAI.Simulator.Engine;
using EquipAI.Simulator.Faults;
using EquipAI.Simulator.Models;
using EquipAI.Simulator.Profiles;
using FluentAssertions;
using Xunit;

namespace EquipAI.Tests.Unit.Simulator;

public class TelemetryGeneratorTests
{
    private static TelemetryGenerator CreateGenerator() => new(new AirCompressorProfile(), seed: 42);

    [Fact]
    public void 正常工况_所有指标应在基线附近波动()
    {
        var gen = CreateGenerator();
        var data = gen.Generate(TimeSpan.FromHours(12), Array.Empty<ActiveFault>());

        // 油温基线 65，昼夜周期 ±3，噪声 ±1，应在 60-70 范围
        data["oil_temperature"].Should().BeInRange(58, 72);
        // 排气压力基线 0.7，几乎不波动
        data["discharge_pressure"].Should().BeInRange(0.65, 0.75);
    }

    [Fact]
    public void 注入过载故障_电流应超过阈值180()
    {
        var gen = CreateGenerator();
        var fault = new ActiveFault(new OverloadFault(), TimeSpan.Zero);

        // 过载 1 分钟后电流阶跃完成
        var data = gen.Generate(TimeSpan.FromMinutes(1), new[] { fault });
        data["motor_current"].Should().BeGreaterThan(178, "过载 1 分钟后电流应接近 180");
    }

    [Fact]
    public void 注入润滑失效_油温应超过阈值90()
    {
        var gen = CreateGenerator();
        var fault = new ActiveFault(new LubricationFailureFault(), TimeSpan.Zero);

        // 润滑失效 2 分钟后油温阶跃完成
        var data = gen.Generate(TimeSpan.FromMinutes(2), new[] { fault });
        data["oil_temperature"].Should().BeGreaterThan(88, "润滑失效 2 分钟后油温应接近 90");
    }

    [Fact]
    public void 注入阀片泄漏_排气压力应低于阈值0点5()
    {
        var gen = CreateGenerator();
        var fault = new ActiveFault(new ValveLeakFault(), TimeSpan.Zero);

        var data = gen.Generate(TimeSpan.FromMinutes(10), new[] { fault });
        data["discharge_pressure"].Should().BeLessThan(0.52, "阀片泄漏 10 分钟后压力应接近 0.5");
    }

    [Fact]
    public void 无故障时连续两次生成结果应不同_证明有噪声()
    {
        var gen = CreateGenerator();
        var d1 = gen.Generate(TimeSpan.FromHours(12), Array.Empty<ActiveFault>());
        var d2 = gen.Generate(TimeSpan.FromHours(12), Array.Empty<ActiveFault>());
        d1["oil_temperature"].Should().NotBe(d2["oil_temperature"]);
    }
}
```

- [ ] **Step 2: 运行测试验证失败**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~TelemetryGeneratorTests"`
Expected: FAIL — `TelemetryGenerator` 不存在

- [ ] **Step 3: 实现 TelemetryGenerator**

```csharp
// tools/EquipAI.Simulator/Engine/TelemetryGenerator.cs
using EquipAI.Simulator.Models;

namespace EquipAI.Simulator.Engine;

/// <summary>
/// 遥测数据合成器 — 将设备画像的基线、趋势、周期、噪声与活跃故障叠加
/// 生成最终发送到 MQTT 的指标值
///
/// 数据模型：metric(t) = baseline + trend(t) + periodic(t) + noise(t) + Σ fault_delta(t)
/// </summary>
public sealed class TelemetryGenerator
{
    private readonly DeviceProfile _profile;
    private readonly Random _random;
    private readonly Dictionary<string, double> _trendState = new();

    public TelemetryGenerator(DeviceProfile profile, int? seed = null)
    {
        _profile = profile;
        _random = seed.HasValue ? new Random(seed.Value) : new Random();

        // 初始化趋势状态为 0
        foreach (var metric in profile.Metrics.Keys)
            _trendState[metric] = 0;
    }

    /// <summary>
    /// 生成当前时刻所有指标的值
    /// </summary>
    /// <param name="currentTime">模拟时间（从启动起算的时长）</param>
    /// <param name="activeFaults">当前活跃的故障列表</param>
    public Dictionary<string, double> Generate(TimeSpan currentTime, IReadOnlyList<ActiveFault> activeFaults)
    {
        var result = new Dictionary<string, double>();
        var hourOfDay = currentTime.TotalHours % 24;

        foreach (var (metric, spec) in _profile.Metrics)
        {
            // 1. 基线
            var value = spec.Baseline;

            // 2. 趋势（布朗运动 — 小步长随机游走，保证时序相关性）
            var trendStep = (_random.NextDouble() - 0.5) * 2 * spec.TrendStep;
            _trendState[metric] += trendStep;
            value += _trendState[metric];

            // 3. 周期（24 小时昼夜正弦波）
            value += spec.PeriodicAmplitude * Math.Sin(2 * Math.PI * hourOfDay / 24);

            // 4. 噪声（高斯白噪声，Box-Muller）
            value += GenerateGaussian(0, spec.NoiseStdDev);

            // 5. 故障叠加
            foreach (var fault in activeFaults)
            {
                var elapsed = fault.ElapsedAt(currentTime);
                value += fault.Pattern.Delta(metric, elapsed);
            }

            // 物理约束：非负
            result[metric] = Math.Round(Math.Max(0, value), 2);
        }

        return result;
    }

    /// <summary>Box-Muller 变换生成高斯随机数</summary>
    private double GenerateGaussian(double mean, double stdDev)
    {
        var u1 = 1.0 - _random.NextDouble();
        var u2 = 1.0 - _random.NextDouble();
        var normal = Math.Sqrt(-2.0 * Math.Log(u1)) * Math.Cos(2.0 * Math.PI * u2);
        return mean + stdDev * normal;
    }
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~TelemetryGeneratorTests"`
Expected: 5 个测试全过

- [ ] **Step 5: 提交**

```bash
git add tools/EquipAI.Simulator/Engine/TelemetryGenerator.cs tests/EquipAI.Tests.Unit/Simulator/TelemetryGeneratorTests.cs
git commit -m "feat(simulator): add TelemetryGenerator with trend+periodic+noise+fault composition"
```

---

## Task 11: 标准答案记录器

**Files:**
- Create: `tools/EquipAI.Simulator/Engine/GroundTruthLogger.cs`
- Test: `tests/EquipAI.Tests.Unit/Simulator/GroundTruthLoggerTests.cs`

- [ ] **Step 1: 写失败测试 — 记录注入与移除事件**

```csharp
// tests/EquipAI.Tests.Unit/Simulator/GroundTruthLoggerTests.cs
using EquipAI.Simulator.Engine;
using EquipAI.Simulator.Faults;
using FluentAssertions;
using Xunit;

namespace EquipAI.Tests.Unit.Simulator;

public class GroundTruthLoggerTests
{
    [Fact]
    public void 记录故障注入_应包含预期根因和指标()
    {
        var logger = new GroundTruthLogger("AC-001", "bearing-wear");
        var fault = new BearingWearFault();

        logger.LogFaultInjected(fault, DateTime.UtcNow);

        var log = logger.BuildLog();
        log.Events.Should().ContainSingle();
        log.Events[0].FaultType.Should().Be("bearing_wear");
        log.Events[0].ExpectedRootCause.Should().Contain("轴承磨损");
        log.Events[0].AffectedMetrics.Should().Contain(new[] { "vibration", "oil_temperature" });
        log.Events[0].Action.Should().Be("started");
    }

    [Fact]
    public void 记录故障移除_应包含持续时间()
    {
        var logger = new GroundTruthLogger("AC-001", "test");
        var fault = new OverloadFault();
        var injectTime = DateTime.UtcNow;

        logger.LogFaultInjected(fault, injectTime);
        logger.LogFaultStopped(fault, injectTime.AddMinutes(30));

        var log = logger.BuildLog();
        log.Events.Should().HaveCount(2);
        log.Events[1].Action.Should().Be("stopped");
        log.Events[1].Duration.Should().Contain("30");
    }

    [Fact]
    public void 构建日志_应包含运行批次信息()
    {
        var logger = new GroundTruthLogger("AC-001", "bearing-wear");
        var log = logger.BuildLog();

        log.DeviceCode.Should().Be("AC-001");
        log.Scenario.Should().Be("bearing-wear");
        log.RunId.Should().NotBeNullOrEmpty();
        log.StartedAt.Should().NotBeNullOrEmpty();
    }
}
```

- [ ] **Step 2: 运行测试验证失败**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~GroundTruthLoggerTests"`
Expected: FAIL — `GroundTruthLogger` 不存在

- [ ] **Step 3: 实现 GroundTruthLogger**

```csharp
// tools/EquipAI.Simulator/Engine/GroundTruthLogger.cs
using System.Text.Json;
using EquipAI.Simulator.Faults;
using EquipAI.Simulator.Models;

namespace EquipAI.Simulator.Engine;

/// <summary>
/// 标准答案记录器 — 记录每次故障注入/移除事件到内存，运行结束时序列化为 JSON 文件
/// 供后续评估 AI 诊断准确率使用
/// </summary>
public sealed class GroundTruthLogger
{
    private readonly GroundTruthLog _log;
    private readonly Dictionary<string, DateTime> _injectedAt = new(StringComparer.OrdinalIgnoreCase);

    public GroundTruthLogger(string deviceCode, string scenarioName)
    {
        var now = DateTime.UtcNow;
        _log = new GroundTruthLog
        {
            RunId = now.ToString("yyyy-MM-ddTHH-mm-ss"),
            DeviceCode = deviceCode,
            Scenario = scenarioName,
            StartedAt = now.ToString("o"),
        };
    }

    /// <summary>记录故障注入事件</summary>
    public void LogFaultInjected(IFaultPattern fault, DateTime realTime)
    {
        _injectedAt[fault.FaultType] = realTime;
        _log.Events.Add(new GroundTruthEvent
        {
            InjectedAt = realTime.ToString("o"),
            FaultType = fault.FaultType,
            AffectedMetrics = fault.AffectedMetrics.ToList(),
            ExpectedRootCause = fault.ExpectedRootCause,
            ExpectedSeverity = fault.ExpectedSeverity,
            Action = "started",
        });
    }

    /// <summary>记录故障移除事件</summary>
    public void LogFaultStopped(IFaultPattern fault, DateTime realTime)
    {
        var duration = _injectedAt.TryGetValue(fault.FaultType, out var injected)
            ? (realTime - injected).ToString()
            : "unknown";

        _log.Events.Add(new GroundTruthEvent
        {
            InjectedAt = realTime.ToString("o"),
            FaultType = fault.FaultType,
            Action = "stopped",
            Duration = duration,
        });

        _injectedAt.Remove(fault.FaultType);
    }

    /// <summary>构建当前日志对象（不写文件）</summary>
    public GroundTruthLog BuildLog() => _log;

    /// <summary>将日志序列化写入文件</summary>
    public async Task SaveAsync(string directory, CancellationToken ct = default)
    {
        Directory.CreateDirectory(directory);
        var path = Path.Combine(directory, $"ground-truth-{_log.RunId}.json");
        var json = JsonSerializer.Serialize(_log, new JsonSerializerOptions
        {
            WriteIndented = true,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        });
        await File.WriteAllTextAsync(path, json, ct);
    }
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~GroundTruthLoggerTests"`
Expected: 3 个测试全过

- [ ] **Step 5: 提交**

```bash
git add tools/EquipAI.Simulator/Engine/GroundTruthLogger.cs tests/EquipAI.Tests.Unit/Simulator/GroundTruthLoggerTests.cs
git commit -m "feat(simulator): add GroundTruthLogger for fault injection tracking"
```

---

## Task 12: 剧本引擎

**Files:**
- Create: `tools/EquipAI.Simulator/Engine/ScenarioEngine.cs`
- Test: `tests/EquipAI.Tests.Unit/Simulator/ScenarioEngineTests.cs`

- [ ] **Step 1: 写失败测试 — 按时间线注入故障**

```csharp
// tests/EquipAI.Tests.Unit/Simulator/ScenarioEngineTests.cs
using EquipAI.Simulator.Engine;
using EquipAI.Simulator.Models;
using FluentAssertions;
using Xunit;

namespace EquipAI.Tests.Unit.Simulator;

public class ScenarioEngineTests
{
    private static FaultScenario MakeScenario(params (string at, string action, string fault)[] entries) =>
        new()
        {
            Name = "test",
            DeviceCode = "AC-001",
            TimeScale = 1,
            Timeline = entries.Select(e => new ScenarioTimelineEntry
            {
                At = e.at,
                Action = e.action,
                FaultType = e.fault,
            }).ToList(),
        };

    [Fact]
    public void 时间线到达_应注入对应故障()
    {
        var scenario = MakeScenario(("00:01:00", "start", "overload"));
        var engine = new ScenarioEngine(scenario);

        engine.Tick(TimeSpan.FromSeconds(30));
        engine.ActiveFaults.Should().BeEmpty("30 秒时还未到 1 分钟触发点");

        engine.Tick(TimeSpan.FromMinutes(1));
        engine.ActiveFaults.Should().ContainSingle();
        engine.ActiveFaults[0].Pattern.FaultType.Should().Be("overload");
    }

    [Fact]
    public void Stop动作_应移除已注入故障()
    {
        var scenario = MakeScenario(
            ("00:00:30", "start", "overload"),
            ("00:05:00", "stop", "overload"));
        var engine = new ScenarioEngine(scenario);

        engine.Tick(TimeSpan.FromSeconds(30));
        engine.ActiveFaults.Should().HaveCount(1);

        engine.Tick(TimeSpan.FromMinutes(5));
        engine.ActiveFaults.Should().BeEmpty("stop 动作后故障应被移除");
    }

    [Fact]
    public void Tick_应更新已注入故障的持续时间()
    {
        var scenario = MakeScenario(("00:00:00", "start", "overload"));
        var engine = new ScenarioEngine(scenario);

        engine.Tick(TimeSpan.FromMinutes(10));
        engine.ActiveFaults.Should().ContainSingle();
        var elapsed = engine.ActiveFaults[0].ElapsedAt(TimeSpan.FromMinutes(10));
        elapsed.TotalMinutes.Should().BeApproximately(10, 0.1);
    }
}
```

- [ ] **Step 2: 运行测试验证失败**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~ScenarioEngineTests"`
Expected: FAIL — `ScenarioEngine` 不存在

- [ ] **Step 3: 实现 ScenarioEngine**

```csharp
// tools/EquipAI.Simulator/Engine/ScenarioEngine.cs
using EquipAI.Simulator.Faults;
using EquipAI.Simulator.Models;

namespace EquipAI.Simulator.Engine;

/// <summary>
/// 剧本引擎 — 按 JSON 剧本的时间线注入和移除故障
/// 每次 Tick 传入当前模拟时间，引擎检查时间线并更新活跃故障列表
/// </summary>
public sealed class ScenarioEngine
{
    private readonly FaultScenario _scenario;
    private readonly FaultRegistry _registry;
    private readonly List<ActiveFault> _activeFaults = new();
    private readonly HashSet<string> _processedEntries = new();

    public IReadOnlyList<ActiveFault> ActiveFaults => _activeFaults;

    public ScenarioEngine(FaultScenario scenario) : this(scenario, new FaultRegistry()) { }

    public ScenarioEngine(FaultScenario scenario, FaultRegistry registry)
    {
        _scenario = scenario;
        _registry = registry;
    }

    /// <summary>
    /// 推进到指定模拟时间，处理所有已到点的剧本条目
    /// </summary>
    public void Tick(TimeSpan currentSimulatedTime)
    {
        for (var i = 0; i < _scenario.Timeline.Count; i++)
        {
            var entry = _scenario.Timeline[i];
            var entryKey = $"{i}-{entry.At}-{entry.Action}-{entry.FaultType}";
            if (_processedEntries.Contains(entryKey)) continue;

            var triggerTime = entry.ParseAt();
            if (triggerTime > currentSimulatedTime) continue;

            if (entry.Action.Equals("start", StringComparison.OrdinalIgnoreCase))
            {
                if (!_activeFaults.Any(f => f.Pattern.FaultType.Equals(entry.FaultType, StringComparison.OrdinalIgnoreCase)))
                {
                    var pattern = _registry.Get(entry.FaultType);
                    _activeFaults.Add(new ActiveFault(pattern, currentSimulatedTime));
                }
            }
            else if (entry.Action.Equals("stop", StringComparison.OrdinalIgnoreCase))
            {
                _activeFaults.RemoveAll(f => f.Pattern.FaultType.Equals(entry.FaultType, StringComparison.OrdinalIgnoreCase));
            }

            _processedEntries.Add(entryKey);
        }
    }
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~ScenarioEngineTests"`
Expected: 3 个测试全过

- [ ] **Step 5: 提交**

```bash
git add tools/EquipAI.Simulator/Engine/ScenarioEngine.cs tests/EquipAI.Tests.Unit/Simulator/ScenarioEngineTests.cs
git commit -m "feat(simulator): add ScenarioEngine for timeline-based fault injection"
```

---

## Task 13: 随机故障调度器

**Files:**
- Create: `tools/EquipAI.Simulator/Engine/RandomFaultScheduler.cs`
- Test: `tests/EquipAI.Tests.Unit/Simulator/RandomFaultSchedulerTests.cs`

- [ ] **Step 1: 写失败测试 — 按概率注入与自动移除**

```csharp
// tests/EquipAI.Tests.Unit/Simulator/RandomFaultSchedulerTests.cs
using EquipAI.Simulator.Engine;
using EquipAI.Simulator.Faults;
using FluentAssertions;
using Xunit;

namespace EquipAI.Tests.Unit.Simulator;

public class RandomFaultSchedulerTests
{
    [Fact]
    public void 高概率_应在首次Tick注入故障()
    {
        var scheduler = new RandomFaultScheduler(faultRate: 1.0, maxDurationMinutes: 1, seed: 42);

        scheduler.Tick(TimeSpan.Zero);
        scheduler.ActiveFaults.Should().NotBeEmpty("概率 100% 时应立即注入");
    }

    [Fact]
    public void 零概率_应永不注入故障()
    {
        var scheduler = new RandomFaultScheduler(faultRate: 0.0, maxDurationMinutes: 1, seed: 42);

        for (var i = 0; i < 100; i++)
            scheduler.Tick(TimeSpan.FromMinutes(i));

        scheduler.ActiveFaults.Should().BeEmpty("概率 0% 时应永不注入");
    }

    [Fact]
    public void 故障达最大时长_应自动移除()
    {
        var scheduler = new RandomFaultScheduler(faultRate: 1.0, maxDurationMinutes: 5, seed: 42);

        scheduler.Tick(TimeSpan.Zero);
        scheduler.ActiveFaults.Should().HaveCount(1);

        // 5 分钟后应自动移除
        scheduler.Tick(TimeSpan.FromMinutes(5));
        scheduler.ActiveFaults.Should().BeEmpty("达最大时长后应自动移除");
    }

    [Fact]
    public void 同时只保留一个活跃故障()
    {
        var scheduler = new RandomFaultScheduler(faultRate: 1.0, maxDurationMinutes: 10, seed: 42);

        for (var i = 0; i < 5; i++)
            scheduler.Tick(TimeSpan.FromMinutes(i));

        scheduler.ActiveFaults.Should().HaveCount(1, "同一时刻只允许一个故障，避免叠加干扰诊断");
    }
}
```

- [ ] **Step 2: 运行测试验证失败**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~RandomFaultSchedulerTests"`
Expected: FAIL — `RandomFaultScheduler` 不存在

- [ ] **Step 3: 实现 RandomFaultScheduler**

```csharp
// tools/EquipAI.Simulator/Engine/RandomFaultScheduler.cs
using EquipAI.Simulator.Faults;
using EquipAI.Simulator.Models;

namespace EquipAI.Simulator.Engine;

/// <summary>
/// 随机故障调度器 — 按 faultRate 概率在空闲时随机注入故障
/// 同一时刻只保留一个活跃故障，达 maxDuration 后自动移除
/// 用于长期运行测试告警引擎稳定性
/// </summary>
public sealed class RandomFaultScheduler
{
    private readonly FaultRegistry _registry;
    private readonly Random _random;
    private readonly double _faultRate;
    private readonly int _maxDurationMinutes;
    private readonly List<ActiveFault> _activeFaults = new();
    private readonly Dictionary<string, TimeSpan> _injectedAt = new();

    public IReadOnlyList<ActiveFault> ActiveFaults => _activeFaults;

    public RandomFaultScheduler(double faultRate, int maxDurationMinutes, int? seed = null)
        : this(new FaultRegistry(), faultRate, maxDurationMinutes, seed) { }

    public RandomFaultScheduler(FaultRegistry registry, double faultRate, int maxDurationMinutes, int? seed = null)
    {
        _registry = registry;
        _faultRate = faultRate;
        _maxDurationMinutes = maxDurationMinutes;
        _random = seed.HasValue ? new Random(seed.Value) : new Random();
    }

    public void Tick(TimeSpan currentSimulatedTime)
    {
        // 1. 移除已达最大时长的故障
        for (var i = _activeFaults.Count - 1; i >= 0; i--)
        {
            var fault = _activeFaults[i];
            var elapsed = fault.ElapsedAt(currentSimulatedTime);
            if (elapsed.TotalMinutes >= _maxDurationMinutes)
            {
                _activeFaults.RemoveAt(i);
                _injectedAt.Remove(fault.Pattern.FaultType);
            }
        }

        // 2. 空闲时按概率注入新故障
        if (_activeFaults.Count == 0 && _random.NextDouble() < _faultRate)
        {
            var pattern = _registry.GetRandom();
            _activeFaults.Add(new ActiveFault(pattern, currentSimulatedTime));
        }
    }
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~RandomFaultSchedulerTests"`
Expected: 4 个测试全过

- [ ] **Step 5: 提交**

```bash
git add tools/EquipAI.Simulator/Engine/RandomFaultScheduler.cs tests/EquipAI.Tests.Unit/Simulator/RandomFaultSchedulerTests.cs
git commit -m "feat(simulator): add RandomFaultScheduler for long-running fault injection"
```

---

## Task 14: 示例剧本 JSON 文件

**Files:**
- Create: `tools/EquipAI.Simulator/scenarios/bearing-wear.json`
- Create: `tools/EquipAI.Simulator/scenarios/lubrication-failure.json`
- Create: `tools/EquipAI.Simulator/scenarios/overload.json`
- Create: `tools/EquipAI.Simulator/scenarios/random-mixed.json`

- [ ] **Step 1: 创建轴承磨损剧本**

```json
// tools/EquipAI.Simulator/scenarios/bearing-wear.json
{
  "name": "bearing-wear-scenario",
  "deviceCode": "AC-001",
  "description": "模拟轴承磨损渐进故障，振动在约 90 小时（模拟时间）内从 2.5 升至 7.0 触发告警。timeScale=360 使 90 小时模拟时间压缩为 15 分钟真实时间",
  "timeScale": 360,
  "timeline": [
    {
      "at": "00:00:00",
      "action": "start",
      "faultType": "bearing_wear"
    },
    {
      "at": "90:00:00",
      "action": "stop",
      "faultType": "bearing_wear"
    }
  ]
}
```

- [ ] **Step 2: 创建润滑失效剧本**

```json
// tools/EquipAI.Simulator/scenarios/lubrication-failure.json
{
  "name": "lubrication-failure-scenario",
  "deviceCode": "AC-001",
  "description": "模拟润滑失效故障，油温在 2 分钟内阶跃至 90°C 触发 Critical 告警",
  "timeScale": 1,
  "timeline": [
    {
      "at": "00:00:30",
      "action": "start",
      "faultType": "lubrication_failure"
    },
    {
      "at": "00:30:00",
      "action": "stop",
      "faultType": "lubrication_failure"
    }
  ]
}
```

- [ ] **Step 3: 创建过载剧本**

```json
// tools/EquipAI.Simulator/scenarios/overload.json
{
  "name": "overload-scenario",
  "deviceCode": "AC-001",
  "description": "模拟电机过载故障，电流在 1 分钟内阶跃至 180A 触发告警",
  "timeScale": 1,
  "timeline": [
    {
      "at": "00:01:00",
      "action": "start",
      "faultType": "overload"
    },
    {
      "at": "00:20:00",
      "action": "stop",
      "faultType": "overload"
    }
  ]
}
```

- [ ] **Step 4: 创建随机混合剧本（占位说明，实际由命令行参数触发）**

```json
// tools/EquipAI.Simulator/scenarios/random-mixed.json
{
  "name": "random-mixed",
  "deviceCode": "AC-001",
  "description": "随机模式 — 由 --mode random --fault-rate 0.1 触发，此文件仅作文档说明。引擎会从 6 种故障中随机选取并注入",
  "timeScale": 1,
  "timeline": []
}
```

- [ ] **Step 5: 验证剧本可被反序列化**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~ScenarioEngineTests"`
Expected: 已有测试仍全过（剧本文件不影响测试，待 Task 15 装配后才能端到端验证）

- [ ] **Step 6: 提交**

```bash
git add tools/EquipAI.Simulator/scenarios/
git commit -m "feat(simulator): add example scenario JSON files for 3 fault types"
```

---

## Task 15: Program.cs 入口重写

**Files:**
- Modify: `tools/EquipAI.Simulator/Program.cs` (完整重写)

- [ ] **Step 1: 重写 Program.cs，装配新引擎**

```csharp
// tools/EquipAI.Simulator/Program.cs
using System.Text;
using System.Text.Json;
using EquipAI.Simulator.Engine;
using EquipAI.Simulator.Models;
using EquipAI.Simulator.Profiles;
using MQTTnet;
using MQTTnet.Client;
using MQTTnet.Protocol;

namespace EquipAI.Simulator;

/// <summary>
/// 工业设备遥测数据模拟器（升级版）
/// 支持剧本模式（--scenario）和随机模式（--mode random）
/// 生成的数据具有真实工业时序特征：趋势 + 周期 + 故障演化
/// </summary>
class Program
{
    private const string DefaultTenantId = "11111111-1111-1111-1111-111111111111";

    static async Task<int> Main(string[] args)
    {
        var options = ParseArguments(args);
        if (options.ShowHelp) { PrintUsage(); return 0; }

        PrintBanner(options);

        using var cts = options.DurationSeconds.HasValue
            ? new CancellationTokenSource(TimeSpan.FromSeconds(options.DurationSeconds.Value))
            : new CancellationTokenSource();

        Console.CancelKeyPress += (_, e) => { e.Cancel = true; cts.Cancel(); };

        try
        {
            await RunSimulatorAsync(options, cts.Token);
        }
        catch (OperationCanceledException) { Console.WriteLine("\n[信息] 模拟器已停止"); }
        catch (Exception ex) { Console.WriteLine($"[错误] {ex.Message}"); return 1; }

        return 0;
    }

    private static async Task RunSimulatorAsync(SimulatorOptions options, CancellationToken ct)
    {
        // 装配设备画像和数据生成器
        var profile = new AirCompressorProfile();
        var generator = new TelemetryGenerator(profile);

        // 装配故障调度器（剧本模式或随机模式）
        ScenarioEngine? scenarioEngine = null;
        RandomFaultScheduler? randomScheduler = null;
        FaultScenario? scenario = null;

        if (!string.IsNullOrEmpty(options.ScenarioFile))
        {
            var json = await File.ReadAllTextAsync(options.ScenarioFile, ct);
            scenario = JsonSerializer.Deserialize<FaultScenario>(json)
                       ?? throw new InvalidOperationException("剧本文件解析失败");
            scenarioEngine = new ScenarioEngine(scenario);
            Console.WriteLine($"[信息] 已加载剧本: {scenario.Name}（timeScale={scenario.TimeScale}）");
        }
        else
        {
            randomScheduler = new RandomFaultScheduler(options.FaultRate, maxDurationMinutes: 30);
            Console.WriteLine($"[信息] 随机模式：faultRate={options.FaultRate}");
        }

        // 装配标准答案记录器
        var scenarioName = scenario?.Name ?? "random";
        var truthLogger = new GroundTruthLogger(options.DeviceCode, scenarioName);
        var lastFaultTypes = new HashSet<string>();

        // 连接 MQTT
        using var mqttClient = new MqttFactory().CreateMqttClient();
        var connectOptions = new MqttClientOptionsBuilder()
            .WithTcpServer(options.BrokerHost, options.Port)
            .WithClientId($"EquipAI-Sim-{Guid.NewGuid():N}"[..50])
            .WithCleanSession(true)
            .Build();

        Console.WriteLine($"[信息] 连接 MQTT {options.BrokerHost}:{options.Port}...");
        await mqttClient.ConnectAsync(connectOptions, ct);
        Console.WriteLine("[信息] 连接成功，开始发送遥测数据...\n");

        var deviceId = Guid.NewGuid();
        var simStart = TimeSpan.Zero;
        var timeScale = scenario?.TimeScale ?? 1;

        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(options.IntervalSeconds));
        var tickCount = 0;

        while (await timer.WaitForNextTickAsync(ct))
        {
            // 推进模拟时间
            var simTime = TimeSpan.FromSeconds(tickCount * options.IntervalSeconds * timeScale);
            tickCount++;

            // 调度故障
            if (scenarioEngine != null)
            {
                scenarioEngine.Tick(simTime);
                LogFaultChanges(scenarioEngine.ActiveFaults, lastFaultTypes, truthLogger);
            }
            else if (randomScheduler != null)
            {
                randomScheduler.Tick(simTime);
                LogFaultChanges(randomScheduler.ActiveFaults, lastFaultTypes, truthLogger);
            }

            var activeFaults = scenarioEngine?.ActiveFaults ?? randomScheduler?.ActiveFaults ?? Array.Empty<ActiveFault>();

            // 生成数据
            var metrics = generator.Generate(simTime, activeFaults.ToList());
            var payload = new
            {
                timestamp = DateTime.UtcNow.ToString("o"),
                quality = activeFaults.Count > 0 ? "warning" : "good",
                metrics,
            };

            var topic = $"factory/{options.TenantId}/telemetry/{deviceId}";
            var message = new MqttApplicationMessageBuilder()
                .WithTopic(topic)
                .WithPayload(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(payload)))
                .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce)
                .Build();

            try
            {
                await mqttClient.PublishAsync(message, ct);
                Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] sim={simTime:hh\\:mm\\:ss} faults={activeFaults.Count} " +
                                  $"oil_temp={metrics["oil_temperature"]:F1}°C vib={metrics["vibration"]:F2} " +
                                  $"press={metrics["discharge_pressure"]:F2} current={metrics["motor_current"]:F0}A");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[错误] 发送失败: {ex.Message}");
            }
        }

        // 保存标准答案日志
        var outputPath = Path.Combine(AppContext.BaseDirectory, "ground-truth");
        await truthLogger.SaveAsync(outputPath, ct);
        Console.WriteLine($"\n[信息] 标准答案已保存到: {outputPath}");
    }

    /// <summary>检测活跃故障列表变化，记录注入/移除事件</summary>
    private static void LogFaultChanges(
        IReadOnlyList<ActiveFault> current,
        HashSet<string> lastTypes,
        GroundTruthLogger logger)
    {
        var currentTypes = current.Select(f => f.Pattern.FaultType).ToHashSet();

        foreach (var fault in current.Where(f => !lastTypes.Contains(f.Pattern.FaultType)))
            logger.LogFaultInjected(fault.Pattern, DateTime.UtcNow);

        foreach (var removed in lastTypes.Except(currentTypes))
        {
            // 用注册表查回模式实例（仅为拿元数据）
            var pattern = new FaultRegistry().Get(removed);
            logger.LogFaultStopped(pattern, DateTime.UtcNow);
        }

        lastTypes.Clear();
        foreach (var t in currentTypes) lastTypes.Add(t);
    }

    private static SimulatorOptions ParseArguments(string[] args)
    {
        var options = new SimulatorOptions();
        for (var i = 0; i < args.Length; i++)
        {
            switch (args[i])
            {
                case "--host" or "-h" when i + 1 < args.Length:
                    options.BrokerHost = args[++i]; break;
                case "--port" or "-p" when i + 1 < args.Length:
                    if (int.TryParse(args[++i], out var port)) options.Port = port;
                    break;
                case "--tenant" or "-t" when i + 1 < args.Length:
                    options.TenantId = args[++i]; break;
                case "--device-code" when i + 1 < args.Length:
                    options.DeviceCode = args[++i]; break;
                case "--interval" or "-i" when i + 1 < args.Length:
                    if (int.TryParse(args[++i], out var interval)) options.IntervalSeconds = interval;
                    break;
                case "--scenario" or "-s" when i + 1 < args.Length:
                    options.ScenarioFile = args[++i]; break;
                case "--mode" when i + 1 < args.Length:
                    options.Mode = args[++i]; break;
                case "--fault-rate" when i + 1 < args.Length:
                    if (double.TryParse(args[++i], out var rate)) options.FaultRate = rate;
                    break;
                case "--duration" when i + 1 < args.Length:
                    if (int.TryParse(args[++i], out var duration)) options.DurationSeconds = duration;
                    break;
                case "--help": options.ShowHelp = true; break;
            }
        }
        return options;
    }

    private static void PrintUsage()
    {
        Console.WriteLine("EquipAI 工业遥测模拟器（升级版）\n");
        Console.WriteLine("剧本模式（可重复评估）:");
        Console.WriteLine("  EquipAI.Simulator --scenario scenarios/bearing-wear.json\n");
        Console.WriteLine("随机模式（长期运行测试）:");
        Console.WriteLine("  EquipAI.Simulator --mode random --fault-rate 0.1\n");
        Console.WriteLine("选项:");
        Console.WriteLine("  --host, -h <host>        MQTT 代理 (默认 localhost)");
        Console.WriteLine("  --port, -p <port>        MQTT 端口 (默认 1883)");
        Console.WriteLine("  --tenant, -t <guid>      租户 ID");
        Console.WriteLine("  --device-code <code>     设备编码 (默认 AC-001)");
        Console.WriteLine("  --interval, -i <sec>     采样间隔 (默认 5)");
        Console.WriteLine("  --scenario, -s <path>    剧本 JSON 文件路径");
        Console.WriteLine("  --mode random            随机故障模式");
        Console.WriteLine("  --fault-rate <0-1>       随机模式故障概率 (默认 0.1)");
        Console.WriteLine("  --duration <sec>         运行时长 (默认无限)");
    }

    private static void PrintBanner(SimulatorOptions options)
    {
        Console.WriteLine();
        Console.WriteLine("  ╔═══════════════════════════════════════════════╗");
        Console.WriteLine("  ║   EquipAI 工业遥测模拟器（升级版）           ║");
        Console.WriteLine("  ╚═══════════════════════════════════════════════╝\n");
        Console.WriteLine($"  设备类型:    空压机 ({options.DeviceCode})");
        Console.WriteLine($"  运行模式:    {(string.IsNullOrEmpty(options.ScenarioFile) ? "随机" : "剧本")}");
        if (!string.IsNullOrEmpty(options.ScenarioFile))
            Console.WriteLine($"  剧本文件:    {options.ScenarioFile}");
        Console.WriteLine($"  采样间隔:    {options.IntervalSeconds} 秒\n");
    }
}

internal class SimulatorOptions
{
    public string BrokerHost { get; set; } = "localhost";
    public int Port { get; set; } = 1883;
    public string TenantId { get; set; } = "11111111-1111-1111-1111-111111111111";
    public string DeviceCode { get; set; } = "AC-001";
    public int IntervalSeconds { get; set; } = 5;
    public string? ScenarioFile { get; set; }
    public string Mode { get; set; } = "scenario";
    public double FaultRate { get; set; } = 0.1;
    public int? DurationSeconds { get; set; }
    public bool ShowHelp { get; set; }
}
```

- [ ] **Step 2: 验证编译**

Run: `dotnet build tools/EquipAI.Simulator/EquipAI.Simulator.csproj`
Expected: 编译成功

- [ ] **Step 3: 运行全部单元测试确认无回归**

Run: `dotnet test tests/EquipAI.Tests.Unit --no-build`
Expected: 全部通过

- [ ] **Step 4: 提交**

```bash
git add tools/EquipAI.Simulator/Program.cs
git commit -m "feat(simulator): rewrite Program.cs to use modular engine with scenario/random modes"
```

---

## Task 16: DataSeeder 空压机告警规则

**Files:**
- Modify: `src/EquipAI.Infrastructure/Seeding/DataSeeder.cs` (空压机模板的 DefaultAlarmRules 字段)

- [ ] **Step 1: 定位空压机模板的 DefaultAlarmRules 行**

Run: `grep -n "空压机\|DefaultAlarmRules" src/EquipAI.Infrastructure/Seeding/DataSeeder.cs`
找到空压机模板定义处（约 311-326 行），当前 `DefaultAlarmRules = "[]"`

- [ ] **Step 2: 修改空压机模板，填充告警规则**

将空压机模板的 `DefaultAlarmRules = "[]"` 替换为：

```csharp
DefaultAlarmRules = JsonSerializer.Serialize(new[]
{
    new { name = "油温过高", metric = "oil_temperature", ruleType = "threshold", @operator = "gt", threshold = 90, severity = "High", cooldownSeconds = 300, enabled = true, autoCreateWorkorder = false },
    new { name = "振动超标", metric = "vibration", ruleType = "threshold", @operator = "gt", threshold = 7.0, severity = "Critical", cooldownSeconds = 600, enabled = true, autoCreateWorkorder = true },
    new { name = "排气压力过高", metric = "discharge_pressure", ruleType = "threshold", @operator = "gt", threshold = 1.1, severity = "High", cooldownSeconds = 300, enabled = true, autoCreateWorkorder = false },
    new { name = "排气压力过低", metric = "discharge_pressure", ruleType = "threshold", @operator = "lt", threshold = 0.5, severity = "High", cooldownSeconds = 300, enabled = true, autoCreateWorkorder = false },
    new { name = "电机电流过高", metric = "motor_current", ruleType = "threshold", @operator = "gt", threshold = 180, severity = "High", cooldownSeconds = 300, enabled = true, autoCreateWorkorder = false }
}),
```

注意：`@operator` 中的 `@` 是 C# 关键字转义，序列化后 JSON 字段名为 `operator`。

- [ ] **Step 3: 验证编译**

Run: `dotnet build src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj`
Expected: 编译成功

- [ ] **Step 4: 运行全部单元测试确认无回归**

Run: `dotnet test tests/EquipAI.Tests.Unit --no-build`
Expected: 全部通过

- [ ] **Step 5: 提交**

```bash
git add src/EquipAI.Infrastructure/Seeding/DataSeeder.cs
git commit -m "feat(seeding): add default alarm rules for air compressor template"
```

---

## Task 17: 集成验证

**Files:** 无修改，仅运行验证

- [ ] **Step 1: 构建整个解决方案**

Run: `dotnet build EquipAI.slnx`
Expected: 编译成功，0 错误 0 警告

- [ ] **Step 2: 运行全部后端单元测试**

Run: `dotnet test tests/EquipAI.Tests.Unit`
Expected: 全部通过（原有 560 + 新增模拟器测试）

- [ ] **Step 3: 运行全部前端测试**

Run: `cd frontend && npm run test -- --run`
Expected: 293 个测试全过，无回归

- [ ] **Step 4: 启动开发环境基础设施**

Run: `docker compose -f docker/docker-compose.dev.yml up -d`
Expected: PostgreSQL + TimescaleDB + Redis + Mosquitto 启动

- [ ] **Step 5: 启动后端**

Run: `dotnet run --project src/EquipAI.WebAPI` (后台运行)
Expected: 后端启动，种子数据初始化空压机告警规则

- [ ] **Step 6: 运行轴承磨损剧本，验证告警触发**

Run:
```bash
dotnet run --project tools/EquipAI.Simulator -- \
  --scenario tools/EquipAI.Simulator/scenarios/bearing-wear.json \
  --duration 1200
```
Expected:
- 模拟器发送 `discharge_pressure`/`oil_temperature`/`vibration`/`motor_current`/`air_flow` 五个指标
- 约 15 分钟后（timeScale=360，90 小时模拟时间压缩），振动值突破 7.0
- 后端日志出现"振动超标"Critical 告警
- AI 分析触发根因诊断

- [ ] **Step 7: 检查标准答案文件已生成**

Run: `find tools/EquipAI.Simulator -name "ground-truth-*.json"`
Expected: 文件存在，包含 bearing_wear 的注入事件和预期诊断

- [ ] **Step 8: 运行过载剧本，验证电流阶跃告警**

Run:
```bash
dotnet run --project tools/EquipAI.Simulator -- \
  --scenario tools/EquipAI.Simulator/scenarios/overload.json \
  --duration 300
```
Expected: 约 1 分钟后电机电流突破 180A，触发"电机电流过高"告警

- [ ] **Step 9: 最终提交（如有遗留改动）**

```bash
git add -A
git status  # 确认无遗漏
```

---

## Self-Review

### Spec 覆盖检查

| Spec 章节 | 覆盖任务 |
|----------|---------|
| 二、架构与模块边界 | Task 1-13（全部模块） |
| 三、数据生成算法 | Task 10（TelemetryGenerator） |
| 四、6 种故障演化曲线 | Task 3-8（每种故障一个任务） |
| 五、指标对齐与告警规则联动 | Task 2（Profile）+ Task 16（DataSeeder） |
| 六、运行模式 | Task 12-13（Scenario/Random）+ Task 14（剧本 JSON）+ Task 15（Program） |
| 七、标准答案记录 | Task 11（GroundTruthLogger） |
| 八、测试策略 | Task 2-13 的 TDD 步骤 + Task 17 集成验证 |
| 九、验收标准 | Task 17 各步骤 |

### 类型一致性检查

- `IFaultPattern.Delta(string, TimeSpan)` 在所有故障类中签名一致 ✓
- `ActiveFault.ElapsedAt(TimeSpan)` 在 TelemetryGenerator 和 ScenarioEngine 中使用一致 ✓
- `FaultScenario.Timeline` 中的 `ScenarioTimelineEntry.ParseAt()` 在 ScenarioEngine 中使用 ✓
- `GroundTruthLogger.LogFaultInjected/LogFaultStopped` 签名在 Program.cs 中调用一致 ✓

### 无占位符

所有步骤均包含完整代码、确切命令和预期输出。
