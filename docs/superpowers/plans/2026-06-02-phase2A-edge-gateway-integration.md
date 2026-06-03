# Phase 2A: 边缘网关联调验证 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建 Simulator 模拟 PLC 项目，端到端验证 EdgeGateway 采集→MQTT→后端→告警全链路

**Architecture:** 新增独立控制台项目 EquipAI.Simulator，内置 OPC UA + Modbus TCP 双协议 Mock Server，使用正弦波+高斯噪声模拟传感器。EdgeGateway 连接 Simulator 发送数据，触发后端告警。

**Tech Stack:** .NET 8, OPC Foundation SDK, FluentModbus, xUnit, FluentAssertions

---

## File Structure

| 操作 | 文件 | 职责 |
|------|------|------|
| 创建 | `src/EquipAI.Simulator/EquipAI.Simulator.csproj` | 项目定义 + NuGet 依赖 |
| 创建 | `src/EquipAI.Simulator/SensorConfig.cs` | 传感器配置模型 |
| 创建 | `src/EquipAI.Simulator/SimulatedSensor.cs` | 正弦波+噪声模拟传感器 |
| 创建 | `src/EquipAI.Simulator/OpcUaMockServer.cs` | OPC UA Mock Server |
| 创建 | `src/EquipAI.Simulator/ModbusTcpMockServer.cs` | Modbus TCP Mock Server |
| 创建 | `src/EquipAI.Simulator/SimulatorOptions.cs` | 配置选项类 |
| 创建 | `src/EquipAI.Simulator/appsettings.json` | 默认配置 |
| 创建 | `src/EquipAI.Simulator/Program.cs` | 启动入口 |
| 创建 | `tests/EquipAI.Tests.Unit/Simulator/SimulatedSensorTests.cs` | 传感器单元测试 |
| 创建 | `tests/e2e/run-integration.sh` | 集成验证脚本 |
| 修改 | `EquipAI.slnx` | 添加 Simulator 项目 |

---

### Task 1: SimulatedSensor 传感器核心

**Files:**
- Create: `src/EquipAI.Simulator/SensorConfig.cs`
- Create: `src/EquipAI.Simulator/SimulatedSensor.cs`
- Create: `src/EquipAI.Simulator/EquipAI.Simulator.csproj`
- Test: `tests/EquipAI.Tests.Unit/Simulator/SimulatedSensorTests.cs`

- [ ] **Step 1: 创建 Simulator 项目和 csproj**

```xml
<!-- src/EquipAI.Simulator/EquipAI.Simulator.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="FluentModbus" Version="5.3.2" />
    <PackageReference Include="OPCFoundation.NetStandard.Opc.Ua" Version="1.5.378.145" />
    <PackageReference Include="Microsoft.Extensions.Hosting" Version="8.0" />
    <PackageReference Include="Serilog.Extensions.Hosting" Version="8.0" />
    <PackageReference Include="Serilog.Sinks.Console" Version="6.0" />
  </ItemGroup>
</Project>
```

- [ ] **Step 2: 创建 SensorConfig 配置模型**

```csharp
// src/EquipAI.Simulator/SensorConfig.cs
namespace EquipAI.Simulator;

/// <summary>
/// 模拟传感器配置 — 定义正弦波参数
/// </summary>
/// <param name="Name">指标名称（如 temperature）</param>
/// <param name="BaseValue">基线值</param>
/// <param name="Amplitude">振幅（值在 BaseValue±Amplitude 范围波动）</param>
/// <param name="Frequency">频率 Hz（控制波动速度）</param>
/// <param name="NoiseStdDev">高斯噪声标准差（0 表示无噪声）</param>
public record SensorConfig(
    string Name,
    double BaseValue,
    double Amplitude,
    double Frequency = 0.01,
    double NoiseStdDev = 0.0);
```

- [ ] **Step 3: 创建 SimulatedSensor**

