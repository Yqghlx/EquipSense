using EquipAI.Application.Hosting;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Services;

/// <summary>
/// 网关心跳监控后台服务
///
/// 定期检查已注册网关的 LastHeartbeatAt，将超时的网关标记为 offline。
/// </summary>
public class GatewayHeartbeatMonitor : LockedTimerService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IConfiguration _configuration;

    public GatewayHeartbeatMonitor(
        IServiceProvider serviceProvider,
        IConfiguration configuration,
        IDistributedLockProvider lockProvider,
        ILogger<GatewayHeartbeatMonitor> logger)
        : base(lockProvider, logger, lockResource: "gateway-heartbeat-monitor", lockExpiry: TimeSpan.FromMinutes(5))
    {
        _serviceProvider = serviceProvider;
        _configuration = configuration;
    }

    /// <summary>每 30s 检查一次网关心跳。</summary>
    protected override TimeSpan DefaultInterval => TimeSpan.FromSeconds(30);

    /// <summary>基类回调：持锁后执行心跳检查。委托给 <see cref="CheckHeartbeatsAsync"/> 以便单元测试直接验证。</summary>
    protected override Task ExecuteWorkAsync(CancellationToken ct) => CheckHeartbeatsAsync(ct);

    /// <summary>
    /// 检查所有网关的心跳状态。public 便于单元测试直接验证（跳过 ExecuteAsync 的 Task.Delay 调度）。
    /// </summary>
    public async Task CheckHeartbeatsAsync(CancellationToken ct = default)
    {
        var timeoutSeconds = _configuration.GetValue("Gateway:HeartbeatTimeoutSeconds", 90);

        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        // 通过 scope 解析 Scoped 通知服务，避免 Singleton HostedService 直接构造注入 ISignalRNotificationService
        // 导致的 captive dependency（Scoped 服务被 Singleton 捕获，跨请求共享错误生命周期）。
        var signalR = scope.ServiceProvider.GetRequiredService<ISignalRNotificationService>();

        var threshold = DateTime.UtcNow.AddSeconds(-timeoutSeconds);

        // 查找所有超时的在线网关
        var expiredGateways = await dbContext.UnfilteredSet<Core.Entities.Gateway>()
            .Where(g => g.Status == "online" && g.LastHeartbeatAt < threshold)
            .ToListAsync(ct);

        if (expiredGateways.Count == 0) return;

        var expiredGatewayIds = expiredGateways.Select(g => g.Id).ToList();

        // 更新条件必须重复 Status + LastHeartbeatAt：网关可能在上面的快照查询之后刚好收到心跳，
        // 若只按 ID 更新，会把已经恢复通信的网关错误改成 offline，造成状态和通知双重误报。
        var affected = await dbContext.UnfilteredSet<Core.Entities.Gateway>()
            .Where(g => expiredGatewayIds.Contains(g.Id)
                     && g.Status == "online"
                     && g.LastHeartbeatAt < threshold)
            .ExecuteUpdateAsync(s => s.SetProperty(g => g.Status, "offline"), ct);

        // 只为实际仍处于超时 offline 状态的网关发送通知；查询与更新之间恢复心跳的网关会被排除。
        var affectedGateways = await dbContext.UnfilteredSet<Core.Entities.Gateway>()
            .Where(g => expiredGatewayIds.Contains(g.Id)
                     && g.Status == "offline"
                     && g.LastHeartbeatAt < threshold)
            .ToListAsync(ct);

        foreach (var gateway in affectedGateways)
        {
            Logger.LogInformation("网关 {GatewayId}（{Name}）心跳超时，标记为 offline", gateway.GatewayId, gateway.Name);

            // 推送网关离线通知（P0 工业：网关是数据采集入口，离线=该网关下设备数据断，运维需立即知晓）。
            // try/catch 隔离——通知失败不得影响离线标记（离线状态是数据正确性，通知是可用性增强）。
            try
            {
                await signalR.SendGatewayOfflineAsync(gateway.TenantId, gateway.Id, gateway.GatewayId, gateway.Name);
            }
            catch (Exception ex)
            {
                Logger.LogWarning(ex, "网关离线通知推送失败，不影响离线标记: GatewayId={GatewayId}", gateway.GatewayId);
            }
        }

        Logger.LogInformation("本轮已将 {Count} 个超时网关标记为 offline", affected);
    }
}
