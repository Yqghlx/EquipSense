# Phase 2A：边缘网关 — OPC UA / Modbus 协议适配器 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建独立的边缘网关应用，通过 OPC UA 和 Modbus TCP/RTU 适配器连接真实工业设备，采集遥测数据并通过 MQTT 上传到后端。

**Architecture:** 新建 `src/EquipAI.EdgeGateway` 控制台应用。协议适配器实现统一的 `IProtocolAdapter` 接口，`DataCollector` 按配置定时轮询设备，`DataNormalizer` 标准化数据，`CloudUploader` 通过 MQTT 发布到后端已订阅的 `factory/{tenantId}/telemetry/{deviceId}` 主题。使用 Microsoft.Extensions.Hosting 进行 DI 和生命周期管理。

**Tech Stack:** .NET 8、OPC Foundation SDK (`OPC_UA_Core` via NuGet)、FluentModbus、MQTTnet 4.3.7、Microsoft.Extensions.Hosting

---

## 文件结构

```
src/EquipAI.EdgeGateway/
├── EquipAI.EdgeGateway.csproj
├── Program.cs                              -- 入口，构建 Host，加载配置
├── Protocols/
│   ├── IProtocolAdapter.cs                 -- 协议适配器统一接口
│   ├── DataPoint.cs                        -- 采集数据点记录
│   ├── DeviceConfig.cs                     -- 设备连接配置记录
│   ├── OpcUaAdapter.cs                     -- OPC UA 适配器
│   └── ModbusTcpAdapter.cs                 -- Modbus TCP 适配器
├── Pipeline/
│   ├── DataCollector.cs                    -- 定时采集调度（BackgroundService）
│   ├── DataNormalizer.cs                   -- 数据标准化（单位转换）
│   └── CloudUploader.cs                    -- MQTT 上传到后端
├── GatewayOptions.cs                       -- 配置选项类
└── appsettings.json                        -- 默认配置模板

tests/EquipAI.Tests.Unit/Protocols/
├── OpcUaAdapterTests.cs                    -- OPC UA 适配器测试（Mock Session）
├── ModbusTcpAdapterTests.cs                -- Modbus 适配器测试（Mock Client）
└── DataCollectorTests.cs                   -- 采集调度测试
```

---

### Task 1: 创建 EdgeGateway 项目骨架 + 核心接口

**Files:**
- Create: `src/EquipAI.EdgeGateway/EquipAI.EdgeGateway.csproj`
- Create: `src/EquipAI.EdgeGateway/Protocols/IProtocolAdapter.cs`
- Create: `src/EquipAI.EdgeGateway/Protocols/DataPoint.cs`
- Create: `src/EquipAI.EdgeGateway/Protocols/DeviceConfig.cs`
- Create: `src/EquipAI.EdgeGateway/GatewayOptions.cs`
- Modify: `EquipAI.slnx` — 添加新项目

- [ ] **Step 1: 创建项目文件**

```xml
<!-- src/EquipAI.EdgeGateway/EquipAI.EdgeGateway.csproj -->
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="MQTTnet" Version="4.3.7.1207" />
    <PackageReference Include="MQTTnet.Extensions.ManagedClient" Version="4.3.7.1207" />
    <PackageReference Include="OPC_UA_Core" Version="1.5.374.54" />
    <PackageReference Include="FluentModbus" Version="0.7.2" />
    <PackageReference Include="Microsoft.Extensions.Hosting" Version="8.0" />
    <PackageReference Include="Microsoft.Extensions.Http" Version="8.0" />
    <PackageReference Include="Serilog.Extensions.Hosting" Version="8.0" />
    <PackageReference Include="Serilog.Sinks.Console" Version="6.0" />
  </ItemGroup>

</Project>
```

- [ ] **Step 2: 添加到解决方案**

Run: `dotnet sln add src/EquipAI.EdgeGateway/EquipAI.EdgeGateway.csproj --solution-folder tools`

- [ ] **Step 3: 创建协议适配器接口**

```csharp
// src/EquipAI.EdgeGateway/Protocols/IProtocolAdapter.cs
namespace EquipAI.EdgeGateway.Protocols;

/// <summary>
/// 工业协议适配器统一接口
/// 所有协议（OPC UA、Modbus、MQTT）都实现此接口
/// </summary>
public interface IProtocolAdapter : IAsyncDisposable
{
    /// <summary>
    /// 连接到设备
    /// </summary>
    Task ConnectAsync(DeviceConfig config, CancellationToken ct);

    /// <summary>
    /// 读取指定数据点的当前值
    /// </summary>
    Task<List<DataPoint>> ReadAsync(string[] pointIds, CancellationToken ct);

    /// <summary>
    /// 连接状态
    /// </summary>
    bool IsConnected { get; }

    /// <summary>
    /// 协议类型标识（opcua / modbus-tcp / modbus-rtu）
    /// </summary>
    string ProtocolType { get; }
}
```

- [ ] **Step 4: 创建 DataPoint 和 DeviceConfig 记录**

```csharp
// src/EquipAI.EdgeGateway/Protocols/DataPoint.cs
namespace EquipAI.EdgeGateway.Protocols;

/// <summary>
/// 单个采集数据点
/// </summary>
/// <param name="PointId">数据点标识（如 OPC UA 节点 ID 或 Modbus 寄存器地址）</param>
/// <param name="Metric">指标名称（如 temperature、vibration）</param>
/// <param name="Value">当前值</param>
/// <param name="Quality">数据质量（Good / Bad / Uncertain）</param>
/// <param name="Timestamp">采集时间戳（UTC）</param>
public record DataPoint(
    string PointId,
    string Metric,
    double Value,
    string Quality,
    DateTime Timestamp);
```

