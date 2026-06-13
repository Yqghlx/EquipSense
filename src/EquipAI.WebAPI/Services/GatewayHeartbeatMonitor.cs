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

    /** 检查所有网关的心跳状态 */
    private async Task CheckHeartbeatsAsync(CancellationToken ct)
    {
        var timeoutSeconds = _configuration.GetValue("Gateway:HeartbeatTimeoutSeconds", 90);

        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

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
        }

        await dbContext.SaveChangesAsync(ct);
    }
}
