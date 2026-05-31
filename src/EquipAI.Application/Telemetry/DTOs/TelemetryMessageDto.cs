using System.Text.Json.Serialization;

namespace EquipAI.Application.Telemetry.DTOs;

/// <summary>
/// HTTP 遥测上报请求
/// </summary>
public class TelemetryUploadRequest
{
    /// <summary>
    /// 设备编码或设备 ID
    /// </summary>
    [JsonPropertyName("deviceId")]
    public string DeviceId { get; set; } = string.Empty;

    /// <summary>
    /// 指标数据（指标名 → 值）
    /// </summary>
    [JsonPropertyName("metrics")]
    public Dictionary<string, double> Metrics { get; set; } = new();

    /// <summary>
    /// 数据时间戳
    /// </summary>
    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 数据质量标记
    /// </summary>
    [JsonPropertyName("quality")]
    public string Quality { get; set; } = "good";
}