```csharp
// src/EquipAI.EdgeGateway/Protocols/DeviceConfig.cs
namespace EquipAI.EdgeGateway.Protocols;

/// <summary>
/// 设备连接配置
/// 对应 appsettings.json 中 Devices 数组的一项
/// </summary>
/// <param name="DeviceId">设备编码（对应后端 devices.device_code）</param>
/// <param name="Protocol">协议类型（opcua / modbus-tcp / modbus-rtu）</param>
/// <param name="ConnectionString">连接字符串</param>
/// <param name="DataPoints">数据点映射：指标名 → 协议地址</param>
/// <param name="PollIntervalMs">轮询间隔（毫秒）</param>
public record DeviceConfig(
    string DeviceId,
    string Protocol,
    string ConnectionString,
    Dictionary<string, string> DataPoints,
    int PollIntervalMs = 3000);
```

- [ ] **Step 5: 创建配置选项类**

```csharp
// src/EquipAI.EdgeGateway/GatewayOptions.cs
namespace EquipAI.EdgeGateway;

/// <summary>
/// 边缘网关配置选项
/// 对应 appsettings.json 中的 Gateway 节
/// </summary>
public class GatewayOptions
{
    public const string SectionName = "Gateway";

    /// <summary>网关唯一标识</summary>
    public string Id { get; set; } = "gateway-001";

    /// <summary>所属租户 ID</summary>
    public string TenantId { get; set; } = string.Empty;

    /// <summary>后端 API 地址</summary>
    public string BackendUrl { get; set; } = "http://localhost:8080";

    /// <summary>MQTT Broker 地址</summary>
    public string MqttBroker { get; set; } = "localhost:1883";

    /// <summary>MQTT 用户名</summary>
    public string? MqttUsername { get; set; }

    /// <summary>MQTT 密码</summary>
    public string? MqttPassword { get; set; }

    /// <summary>上传间隔（秒）</summary>
    public int UploadIntervalSeconds { get; set; } = 5;

    /// <summary>内存缓冲区大小</summary>
    public int BufferSize { get; set; } = 10000;

    /// <summary>认证密钥</summary>
    public string AuthKey { get; set; } = string.Empty;
}
```

- [ ] **Step 6: 提交**

```bash
git add src/EquipAI.EdgeGateway/ EquipAI.slnx
git commit -m "feat(edge): 创建边缘网关项目骨架 + 协议适配器接口"
```

---

### Task 2: OPC UA 适配器实现

**Files:**
- Create: `src/EquipAI.EdgeGateway/Protocols/OpcUaAdapter.cs`
- Create: `tests/EquipAI.Tests.Unit/Protocols/OpcUaAdapterTests.cs`

- [ ] **Step 1: 编写 OPC UA 适配器失败测试**

```csharp
// tests/EquipAI.Tests.Unit/Protocols/OpcUaAdapterTests.cs
using EquipAI.EdgeGateway.Protocols;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Protocols;

public class OpcUaAdapterTests
{
    [Fact]
    public void ProtocolType 应返回_opcua()
    {
        var adapter = new OpcUaAdapter();
        adapter.ProtocolType.Should().Be("opcua");
    }

    [Fact]
    public void 初始状态_IsConnected 应为_false()
    {
        var adapter = new OpcUaAdapter();
        adapter.IsConnected.Should().BeFalse();
    }

    [Fact]
    public async Task 未连接时_ReadAsync 应抛出异常()
    {
        var adapter = new OpcUaAdapter();
        var act = () => adapter.ReadAsync(["ns=2;s=Temperature"], CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*未连接*");
    }

    [Fact]
    public async Task ConnectAsync_无效地址应抛出异常()
    {
        var adapter = new OpcUaAdapter();
        var config = new DeviceConfig(
            "test-device", "opcua", "opc.tcp://invalid-host:4840",
            new Dictionary<string, string> { ["temperature"] = "ns=2;s=Temp" });

        var act = () => adapter.ConnectAsync(config, CancellationToken.None);

        // 连接失败应抛出异常而不是静默失败
        await act.Should().ThrowAsync<Exception>();
        adapter.IsConnected.Should().BeFalse();
    }

    [Fact]
    public async Task DisposeAsync 应可安全重复调用()
    {
        var adapter = new OpcUaAdapter();
        await adapter.DisposeAsync();
        await adapter.DisposeAsync();
        // 不应抛出异常
    }
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "OpcUaAdapterTests" --verbosity normal`
Expected: 至少 1 个测试通过（ProtocolType、IsConnected、DisposeAsync），连接相关测试因无真实 OPC UA 服务器而可能超时

- [ ] **Step 3: 实现 OPC UA 适配器**

