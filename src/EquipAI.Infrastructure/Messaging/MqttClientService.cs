using EquipAI.Infrastructure.Metrics;
using EquipAI.Core.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MQTTnet;
using MQTTnet.Client;
using System.Security.Authentication;

namespace EquipAI.Infrastructure.Messaging;

public class MqttOptions
{
    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 1883;
    public string ClientIdPrefix { get; set; } = "equipai-backend";
    public string TopicPattern { get; set; } = "factory/+/telemetry/+";
    public int ReconnectDelaySeconds { get; set; } = 30;

    /// <summary>MQTT 认证用户名（可选，Mosquitto 未开启认证时可为空）</summary>
    public string? Username { get; set; }

    /// <summary>MQTT 认证密码（可选）</summary>
    public string? Password { get; set; }

    /// <summary>是否通过 TLS 连接 MQTT Broker。</summary>
    public bool UseTls { get; set; }

    /// <summary>
    /// 是否允许不受信任的服务端证书。
    /// 仅用于开发环境临时连接自签名证书，生产环境必须为 false。
    /// </summary>
    public bool AllowUntrustedCertificates { get; set; }

    /// <summary>可选的自定义 CA 证书路径，未配置时使用系统信任链。</summary>
    public string? CaCertificatePath { get; set; }
}

/// <summary>
/// MQTT 客户端封装，管理连接、订阅和消息接收
/// </summary>
public class MqttClientService
{
    private readonly MqttOptions _options;
    private readonly ILogger<MqttClientService> _logger;
    private IMqttClient? _client;
    private MqttClientOptions? _clientOptions;

    /// <summary>
    /// 停机保护标志：为 true 时 HandleDisconnectedAsync 不再尝试重连。
    /// 由 GracefulShutdown 钩子在断开前设置，避免 SIGTERM 后触发无意义的重连尝试。
    /// </summary>
    private bool _isStopping;

    public event Func<string, string, byte[], Task>? OnMessageReceived;

    public MqttClientService(IOptions<MqttOptions> options, ILogger<MqttClientService> logger)
    {
        _options = options.Value;
        _logger = logger;

        // 检测是否使用了默认连接参数（可能配置节缺失），记录警告便于排查
        if (_options.Host == "localhost" && _options.Port == 1883)
        {
            _logger.LogWarning("MQTT 使用默认连接参数（localhost:1883），请确认配置节 Mqtt 是否已正确设置");
        }
    }

    public async Task ConnectAsync(CancellationToken cancellationToken = default)
    {
        var factory = new MqttFactory();
        _client = factory.CreateMqttClient();

        _clientOptions = BuildClientOptions();

        _client.DisconnectedAsync += HandleDisconnectedAsync;
        _client.ApplicationMessageReceivedAsync += HandleMessageAsync;

        await _client.ConnectAsync(_clientOptions, cancellationToken);

        BusinessMetrics.MqttConnected.Set(1);
        _logger.LogInformation("MQTT 已连接到 {Host}:{Port}", _options.Host, _options.Port);

        var subscribeOptions = new MqttClientSubscribeOptionsBuilder()
            .WithTopicFilter(f => f.WithTopic(_options.TopicPattern))
            .Build();

        await _client.SubscribeAsync(subscribeOptions, cancellationToken);
        _logger.LogInformation("MQTT 已订阅主题: {Topic}", _options.TopicPattern);
    }