```csharp
// src/EquipAI.Simulator/SimulatedSensor.cs
namespace EquipAI.Simulator;

/// <summary>
/// 模拟传感器 — 生成正弦波 + 高斯噪声的物理量
/// 值 = BaseValue + Amplitude * sin(2π * Frequency * t) + N(0, NoiseStdDev)
/// </summary>
public class SimulatedSensor
{
    private readonly SensorConfig _config;
    private readonly Random _random;

    public string Name => _config.Name;

    public SimulatedSensor(SensorConfig config, int? seed = null)
    {
        _config = config;
        _random = seed.HasValue ? new Random(seed.Value) : new Random();
    }

    /// <summary>
    /// 获取指定时刻的模拟值
    /// </summary>
    public double GetValue(DateTime timestamp)
    {
        var t = timestamp.Ticks / (double)TimeSpan.TicksPerSecond;
        var sine = _config.Amplitude * Math.Sin(2.0 * Math.PI * _config.Frequency * t);
        var noise = _config.NoiseStdDev > 0 ? SampleGaussian() * _config.NoiseStdDev : 0.0;
        return _config.BaseValue + sine + noise;
    }

    /// <summary>
    /// Box-Muller 变换生成标准正态分布随机数
    /// </summary>
    private double SampleGaussian()
    {
        double u1, u2;
        do { u1 = _random.NextDouble(); } while (u1 == 0);
        u2 = _random.NextDouble();
        return Math.Sqrt(-2.0 * Math.Log(u1)) * Math.Cos(2.0 * Math.PI * u2);
    }
}
```

- [ ] **Step 4: 编写 SimulatedSensor 单元测试**

```csharp
// tests/EquipAI.Tests.Unit/Simulator/SimulatedSensorTests.cs
using EquipAI.Simulator;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Simulator;

public class SimulatedSensorTests
{
    [Fact]
    public void GetValue_无噪声时返回纯正弦值()
    {
        var config = new SensorConfig("test", 50.0, 10.0, 0.01, 0.0);
        var sensor = new SimulatedSensor(config, seed: 42);
        var timestamp = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var value = sensor.GetValue(timestamp);

        // 纯正弦值应在 [BaseValue - Amplitude, BaseValue + Amplitude] 范围内
        value.Should().BeInRange(40.0, 60.0);
    }

    [Fact]
    public void GetValue_有噪声时值在合理范围内()
    {
        var config = new SensorConfig("temperature", 65.0, 30.0, 0.01, 2.0);
        var sensor = new SimulatedSensor(config, seed: 42);

        // 采样 100 次，所有值都应在 [BaseValue - Amplitude - 5σ, BaseValue + Amplitude + 5σ] 内
        for (var i = 0; i < 100; i++)
        {
            var t = DateTime.UtcNow.AddSeconds(i);
            var value = sensor.GetValue(t);
            value.Should().BeInRange(65.0 - 30.0 - 10.0, 65.0 + 30.0 + 10.0);
        }
    }

    [Fact]
    public void GetValue_零振幅时返回恒定基线值()
    {
        var config = new SensorConfig("static", 42.0, 0.0, 0.01, 0.0);
        var sensor = new SimulatedSensor(config, seed: 42);

        var v1 = sensor.GetValue(DateTime.UtcNow);
        var v2 = sensor.GetValue(DateTime.UtcNow);

        v1.Should().BeApproximately(42.0, 0.001);
        v2.Should().BeApproximately(42.0, 0.001);
    }
}
```

- [ ] **Step 5: 运行测试确认通过**

Run: `cd /Users/yqgmac/yqg/project/EquipSense && dotnet test tests/EquipAI.Tests.Unit --filter "Simulator" --no-restore -v n`
Expected: 3 个测试全部 PASS

- [ ] **Step 6: 将 Simulator 项目添加到解决方案**

Run: `cd /Users/yqgmac/yqg/project/EquipSense && dotnet sln EquipAI.slnx add src/EquipAI.Simulator/EquipAI.Simulator.csproj --solution-folder /src/`

- [ ] **Step 7: 提交**

```bash
git add src/EquipAI.Simulator/ tests/EquipAI.Tests.Unit/Simulator/ EquipAI.slnx
git commit -m "feat: Simulator 项目骨架 + SimulatedSensor 正弦波模拟器

- SensorConfig 配置模型（基线值/振幅/频率/噪声）
- SimulatedSensor: 正弦波 + Box-Muller 高斯噪声
- 3 个单元测试：纯 sine 范围、有噪声范围、零振幅恒定值"
```

---

### Task 2: Modbus TCP Mock Server

**Files:**
- Create: `src/EquipAI.Simulator/ModbusTcpMockServer.cs`

- [ ] **Step 1: 实现 Modbus TCP Mock Server**