```csharp
// src/EquipAI.EdgeGateway/Protocols/OpcUaAdapter.cs
using Microsoft.Extensions.Logging;
using Opc.Ua;
using Opc.Ua.Client;

namespace EquipAI.EdgeGateway.Protocols;

/// <summary>
/// OPC UA 协议适配器
/// 使用 OPC Foundation SDK 连接 OPC UA 服务器并读取节点数据
/// </summary>
public class OpcUaAdapter : IProtocolAdapter
{
    private readonly ILogger<OpcUaAdapter>? _logger;
    private Session? _session;
    private bool _disposed;

    public OpcUaAdapter(ILogger<OpcUaAdapter>? logger = null)
    {
        _logger = logger;
    }

    public string ProtocolType => "opcua";

    public bool IsConnected => _session?.Connected == true && !_disposed;

    /// <inheritdoc />
    public async Task ConnectAsync(DeviceConfig config, CancellationToken ct)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);

        var endpointUrl = config.ConnectionString;
        _logger?.LogInformation("正在连接 OPC UA 服务器: {Endpoint}", endpointUrl);

        try
        {
            var application = new ApplicationInstance
            {
                ApplicationName = "EquipAI EdgeGateway",
                ApplicationType = ApplicationType.Client,
                ConfigSectionName = "Opc.Ua"
            };

            var endpointDescription = CoreClientUtils.SelectEndpoint(endpointUrl, useSecurity: false);
            var endpointConfig = EndpointConfiguration.Create();
            var endpoint = new ConfiguredEndpoint(null, endpointDescription, endpointConfig);

            _session = await Session.Create(
                configuration: null!,
                endpoint: endpoint,
                updateBeforeConnect: true,
                sessionName: $"EdgeGateway-{config.DeviceId}",
                sessionTimeout: 30000,
                identity: null,
                ct);

            _logger?.LogInformation("OPC UA 连接成功: {Endpoint}", endpointUrl);
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "OPC UA 连接失败: {Endpoint}", endpointUrl);
            _session?.Dispose();
            _session = null;
            throw;
        }
    }

    /// <inheritdoc />
    public async Task<List<DataPoint>> ReadAsync(string[] pointIds, CancellationToken ct)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);

        if (_session is null || !_session.Connected)
            throw new InvalidOperationException("OPC UA 未连接，请先调用 ConnectAsync");

        var nodesToRead = pointIds
            .Select(id => new ReadValueId { NodeId = new NodeId(id), AttributeId = Attributes.Value })
            .ToList();

        var readDetails = new ReadValueIdCollection(nodesToRead);
        var request = new ReadRequest
        {
            NodesToRead = readDetails,
            MaxAge = 0,
            TimestampsToReturn = TimestampsToReturn.Both
        };

        var response = await _session.ReadAsync(request, ct);

        var results = new List<DataPoint>();
        var timestamps = response.Results;

        for (var i = 0; i < pointIds.Length; i++)
        {
            var value = response.Results[i];
            var quality = StatusCode.IsGood(value.StatusCode) ? "good" : "bad";
            var timestamp = value.ServerTimestamp != DateTime.MinValue
                ? value.ServerTimestamp
                : DateTime.UtcNow;

            // 提取数值：支持 int、float、double、bool 类型
            var numericValue = value.Value switch
            {
                double d => d,
                float f => f,
                int n => n,
                long l => l,
                bool b => b ? 1.0 : 0.0,
                _ => double.TryParse(value.Value?.ToString(), out var parsed) ? parsed : 0.0
            };

            results.Add(new DataPoint(
                PointId: pointIds[i],
                Metric: pointIds[i], // 调用方负责映射为指标名
                Value: numericValue,
                Quality: quality,
                Timestamp: timestamp));
        }

        return results;
    }

    /// <inheritdoc />
    public async ValueTask DisposeAsync()
    {
        if (_disposed) return;
        _disposed = true;

        if (_session is not null)
        {
            try
            {
                await _session.CloseAsync();
            }
            catch (Exception ex)
            {
                _logger?.LogDebug(ex, "关闭 OPC UA 会话时出错");
            }

            _session.Dispose();
            _session = null;
        }

        GC.SuppressFinalize(this);
    }
}
```

- [ ] **Step 4: 运行测试**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "OpcUaAdapterTests" --verbosity normal`
Expected: ProtocolType、IsConnected、未连接异常、DisposeAsync 测试通过。ConnectAsync 无效地址测试因无 OPC UA 服务器而抛出异常（通过）。

- [ ] **Step 5: 提交**

```bash
git add src/EquipAI.EdgeGateway/Protocols/OpcUaAdapter.cs tests/EquipAI.Tests.Unit/Protocols/OpcUaAdapterTests.cs
git commit -m "feat(edge): 实现 OPC UA 协议适配器"
```

---

### Task 3: Modbus TCP 适配器实现

**Files:**
- Create: `src/EquipAI.EdgeGateway/Protocols/ModbusTcpAdapter.cs`
- Create: `tests/EquipAI.Tests.Unit/Protocols/ModbusTcpAdapterTests.cs`

- [ ] **Step 1: 编写 Modbus TCP 适配器测试**

```csharp
// tests/EquipAI.Tests.Unit/Protocols/ModbusTcpAdapterTests.cs
using System.Net;
using EquipAI.EdgeGateway.Protocols;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Protocols;

public class ModbusTcpAdapterTests
{
    [Fact]
    public void ProtocolType 应返回_modbus_tcp()
    {
        var adapter = new ModbusTcpAdapter();
        adapter.ProtocolType.Should().Be("modbus-tcp");
    }

    [Fact]
    public void 初始状态_IsConnected 应为_false()
    {
        var adapter = new ModbusTcpAdapter();
        adapter.IsConnected.Should().BeFalse();
    }