    /// <summary>
    /// 构建 MQTT 客户端连接选项。
    /// </summary>
    private MqttClientOptions BuildClientOptions()
    {
        // 构建 MQTT 客户端选项，包含认证（如果配置了用户名密码）。
        var builder = new MqttClientOptionsBuilder()
            .WithTcpServer(_options.Host, _options.Port)
            .WithClientId($"{_options.ClientIdPrefix}-{Environment.MachineName}-{Guid.NewGuid():N}")
            .WithCleanStart(true);

        if (_options.UseTls)
        {
            builder.WithTlsOptions(tlsOptions =>
            {
                tlsOptions
                    .UseTls()
                    .WithSslProtocols(SslProtocols.Tls12 | SslProtocols.Tls13)
                    .WithAllowUntrustedCertificates(_options.AllowUntrustedCertificates)
                    .WithIgnoreCertificateChainErrors(_options.AllowUntrustedCertificates)
                    .WithIgnoreCertificateRevocationErrors(_options.AllowUntrustedCertificates);

                if (!string.IsNullOrWhiteSpace(_options.CaCertificatePath))
                {
                    tlsOptions.WithCertificateValidationHandler(context =>
                        MqttServerCertificateValidator.Validate(
                            context.Certificate,
                            context.SslPolicyErrors,
                            _options.CaCertificatePath));
                }
            });
        }

        // 如果配置了认证凭证，则添加用户名密码
        if (!string.IsNullOrEmpty(_options.Username))
        {
            builder.WithCredentials(_options.Username, _options.Password ?? string.Empty);
            _logger.LogInformation("MQTT 使用认证连接: 用户名={Username}", _options.Username);
        }
        else
        {
            _logger.LogWarning("MQTT 未配置认证凭证，使用匿名连接");
        }

        return builder.Build();
    }

    /// <summary>
    /// 测试辅助入口：返回实际使用的 MQTTnet 连接选项，不建立网络连接。
    /// </summary>
    internal MqttClientOptions BuildClientOptionsForTest() => BuildClientOptions();

    public async Task DisconnectAsync(CancellationToken cancellationToken = default)
    {
        // 停机保护：先置标志位，防止 Disconnect 事件回调触发重连
        _isStopping = true;

        if (_client?.IsConnected == true)
        {
            await _client.DisconnectAsync(cancellationToken: cancellationToken);
            BusinessMetrics.MqttConnected.Set(0);
            _logger.LogInformation("MQTT 已断开连接（优雅停机）");
        }
    }

    private async Task HandleMessageAsync(MqttApplicationMessageReceivedEventArgs e)
    {
        if (OnMessageReceived != null)
        {
            await OnMessageReceived(e.ApplicationMessage.Topic, string.Empty, e.ApplicationMessage.PayloadSegment.Array ?? []);
        }
    }

    private async Task HandleDisconnectedAsync(MqttClientDisconnectedEventArgs e)
    {
        // 停机保护：应用正在关闭时不再尝试重连
        if (_isStopping)
        {
            _logger.LogInformation("MQTT 连接断开（停机中），跳过重连");
            return;
        }

        if (e.ClientWasConnected)
        {
            _logger.LogWarning("MQTT 连接断开，开始尝试重连（指数退避，上限 5 分钟）");
        }
        else
        {
            _logger.LogWarning("MQTT 首次连接失败，开始尝试重连（指数退避，上限 5 分钟）");
        }

        // 关键修复：原实现只重连一次，broker 重启超过 30 秒+1 次连接超时即永久失联。
        // 改为循环重试 + 指数退避（30s → 60s → 120s → 240s → 300s 封顶），
        // 直到成功或应用停机。MQTTnet 3.x 推荐在 Disconnected 事件中循环重连。
        var attempt = 0;
        while (!_isStopping)
        {
            attempt++;
            // 指数退避：base * 2^(attempt-1)，封顶 5 分钟
            var delaySeconds = Math.Min(
                _options.ReconnectDelaySeconds * Math.Pow(2, attempt - 1),
                300);
            await Task.Delay(TimeSpan.FromSeconds(delaySeconds));

            // Delay 期间可能已收到停机信号，再次检查
            if (_isStopping) return;

            try
            {
                if (_client != null && _clientOptions != null)
                {
                    // 重连前确保旧连接已清理（MQTTnet 在某些异常状态下 IsConnected 可能不准）
                    if (_client.IsConnected)
                    {
                        try { await _client.DisconnectAsync(); } catch { /* 忽略清理失败 */ }
                    }

                    await _client.ConnectAsync(_clientOptions);
                    BusinessMetrics.MqttConnected.Set(1);
                    _logger.LogInformation("MQTT 第 {Attempt} 次重连成功", attempt);
                    return;  // 成功则退出循环
                }
            }
            catch (Exception ex)
            {
                BusinessMetrics.MqttConnected.Set(0);
                _logger.LogError(ex, "MQTT 第 {Attempt} 次重连失败，{Delay}s 后重试", attempt, (int)delaySeconds);
                // 继续循环，直到成功或停机
            }
        }
    }
}
