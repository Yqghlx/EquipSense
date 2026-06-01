using System.Text.Json;
using EquipAI.EdgeGateway.Protocols;
using Microsoft.Extensions.Logging;
using MQTTnet;
using MQTTnet.Client;
using MQTTnet.Protocol;

namespace EquipAI.EdgeGateway.Pipeline;

/// <summary>
/// 云端上传器，通过 MQTT 将标准化遥测数据发布到后端
/// MQTT 主题格式：factory/{tenantId}/telemetry/{deviceId}
/// </summary>
public class CloudUploader : IAsyncDisposable
{
    private readonly ILogger<CloudUploader> _logger;
    private readonly GatewayOptions _options;
    private readonly MqttFactory _mqttFactory = new();
    private IMqttClient? _mqttClient;
    private bool _disposed;

    public CloudUploader(ILogger<CloudUploader> logger, GatewayOptions options)
    {
        _logger = logger;
        _options = options;
    }

    /// <summary>
    /// 连接到 MQTT Broker
    /// </summary>
    public async Task ConnectAsync(CancellationToken ct)
    {
        _mqttClient = _mqttFactory.CreateMqttClient();

        var parts = _options.MqttBroker.Split(':');
        var host = parts[0];
        var port = parts.Length > 1 ? int.Parse(parts[1]) : 1883;

        var builder = new MqttClientOptionsBuilder()
            .WithTcpServer(host, port)
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
        if (_mqttClient is null || !_mqttClient.IsConnected)
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

        if (_mqttClient is not null)
        {
            if (_mqttClient.IsConnected)
            {
                try { await _mqttClient.DisconnectAsync(); } catch { }
            }
            _mqttClient.Dispose();
        }

        GC.SuppressFinalize(this);
    }
}
