namespace EquipAI.Simulator;

/// <summary>
/// Simulator 全局配置选项 — 从 appsettings.json 的 "Simulator" 节绑定
/// </summary>
public class SimulatorOptions
{
    /// <summary>
    /// 配置节名称
    /// </summary>
    public const string SectionName = "Simulator";

    /// <summary>
    /// OPC UA 服务器配置
    /// </summary>
    public OpcUaOptions OpcUa { get; set; } = new();

    /// <summary>
    /// Modbus TCP 服务器配置
    /// </summary>
    public ModbusTcpOptions ModbusTcp { get; set; } = new();

    /// <summary>
    /// 模拟传感器配置列表
    /// </summary>
    public List<SensorConfig> Sensors { get; set; } = [];
}

/// <summary>
/// OPC UA Mock Server 配置
/// </summary>
public class OpcUaOptions
{
    /// <summary>
    /// OPC UA TCP 监听端口（默认 4840）
    /// </summary>
    public int Port { get; set; } = 4840;
}

/// <summary>
/// Modbus TCP Mock Server 配置
/// </summary>
public class ModbusTcpOptions
{
    /// <summary>
    /// Modbus TCP 监听端口（默认 5020）
    /// </summary>
    public int Port { get; set; } = 5020;
}