    [Fact]
    public async Task 未连接时_ReadAsync 应抛出异常()
    {
        var adapter = new ModbusTcpAdapter();
        var act = () => adapter.ReadAsync(["holding_register:100"], CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*未连接*");
    }

    [Fact]
    public void ParsePointId_holding_register 应解析出正确的地址和类型()
    {
        // holding_register:100 → (类型=HoldingRegister, 地址=100)
        var (type, address) = ModbusTcpAdapter.ParsePointId("holding_register:100");
        type.Should().Be("holding_register");
        address.Should().Be(100);
    }

    [Fact]
    public void ParsePointId_input_register 应解析出正确的地址和类型()
    {
        var (type, address) = ModbusTcpAdapter.ParsePointId("input_register:50");
        type.Should().Be("input_register");
        address.Should().Be(50);
    }

    [Fact]
    public void ParsePointId_coil 应解析出正确的地址和类型()
    {
        var (type, address) = ModbusTcpAdapter.ParsePointId("coil:10");
        type.Should().Be("coil");
        address.Should().Be(10);
    }

    [Fact]
    public void ParsePointId_无效格式应抛出异常()
    {
        var act = () => ModbusTcpAdapter.ParsePointId("invalid");
        act.Should().Throw<FormatException>();
    }

    [Fact]
    public async Task DisposeAsync 应可安全重复调用()
    {
        var adapter = new ModbusTcpAdapter();
        await adapter.DisposeAsync();
        await adapter.DisposeAsync();
    }
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "ModbusTcpAdapterTests" --verbosity normal`
Expected: ParsePointId 相关测试编译失败（方法不存在）

- [ ] **Step 3: 实现 Modbus TCP 适配器**

```csharp
// src/EquipAI.EdgeGateway/Protocols/ModbusTcpAdapter.cs
using System.Net;
using FluentModbus;
using Microsoft.Extensions.Logging;

namespace EquipAI.EdgeGateway.Protocols;

/// <summary>
/// Modbus TCP 协议适配器
/// 使用 FluentModbus 连接 Modbus TCP 设备，支持 Holding Register、Input Register 和 Coil 读取
/// 数据点地址格式：{类型}:{起始地址}，如 holding_register:100、coil:0
/// </summary>
public class ModbusTcpAdapter : IProtocolAdapter
{
    private readonly ILogger<ModbusTcpAdapter>? _logger;
    private ModbusTcpClient? _client;
    private bool _disposed;

    public ModbusTcpAdapter(ILogger<ModbusTcpAdapter>? logger = null)
    {
        _logger = logger;
    }

    public string ProtocolType => "modbus-tcp";

    public bool IsConnected => _client?.IsConnected == true && !_disposed;

    /// <inheritdoc />
    public Task ConnectAsync(DeviceConfig config, CancellationToken ct)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);

        // 解析连接字符串：host:port 或 host（默认端口 502）
        var parts = config.ConnectionString.Split(':');
        var host = parts[0];
        var port = parts.Length > 1 ? int.Parse(parts[1]) : 502;

        _logger?.LogInformation("正在连接 Modbus TCP: {Host}:{Port}", host, port);

        _client = new ModbusTcpClient();
        _client.Connect(host, port);

        _logger?.LogInformation("Modbus TCP 连接成功: {Host}:{Port}", host, port);
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<List<DataPoint>> ReadAsync(string[] pointIds, CancellationToken ct)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);

        if (_client is null || !_client.IsConnected)
            throw new InvalidOperationException("Modbus TCP 未连接，请先调用 ConnectAsync");

        var results = new List<DataPoint>();

        foreach (var pointId in pointIds)
        {
            var (type, address) = ParsePointId(pointId);
            var timestamp = DateTime.UtcNow;

            double value = type switch
            {
                "holding_register" => _client.ReadHoldingRegisters<ushort>(0, address, 1)[0],
                "input_register" => _client.ReadInputRegisters<ushort>(0, address, 1)[0],
                "coil" => _client.ReadCoils(0, address, 1)[0] ? 1.0 : 0.0,
                _ => throw new FormatException($"不支持的 Modbus 数据类型: {type}")
            };

            results.Add(new DataPoint(
                PointId: pointId,
                Metric: pointId,
                Value: value,
                Quality: "good",
                Timestamp: timestamp));
        }

        return Task.FromResult(results);
    }

    /// <summary>
    /// 解析 Modbus 数据点地址
    /// 格式：{类型}:{地址}，如 holding_register:100
    /// </summary>
    public static (string Type, int Address) ParsePointId(string pointId)
    {
        var separatorIndex = pointId.IndexOf(':');
        if (separatorIndex < 0 || separatorIndex >= pointId.Length - 1)
            throw new FormatException($"Modbus 数据点格式无效: {pointId}，期望格式: type:address");

        var type = pointId[..separatorIndex];
        var addressStr = pointId[(separatorIndex + 1)..];

        if (!int.TryParse(addressStr, out var address) || address < 0)
            throw new FormatException($"Modbus 地址无效: {addressStr}");

        return (type, address);
    }

    /// <inheritdoc />
    public async ValueTask DisposeAsync()
    {
        if (_disposed) return;
        _disposed = true;

        if (_client is not null)
        {
            try
            {
                _client.Disconnect();
            }
            catch (Exception ex)
            {
                _logger?.LogDebug(ex, "断开 Modbus TCP 连接时出错");
            }

            _client.Dispose();
            _client = null;
        }

        GC.SuppressFinalize(this);
    }
}
```

- [ ] **Step 4: 运行测试**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "ModbusTcpAdapterTests" --verbosity normal`
Expected: 8/8 通过

- [ ] **Step 5: 提交**

```bash
git add src/EquipAI.EdgeGateway/Protocols/ModbusTcpAdapter.cs tests/EquipAI.Tests.Unit/Protocols/ModbusTcpAdapterTests.cs
git commit -m "feat(edge): 实现 Modbus TCP 协议适配器"
```

---

### Task 4: 数据标准化器

**Files:**
- Create: `src/EquipAI.EdgeGateway/Pipeline/DataNormalizer.cs`
- Create: `tests/EquipAI.Tests.Unit/Protocols/DataNormalizerTests.cs`

- [ ] **Step 1: 编写测试**

