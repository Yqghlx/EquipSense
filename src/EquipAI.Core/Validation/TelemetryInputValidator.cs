namespace EquipAI.Core.Validation;

/// <summary>
/// 遥测接入边界校验。
///
/// HTTP 和 MQTT 是两条不同的入口，但最终都会进入同一个异步遥测队列；
/// 校验规则必须在 Core 共享，避免某个入口绕过数据库字段和队列容量边界。
/// </summary>
public static class TelemetryInputValidator
{
    /// <summary>单条消息允许包含的最大指标数量，与遥测服务单批处理上限保持一致。</summary>
    public const int MaxMetricCount = 100;

    /// <summary>指标名称的最大字符数，与 device_telemetry.metric 列约束保持一致。</summary>
    public const int MaxMetricNameLength = 100;

    /// <summary>设备编码或设备 ID 的最大字符数，与 devices.device_code 列约束保持一致。</summary>
    public const int MaxDeviceIdentifierLength = 50;

    /// <summary>数据质量标记的最大字符数，与 device_telemetry.quality 列约束保持一致。</summary>
    public const int MaxQualityLength = 20;

    /// <summary>HTTP/MQTT 单条遥测消息的最大字节数，限制解析前的内存消耗。</summary>
    public const int MaxPayloadBytes = 256 * 1024;

    /// <summary>
    /// 校验 HTTP 遥测上报请求。
    /// </summary>
    /// <param name="deviceIdentifier">设备编码或设备 ID。</param>
    /// <param name="metrics">指标数据。</param>
    /// <param name="timestamp">数据时间戳。</param>
    /// <param name="quality">数据质量标记。</param>
    /// <returns>校验失败原因；校验通过时返回 <see langword="null"/>。</returns>
    public static string? ValidateUpload(
        string? deviceIdentifier,
        IReadOnlyDictionary<string, double>? metrics,
        DateTime timestamp,
        string? quality)
    {
        var deviceError = ValidateDeviceIdentifier(deviceIdentifier);
        if (deviceError is not null)
            return deviceError;

        var metricsError = ValidateMetrics(metrics);
        if (metricsError is not null)
            return metricsError;

        var timestampError = ValidateTimestamp(timestamp);
        if (timestampError is not null)
            return timestampError;

        return ValidateQuality(quality);
    }

    /// <summary>
    /// 校验设备标识。
    /// </summary>
    /// <param name="deviceIdentifier">设备编码或设备 ID。</param>
    /// <returns>校验失败原因；校验通过时返回 <see langword="null"/>。</returns>
    public static string? ValidateDeviceIdentifier(string? deviceIdentifier)
    {
        var normalized = deviceIdentifier?.Trim();
        return string.IsNullOrWhiteSpace(normalized)
               || normalized.Length > MaxDeviceIdentifierLength
            ? $"设备标识不能为空且不能超过 {MaxDeviceIdentifierLength} 个字符"
            : null;
    }

    /// <summary>
    /// 校验指标字典及其中的每个指标值。
    /// </summary>
    /// <param name="metrics">指标数据。</param>
    /// <returns>校验失败原因；校验通过时返回 <see langword="null"/>。</returns>
    public static string? ValidateMetrics(IReadOnlyDictionary<string, double>? metrics)
    {
        if (metrics is null || metrics.Count == 0)
            return "指标不能为空";

        if (metrics.Count > MaxMetricCount)
            return $"指标数量不能超过 {MaxMetricCount} 个";

        foreach (var (metric, value) in metrics)
        {
            var metricError = ValidateMetric(metric, value);
            if (metricError is not null)
                return metricError;
        }

        return null;
    }

    /// <summary>
    /// 校验单个指标名称和值。
    /// </summary>
    /// <param name="metric">指标名称。</param>
    /// <param name="value">指标值。</param>
    /// <returns>校验失败原因；校验通过时返回 <see langword="null"/>。</returns>
    public static string? ValidateMetric(string? metric, double value)
    {
        if (string.IsNullOrWhiteSpace(metric)
            || metric.Length > MaxMetricNameLength
            || !string.Equals(metric, metric.Trim(), StringComparison.Ordinal)
            || metric.Any(char.IsControl))
        {
            return $"指标名不能为空、不能包含控制字符或首尾空白，且不能超过 {MaxMetricNameLength} 个字符";
        }

        return double.IsFinite(value)
            ? null
            : "指标值必须是有限数字";
    }

    /// <summary>
    /// 校验数据质量标记。
    /// </summary>
    /// <param name="quality">数据质量标记。</param>
    /// <returns>校验失败原因；校验通过时返回 <see langword="null"/>。</returns>
    public static string? ValidateQuality(string? quality)
    {
        var normalized = quality?.Trim();
        return string.IsNullOrWhiteSpace(normalized)
               || normalized.Length > MaxQualityLength
               || normalized.Any(char.IsControl)
            ? $"数据质量不能为空、不能包含控制字符且不能超过 {MaxQualityLength} 个字符"
            : null;
    }

    /// <summary>
    /// 校验时间戳是否为可入库的有效时间。
    /// 不限制时间的新旧，允许边缘网关完成断网缓存后补传历史数据。
    /// </summary>
    /// <param name="timestamp">数据时间戳。</param>
    /// <returns>校验失败原因；校验通过时返回 <see langword="null"/>。</returns>
    public static string? ValidateTimestamp(DateTime timestamp)
        => timestamp == default ? "时间戳必须是有效时间" : null;
}
