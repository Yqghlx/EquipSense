using System.Text.Json;
using System.Security.Authentication;
using EquipAI.Core.Security;
using EquipAI.EdgeGateway.Persistence;
using EquipAI.EdgeGateway.Protocols;
using Microsoft.Extensions.Logging;
using MQTTnet;
using MQTTnet.Client;
using MQTTnet.Protocol;

namespace EquipAI.EdgeGateway.Pipeline;

/// <summary>
/// 云端上传器，通过 MQTT 将标准化遥测数据发布到后端。
/// 支持断网检测和离线回放——在线时直接上传并回放积压数据，断网时缓冲到本地存储。
/// MQTT 主题格式：factory/{tenantId}/telemetry/{deviceId}
/// </summary>
public class CloudUploader : IAsyncDisposable
{
    private readonly ILogger<CloudUploader> _logger;
    private readonly GatewayOptions _options;
    private readonly SqliteBufferStore? _offlineStore;
    private readonly LocalBuffer? _localBuffer;
    private readonly GatewayMetrics? _metrics;
    private readonly MqttFactory _mqttFactory = new();
    private IMqttClient? _mqttClient;
    private bool _disposed;

    /// <summary>
    /// 当前是否在线（MQTT 连接正常）
    /// </summary>
    public bool IsOnline => _mqttClient?.IsConnected == true;

    /// <summary>
    /// 当前网关所属的租户 ID（供外部构建 MQTT 主题使用）
    /// </summary>
    public string TenantId => _options.TenantId;

    /// <summary>
    /// 初始化云端上传器
    /// </summary>
    /// <param name="logger">日志记录器</param>
    /// <param name="options">网关配置选项</param>
    /// <param name="offlineStore">可选的 SQLite 离线缓冲存储</param>
    /// <param name="localBuffer">可选的内存本地缓冲区</param>
    public CloudUploader(
        ILogger<CloudUploader> logger,
        GatewayOptions options,
        SqliteBufferStore? offlineStore = null,
        LocalBuffer? localBuffer = null,
        GatewayMetrics? metrics = null)
    {
        _logger = logger;
        _options = options;
        _offlineStore = offlineStore;
        _localBuffer = localBuffer;
        _metrics = metrics;
    }

    /// <summary>
    /// 连接到 MQTT Broker
    /// </summary>
    public async Task ConnectAsync(CancellationToken ct)
    {
        _mqttClient = _mqttFactory.CreateMqttClient();

        await _mqttClient.ConnectAsync(BuildMqttClientOptions(), ct);
        _logger.LogInformation("MQTT 已连接: {Broker}", _options.MqttBroker);
    }

    /// <summary>
    /// 构建 MQTT 发布端连接选项。
    /// </summary>
    private MqttClientOptions BuildMqttClientOptions()
    {
        var parts = _options.MqttBroker.Split(':', 2, StringSplitOptions.TrimEntries);
        var host = parts[0];
        var port = parts.Length > 1 && int.TryParse(parts[1], out var configuredPort)
            ? configuredPort
            : (_options.MqttUseTls ? 8883 : 1883);

        var builder = new MqttClientOptionsBuilder()
            .WithTcpServer(host, port)
            .WithClientId($"edge-gateway-{_options.Id}")
            .WithCleanSession(true);

        if (_options.MqttUseTls)
        {
            builder.WithTlsOptions(tlsOptions =>
            {
                tlsOptions
                    .UseTls()
                    .WithSslProtocols(SslProtocols.Tls12 | SslProtocols.Tls13)
                    .WithAllowUntrustedCertificates(_options.MqttAllowUntrustedCertificates)
                    .WithIgnoreCertificateChainErrors(_options.MqttAllowUntrustedCertificates)
                    .WithIgnoreCertificateRevocationErrors(_options.MqttAllowUntrustedCertificates);

                if (!string.IsNullOrWhiteSpace(_options.MqttCaCertificatePath))
                {
                    tlsOptions.WithCertificateValidationHandler(context =>
                        MqttServerCertificateValidator.Validate(
                            context.Certificate,
                            context.SslPolicyErrors,
                            _options.MqttCaCertificatePath));
                }
            });
        }

        if (!string.IsNullOrEmpty(_options.MqttUsername))
        {
            builder.WithCredentials(_options.MqttUsername, _options.MqttPassword ?? string.Empty);
        }

        return builder.Build();
    }

    /// <summary>
    /// 测试辅助入口：返回实际使用的 MQTTnet 连接选项，不建立网络连接。
    /// </summary>
    internal MqttClientOptions BuildMqttClientOptionsForTest() => BuildMqttClientOptions();

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
        _metrics?.Increment(GatewayMetrics.Names.UploadSuccessTotal);
        _logger.LogDebug("已上传: {DeviceId} → {Topic}, 指标数={Count}",
            message.DeviceId, topic, message.Metrics.Count);
    }

    /// <summary>
    /// 带断网保护的上传方法
    /// 在线时直接上传并回放离线积压数据；离线或上传失败时缓冲到本地
    /// </summary>
    /// <param name="topic">MQTT 主题</param>
    /// <param name="payload">消息负载</param>
    /// <param name="ct">取消令牌</param>
    public async Task UploadWithFallbackAsync(string topic, byte[] payload, CancellationToken ct)
    {
        if (IsOnline)
        {
            try
            {
                var mqttMessage = new MqttApplicationMessageBuilder()
                    .WithTopic(topic)
                    .WithPayload(payload)
                    .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce)
                    .Build();
                await _mqttClient!.PublishAsync(mqttMessage, ct);
                _logger.LogDebug("已上传: {Topic}", topic);
                await ReplayOfflineDataAsync(ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "上传失败，转入离线缓冲: {Topic}", topic);
                _metrics?.Increment(GatewayMetrics.Names.UploadFailTotal);
                await BufferOfflineAsync(topic, payload);
            }
        }
        else
        {
            await BufferOfflineAsync(topic, payload);
        }
    }

    /// <summary>
    /// 将消息缓冲到离线存储
    /// 优先写入内存 LocalBuffer，无内存缓冲时直接写 SQLite
    /// </summary>
    private async Task BufferOfflineAsync(string topic, byte[] payload)
    {
        if (_localBuffer is not null)
            await _localBuffer.EnqueueAsync(topic, payload);
        else if (_offlineStore is not null)
            await _offlineStore.StoreAsync(topic, payload);
    }

    /// <summary>
    /// 回放离线缓冲数据
    /// 在线时从 SQLite 取出积压消息逐条发送，发送成功后标记已发送
    /// 遇到发送失败或断网则停止回放，等待下次恢复后继续
    /// </summary>
    /// <param name="ct">取消令牌</param>
    public async Task ReplayOfflineDataAsync(CancellationToken ct)
    {
        if (_offlineStore is null || !IsOnline) return;

        var pending = await _offlineStore.GetPendingAsync(100);
        foreach (var record in pending)
        {
            if (!IsOnline || ct.IsCancellationRequested) break;
            try
            {
                var mqttMessage = new MqttApplicationMessageBuilder()
                    .WithTopic(record.Topic)
                    .WithPayload(record.Payload)
                    .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce)
                    .Build();
                await _mqttClient!.PublishAsync(mqttMessage, ct);
                await _offlineStore.MarkAsSentAsync(record.Id);
                _metrics?.Increment(GatewayMetrics.Names.ReplayMessagesTotal);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "回放离线数据失败，停止回放");
                break;
            }
        }
        await _offlineStore.CleanupOldAsync();
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
