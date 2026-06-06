using EquipAI.Core.Enums;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Dashboard;

/// <summary>
/// 仪表盘统计服务 — 聚合设备、告警、工单等多维度统计数据
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
    /// </summary>
    private async Task<(int ActiveCount, Dictionary<string, int> BySeverity)> GetAlertStatsAsync(Guid tenantId, CancellationToken ct)
    {
        var bySeverity = await _db.Alerts
            .Where(a => a.Status == AlertStatus.Active)
            .GroupBy(a => a.Severity.ToString())
            .Select(g => new { Severity = g.Key, Count = g.Count() })
            .ToDictionaryAsync(g => g.Severity, g => g.Count, ct);

        var activeCount = bySeverity.Values.Sum();
        return (activeCount, bySeverity);
    }

    /// <summary>
    /// 工单统计：待派工数和按状态分布
    /// </summary>
    private async Task<(int PendingCount, Dictionary<string, int> ByStatus)> GetWorkOrderStatsAsync(Guid tenantId, CancellationToken ct)
    {
        var byStatus = await _db.WorkOrders
            .GroupBy(w => w.Status.ToString())
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToDictionaryAsync(g => g.Status, g => g.Count, ct);

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
