using EquipAI.Application.Hosting;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
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
public class DeviceStatusMonitor : LockedTimerService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _configuration;

    public DeviceStatusMonitor(
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration,
        IDistributedLockProvider lockProvider,
        ILogger<DeviceStatusMonitor> logger)
        : base(lockProvider, logger, lockResource: "device-status-monitor", lockExpiry: TimeSpan.FromMinutes(5))
    {
        _scopeFactory = scopeFactory;
        _configuration = configuration;
    }

    /// <summary>每 30s 扫一次，配合默认 90s 超时阈值。</summary>
    protected override TimeSpan DefaultInterval => TimeSpan.FromSeconds(30);

    /// <summary>基类回调：持锁后执行状态巡检。委托给 <see cref="CheckDeviceStatusAsync"/> 以便单元测试直接验证。</summary>
    protected override Task<int> ExecuteWorkAsync(CancellationToken ct) => CheckDeviceStatusAsync(ct);

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
        // 在检查 scope 内解析通知服务（而非构造注入），避免 Singleton HostedService 捕获 Scoped 依赖
        // （ISignalRNotificationService 内部持有 Scoped AppDbContext，构造注入会导致 captive dependency）
        var notifications = scope.ServiceProvider.GetRequiredService<ISignalRNotificationService>();

        // IgnoreQueryFilters：跨所有租户全局巡检（见上方 remarks）。先查出超时设备（含 TenantId/标识，
        // 用于按租户推送离线通知），再批量更新状态，最后逐个推送。相比原 ExecuteUpdateAsync（只返回行数），
        // 这里需加载设备标识以支持实时离线通知——运维必须知道哪台设备离线了。
        var offlineDevices = await dbContext.Devices
            .IgnoreQueryFilters()
            .Where(d => d.Status == DeviceStatus.Online && (d.LastSeenAt == null || d.LastSeenAt < cutoff))
            .Select(d => new { d.Id, d.TenantId, d.DeviceCode, d.Name })
            .ToListAsync(ct);

        if (offlineDevices.Count == 0)
            return 0;

        var offlineIds = offlineDevices.Select(d => d.Id).ToList();
        var affected = await dbContext.Devices
            .IgnoreQueryFilters()
            .Where(d => offlineIds.Contains(d.Id))
            .ExecuteUpdateAsync(s => s.SetProperty(d => d.Status, DeviceStatus.Offline), ct);

        // 逐设备推送离线通知（按租户隔离 + 持久化通知 + Web Push），让运维实时感知设备通信中断。
        // 原实现只改状态不发通知，且设备离线不产生遥测故不触发阈值告警 → 运维完全不知情。
        // 单设备通知失败不阻塞其他设备（catch 仅告警）。
        foreach (var device in offlineDevices)
        {
            try
            {
                await notifications.SendDeviceOfflineAsync(
                    device.TenantId, device.Id, device.DeviceCode, device.Name ?? device.DeviceCode);
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "设备离线通知推送失败: DeviceId={DeviceId}", device.Id);
            }
        }

        Logger.LogInformation("已将 {Count} 个超时无遥测的设备标记为 Offline 并通知运维（阈值 {Timeout}s）",
            affected, timeoutSeconds);

        return affected;
    }
}
