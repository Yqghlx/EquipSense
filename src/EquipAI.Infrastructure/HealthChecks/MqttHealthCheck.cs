using EquipAI.Infrastructure.Messaging;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace EquipAI.Infrastructure.HealthChecks;

/// <summary>
/// MQTT 实际消费链路健康检查。
/// 仅检查后台客户端已经完成连接和遥测主题订阅，避免 Broker 端口可达但后端实际收不到数据时错误报告就绪。
/// </summary>
public class MqttHealthCheck : IHealthCheck
{
    private readonly MqttClientService _mqttClient;

    /// <summary>
    /// 初始化 MQTT 健康检查。
    /// </summary>
    /// <param name="mqttClient">共享的 MQTT 客户端服务。</param>
    public MqttHealthCheck(MqttClientService mqttClient)
    {
        _mqttClient = mqttClient ?? throw new ArgumentNullException(nameof(mqttClient));
    }

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken ct = default)
    {
        var result = _mqttClient.IsConnected
            ? HealthCheckResult.Healthy("MQTT 客户端已连接并完成遥测主题订阅")
            : HealthCheckResult.Unhealthy("MQTT 客户端未连接或尚未完成遥测主题订阅");
        return Task.FromResult(result);
    }
}
