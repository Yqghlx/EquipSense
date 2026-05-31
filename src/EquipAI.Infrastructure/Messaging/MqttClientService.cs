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

    public event Func<string, string, byte[], Task>? OnMessageReceived;

    public MqttClientService(IOptions<MqttOptions> options, ILogger<MqttClientService> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task ConnectAsync(CancellationToken cancellationToken = default)
    {
        var factory = new MqttFactory();
        _client = factory.CreateMqttClient();

        _clientOptions = new MqttClientOptionsBuilder()
            .WithTcpServer(_options.Host, _options.Port)
            .WithClientId($"{_options.ClientIdPrefix}-{Environment.MachineName}-{Guid.NewGuid():N}")
            .WithCleanStart(true)
            .Build();

        _client.DisconnectedAsync += HandleDisconnectedAsync;
        _client.ApplicationMessageReceivedAsync += HandleMessageAsync;

        await _client.ConnectAsync(_clientOptions, cancellationToken);

        _logger.LogInformation("MQTT 已连接到 {Host}:{Port}", _options.Host, _options.Port);

        var subscribeOptions = new MqttClientSubscribeOptionsBuilder()
            .WithTopicFilter(f => f.WithTopic(_options.TopicPattern))
            .Build();

        await _client.SubscribeAsync(subscribeOptions, cancellationToken);
        _logger.LogInformation("MQTT 已订阅主题: {Topic}", _options.TopicPattern);
    }

    public async Task DisconnectAsync(CancellationToken cancellationToken = default)
    {
        if (_client?.IsConnected == true)
        {
            await _client.DisconnectAsync(cancellationToken: cancellationToken);
            _logger.LogInformation("MQTT 已断开连接");
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
        if (e.ClientWasConnected)
        {
            _logger.LogWarning("MQTT 连接断开，{Seconds} 秒后尝试重连", _options.ReconnectDelaySeconds);
        }

        await Task.Delay(TimeSpan.FromSeconds(_options.ReconnectDelaySeconds));

        try
        {
            if (_client != null && _clientOptions != null)
            {
                await _client.ConnectAsync(_clientOptions);
                _logger.LogInformation("MQTT 重连成功");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "MQTT 重连失败");
        }
    }
}
