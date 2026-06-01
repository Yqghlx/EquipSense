namespace EquipAI.EdgeGateway.Protocols;

/// <summary>
/// 标准化数据点 — 从设备采集的单个指标值。
/// </summary>
/// <param name="PointId">点位标识（对应 DeviceConfig.DataPoints 的 key）。</param>
/// <param name="Metric">指标名称（如 "temperature"、"pressure"）。</param>
/// <param name="Value">采集值。</param>
/// <param name="Quality">数据质量标识（如 "Good"、"Bad"、"Uncertain"）。</param>
/// <param name="Timestamp">采集时间戳（UTC）。</param>
public record DataPoint(
    string PointId,
    string Metric,
    double Value,
    string Quality,
    DateTime Timestamp);
