using EquipAI.Application.Services;
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
/// 2. 趋势数据按租户本地时区当天分组（v1.4 #245 修复，使用 Tenant.TimeZone + TimeZoneResolver）。
///    查询窗口起点 = 租户时区"今天 0:00"转 UTC；分组键 = 遥测时间转租户时区后的 .Date。
///    跨时区用户看到的"今天"与本地一致（旧实现按 UTC 分组会让 UTC+8 用户在 UTC 0-8 点错位一天）。
/// 3. 所有业务查询都显式附加 TenantId = @tenantId；全局查询过滤器仍作为请求上下文的第二道防线，
///    这样系统管理员跨租户查看或后台复用服务时不会因为 DbContext 当前租户而返回错误统计。
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
    /// <param name="tenantId">目标租户 ID，作为统计查询的显式数据边界</param>
    public async Task<DashboardStats> GetStatsAsync(Guid tenantId, CancellationToken ct = default)
    {
        // 一次 DB 查询拿到租户时区，趋势聚合按本地日期分组（v1.4 修复跨时区错位）
        var tenantTimeZone = await _db.Tenants
            .IgnoreQueryFilters()
            .Where(t => t.Id == tenantId)
            .Select(t => new { t.TimeZone })
            .FirstOrDefaultAsync(ct);
        var timeZone = TimeZoneResolver.Resolve(tenantTimeZone?.TimeZone, _logger);

        // 顺序执行所有统计查询（EF Core DbContext 不支持并发操作）
        var deviceStats = await GetDeviceStatsAsync(tenantId, ct);
        var alertStats = await GetAlertStatsAsync(tenantId, ct);
        var workOrderStats = await GetWorkOrderStatsAsync(tenantId, ct);
        var alertTrend = await GetAlertTrendAsync(tenantId, timeZone, ct);
        var workOrderTrend = await GetWorkOrderTrendAsync(tenantId, timeZone, ct);

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
        var devices = _db.UnfilteredSet<Core.Entities.Device>()
            .Where(d => d.TenantId == tenantId);
        var total = await devices.CountAsync(ct);
        var online = await devices.CountAsync(d => d.Status == DeviceStatus.Online, ct);
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
        var alerts = await _db.UnfilteredSet<Core.Entities.Alert>()
            .Where(a => a.TenantId == tenantId
                     && (a.Status == AlertStatus.Active || a.Status == AlertStatus.Acknowledged))
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
        var workOrders = await _db.UnfilteredSet<Core.Entities.WorkOrder>()
            .Where(w => w.TenantId == tenantId)
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
    ///
    /// 时区处理（v1.4 修复）：
    ///   - 查询窗口用租户时区当天 0:00 起算的过去 7 天（转 UTC 后过滤 OccurredAt）
    ///   - 分组键用告警时间转租户时区后的 .Date（之前用 UTC .Date 会让跨时区用户看到错位一天）
    /// </summary>
    private async Task<List<TrendPoint>> GetAlertTrendAsync(Guid tenantId, TimeZoneInfo timeZone, CancellationToken ct)
    {
        // 租户时区的"今天 0:00"（本地）→ 转 UTC 作为查询窗口起点
        var todayLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZone).Date;
        var startLocal = todayLocal.AddDays(-6);
        var startUtc = TimeZoneInfo.ConvertTimeToUtc(startLocal, timeZone);

        var alerts = await _db.UnfilteredSet<Core.Entities.Alert>()
            .Where(a => a.TenantId == tenantId && a.OccurredAt >= startUtc)
            .Select(a => new { a.OccurredAt })
            .ToListAsync(ct);

        // 按租户时区的日期分组（之前按 UTC，跨时区用户看到的"今天"会错位）
        var dailyCounts = alerts
            .GroupBy(a => TimeZoneInfo.ConvertTimeFromUtc(a.OccurredAt, timeZone).Date)
            .ToDictionary(g => g.Key, g => g.Count());

        return BuildTrend(startLocal, dailyCounts);
    }

    /// <summary>
    /// 工单趋势：最近 7 天每天创建工单数
    /// 时区处理同 GetAlertTrendAsync
    /// </summary>
    private async Task<List<TrendPoint>> GetWorkOrderTrendAsync(Guid tenantId, TimeZoneInfo timeZone, CancellationToken ct)
    {
        var todayLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZone).Date;
        var startLocal = todayLocal.AddDays(-6);
        var startUtc = TimeZoneInfo.ConvertTimeToUtc(startLocal, timeZone);

        var workOrders = await _db.UnfilteredSet<Core.Entities.WorkOrder>()
            .Where(w => w.TenantId == tenantId && w.CreatedAt >= startUtc)
            .Select(w => new { w.CreatedAt })
            .ToListAsync(ct);

        var dailyCounts = workOrders
            .GroupBy(w => TimeZoneInfo.ConvertTimeFromUtc(w.CreatedAt, timeZone).Date)
            .ToDictionary(g => g.Key, g => g.Count());

        return BuildTrend(startLocal, dailyCounts);
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