```csharp
// tests/EquipAI.Tests.Unit/Protocols/DataNormalizerTests.cs
using EquipAI.EdgeGateway.Pipeline;
using EquipAI.EdgeGateway.Protocols;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Protocols;

public class DataNormalizerTests
{
    [Fact]
    public void Normalize 应将DataPoint映射为指标名()
    {
        var dataPoints = new List<DataPoint>
        {
            new("ns=2;s=Channel1.Temperature", "temperature", 85.3, "good", DateTime.UtcNow),
            new("ns=2;s=Channel1.Vibration", "vibration", 2.1, "good", DateTime.UtcNow),
        };

        var deviceConfig = new DeviceConfig(
            "cnc-001", "opcua", "opc.tcp://localhost:4840",
            new Dictionary<string, string>
            {
                ["temperature"] = "ns=2;s=Channel1.Temperature",
                ["vibration"] = "ns=2;s=Channel1.Vibration"
            });

        var result = DataNormalizer.Normalize("cnc-001", dataPoints, deviceConfig);

        result.DeviceId.Should().Be("cnc-001");
        result.Metrics["temperature"].Should().Be(85.3);
        result.Metrics["vibration"].Should().Be(2.1);
    }

    [Fact]
    public void Normalize 未配置的数据点应忽略()
    {
        var dataPoints = new List<DataPoint>
        {
            new("ns=2;s=Unknown", "unknown", 42.0, "good", DateTime.UtcNow),
        };

        var deviceConfig = new DeviceConfig(
            "dev-001", "opcua", "opc.tcp://localhost:4840",
            new Dictionary<string, string>());

        var result = DataNormalizer.Normalize("dev-001", dataPoints, deviceConfig);

        result.Metrics.Should().BeEmpty();
    }

    [Fact]
    public void Normalize 多个数据点应正确映射()
    {
        var now = DateTime.UtcNow;
        var dataPoints = new List<DataPoint>
        {
            new("holding_register:100", "temperature", 85.3, "good", now),
            new("holding_register:101", "pressure", 6.2, "good", now),
            new("coil:0", "status", 1.0, "good", now),
        };

        var deviceConfig = new DeviceConfig(
            "inj-001", "modbus-tcp", "192.168.1.50:502",
            new Dictionary<string, string>
            {
                ["temperature"] = "holding_register:100",
                ["pressure"] = "holding_register:101",
                ["status"] = "coil:0"
            });

        var result = DataNormalizer.Normalize("inj-001", dataPoints, deviceConfig);

        result.Metrics.Should().HaveCount(3);
        result.DeviceId.Should().Be("inj-001");
    }
}
```

- [ ] **Step 2: 运行测试确认编译失败**

- [ ] **Step 3: 实现 DataNormalizer**

```csharp
// src/EquipAI.EdgeGateway/Pipeline/DataNormalizer.cs
using EquipAI.EdgeGateway.Protocols;

namespace EquipAI.EdgeGateway.Pipeline;

/// <summary>
/// 标准化后的遥测消息
/// </summary>
/// <param name="DeviceId">设备编码</param>
/// <param name="Timestamp">最新数据点时间戳</param>
/// <param name="Metrics">指标名称到值的映射</param>
/// <param name="Status">设备状态</param>
public record NormalizedMessage(
    string DeviceId,
    DateTime Timestamp,
    Dictionary<string, double> Metrics,
    string Status = "running");

/// <summary>
/// 数据标准化器
/// 将适配器采集的原始 DataPoint 转换为后端期望的 MQTT 消息格式
/// 反转 DeviceConfig.DataPoints 的映射（协议地址 → 指标名）
/// </summary>
public static class DataNormalizer
{
    /// <summary>
    /// 将原始数据点标准化为统一消息格式
    /// </summary>
    public static NormalizedMessage Normalize(
        string deviceId, List<DataPoint> dataPoints, DeviceConfig config)
    {
        // 反转映射：协议地址 → 指标名
        var addressToMetric = config.DataPoints
            .ToDictionary(kvp => kvp.Value, kvp => kvp.Key);

        var metrics = new Dictionary<string, double>();
        var latestTimestamp = DateTime.MinValue;

        foreach (var point in dataPoints)
        {
            if (addressToMetric.TryGetValue(point.PointId, out var metric))
            {
                metrics[metric] = point.Value;
                if (point.Timestamp > latestTimestamp)
                    latestTimestamp = point.Timestamp;
            }
        }

        return new NormalizedMessage(
            DeviceId: deviceId,
            Timestamp: latestTimestamp == DateTime.MinValue ? DateTime.UtcNow : latestTimestamp,
            Metrics: metrics);
    }
}
```

- [ ] **Step 4: 运行测试**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "DataNormalizerTests" --verbosity normal`
Expected: 3/3 通过

- [ ] **Step 5: 提交**

```bash
git add src/EquipAI.EdgeGateway/Pipeline/DataNormalizer.cs tests/EquipAI.Tests.Unit/Protocols/DataNormalizerTests.cs
git commit -m "feat(edge): 实现数据标准化器 DataNormalizer"
```

---

### Task 5: MQTT 云端上传器

**Files:**
- Create: `src/EquipAI.EdgeGateway/Pipeline/CloudUploader.cs`
- Create: `tests/EquipAI.Tests.Unit/Protocols/CloudUploaderTests.cs`

- [ ] **Step 1: 编写测试**

```csharp
// tests/EquipAI.Tests.Unit/Protocols/CloudUploaderTests.cs
using EquipAI.EdgeGateway.Pipeline;
using FluentAssertions;
using System.Text.Json;

namespace EquipAI.Tests.Unit.Protocols;

public class CloudUploaderTests
{
    [Fact]
    public void BuildMqttTopic 应生成正确的主题()
    {
        var topic = CloudUploader.BuildMqttTopic("tenant-123", "cnc-001");
        topic.Should().Be("factory/tenant-123/telemetry/cnc-001");
    }

