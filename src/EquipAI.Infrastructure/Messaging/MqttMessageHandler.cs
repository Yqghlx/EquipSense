using System.Globalization;
using System.Text.Json;
using EquipAI.Core.Extensions;
using EquipAI.Core.Interfaces;
using EquipAI.Core.Validation;
using EquipAI.Infrastructure.Metrics;
using Microsoft.Extensions.Logging;

namespace EquipAI.Infrastructure.Messaging;

/// <summary>
/// MQTT 消息解析和处理
/// 主题格式：factory/{tenantId}/telemetry/{deviceId}
/// </summary>
public class MqttMessageHandler
{
    /// <summary>将校验通过的遥测指标加入异步批量写入队列。</summary>
    private readonly ITelemetryService _telemetryService;

    /// <summary>记录无效 MQTT 消息和处理异常的日志记录器。</summary>
    private readonly ILogger<MqttMessageHandler> _logger;

    /// <summary>
    /// 初始化 MQTT 消息处理器。
    /// </summary>
    /// <param name="telemetryService">遥测批量写入服务。</param>
    /// <param name="logger">消息处理日志记录器。</param>
    public MqttMessageHandler(ITelemetryService telemetryService, ILogger<MqttMessageHandler> logger)
    {
        _telemetryService = telemetryService;
        _logger = logger;
    }

    /// <summary>
    /// 解析并校验一条 MQTT 遥测消息，然后按指标拆分入队。
    /// </summary>
    /// <param name="topic">MQTT 主题，格式为 factory/{tenantId}/telemetry/{deviceId}。</param>
    /// <param name="payload">UTF-8 JSON 消息体。</param>
    public async Task HandleAsync(string topic, byte[] payload)
    {
        try
        {
            BusinessMetrics.MqttMessagesReceived.Inc();

            if (payload is null || payload.Length == 0)
            {
                _logger.LogWarning("忽略空 MQTT 消息: {Topic}", topic);
                return;
            }

            // 先按字节数拒绝，再反序列化，避免恶意消息在 JSON 解析阶段占用过多内存。
            if (payload.Length > TelemetryInputValidator.MaxPayloadBytes)
            {
                _logger.LogWarning(
                    "忽略超大 MQTT 消息: {Topic}, Bytes={Bytes}, Limit={Limit}",
                    topic, payload.Length, TelemetryInputValidator.MaxPayloadBytes);
                return;
            }

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

            if (timestampEl.ValueKind != JsonValueKind.String
                || !DateTime.TryParse(
                    timestampEl.GetString(),
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal,
                    out var timestamp)
                || TelemetryInputValidator.ValidateTimestamp(timestamp) is not null)
            {
                _logger.LogWarning("忽略时间戳无效的 MQTT 消息: {Topic}", topic);
                return;
            }

            timestamp = timestamp.ToSafeUtc();

            var quality = "good";
            if (json.TryGetProperty("quality", out var qEl))
            {
                if (qEl.ValueKind != JsonValueKind.String)
                {
                    _logger.LogWarning("忽略质量字段类型无效的 MQTT 消息: {Topic}", topic);
                    return;
                }

                quality = qEl.GetString() ?? string.Empty;
            }

            if (TelemetryInputValidator.ValidateQuality(quality) is not null)
            {
                _logger.LogWarning("忽略质量字段无效的 MQTT 消息: {Topic}", topic);
                return;
            }

            quality = quality.Trim();

            if (metricsEl.ValueKind != JsonValueKind.Object)
            {
                _logger.LogWarning("忽略指标字段类型无效的 MQTT 消息: {Topic}", topic);
                return;
            }

            var metricCount = metricsEl.EnumerateObject().Count();
            if (metricCount == 0 || metricCount > TelemetryInputValidator.MaxMetricCount)
            {
                _logger.LogWarning(
                    "忽略指标数量无效的 MQTT 消息: {Topic}, Count={Count}, Limit={Limit}",
                    topic, metricCount, TelemetryInputValidator.MaxMetricCount);
                return;
            }

            var persistenceTasks = new List<Task>(metricCount);
            var acceptedCount = 0;
            foreach (var metric in metricsEl.EnumerateObject())
            {
                if (metric.Value.ValueKind != JsonValueKind.Number
                    || !metric.Value.TryGetDouble(out var value))
                {
                    _logger.LogWarning("忽略非数字遥测指标: {Topic}, Metric={Metric}", topic, metric.Name);
                    continue;
                }

                if (TelemetryInputValidator.ValidateMetric(metric.Name, value) is not null)
                {
                    _logger.LogWarning("忽略非法遥测指标: {Topic}, Metric={Metric}", topic, metric.Name);
                    continue;
                }

                // MQTT 只有在所属批次完成数据库持久化后才返回；否则 MqttClientService 会标记
                // ProcessingFailed，避免 Broker 收到成功确认后把未落库遥测永久丢失。
                persistenceTasks.Add(_telemetryService.EnqueueAndWaitForPersistenceAsync(
                    tenantId, deviceId,
                    metric.Name, value,
                    timestamp, quality, "mqtt"));
                acceptedCount++;
            }

            await Task.WhenAll(persistenceTasks);
            for (var index = 0; index < acceptedCount; index++)
            {
                BusinessMetrics.TelemetryReceived
                    .WithLabels(tenantId.ToString(), deviceId.ToString())
                    .Inc();
            }

            if (acceptedCount == 0)
                _logger.LogWarning("MQTT 消息没有可接受的数字指标: {Topic}", topic);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "忽略无法解析的 MQTT JSON 消息: {Topic}", topic);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "处理 MQTT 消息失败: {Topic}", topic);
            // 基础设施/持久化失败不能被吞成“成功处理”；由 MqttClientService 负责把
            // 失败状态映射到 MQTT ACK，触发 Broker 按 QoS 语义重投。
            throw;
        }
    }
}
