using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EquipAI.Infrastructure.Messaging;

/// <summary>
/// MQTT 后台订阅服务，随应用启动自动连接并接收消息
/// </summary>
public class MqttBackgroundService : BackgroundService
{
    private readonly MqttClientService _mqttClient;
    private readonly MqttMessageHandler _messageHandler;
    private readonly ILogger<MqttBackgroundService> _logger;

    public MqttBackgroundService(
        MqttClientService mqttClient,
        MqttMessageHandler messageHandler,
        ILogger<MqttBackgroundService> logger)
    {
        _mqttClient = mqttClient;
        _messageHandler = messageHandler;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("MQTT 后台服务启动中...");

        _mqttClient.OnMessageReceived += async (topic, _, payload) =>
        {
            await _messageHandler.HandleAsync(topic, payload);
        };

        // 延迟 2 秒启动，等待其他服务初始化完成
        await Task.Delay(2000, stoppingToken);

        try
        {
            await _mqttClient.ConnectAsync(stoppingToken);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // 宿主主动停机时，连接取消是正常生命周期事件，不应被记录为 MQTT 故障。
            return;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "MQTT 初始连接失败，后台服务将依赖自动重连机制");
        }

        await Task.Delay(Timeout.Infinite, stoppingToken);
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("MQTT 后台服务停止中...");
        await _mqttClient.DisconnectAsync(cancellationToken);
        await base.StopAsync(cancellationToken);
    }
}
