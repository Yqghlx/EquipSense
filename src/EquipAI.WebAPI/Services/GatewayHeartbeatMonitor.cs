using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Services;

/// <summary>
/// 网关心跳监控后台服务
///
/// 定期检查已注册网关的 LastHeartbeatAt，将超时的网关标记为 offline。
/// </summary>
public class GatewayHeartbeatMonitor : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GatewayHeartbeatMonitor> _logger;

    public GatewayHeartbeatMonitor(
        IServiceProvider serviceProvider,
        IConfiguration configuration,
        ILogger<GatewayHeartbeatMonitor> logger)
    {
        _serviceProvider = serviceProvider;
        _configuration = configuration;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("网关心跳监控服务已启动");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckHeartbeatsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "网关心跳检查异常");
            }

            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }

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

        foreach (var gateway in expiredGateways)
        {
            gateway.Status = "offline";
            _logger.LogInformation("网关 {GatewayId}（{Name}）心跳超时，标记为 offline", gateway.GatewayId, gateway.Name);

            // 推送网关离线通知（P0 工业：网关是数据采集入口，离线=该网关下设备数据断，运维需立即知晓）。
            // try/catch 隔离——通知失败不得影响离线标记（离线状态是数据正确性，通知是可用性增强），
            // 且与持久化通知/Web Push 解耦（推送服务的隔离由 SendGatewayOfflineAsync 内部保证）。
            try
            {
                await signalR.SendGatewayOfflineAsync(gateway.TenantId, gateway.Id, gateway.GatewayId, gateway.Name);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "网关离线通知推送失败，不影响离线标记: GatewayId={GatewayId}", gateway.GatewayId);
            }
        }

        await dbContext.SaveChangesAsync(ct);
    }
}