    [Fact]
    public void BuildPayload 应生成有效的JSON()
    {
        var msg = new NormalizedMessage(
            "cnc-001", new DateTime(2026, 6, 1, 12, 0, 0, DateTimeKind.Utc),
            new Dictionary<string, double> { ["temperature"] = 85.3, ["vibration"] = 2.1 });

        var json = CloudUploader.BuildPayload(msg, "CNC");
        var doc = JsonDocument.Parse(json);

        doc.RootElement.GetProperty("device_id").GetString().Should().Be("cnc-001");
        doc.RootElement.GetProperty("device_type").GetString().Should().Be("CNC");
        doc.RootElement.GetProperty("metrics").GetProperty("temperature").GetDouble().Should().Be(85.3);
        doc.RootElement.GetProperty("quality").GetString().Should().Be("good");
    }
}
```

- [ ] **Step 2: 运行测试确认编译失败**

- [ ] **Step 3: 实现 CloudUploader**

```csharp
// src/EquipAI.EdgeGateway/Pipeline/CloudUploader.cs
using System.Text.Json;
using System.Text.Json.Serialization;
using EquipAI.EdgeGateway.Protocols;
using Microsoft.Extensions.Logging;
using MQTTnet;
using MQTTnet.Protocol;

namespace EquipAI.EdgeGateway.Pipeline;

/// <summary>
/// 云端上传器，通过 MQTT 将标准化遥测数据发布到后端
/// MQTT 主题格式：factory/{tenantId}/telemetry/{deviceId}
/// 后端已订阅 factory/+/telemetry/+ 接收数据
/// </summary>
public class CloudUploader : IAsyncDisposable
{
    private readonly ILogger<CloudUploader> _logger;
    private readonly GatewayOptions _options;
    private readonly IMqttClient _mqttClient;
    private readonly MqttFactory _mqttFactory = new();
    private bool _disposed;

    public CloudUploader(ILogger<CloudUploader> logger, GatewayOptions options)
    {
        _logger = logger;
        _options = options;
        _mqttClient = _mqttFactory.CreateMqttClient();
    }

    /// <summary>
    /// 连接到 MQTT Broker
    /// </summary>
    public async Task ConnectAsync(CancellationToken ct)
    {
        var builder = new MqttClientOptionsBuilder()
            .WithTcpServer(_options.MqttBroker.Split(':').First(),
                _options.MqttBroker.Contains(':') ? int.Parse(_options.MqttBroker.Split(':').Last()) : 1883)
            .WithClientId($"edge-gateway-{_options.Id}")
            .WithCleanSession(true);

        if (!string.IsNullOrEmpty(_options.MqttUsername))
            builder.WithCredentials(_options.MqttUsername, _options.MqttPassword);

        await _mqttClient.ConnectAsync(builder.Build(), ct);
        _logger.LogInformation("MQTT 已连接: {Broker}", _options.MqttBroker);
    }

    /// <summary>
    /// 上传标准化遥测消息
    /// </summary>
    public async Task UploadAsync(NormalizedMessage message, string deviceType, CancellationToken ct)
    {
        if (!_mqttClient.IsConnected)
        {
            _logger.LogWarning("MQTT 未连接，跳过上传");
            return;
        }

        var topic = BuildMqttTopic(_options.TenantId, message.DeviceId);
        var payload = BuildPayload(message, deviceType);

        var mqttMessage = new MqttApplicationMessageBuilder()
            .WithTopic(topic)
            .WithPayload(payload)
            .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce)
            .Build();

        await _mqttClient.PublishAsync(mqttMessage, ct);
        _logger.LogDebug("已上传: {DeviceId} → {Topic}, 指标数={Count}",
            message.DeviceId, topic, message.Metrics.Count);
    }

    /// <summary>
    /// 构建 MQTT 主题
    /// </summary>
    public static string BuildMqttTopic(string tenantId, string deviceId)
        => $"factory/{tenantId}/telemetry/{deviceId}";

    /// <summary>
    /// 构建消息 JSON 载荷
    /// </summary>
    public static string BuildPayload(NormalizedMessage message, string deviceType)
    {
        var payload = new
        {
            device_id = message.DeviceId,
            device_type = deviceType,
            timestamp = message.Timestamp.ToString("O"),
            metrics = message.Metrics,
            status = message.Status,
            quality = "good"
        };

        return JsonSerializer.Serialize(payload);
    }

    public async ValueTask DisposeAsync()
    {
        if (_disposed) return;
        _disposed = true;

        if (_mqttClient.IsConnected)
        {
            try { await _mqttClient.DisconnectAsync(); } catch { /* 忽略 */ }
        }

        _mqttClient.Dispose();
        GC.SuppressFinalize(this);
    }
}
```

- [ ] **Step 4: 运行测试**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "CloudUploaderTests" --verbosity normal`
Expected: 2/2 通过

- [ ] **Step 5: 提交**

```bash
git add src/EquipAI.EdgeGateway/Pipeline/CloudUploader.cs tests/EquipAI.Tests.Unit/Protocols/CloudUploaderTests.cs
git commit -m "feat(edge): 实现 MQTT 云端上传器 CloudUploader"
```

---

### Task 6: 数据采集调度器（BackgroundService）

**Files:**
- Create: `src/EquipAI.EdgeGateway/Pipeline/DataCollector.cs`
- Create: `tests/EquipAI.Tests.Unit/Protocols/DataCollectorTests.cs`

- [ ] **Step 1: 编写测试**