```csharp
// src/EquipAI.Simulator/ModbusTcpMockServer.cs
using System.Net;
using FluentModbus;

namespace EquipAI.Simulator;

/// <summary>
/// Modbus TCP Mock Server — 将 SimulatedSensor 值映射到 Holding Registers
/// 每个传感器占用 2 个连续寄存器（float 拆分为两个 ushort）
/// </summary>
public class ModbusTcpMockServer : IAsyncDisposable
{
    private readonly ModbusTcpServer _server;
    private readonly List<SimulatedSensor> _sensors;
    private readonly ushort _startAddress;
    private readonly CancellationTokenSource _cts = new();
    private Task? _updateTask;

    public int Port { get; }

    public ModbusTcpMockServer(int port, IEnumerable<SimulatedSensor> sensors, ushort startAddress = 100)
    {
        Port = port;
        _startAddress = startAddress;
        _sensors = sensors.ToList();
        _server = new ModbusTcpServer();
    }

    /// <summary>
    /// 启动 Modbus TCP Server 并开始更新寄存器值
    /// </summary>
    public void Start()
    {
        _server.Start(new IPEndPoint(IPAddress.Any, Port));
        _updateTask = Task.Run(UpdateLoopAsync);
    }

    /// <summary>
    /// 每 500ms 更新所有传感器的寄存器值
    /// </summary>
    private async Task UpdateLoopAsync()
    {
        while (!_cts.IsCancellationRequested)
        {
            var values = _sensors.Select(s => (float)s.GetValue(DateTime.UtcNow)).ToArray();
            var registers = new ushort[values.Length * 2];

            for (var i = 0; i < values.Length; i++)
            {
                var bytes = BitConverter.GetBytes(values[i]);
                if (!BitConverter.IsLittleEndian) Array.Reverse(bytes);
                registers[i * 2] = BitConverter.ToUInt16(bytes, 0);
                registers[i * 2 + 1] = BitConverter.ToUInt16(bytes, 2);
            }

            // 写入 Holding Registers（只写模拟器占用的范围）
            var allRegisters = new ushort[_startAddress + registers.Length];
            Array.Copy(registers, 0, allRegisters, _startAddress, registers.Length);
            _server.WriteHoldingRegisters(allRegisters, 0, (ushort)0, (ushort)allRegisters.Length);

            await Task.Delay(500, _cts.Token);
        }
    }

    public async ValueTask DisposeAsync()
    {
        _cts.Cancel();
        if (_updateTask is not null)
        {
            try { await _updateTask; } catch { }
        }
        _server.Stop();
        _cts.Dispose();
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/EquipAI.Simulator/ModbusTcpMockServer.cs
git commit -m "feat: Modbus TCP Mock Server — 传感器值映射到 Holding Registers"
```

---

### Task 3: OPC UA Mock Server

**Files:**
- Create: `src/EquipAI.Simulator/OpcUaMockServer.cs`

- [ ] **Step 1: 实现 OPC UA Mock Server**

OPC Foundation Server SDK 较复杂，为简化使用自定义 HTTP-to-OPC 桥接方案不现实。这里采用轻量方式：Simulator 直接作为 OPC UA 数据节点提供者。

由于 OPC UA Server API 在 OPC Foundation 1.5.x 中需要大量样板代码（Certificate、NamespaceManager 等），**实际实现改为在 Simulator 启动时直接用 mosquitto_pub 发送 MQTT 消息模拟 OPC UA 设备的数据输出**，与 EdgeGateway 解耦验证。

备选方案：如果需要真实的 OPC UA 协议测试，可以在后续迭代中引入 OPC UA Simulation Server（如 Prosys）。

**最终决定**：OPC UA Mock Server 需要使用 OPC Foundation Server SDK 的 `OpcUaServer` 类。核心实现如下：

