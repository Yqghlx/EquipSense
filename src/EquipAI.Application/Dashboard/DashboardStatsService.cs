using EquipAI.Core.Enums;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Dashboard;

/// <summary>
/// 仪表盘统计服务 — 聚合设备、告警、工单等多维度统计数据
///
/// 数据准确性说明（v1.3.0 校准）：
/// 1. Availability 字段是"瞬时在线设备比例"，不是工业可用率。
///    真正的工业可用率 = 运行时间 / 计划运行时间，需要接入设备状态历史遥测后才能实现。
/// 2. 趋势数据按 UTC 当天分组，未做时区转换。
///    跨时区用户（如 UTC+8 中国用户）会在 UTC 0:00-7:59 期间看到趋势图错位一天。
///    修复需要给 Tenant 加 TimeZone 字段，属于 v1.4 范畴。
/// 3. 所有查询依赖 EF Core 全局查询过滤器自动附加 WHERE TenantId = @current，
///    所以 tenantId 参数虽未显式传入 LINQ，但过滤器保证租户隔离。
/// </summary>
public class DashboardStatsService
{
    private readonly AppDbContext _db;
    private readonly ILogger<DashboardStatsService> _logger;

    public DashboardStatsService(AppDbContext db, ILogger<DashboardStatsService> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// 获取当前租户的仪表盘统计数据
    ///
    /// 注意：EF Core DbContext 不是线程安全的，不能并行执行多个查询。
    /// 此处改为顺序执行，每次查询间隔极短（微秒级网络往返已足够快）。
    /// </summary>
    /// <param name="tenantId">租户 ID（实际过滤由 EF 全局查询过滤器完成，保留参数为可读性 + 未来支持跨租户查询）</param>
    public async Task<DashboardStats> GetStatsAsync(Guid tenantId, CancellationToken ct = default)
    {
        // 顺序执行所有统计查询（EF Core DbContext 不支持并发操作）
        var deviceStats = await GetDeviceStatsAsync(tenantId, ct);
        var alertStats = await GetAlertStatsAsync(tenantId, ct);
        var workOrderStats = await GetWorkOrderStatsAsync(tenantId, ct);
        var alertTrend = await GetAlertTrendAsync(tenantId, ct);
        var workOrderTrend = await GetWorkOrderTrendAsync(tenantId, ct);

        return new DashboardStats
        {
            TotalDevices = deviceStats.Total,
            OnlineDevices = deviceStats.Online,
            ActiveAlerts = alertStats.ActiveCount,
            PendingWorkOrders = workOrderStats.PendingCount,
            // 注意：这是"瞬时在线比例"，不是工业可用率（详见类头注释）
            Availability = deviceStats.Total > 0
                ? Math.Round((double)deviceStats.Online / deviceStats.Total * 100, 1)
                : 0,
            AlertsBySeverity = alertStats.BySeverity,
            WorkOrdersByStatus = workOrderStats.ByStatus,
            AlertTrend = alertTrend,
            WorkOrderTrend = workOrderTrend,
        };
    }

    /// <summary>
    /// 设备基础统计：总数和在线数
    /// </summary>
    private async Task<(int Total, int Online)> GetDeviceStatsAsync(Guid tenantId, CancellationToken ct)
    {
        var total = await _db.Devices.CountAsync(ct);
        var online = await _db.Devices.CountAsync(d => d.Status == DeviceStatus.Online, ct);
        return (total, online);
    }

    /// <summary>
    /// 告警统计：活跃告警数和按级别分布
    ///
    /// 业务定义：活跃告警 = Active（已触发未确认）+ Acknowledged（已确认未解决）
    /// 修复历史（v1.3.0）：
    ///   原代码只查 Status=Active，漏算 Acknowledged，导致用户确认告警后活跃数立即减少，
    ///   误以为问题已处理。实际只有 Resolved（已解决）才应该从活跃数中扣除。
    /// </summary>
    private async Task<(int ActiveCount, Dictionary<string, int> BySeverity)> GetAlertStatsAsync(Guid tenantId, CancellationToken ct)
    {
        // 先查询原始数据再在内存中分组，避免 EF Core 翻译枚举 ToString() 失败
        var alerts = await _db.Alerts
            .Where(a => a.Status == AlertStatus.Active || a.Status == AlertStatus.Acknowledged)
            .Select(a => new { a.Severity })
            .ToListAsync(ct);

        var bySeverity = alerts
            .GroupBy(a => a.Severity.ToString())
            .ToDictionary(g => g.Key, g => g.Count());

        var activeCount = bySeverity.Values.Sum();
        return (activeCount, bySeverity);
    }

    /// <summary>
    /// 工单统计：待派工数和按状态分布
    /// </summary>
    private async Task<(int PendingCount, Dictionary<string, int> ByStatus)> GetWorkOrderStatsAsync(Guid tenantId, CancellationToken ct)
    {
        // 先查询原始数据再在内存中分组，兼容 InMemory 数据库和避免枚举翻译问题
        var workOrders = await _db.WorkOrders
            .Select(w => new { w.Status })
            .ToListAsync(ct);

        var byStatus = workOrders
            .GroupBy(w => w.Status.ToString())
            .ToDictionary(g => g.Key, g => g.Count());

        byStatus.TryGetValue("PendingDispatch", out var pending);
        return (pending, byStatus);
    }

    /// <summary>
    /// 告警趋势：最近 7 天每天新增告警数
    /// 先查询原始数据再在内存中分组，兼容 InMemory 数据库
    /// </summary>
    private async Task<List<TrendPoint>> GetAlertTrendAsync(Guid tenantId, CancellationToken ct)
    {
        var startDate = DateTime.UtcNow.Date.AddDays(-6);

        var alerts = await _db.Alerts
            .Where(a => a.OccurredAt >= startDate)
            .Select(a => new { a.OccurredAt })
            .ToListAsync(ct);

        var dailyCounts = alerts
            .GroupBy(a => a.OccurredAt.Date)
            .ToDictionary(g => g.Key, g => g.Count());

        return BuildTrend(startDate, dailyCounts);
    }

    /// <summary>
    /// 工单趋势：最近 7 天每天创建工单数
    /// </summary>
    private async Task<List<TrendPoint>> GetWorkOrderTrendAsync(Guid tenantId, CancellationToken ct)
    {
        var startDate = DateTime.UtcNow.Date.AddDays(-6);

        var workOrders = await _db.WorkOrders
            .Where(w => w.CreatedAt >= startDate)
            .Select(w => new { w.CreatedAt })
            .ToListAsync(ct);

        var dailyCounts = workOrders
            .GroupBy(w => w.CreatedAt.Date)
            .ToDictionary(g => g.Key, g => g.Count());

        return BuildTrend(startDate, dailyCounts);
    }

    /// <summary>
    /// 构建连续 7 天的趋势数据，无数据的日期补零
    /// </summary>
    private static List<TrendPoint> BuildTrend(DateTime startDate, Dictionary<DateTime, int> dailyCounts)
    {
        var result = new List<TrendPoint>(7);
        for (var i = 0; i < 7; i++)
        {
            var date = startDate.AddDays(i);
            result.Add(new TrendPoint
            {
                Date = date.ToString("yyyy-MM-dd"),
                Count = dailyCounts.GetValueOrDefault(date, 0),
            });
        }
        return result;
    }
}
