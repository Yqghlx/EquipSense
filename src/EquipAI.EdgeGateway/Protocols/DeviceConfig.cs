namespace EquipAI.EdgeGateway.Protocols;

/// <summary>
/// 设备连接配置 — 描述如何连接一台物理设备。
/// </summary>
/// <param name="DeviceId">设备唯一标识。</param>
/// <param name="Protocol">协议类型（如 "OPCUA"、"ModbusTCP"）。</param>
/// <param name="ConnectionString">连接字符串（协议相关格式）。</param>
/// <param name="DataPoints">需要采集的点位映射：key=点位ID，value=指标名称。</param>
/// <param name="PollIntervalMs">轮询间隔（毫秒），默认 3000ms。</param>
public record DeviceConfig(
    string DeviceId,
    string Protocol,
    string ConnectionString,
    Dictionary<string, string> DataPoints,
    int PollIntervalMs = 3000)
{
    /// <summary>
    /// 设备类型（可选），用于关联设备类型模板。
    /// </summary>
    public string? DeviceType { get; init; }
}