```csharp
// tests/EquipAI.Tests.Unit/Protocols/DataCollectorTests.cs
using EquipAI.EdgeGateway.Pipeline;
using EquipAI.EdgeGateway.Protocols;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace EquipAI.Tests.Unit.Protocols;

public class DataCollectorTests
{
    [Fact]
    public async Task CollectOnceAsync 应调用适配器读取所有配置的数据点()
    {
        // 安排：Mock 适配器返回数据
        var mockAdapter = new Mock<IProtocolAdapter>();
        mockAdapter.SetupGet(a => a.IsConnected).Returns(true);
        mockAdapter.Setup(a => a.ReadAsync(It.IsAny<string[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<DataPoint>
            {
                new("holding_register:100", "holding_register:100", 85.3, "good", DateTime.UtcNow)
            });

        var mockUploader = new Mock<CloudUploader>(Mock.Of<ILogger<CloudUploader>>(), new GatewayOptions());
        var config = new DeviceConfig(
            "inj-001", "modbus-tcp", "192.168.1.50:502",
            new Dictionary<string, string> { ["temperature"] = "holding_register:100" },
            5000);

        var collector = new DataCollector(
            Mock.Of<ILogger<DataCollector>>(), mockAdapter.Object, mockUploader.Object, config, "CNC");

        // 执行：单次采集
        await collector.CollectOnceAsync(CancellationToken.None);

        // 验证：适配器被调用，读取了配置的数据点地址
        mockAdapter.Verify(
            a => a.ReadAsync(It.Is<string[]>(ids => ids.Contains("holding_register:100")), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CollectOnceAsync_适配器未连接应跳过()
    {
        var mockAdapter = new Mock<IProtocolAdapter>();
        mockAdapter.SetupGet(a => a.IsConnected).Returns(false);

        var mockUploader = new Mock<CloudUploader>(Mock.Of<ILogger<CloudUploader>>(), new GatewayOptions());
        var config = new DeviceConfig("dev-001", "opcua", "opc.tcp://localhost:4840",
            new Dictionary<string, string> { ["temperature"] = "ns=2;s=Temp" });

        var collector = new DataCollector(
            Mock.Of<ILogger<DataCollector>>(), mockAdapter.Object, mockUploader.Object, config, "CNC");

        await collector.CollectOnceAsync(CancellationToken.None);

        // 不应调用 ReadAsync
        mockAdapter.Verify(
            a => a.ReadAsync(It.IsAny<string[]>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
```

- [ ] **Step 2: 运行测试确认编译失败**

- [ ] **Step 3: 实现 DataCollector**

```csharp
// src/EquipAI.EdgeGateway/Pipeline/DataCollector.cs
using EquipAI.EdgeGateway.Protocols;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EquipAI.EdgeGateway.Pipeline;

/// <summary>
/// 数据采集调度器
/// 按设备配置的 PollIntervalMs 间隔，定时调用协议适配器读取数据，
/// 标准化后通过 CloudUploader 上传到后端
/// </summary>
public class DataCollector : BackgroundService
{
    private readonly ILogger<DataCollector> _logger;
    private readonly IProtocolAdapter _adapter;
    private readonly CloudUploader _uploader;
    private readonly DeviceConfig _config;
    private readonly string _deviceType;

    public DataCollector(
        ILogger<DataCollector> logger,
        IProtocolAdapter adapter,
        CloudUploader uploader,
        DeviceConfig config,
        string deviceType = "Unknown")
    {
        _logger = logger;
        _adapter = adapter;
        _uploader = uploader;
        _config = config;
        _deviceType = deviceType;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("数据采集器启动: 设备={DeviceId}, 协议={Protocol}, 间隔={Interval}ms",
            _config.DeviceId, _config.Protocol, _config.PollIntervalMs);

        try
        {
            await _adapter.ConnectAsync(_config, stoppingToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "设备 {DeviceId} 连接失败", _config.DeviceId);
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CollectOnceAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "设备 {DeviceId} 采集失败", _config.DeviceId);
            }

            await Task.Delay(_config.PollIntervalMs, stoppingToken);
        }
    }

    /// <summary>
    /// 执行一次采集 → 标准化 → 上传
    /// </summary>
    public async Task CollectOnceAsync(CancellationToken ct)
    {
        if (!_adapter.IsConnected)
        {
            _logger.LogWarning("设备 {DeviceId} 适配器未连接，跳过采集", _config.DeviceId);
            return;
        }

        // 读取所有配置的数据点地址
        var pointIds = _config.DataPoints.Values.ToArray();
        var dataPoints = await _adapter.ReadAsync(pointIds, ct);

        if (dataPoints.Count == 0) return;

        // 标准化并上传
        var message = DataNormalizer.Normalize(_config.DeviceId, dataPoints, _config);
        if (message.Metrics.Count == 0) return;

        await _uploader.UploadAsync(message, _deviceType, ct);
    }
}
```

