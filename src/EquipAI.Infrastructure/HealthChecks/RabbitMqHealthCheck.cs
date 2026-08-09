using EquipAI.Infrastructure.Messaging;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace EquipAI.Infrastructure.HealthChecks;

/// <summary>
/// RabbitMQ 事件总线就绪检查；仅应挂载到 readiness 探针。
/// </summary>
public sealed class RabbitMqHealthCheck(IRabbitMqConnectionState connectionState) : IHealthCheck
{
    /// <inheritdoc />
    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(connectionState.IsReady
            ? HealthCheckResult.Healthy(connectionState.StatusDescription)
            : HealthCheckResult.Unhealthy(connectionState.StatusDescription));
}
