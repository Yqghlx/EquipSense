using System.Text.Json;
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace EquipAI.Infrastructure.Messaging;

/// <summary>
/// MQTT 消息解析和处理
/// 主题格式：factory/{tenantId}/telemetry/{deviceId}
/// </summary>
public class MqttMessageHandler
{
    private readonly ITelemetryService _telemetryService;
    private readonly ILogger<MqttMessageHandler> _logger;

    public MqttMessageHandler(ITelemetryService telemetryService, ILogger<MqttMessageHandler> logger)
    {
        _telemetryService = telemetryService;
        _logger = logger;
    }

    public async Task HandleAsync(string topic, byte[] payload)
    {
        try
        {
            var parts = topic.Split('/');
            if (parts.Length != 4 || parts[0] != "factory" || parts[2] != "telemetry")
            {
                _logger.LogWarning("忽略无效主题格式: {Topic}", topic);
                return;
            }

            if (!Guid.TryParse(parts[1], out var tenantId) || !Guid.TryParse(parts[3], out var deviceId))
            {
                _logger.LogWarning("忽略无效租户/设备 ID 的主题: {Topic}", topic);
                return;
            }

            var json = JsonSerializer.Deserialize<JsonElement>(payload);
            if (json.ValueKind != JsonValueKind.Object)
            {
                _logger.LogWarning("忽略非 JSON 对象的消息: {Topic}", topic);
                return;
            }

            if (!json.TryGetProperty("timestamp", out var timestampEl) ||
                !json.TryGetProperty("metrics", out var metricsEl))
            {
                _logger.LogWarning("消息缺少必填字段（timestamp/metrics）: {Topic}", topic);
                return;
            }

            var timestamp = timestampEl.ValueKind == JsonValueKind.String
                ? DateTime.Parse(timestampEl.GetString()!)
                : DateTime.UtcNow;

            var quality = json.TryGetProperty("quality", out var qEl) ? qEl.GetString() ?? "good" : "good";

            if (metricsEl.ValueKind == JsonValueKind.Object)
            {
                foreach (var metric in metricsEl.EnumerateObject())
                {
                    if (metric.Value.ValueKind == JsonValueKind.Number)
                    {
                        await _telemetryService.EnqueueAsync(
                            tenantId, deviceId,
                            metric.Name, metric.Value.GetDouble(),
                            timestamp, quality, "mqtt");
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "处理 MQTT 消息失败: {Topic}", topic);
        }
    }
}