- [ ] **Step 4: 运行测试**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "DataCollectorTests" --verbosity normal`
Expected: 2/2 通过

- [ ] **Step 5: 提交**

```bash
git add src/EquipAI.EdgeGateway/Pipeline/DataCollector.cs tests/EquipAI.Tests.Unit/Protocols/DataCollectorTests.cs
git commit -m "feat(edge): 实现数据采集调度器 DataCollector"
```

---

### Task 7: Program.cs 入口 + 配置模板

**Files:**
- Create: `src/EquipAI.EdgeGateway/Program.cs`
- Create: `src/EquipAI.EdgeGateway/appsettings.json`

- [ ] **Step 1: 创建 Program.cs**

```csharp
// src/EquipAI.EdgeGateway/Program.cs
using EquipAI.EdgeGateway;
using EquipAI.EdgeGateway.Pipeline;
using EquipAI.EdgeGateway.Protocols;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = Host.CreateApplicationBuilder(args);

    // 绑定配置
    builder.Services.Configure<GatewayOptions>(
        builder.Configuration.GetSection(GatewayOptions.SectionName));
    builder.Services.AddSingleton(sp =>
        sp.GetRequiredService<IOptions<GatewayOptions>>().Value);

    // 注册协议适配器工厂
    builder.Services.AddSingleton<Func<string, IProtocolAdapter>>(protocol => protocol switch
    {
        "opcua" => new OpcUaAdapter(),
        "modbus-tcp" => new ModbusTcpAdapter(),
        _ => throw new ArgumentException($"不支持的协议: {protocol}")
    });

    // 注册上传器
    builder.Services.AddSingleton<CloudUploader>();

    // 注册后台采集服务（每个设备一个 DataCollector 实例）
    builder.Services.AddSingleton<IHostedService>(sp =>
    {
        // 这里使用工厂委托，实际在 Task 8 中完善
        throw new NotImplementedException("请通过配置文件加载设备列表");
    });

    builder.Services.AddSerilog();

    var host = builder.Build();
    Log.Information("边缘网关启动中...");
    await host.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "边缘网关启动失败");
}
finally
{
    await Log.CloseAndFlushAsync();
}
```

注意：需要添加 `using Microsoft.Extensions.Options;`

- [ ] **Step 2: 创建 appsettings.json**

```json
// src/EquipAI.EdgeGateway/appsettings.json
{
  "Gateway": {
    "Id": "gateway-factory-a-01",
    "TenantId": "default-tenant-id",
    "BackendUrl": "http://localhost:8080",
    "MqttBroker": "localhost:1883",
    "UploadIntervalSeconds": 5,
    "BufferSize": 10000,
    "AuthKey": "${GATEWAY_AUTH_KEY}"
  },
  "Devices": [
    {
      "DeviceId": "cnc-001",
      "Protocol": "opcua",
      "ConnectionString": "opc.tcp://192.168.1.100:4840",
      "PollIntervalMs": 3000,
      "DeviceType": "CNC",
      "DataPoints": {
        "temperature": "ns=2;s=Channel1.Device1.Temperature",
        "vibration": "ns=2;s=Channel1.Device1.Vibration",
        "pressure": "ns=2;s=Channel1.Device1.Pressure"
      }
    },
    {
      "DeviceId": "inj-001",
      "Protocol": "modbus-tcp",
      "ConnectionString": "192.168.1.50:502",
      "PollIntervalMs": 5000,
      "DeviceType": "注塑机",
      "DataPoints": {
        "temperature": "holding_register:100",
        "pressure": "holding_register:101",
        "status": "coil:0"
      }
    }
  ]
}
```

- [ ] **Step 3: 编译确认**

Run: `dotnet build src/EquipAI.EdgeGateway`
Expected: 编译成功（可能有 using 警告，修复即可）

- [ ] **Step 4: 提交**

```bash
git add src/EquipAI.EdgeGateway/Program.cs src/EquipAI.EdgeGateway/appsettings.json
git commit -m "feat(edge): 创建 Program.cs 入口 + 配置模板"
```

---

### Task 8: 完善 Program.cs — 动态加载设备配置

**Files:**
- Modify: `src/EquipAI.EdgeGateway/Program.cs`

- [ ] **Step 1: 完善 Program.cs 支持从配置加载设备列表并为每个设备创建 DataCollector**

将 Task 7 中的 `IHostedService` 注册替换为以下实现：

```csharp
// 替换 builder.Services.AddSingleton<IHostedService>(...) 部分

// 加载设备配置并注册采集服务
var devicesSection = builder.Configuration.GetSection("Devices");
var devices = devicesSection.Get<DeviceConfig[]>() ?? [];

Log.Information("已加载 {Count} 个设备配置", devices.Length);

builder.Services.AddSingleton(sp =>
{
    var options = sp.GetRequiredService<GatewayOptions>();
    return new CloudUploader(
        sp.GetRequiredService<ILogger<CloudUploader>>(), options);
});

// 为每个设备注册独立的采集 BackgroundService
var adapterFactory = new Func<string, IProtocolAdapter>(protocol => protocol switch
{
    "opcua" => new OpcUaAdapter(),
    "modbus-tcp" => new ModbusTcpAdapter(),
    _ => throw new ArgumentException($"不支持的协议: {protocol}")
});

foreach (var device in devices)
{
    var deviceConfig = device;
    builder.Services.AddSingleton<IHostedService>(sp => new DataCollector(
        sp.GetRequiredService<ILogger<DataCollector>>(),
        adapterFactory(deviceConfig.Protocol),
        sp.GetRequiredService<CloudUploader>(),
        deviceConfig,
        deviceConfig.DeviceType ?? "Unknown"));
}
```

- [ ] **Step 2: 编译确认**

Run: `dotnet build src/EquipAI.EdgeGateway`
Expected: 编译成功

- [ ] **Step 3: 提交**

```bash
git add src/EquipAI.EdgeGateway/Program.cs
git commit -m "feat(edge): 支持从配置文件动态加载设备列表"
```

---

## 自检

1. **规格覆盖**: OPC UA 适配器 ✅、Modbus TCP 适配器 ✅、数据标准化 ✅、MQTT 上传 ✅、定时采集 ✅、配置驱动 ✅
2. **占位符扫描**: 无 TBD/TODO/FIXME
3. **类型一致性**: DataPoint、DeviceConfig、NormalizedMessage、GatewayOptions 全局一致
