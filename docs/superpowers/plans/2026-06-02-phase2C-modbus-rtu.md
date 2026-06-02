# Phase 2C: Modbus RTU 适配器 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 ModbusRtuAdapter 支持 RS485 串口设备，SerialPortManager 管理串口共享，复用现有数据管线零改动

**Architecture:** ModbusRtuAdapter 实现 IProtocolAdapter 接口，传输层从 TCP 改为 Serial RTU。SerialPortManager 单例管理串口生命周期（RS485 总线上多设备共享同一串口）。地址解析复用 ModbusTcpAdapter 的 `type:address` 格式。

**Tech Stack:** .NET 8, FluentModbus（已含 RTU 支持）, System.IO.Ports, xUnit, FluentAssertions, Moq

---

## File Structure

| 操作 | 文件 | 职责 |
|------|------|------|
| 创建 | `src/EquipAI.EdgeGateway/Protocols/SerialPortConfig.cs` | 串口配置模型 |
| 创建 | `src/EquipAI.EdgeGateway/Protocols/SerialPortManager.cs` | 串口生命周期管理（单例） |
| 创建 | `src/EquipAI.EdgeGateway/Protocols/ModbusRtuAdapter.cs` | Modbus RTU 协议适配器 |
| 创建 | `tests/EquipAI.Tests.Unit/EdgeGateway/SerialPortManagerTests.cs` | 串口管理器单元测试 |
| 创建 | `tests/EquipAI.Tests.Unit/EdgeGateway/ModbusRtuAdapterTests.cs` | RTU 适配器单元测试 |
| 修改 | `src/EquipAI.EdgeGateway/EquipAI.EdgeGateway.csproj` | 添加 System.IO.Ports |
| 修改 | `src/EquipAI.EdgeGateway/Program.cs` | 注册 modbus-rtu 适配器 + SerialPortManager |

---

### Task 1: SerialPortConfig + SerialPortManager

**Files:**
- Create: `src/EquipAI.EdgeGateway/Protocols/SerialPortConfig.cs`
- Create: `src/EquipAI.EdgeGateway/Protocols/SerialPortManager.cs`
- Test: `tests/EquipAI.Tests.Unit/EdgeGateway/SerialPortManagerTests.cs`

- [ ] **Step 1: 创建 SerialPortConfig 配置模型**

```csharp
// src/EquipAI.EdgeGateway/Protocols/SerialPortConfig.cs
using System.IO.Ports;

namespace EquipAI.EdgeGateway.Protocols;

/// <summary>
/// 串口配置参数 — 描述 RS485 串口的通信参数
/// </summary>
/// <param name="PortName">串口名称（如 COM3 或 /dev/ttyUSB0）</param>
/// <param name="BaudRate">波特率（常见值: 9600, 19200, 38400, 115200）</param>
/// <param name="DataBits">数据位（通常为 7 或 8）</param>
/// <param name="Parity">校验位（N=None, E=Even, O=Odd）</param>
/// <param name="StopBits">停止位（1, 1.5, 2）</param>
public record SerialPortConfig(
    string PortName,
    int BaudRate = 9600,
    int DataBits = 8,
    Parity Parity = System.IO.Ports.Parity.None,
    StopBits StopBits = System.IO.Ports.StopBits.One)
{
    /// <summary>
    /// 从连接字符串解析串口配置。
    /// 格式："端口:波特率:数据位:校验(N/E/O):停止位(1/2)"
    /// 示例："/dev/ttyUSB0:9600:8:N:1"
    /// </summary>
    public static SerialPortConfig Parse(string connectionString)
    {
        var parts = connectionString.Split(':');
        if (parts.Length < 1 || string.IsNullOrWhiteSpace(parts[0]))
            throw new FormatException($"串口连接字符串格式无效: {connectionString}");

        var portName = parts[0];
        var baudRate = parts.Length > 1 ? int.Parse(parts[1]) : 9600;
        var dataBits = parts.Length > 2 ? int.Parse(parts[2]) : 8;
        var parity = parts.Length > 3 ? ParseParity(parts[3]) : System.IO.Ports.Parity.None;
        var stopBits = parts.Length > 4 ? ParseStopBits(parts[4]) : System.IO.Ports.StopBits.One;

        return new SerialPortConfig(portName, baudRate, dataBits, parity, stopBits);
    }

    /// <summary>
    /// 生成缓存键（同一串口配置的设备共享同一个 SerialPort）
    /// </summary>
    public string CacheKey => $"{PortName}:{BaudRate}:{DataBits}:{Parity}:{StopBits}";

    private static Parity ParseParity(string s) => s.ToUpperInvariant() switch
    {
        "N" or "NONE" => System.IO.Ports.Parity.None,
        "E" or "EVEN" => System.IO.Ports.Parity.Even,
        "O" or "ODD" => System.IO.Ports.Parity.Odd,
        _ => throw new FormatException($"无效校验位: {s}，支持 N/E/O")
    };

    private static StopBits ParseStopBits(string s) => s switch
    {
        "1" => System.IO.Ports.StopBits.One,
        "2" => System.IO.Ports.StopBits.Two,
        "1.5" => System.IO.Ports.StopBits.OnePointFive,
        _ => throw new FormatException($"无效停止位: {s}，支持 1/1.5/2")
    };
}
```