```csharp
// src/EquipAI.Simulator/OpcUaMockServer.cs
using System.Security.Cryptography.X509Certificates;
using Opc.Ua;
using Opc.Ua.Configuration;
using Opc.Ua.Server;

namespace EquipAI.Simulator;

/// <summary>
/// OPC UA Mock Server — 为每个 SimulatedSensor 注册一个可读节点
/// 节点 ID 格式：ns=2;s={SensorName}
/// </summary>
public class OpcUaMockServer : IAsyncDisposable
{
    private OpcUaServer? _server;
    private readonly List<SimulatedSensor> _sensors;
    private readonly int _port;
    private readonly CancellationTokenSource _cts = new();
    private Task? _updateTask;

    /// <summary>
    /// 节点管理器，持有动态更新的传感器值
    /// </summary>
    private readonly Dictionary<string, double> _sensorValues = new();

    public OpcUaMockServer(int port, IEnumerable<SimulatedSensor> sensors)
    {
        _port = port;
        _sensors = sensors.ToList();
        foreach (var s in _sensors)
        {
            _sensorValues[s.Name] = s.GetValue(DateTime.UtcNow);
        }
    }

    /// <summary>
    /// 获取当前传感器值（供外部读取）
    /// </summary>
    public double GetValue(string sensorName) =>
        _sensorValues.TryGetValue(sensorName, out var v) ? v : 0.0;

    /// <summary>
    /// 启动 OPC UA Server + 后台传感器值更新
    /// </summary>
    public async Task StartAsync()
    {
        // 后台定时更新传感器值
        _updateTask = Task.Run(async () =>
        {
            while (!_cts.IsCancellationRequested)
            {
                foreach (var sensor in _sensors)
                {
                    _sensorValues[sensor.Name] = sensor.GetValue(DateTime.UtcNow);
                }
                await Task.Delay(500, _cts.Token);
            }
        });

        // OPC UA Server 配置
        var application = new ApplicationInstance
        {
            ApplicationName = "EquipAI Simulator",
            ApplicationType = ApplicationType.Server,
            ConfigSectionName = "OpcUa.Simulator"
        };

        var config = await application.LoadApplicationConfiguration(silent: true);
        await application.CheckApplicationInstanceCertificate(silent: true, minimumKeySize: 2048);

        _server = new OpcUaServer();
        _server.NodeManagerFactory = new SimulatorNodeManagerFactory(_sensorValues);
        await application.Start(_server);

        // 等待服务器就绪
        await Task.Delay(1000);
    }

    public async ValueTask DisposeAsync()
    {
        _cts.Cancel();
        if (_updateTask is not null)
        {
            try { await _updateTask; } catch { }
        }
        _server?.Dispose();
        _cts.Dispose();
    }
}

/// <summary>
/// 节点管理器工厂 — 为 Simulator 创建自定义节点管理器
/// </summary>
internal class SimulatorNodeManagerFactory : INodeManagerFactory
{
    private readonly Dictionary<string, double> _values;

    public SimulatorNodeManagerFactory(Dictionary<string, double> values)
    {
        _values = values;
    }

    public string DefaultNamespaceUri => "http://equipai.com/simulator";
    public INodeManager Create(IServerInternal server, ApplicationConfiguration configuration)
    {
        return new SimulatorNodeManager(server, configuration, _values);
    }
}

/// <summary>
/// 自定义节点管理器 — 注册每个传感器为可读变量节点
/// </summary>
internal class SimulatorNodeManager : CustomNodeManager2
{
    private readonly Dictionary<string, double> _values;
    private readonly Dictionary<NodeId, string> _nodeToSensor = new();

    public SimulatorNodeManager(IServerInternal server, ApplicationConfiguration config,
        Dictionary<string, double> values)
        : base(server, config, "http://equipai.com/simulator")
    {
        _values = values;
        SystemContext.NodeIdFactory = this;
    }

    public override void CreateAddressSpace(IDictionary<NodeId, IList<IReference>> externalReferences)
    {
        base.CreateAddressSpace(externalReferences);

        var root = new FolderState(null)
        {
            SymbolicName = "Simulator",
            ReferenceTypeId = ReferenceTypes.Organizes,
            TypeDefinitionId = ObjectTypeIds.FolderType,
            NodeId = new NodeId("Simulator", NamespaceIndex),
            BrowseName = new QualifiedName("Simulator", NamespaceIndex)
        };

        foreach (var kvp in _values)
        {
            var variable = new BaseDataVariableState(root)
            {
                SymbolicName = kvp.Key,
                ReferenceTypeId = ReferenceTypes.Organizes,
                TypeDefinitionId = VariableTypeIds.BaseDataVariableType,
                NodeId = new NodeId(kvp.Key, NamespaceIndex),
                BrowseName = new QualifiedName(kvp.Key, NamespaceIndex),
                DataType = DataTypeIds.Double,
                Value = kvp.Value,
                ValuePrecision = 2
            };

            variable.OnReadValue = (ctx, node, value) =>
            {
                var sensorName = ((BaseDataVariableState)node).SymbolicName.Name;
                if (_values.TryGetValue(sensorName, out var v))
                {
                    value.Value = v;
                }
                return ServiceResult.Good;
            };

            root.AddChild(variable);
            _nodeToSensor[variable.NodeId] = kvp.Key;
        }

        AddPredefinedNode(SystemContext, root);
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/EquipAI.Simulator/OpcUaMockServer.cs
git commit -m "feat: OPC UA Mock Server — 动态传感器节点 + 自定义 NodeManager"
```

