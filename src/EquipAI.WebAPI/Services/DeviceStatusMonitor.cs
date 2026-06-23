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
    /// 把 LastSeenAt 超过阈值仍标记为 Online 的设备改为 Offline。
    /// 返回受影响行数，便于测试与日志观测。
    /// </summary>
    /// <remarks>
    /// 必须使用 IgnoreQueryFilters：本服务在后台 HostedService scope 运行，无 HTTP 请求上下文，
    /// ITenantContext 经 DI 回退为空租户（<see cref="Guid.Empty"/>，见 ServiceCollectionExtensions
    /// 中无 HttpContext 时的 <c>new TenantContext(Guid.Empty, "Shared", false, Guid.Empty)</c> 回退分支）。
    /// 若不绕过全局租户过滤器，<c>WHERE TenantId = Guid.Empty</c> 只命中系统租户（无真实设备），
    /// <see cref="Microsoft.EntityFrameworkCore.RelationalQueryableExtensions.ExecuteUpdateAsync"/>
    /// 永远影响 0 行——设备一旦因收到遥测变 Online（<c>TelemetryEventHandler</c> 已正确用 IgnoreQueryFilters 写入）
    /// 就永远变不回 Offline，哪怕断网数天。后果：Dashboard 在线设备数 / 设备可用率 / OEE 永久虚高，
    /// 客户运维看到的产线状态是假的。
    ///
    /// 安全性：本服务是跨租户的"全局运维巡检"——只按 <c>Status + LastSeenAt</c> 把超时设备降级为 Offline，
    /// 既不读取、也不返回任何租户私有数据（设备名、位置、序列号等），因此 IgnoreQueryFilters 在此无跨租户
    /// 泄漏面，与 <c>TelemetryEventHandler</c> 的 Online 写入路径对称。回归测试见 DeviceStatusMonitorTests
    /// （SQLite + Guid.Empty 上下文复刻后台路径，InMemory 提供程序不强制过滤器会掩盖此 bug）。
    /// </remarks>
    public async Task<int> CheckDeviceStatusAsync(CancellationToken ct)
    {
        var timeoutSeconds = _configuration.GetValue("Device:OfflineTimeoutSeconds", 90);
        var cutoff = DateTime.UtcNow.AddSeconds(-timeoutSeconds);

        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // IgnoreQueryFilters：跨所有租户全局巡检（见上方 remarks）。一次 UPDATE 完成，无需加载实体到内存。
        var affected = await dbContext.Devices
            .IgnoreQueryFilters()
            .Where(d => d.Status == DeviceStatus.Online && (d.LastSeenAt == null || d.LastSeenAt < cutoff))
            .ExecuteUpdateAsync(s => s.SetProperty(d => d.Status, DeviceStatus.Offline), ct);

        if (affected > 0)
        {
            _logger.LogInformation("已将 {Count} 个超时无遥测的设备标记为 Offline（阈值 {Timeout}s）",
                affected, timeoutSeconds);
        }

        return affected;
    }
}