- [ ] **Step 2: 创建 SerialPortManager**

```csharp
// src/EquipAI.EdgeGateway/Protocols/SerialPortManager.cs
using System.Collections.Concurrent;
using System.IO.Ports;
using Microsoft.Extensions.Logging;

namespace EquipAI.EdgeGateway.Protocols;

/// <summary>
/// 串口生命周期管理器 — RS485 总线上多设备共享同一物理串口。
/// 同一 CacheKey（端口名+波特率+数据位+校验+停止位）复用同一个 SerialPort 实例。
/// 引用计数管理释放：最后一个引用释放时关闭串口。
/// </summary>
public class SerialPortManager : IDisposable
{
    private readonly ConcurrentDictionary<string, RefCountedPort> _ports = new();
    private readonly ILogger? _logger;

    public SerialPortManager(ILogger<SerialPortManager>? logger = null)
    {
        _logger = logger;
    }

    /// <summary>
    /// 获取或创建串口实例。同一配置返回同一个 SerialPort，引用计数 +1。
    /// </summary>
    public SerialPort GetOrCreatePort(SerialPortConfig config)
    {
        var entry = _ports.AddOrUpdate(
            config.CacheKey,
            key => CreateEntry(config),
            (key, existing) =>
            {
                existing.RefCount++;
                _logger?.LogDebug("串口引用计数 +1: {Key}，当前 {Count}", key, existing.RefCount);
                return existing;
            });

        return entry.Port;
    }

    /// <summary>
    /// 释放一个引用。引用计数归零时关闭并释放串口。
    /// </summary>
    public void Release(string cacheKey)
    {
        if (_ports.TryGetValue(cacheKey, out var entry))
        {
            entry.RefCount--;
            _logger?.LogDebug("串口引用计数 -1: {Key}，当前 {Count}", cacheKey, entry.RefCount);

            if (entry.RefCount <= 0 && _ports.TryRemove(cacheKey, out var removed))
            {
                removed.Port.Close();
                removed.Port.Dispose();
                _logger?.LogInformation("串口已关闭并释放: {Key}", cacheKey);
            }
        }
    }

    private RefCountedPort CreateEntry(SerialPortConfig config)
    {
        var port = new SerialPort(config.PortName, config.BaudRate, config.Parity, config.DataBits, config.StopBits)
        {
            ReadTimeout = 1000,
            WriteTimeout = 1000
        };

        port.Open();
        _logger?.LogInformation("串口已打开: {Key}", config.CacheKey);

        return new RefCountedPort(port);
    }

    public void Dispose()
    {
        foreach (var kvp in _ports)
        {
            try
            {
                kvp.Value.Port.Close();
                kvp.Value.Port.Dispose();
            }
            catch { /* 释放时忽略异常 */ }
        }
        _ports.Clear();
        GC.SuppressFinalize(this);
    }

    private class RefCountedPort(SerialPort port)
    {
        public SerialPort Port { get; } = port;
        public int RefCount { get; set; } = 1;
    }
}
```

- [ ] **Step 3: 编写 SerialPortManager 单元测试**

由于真实串口在 CI/CD 环境不可用，测试聚焦在配置解析和引用计数逻辑。

