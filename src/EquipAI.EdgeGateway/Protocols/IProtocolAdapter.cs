namespace EquipAI.EdgeGateway.Protocols;

/// <summary>
/// 协议适配器接口 — 所有工业协议（OPC UA、Modbus、MQTT 等）的统一抽象。
/// </summary>
public interface IProtocolAdapter : IAsyncDisposable
{
    /// <summary>
    /// 异步连接到目标设备。
    /// </summary>
    Task ConnectAsync(DeviceConfig config, CancellationToken ct);

    /// <summary>
    /// 按点位 ID 批量读取数据。
    /// </summary>
    Task<List<DataPoint>> ReadAsync(string[] pointIds, CancellationToken ct);

    /// <summary>
    /// 当前连接是否存活。
    /// </summary>
    bool IsConnected { get; }

    /// <summary>
    /// 协议类型标识（如 "OPCUA"、"ModbusTCP"、"MQTT"）。
    /// </summary>
    string ProtocolType { get; }
}
