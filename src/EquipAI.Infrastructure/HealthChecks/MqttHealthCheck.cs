using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace EquipAI.Infrastructure.HealthChecks;

/// <summary>
/// MQTT 代理连通性健康检查
/// 通过尝试建立 TCP 连接验证 MQTT 代理可达性
/// </summary>
public class MqttHealthCheck : IHealthCheck
{
    private readonly string _host;
    private readonly int _port;

    public MqttHealthCheck(IConfiguration configuration)
    {
        _host = configuration["Mqtt:Host"] ?? "localhost";
        _port = int.TryParse(configuration["Mqtt:Port"], out var port) ? port : 1883;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken ct = default)
    {
        try
        {
            using var tcpClient = new System.Net.Sockets.TcpClient();
            await tcpClient.ConnectAsync(_host, _port, ct);

            return tcpClient.Connected
                ? HealthCheckResult.Healthy($"MQTT 代理 {_host}:{_port} 连接正常")
                : HealthCheckResult.Degraded($"MQTT 代理 {_host}:{_port} 未连接");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy($"MQTT 代理 {_host}:{_port} 不可达", ex);
        }
    }
}