```csharp
// tests/EquipAI.Tests.Unit/EdgeGateway/SerialPortManagerTests.cs
using EquipAI.EdgeGateway.Protocols;
using FluentAssertions;

namespace EquipAI.Tests.Unit.EdgeGateway;

public class SerialPortManagerTests
{
    [Fact]
    public void Parse_完整配置字符串正确解析()
    {
        var config = SerialPortConfig.Parse("/dev/ttyUSB0:9600:8:N:1");

        config.PortName.Should().Be("/dev/ttyUSB0");
        config.BaudRate.Should().Be(9600);
        config.DataBits.Should().Be(8);
        config.Parity.Should().Be(System.IO.Ports.Parity.None);
        config.StopBits.Should().Be(System.IO.Ports.StopBits.One);
    }

    [Fact]
    public void Parse_仅端口名时使用默认值()
    {
        var config = SerialPortConfig.Parse("COM3");

        config.PortName.Should().Be("COM3");
        config.BaudRate.Should().Be(9600);
        config.DataBits.Should().Be(8);
        config.Parity.Should().Be(System.IO.Ports.Parity.None);
        config.StopBits.Should().Be(System.IO.Ports.StopBits.One);
    }

    [Fact]
    public void Parse_偶校验和双停止位正确解析()
    {
        var config = SerialPortConfig.Parse("COM3:19200:7:E:2");

        config.BaudRate.Should().Be(19200);
        config.DataBits.Should().Be(7);
        config.Parity.Should().Be(System.IO.Ports.Parity.Even);
        config.StopBits.Should().Be(System.IO.Ports.StopBits.Two);
    }

    [Fact]
    public void Parse_空字符串抛出异常()
    {
        var act = () => SerialPortConfig.Parse("");
        act.Should().Throw<FormatException>();
    }

    [Fact]
    public void Parse_无效校验位抛出异常()
    {
        var act = () => SerialPortConfig.Parse("COM3:9600:8:X:1");
        act.Should().Throw<FormatException>().WithMessage("*无效校验位*");
    }

    [Fact]
    public void CacheKey_相同配置生成相同键()
    {
        var c1 = new SerialPortConfig("COM3", 9600, 8, System.IO.Ports.Parity.None, System.IO.Ports.StopBits.One);
        var c2 = new SerialPortConfig("COM3", 9600, 8, System.IO.Ports.Parity.None, System.IO.Ports.StopBits.One);

        c1.CacheKey.Should().Be(c2.CacheKey);
    }

    [Fact]
    public void CacheKey_不同波特率生成不同键()
    {
        var c1 = new SerialPortConfig("COM3", 9600);
        var c2 = new SerialPortConfig("COM3", 19200);

        c1.CacheKey.Should().NotBe(c2.CacheKey);
    }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd /Users/yqgmac/yqg/project/EquipSense && dotnet test tests/EquipAI.Tests.Unit --filter "SerialPortManager" --no-restore -v n`
Expected: 7 个测试全部 PASS

- [ ] **Step 5: 提交**

```bash
git add src/EquipAI.EdgeGateway/Protocols/SerialPortConfig.cs src/EquipAI.EdgeGateway/Protocols/SerialPortManager.cs tests/EquipAI.Tests.Unit/EdgeGateway/SerialPortManagerTests.cs
git commit -m "feat: SerialPortConfig + SerialPortManager — RS485 串口共享管理

- SerialPortConfig: 解析 COM3:9600:8:N:1 格式的连接字符串
- SerialPortManager: 引用计数串口生命周期，多设备共享同一物理串口
- 7 个单元测试：配置解析、默认值、校验位、CacheKey 一致性"
```

---

### Task 2: ModbusRtuAdapter

**Files:**
- Create: `src/EquipAI.EdgeGateway/Protocols/ModbusRtuAdapter.cs`
- Test: `tests/EquipAI.Tests.Unit/EdgeGateway/ModbusRtuAdapterTests.cs`

- [ ] **Step 1: 创建 ModbusRtuAdapter**

