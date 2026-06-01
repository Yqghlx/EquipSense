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