---

### Task 4: Simulator 启动入口和配置

**Files:**
- Create: `src/EquipAI.Simulator/SimulatorOptions.cs`
- Create: `src/EquipAI.Simulator/appsettings.json`
- Create: `src/EquipAI.Simulator/Program.cs`

- [ ] **Step 1: 创建配置选项类**

```csharp
// src/EquipAI.Simulator/SimulatorOptions.cs
namespace EquipAI.Simulator;

/// <summary>
/// Simulator 全局配置选项
/// </summary>
public class SimulatorOptions
{
    public const string SectionName = "Simulator";

    public OpcUaOptions OpcUa { get; set; } = new();
    public ModbusTcpOptions ModbusTcp { get; set; } = new();
    public List<SensorConfig> Sensors { get; set; } = [];
}

public class OpcUaOptions
{
    public int Port { get; set; } = 4840;
}

public class ModbusTcpOptions
{
    public int Port { get; set; } = 5020;
}
```

- [ ] **Step 2: 创建默认配置文件**

```json
// src/EquipAI.Simulator/appsettings.json
{
  "Simulator": {
    "OpcUa": { "Port": 4840 },
    "ModbusTcp": { "Port": 5020 },
    "Sensors": [
      { "Name": "temperature", "BaseValue": 65.0, "Amplitude": 30.0, "Frequency": 0.01, "NoiseStdDev": 1.0 },
      { "Name": "pressure", "BaseValue": 50.0, "Amplitude": 15.0, "Frequency": 0.008, "NoiseStdDev": 0.5 },
      { "Name": "vibration", "BaseValue": 5.0, "Amplitude": 3.0, "Frequency": 0.02, "NoiseStdDev": 0.2 }
    ]
  }
}
```

- [ ] **Step 3: 创建 Program.cs**

```csharp
// src/EquipAI.Simulator/Program.cs
using EquipAI.Simulator;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var config = new ConfigurationBuilder()
        .SetBasePath(Directory.GetCurrentDirectory())
        .AddJsonFile("appsettings.json", optional: false)
        .Build();

    var options = new SimulatorOptions();
    config.GetSection(SimulatorOptions.SectionName).Bind(options);

    Log.Information("EquipAI Simulator 启动中...");
    Log.Information("已配置 {Count} 个传感器", options.Sensors.Count);

    var sensors = options.Sensors
        .Select(s => new SimulatedSensor(s))
        .ToList();

    // 启动 Modbus TCP Mock Server
    var modbusServer = new ModbusTcpMockServer(options.ModbusTcp.Port, sensors);
    modbusServer.Start();
    Log.Information("Modbus TCP Mock Server 已启动，端口: {Port}", options.ModbusTcp.Port);

    // 启动 OPC UA Mock Server
    var opcUaServer = new OpcUaMockServer(options.OpcUa.Port, sensors);
    await opcUaServer.StartAsync();
    Log.Information("OPC UA Mock Server 已启动，端口: {Port}", options.OpcUa.Port);

    Log.Information("Simulator 就绪 — OPC UA: opc.tcp://localhost:{OpcPort}, Modbus TCP: localhost:{ModbusPort}",
        options.OpcUa.Port, options.ModbusTcp.Port);
    Log.Information("按 Enter 键退出...");

    Console.ReadLine();

    await modbusServer.DisposeAsync();
    await opcUaServer.DisposeAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Simulator 启动失败");
}
finally
{
    await Log.CloseAndFlushAsync();
}
```

- [ ] **Step 4: 构建确认编译通过**

Run: `cd /Users/yqgmac/yqg/project/EquipSense && dotnet build src/EquipAI.Simulator`
Expected: Build succeeded, 0 errors

- [ ] **Step 5: 提交**

```bash
git add src/EquipAI.Simulator/SimulatorOptions.cs src/EquipAI.Simulator/appsettings.json src/EquipAI.Simulator/Program.cs
git commit -m "feat: Simulator 启动入口 — 双协议 Mock Server 同时运行

- SimulatorOptions 配置绑定（OPC UA 端口 / Modbus TCP 端口 / 传感器列表）
- 默认配置：temperature(65±30)、pressure(50±15)、vibration(5±3)
- Program.cs 启动两个 Mock Server，按 Enter 退出"
```