```csharp
// src/EquipAI.EdgeGateway/Protocols/ModbusRtuAdapter.cs
using FluentModbus;
using Microsoft.Extensions.Logging;

namespace EquipAI.EdgeGateway.Protocols;

/// <summary>
/// Modbus RTU 协议适配器 — 通过 RS485 串口读取设备数据。
/// 连接字符串格式："端口:波特率:数据位:校验(N/E/O):停止位(1/2):从站地址"
/// 示例："/dev/ttyUSB0:9600:8:N:1:1"
/// 数据点地址格式与 ModbusTcpAdapter 相同："类型:地址"（如 holding_register:100）
/// </summary>
public class ModbusRtuAdapter : IProtocolAdapter
{
    private readonly SerialPortManager _portManager;
    private readonly ILogger<ModbusRtuAdapter>? _logger;
    private ModbusRtuSerialClient? _client;
    private byte _slaveAddress;
    private string? _portCacheKey;
    private bool _disposed;

    public ModbusRtuAdapter(SerialPortManager portManager, ILogger<ModbusRtuAdapter>? logger = null)
    {
        _portManager = portManager;
        _logger = logger;
    }

    /// <inheritdoc />
    public string ProtocolType => "modbus-rtu";

    /// <inheritdoc />
    public bool IsConnected => _client is not null && !_disposed;

    /// <inheritdoc />
    /// <remarks>
    /// 从连接字符串解析串口参数和从站地址，通过 SerialPortManager 获取共享串口，
    /// 创建 FluentModbus RTU Client 绑定到该串口。
    /// </remarks>
    public Task ConnectAsync(DeviceConfig config, CancellationToken ct)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);

        // 格式："端口:波特率:数据位:校验:停止位:从站地址"
        var parts = config.ConnectionString.Split(':');
        if (parts.Length < 1)
            throw new FormatException($"Modbus RTU 连接字符串格式无效: {config.ConnectionString}");

        // 最后一个字段是从站地址
        _slaveAddress = parts.Length >= 6
            ? byte.Parse(parts[5])
            : (byte)1;

        // 前 5 个字段是串口配置
        var portConfigStr = parts.Length >= 5
            ? string.Join(':', parts[..5])
            : parts[0];

        var serialConfig = SerialPortConfig.Parse(portConfigStr);
        _portCacheKey = serialConfig.CacheKey;

        _logger?.LogInformation("正在连接 Modbus RTU: {Port}, 从站地址: {SlaveAddress}",
            serialConfig.PortName, _slaveAddress);

        // 获取共享串口
        var serialPort = _portManager.GetOrCreatePort(serialConfig);

        // 创建 RTU Client 绑定到共享串口
        _client = new ModbusRtuSerialClient();
        _client.Connect(serialPort);

        _logger?.LogInformation("Modbus RTU 连接成功: {Port}", serialConfig.PortName);
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    /// <remarks>
    /// 遍历数据点，按类型调用对应 Modbus 读取函数。
    /// 使用 _slaveAddress 而非 TCP 的固定 unitIdentifier。
    /// </remarks>
    public Task<List<DataPoint>> ReadAsync(string[] pointIds, CancellationToken ct)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);

        if (_client is null)
            throw new InvalidOperationException("Modbus RTU 未连接，请先调用 ConnectAsync");

        var results = new List<DataPoint>(pointIds.Length);
        var timestamp = DateTime.UtcNow;

        foreach (var pointId in pointIds)
        {
            var (type, address) = ModbusTcpAdapter.ParsePointId(pointId);
            double value = type switch
            {
                "holding_register" => _client.ReadHoldingRegisters<ushort>(
                    _slaveAddress, address, 1)[0],

                "input_register" => _client.ReadInputRegisters<ushort>(
                    _slaveAddress, address, 1)[0],

                "coil" => (_client.ReadCoils(_slaveAddress, address, 1)[0] & 0x01) != 0
                    ? 1.0 : 0.0,

                "discrete_input" => (_client.ReadDiscreteInputs(_slaveAddress, address, 1)[0] & 0x01) != 0
                    ? 1.0 : 0.0,

                _ => throw new FormatException($"不支持的 Modbus 数据类型: {type}")
            };

            results.Add(new DataPoint(pointId, pointId, value, "good", timestamp));
        }

        return Task.FromResult(results);
    }

    /// <inheritdoc />
    public ValueTask DisposeAsync()
    {
        if (_disposed) return ValueTask.CompletedTask;

        _disposed = true;

        if (_client is not null)
        {
            try { _client.Close(); }
            catch { /* 关闭时忽略异常 */ }
            _client = null;
        }

        // 释放串口引用（减少引用计数）
        if (_portCacheKey is not null)
        {
            _portManager.Release(_portCacheKey);
            _portCacheKey = null;
        }

        GC.SuppressFinalize(this);
        return ValueTask.CompletedTask;
    }
}
```

- [ ] **Step 2: 编写 ModbusRtuAdapter 单元测试**

