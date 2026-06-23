using EquipAI.Core.Enums;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Analysis;

/// <summary>
/// 设备健康度定时重算后台服务
///
/// 背景：DeviceHealthService.UpdateAllHealthScoresAsync 注释自述"用于定时任务或手动触发"，但系统此前无任何
/// 定时任务调用它（8 个 HostedService 均与健康度无关，也无外部调度器）。仅 DevicesController 的手动端点
/// RefreshAllHealthScores 调用。后果：devices.health_score 默认 100（Device.cs 构造默认值）永不自动重算 →
/// DeviceDetailPage / 运营报表 / CSV 导出里所有设备恒显示"健康"(绿色)，无视 Critical 告警、离线状态、
/// 遥测质量差——健康度这一核心监控 KPI 实质失效，误导客户对设备状况的判断。
///
/// 本服务每 10 分钟遍历所有活跃（非 Expired、非系统）租户，逐租户调用 UpdateAllHealthScoresAsync 重算并
/// 持久化健康度。单租户失败不阻断其余租户（捕获并记录）。
///
/// 注意：DeviceHealthService 的设备/遥测查询已配合加 IgnoreQueryFilters（后台 scope 无 HttpContext，
/// 默认租户过滤器解析为 Guid.Empty 会吞掉查询），否则即便有定时调用者也会查不到设备而形同空跑。
/// </summary>
public class DeviceHealthRecalculationHostedService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DeviceHealthRecalculationHostedService> _logger;

    /// <summary>重算间隔：10 分钟。健康度是慢变指标（基于 7 天告警窗口 + 状态），10 分钟粒度足够及时且 DB 负载可控。</summary>
    private static readonly TimeSpan ScanInterval = TimeSpan.FromMinutes(10);

    /// <summary>启动延迟：等待应用完全启动后再扫描，避免启动期 DB 压力叠加。</summary>
    private static readonly TimeSpan StartupDelay = TimeSpan.FromSeconds(60);

    public DeviceHealthRecalculationHostedService(
        IServiceScopeFactory scopeFactory,
        ILogger<DeviceHealthRecalculationHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // 首次延迟等待应用完全启动（健康度重算非启动关键路径，延后避免与迁移/播种争抢 DB）
        await Task.Delay(StartupDelay, stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunRecalculationAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                // 单次扫描整体失败不应终止后台循环，记录后等待下次扫描
                _logger.LogError(ex, "设备健康度重算扫描执行失败");
            }

            await Task.Delay(ScanInterval, stoppingToken);
        }
    }

    /// <summary>
    /// 单次扫描：遍历所有活跃租户，逐租户重算并持久化设备健康度。
    /// 公开以便单元测试直接调用（不依赖定时器与启动延迟）。
    /// </summary>
    /// <param name="ct">取消令牌</param>
    /// <returns>本次扫描累计重算的设备数</returns>
    public async Task<int> RunRecalculationAsync(CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var healthService = scope.ServiceProvider.GetRequiredService<DeviceHealthService>();

        // Tenant 实体无全局租户过滤器（后台服务需跨租户遍历），默认查询即返回全部租户。
        // 跳过系统租户（Guid.Empty，仅承载预置模板，无真实设备）与已过期租户（设备不再产生监控价值）。
        var tenants = await dbContext.Tenants
            .Where(t => t.Id != Guid.Empty && t.Status != TenantStatus.Expired)
            .Select(t => t.Id)
            .ToListAsync(ct);

        var totalUpdated = 0;
        foreach (var tenantId in tenants)
        {
            // 单租户隔离：一个租户的重算失败不阻断其余租户的处理
            try
            {
                totalUpdated += await healthService.UpdateAllHealthScoresAsync(tenantId, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "租户 {TenantId} 的设备健康度重算失败", tenantId);
            }
        }

        if (totalUpdated > 0)
        {
            _logger.LogInformation("设备健康度重算完成：处理 {TenantCount} 个租户，累计重算 {UpdatedCount} 台设备",
                tenants.Count, totalUpdated);
        }

        return totalUpdated;
    }
}