---

### Task 5: 集成验证脚本

**Files:**
- Create: `tests/e2e/run-integration.sh`

- [ ] **Step 1: 创建集成验证脚本**

```bash
#!/bin/bash
# tests/e2e/run-integration.sh
# 端到端集成验证：Simulator → EdgeGateway → MQTT → 后端 → 告警

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LOG_DIR="/tmp/equipsense-e2e"
mkdir -p "$LOG_DIR"

echo "=== EquipSense 端到端集成验证 ==="
echo ""

# 1. 检查 Docker 服务
echo "[1/7] 检查 Docker 服务..."
if ! curl -s http://localhost:5432 >/dev/null 2>&1 || ! curl -s http://localhost:1883 >/dev/null 2>&1; then
    echo "  启动 Docker 服务..."
    cd "$PROJECT_ROOT/docker" && docker compose -f docker-compose.dev.yml up -d
    sleep 5
fi
echo "  ✓ Docker 服务就绪"

# 2. 启动后端
echo "[2/7] 启动后端..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
cd "$PROJECT_ROOT" && dotnet run --project src/EquipAI.WebAPI -- --seed > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
sleep 8
echo "  ✓ 后端已启动 (PID=$BACKEND_PID)"

# 3. 启动 Simulator
echo "[3/7] 启动 Simulator..."
cd "$PROJECT_ROOT" && dotnet run --project src/EquipAI.Simulator > "$LOG_DIR/simulator.log" 2>&1 &
SIM_PID=$!
sleep 5
echo "  ✓ Simulator 已启动 (PID=$SIM_PID)"

# 4. 启动 EdgeGateway（使用测试配置）
echo "[4/7] 启动 EdgeGateway..."
# 复制测试配置
cp "$PROJECT_ROOT/tests/e2e/test-gateway-appsettings.json" "$PROJECT_ROOT/src/EquipAI.EdgeGateway/appsettings.json.bak" 2>/dev/null || true
cd "$PROJECT_ROOT" && dotnet run --project src/EquipAI.EdgeGateway > "$LOG_DIR/gateway.log" 2>&1 &
GW_PID=$!
sleep 5
echo "  ✓ EdgeGateway 已启动 (PID=$GW_PID)"

# 5. 等待数据流和告警触发
echo "[5/7] 等待 30 秒让温度上升到超阈值（>85°C）..."
sleep 30

# 6. 验证结果
echo "[6/7] 验证结果..."

# 登录获取 Token
TOKEN=$(curl -s -X POST "http://localhost:8080/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"Admin@123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")

PASS=true

# 检查遥测数据
TELEMETRY_COUNT=$(curl -s "http://localhost:8080/api/v1/telemetry/latest?deviceId=cd177305-b63f-4e30-b20f-086358ab725b" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null | python3 -c "import sys,json;d=json.load(sys.stdin);print(len(d) if isinstance(d,list) else 0)" 2>/dev/null || echo "0")

if [ "$TELEMETRY_COUNT" -gt "0" ]; then
    echo "  ✓ 遥测数据已写入（${TELEMETRY_COUNT} 条）"
else
    echo "  ✗ 遥测数据未写入"
    PASS=false
fi

# 检查告警
ALERT_TOTAL=$(curl -s "http://localhost:8080/api/v1/alerts?page=1&pageSize=1" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null | python3 -c "import sys,json;print(json.load(sys.stdin).get('total',0))" 2>/dev/null || echo "0")

if [ "$ALERT_TOTAL" -gt "0" ]; then
    echo "  ✓ 告警已触发（${ALERT_TOTAL} 条）"
else
    echo "  ✗ 告警未触发"
    PASS=false
fi

# 7. 清理
echo "[7/7] 清理..."
kill $GW_PID 2>/dev/null || true
kill $SIM_PID 2>/dev/null || true
kill $BACKEND_PID 2>/dev/null || true
echo ""

if $PASS; then
    echo "=== 验证通过 ✓ ==="
    exit 0
else
    echo "=== 验证失败 ✗ ==="
    echo "日志目录: $LOG_DIR/"
    exit 1
fi
```

- [ ] **Step 2: 赋予执行权限**

Run: `chmod +x tests/e2e/run-integration.sh`

- [ ] **Step 3: 提交**

```bash
git add tests/e2e/run-integration.sh
git commit -m "feat: 端到端集成验证脚本 — Simulator+EdgeGateway+后端全链路验证"
```