```csharp
// tests/EquipAI.Tests.Unit/EdgeGateway/ModbusRtuAdapterTests.cs
using EquipAI.EdgeGateway.Protocols;
using FluentAssertions;
using Moq;

namespace EquipAI.Tests.Unit.EdgeGateway;

public class ModbusRtuAdapterTests
{
    [Fact]
    public void ProtocolType_返回modbus_rtu()
    {
        var portManager = new Mock<SerialPortManager>().Object;
        var adapter = new ModbusRtuAdapter(portManager);

        adapter.ProtocolType.Should().Be("modbus-rtu");
    }

    [Fact]
    public void IsConnected_未连接时返回false()
    {
        var portManager = new Mock<SerialPortManager>().Object;
        var adapter = new ModbusRtuAdapter(portManager);

        adapter.IsConnected.Should().BeFalse();
    }

    [Fact]
    public async Task DisposeAsync_重复调用不抛异常()
    {
        var portManager = new Mock<SerialPortManager>().Object;
        var adapter = new ModbusRtuAdapter(portManager);

        await adapter.DisposeAsync();
        await adapter.DisposeAsync();

        adapter.IsConnected.Should().BeFalse();
    }

    [Fact]
    public async Task ReadAsync_未连接时抛出异常()
    {
        var portManager = new Mock<SerialPortManager>().Object;
        var adapter = new ModbusRtuAdapter(portManager);

        var act = async () => await adapter.ReadAsync(["holding_register:100"], CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*未连接*");
    }

    [Theory]
    [InlineData("holding_register:100", "holding_register", 100)]
    [InlineData("input_register:200", "input_register", 200)]
    [InlineData("coil:0", "coil", 0)]
    [InlineData("discrete_input:15", "discrete_input", 15)]
    public void ParsePointId_复用TcpAdapter解析逻辑(string pointId, string expectedType, int expectedAddress)
    {
        var (type, address) = ModbusTcpAdapter.ParsePointId(pointId);

        type.Should().Be(expectedType);
        address.Should().Be(expectedAddress);
    }
}
```

- [ ] **Step 3: 运行测试确认通过**

Run: `cd /Users/yqgmac/yqg/project/EquipSense && dotnet test tests/EquipAI.Tests.Unit --filter "ModbusRtu" --no-restore -v n`
Expected: 6 个测试全部 PASS

- [ ] **Step 4: 提交**

```bash
git add src/EquipAI.EdgeGateway/Protocols/ModbusRtuAdapter.cs tests/EquipAI.Tests.Unit/EdgeGateway/ModbusRtuAdapterTests.cs
git commit -m "feat: ModbusRtuAdapter — RS485 串口 Modbus RTU 协议适配器

- 复用 ModbusTcpAdapter 的 type:address 点位格式
- 通过 SerialPortManager 共享串口，引用计数管理释放
- 支持从站地址配置（ConnectionString 最后一个字段）
- 6 个单元测试：协议类型、连接状态、重复释放、未连接读取"
```

---

### Task 3: NuGet 依赖 + Program.cs 注册

**Files:**
- Modify: `src/EquipAI.EdgeGateway/EquipAI.EdgeGateway.csproj`
- Modify: `src/EquipAI.EdgeGateway/Program.cs`

- [ ] **Step 1: 添加 System.IO.Ports NuGet 包**

在 `src/EquipAI.EdgeGateway/EquipAI.EdgeGateway.csproj` 的 `<ItemGroup>` 中添加：

```xml
<PackageReference Include="System.IO.Ports" Version="9.0.0" />
```

- [ ] **Step 2: 在 Program.cs 中注册 SerialPortManager + modbus-rtu 适配器**

修改 `Program.cs`：

```csharp
// 在 adapterFactory 定义之前添加 SerialPortManager 注册
builder.Services.AddSingleton<SerialPortManager>();

// 修改 adapterFactory，注入 SerialPortManager
var spManager = new SerialPortManager(); // 简化：直接创建单例
var adapterFactory = new Func<string, IProtocolAdapter>(protocol => protocol switch
{
    "opcua" => new OpcUaAdapter(),
    "modbus-tcp" => new ModbusTcpAdapter(),
    "modbus-rtu" => new ModbusRtuAdapter(spManager),
    _ => throw new ArgumentException($"不支持的协议: {protocol}")
});
```

- [ ] **Step 3: 构建确认编译通过**

Run: `cd /Users/yqgmac/yqg/project/EquipSense && dotnet build src/EquipAI.EdgeGateway`
Expected: Build succeeded

- [ ] **Step 4: 运行全部 EdgeGateway 相关测试**

Run: `cd /Users/yqgmac/yqg/project/EquipSense && dotnet test tests/EquipAI.Tests.Unit --filter "EdgeGateway|ModbusTcp|ModbusRtu|SerialPort" -v n`
Expected: 全部 PASS

- [ ] **Step 5: 提交**

```bash
git add src/EquipAI.EdgeGateway/EquipAI.EdgeGateway.csproj src/EquipAI.EdgeGateway/Program.cs
git commit -m "feat: EdgeGateway 注册 Modbus RTU 适配器 + System.IO.Ports 依赖

- 添加 System.IO.Ports 9.0.0 NuGet 包
- adapterFactory 新增 modbus-rtu 分支，注入 SerialPortManager 单例"
```
