using EquipAI.Core.Enums;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Services;

/// <summary>
/// 设备在线状态监控后台服务
///
/// 周期性扫描所有"最近一次遥测时间"超过阈值的设备，将其状态标记为 Offline。
/// 与 TelemetryEventHandler 配合实现：
///   收到遥测 → TelemetryEventHandler 设置 Online + 刷新 LastSeenAt
///   超过阈值无遥测 → 本服务标记 Offline
///
/// 这样 Dashboard 的"在线设备数"、"设备可用率"、"OEE"才能反映真实状态。
/// </summary>
public class DeviceStatusMonitor : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DeviceStatusMonitor> _logger;

    public DeviceStatusMonitor(
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration,
        ILogger<DeviceStatusMonitor> logger)
    {
        _scopeFactory = scopeFactory;
        _configuration = configuration;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("设备在线状态监控服务已启动");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckDeviceStatusAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "设备状态检查异常");
            }

            // 每 30s 扫一次，配合默认 90s 超时阈值
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }

    /// <summary>
    /// 把 LastSeenAt 超过阈值仍标记为 Online 的设备改为 Offline
    /// </summary>
    private async Task CheckDeviceStatusAsync(CancellationToken ct)
    {
        var timeoutSeconds = _configuration.GetValue("Device:OfflineTimeoutSeconds", 90);
        var cutoff = DateTime.UtcNow.AddSeconds(-timeoutSeconds);

        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 一次 UPDATE 完成，无需加载实体到内存
        var affected = await dbContext.Devices
            .Where(d => d.Status == DeviceStatus.Online && (d.LastSeenAt == null || d.LastSeenAt < cutoff))
            .ExecuteUpdateAsync(s => s.SetProperty(d => d.Status, DeviceStatus.Offline), ct);

        if (affected > 0)
        {
            _logger.LogInformation("已将 {Count} 个超时无遥测的设备标记为 Offline（阈值 {Timeout}s）",
                affected, timeoutSeconds);
        }
    }
}
