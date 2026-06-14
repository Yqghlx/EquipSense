using EquipAI.Infrastructure.Metrics;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MQTTnet;
using MQTTnet.Client;

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

        // 构建 MQTT 客户端选项，包含认证（如果配置了用户名密码）
        var builder = new MqttClientOptionsBuilder()
            .WithTcpServer(_options.Host, _options.Port)
            .WithClientId($"{_options.ClientIdPrefix}-{Environment.MachineName}-{Guid.NewGuid():N}")
            .WithCleanStart(true);

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

        _clientOptions = builder.Build();

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
            _logger.LogWarning("MQTT 连接断开，{Seconds} 秒后尝试重连", _options.ReconnectDelaySeconds);
        }

        await Task.Delay(TimeSpan.FromSeconds(_options.ReconnectDelaySeconds));

        // Delay 期间可能已收到停机信号，再次检查
        if (_isStopping) return;

        try
        {
            if (_client != null && _clientOptions != null)
            {
                await _client.ConnectAsync(_clientOptions);
                BusinessMetrics.MqttConnected.Set(1);
                _logger.LogInformation("MQTT 重连成功");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "MQTT 重连失败");
        }
    }
}
