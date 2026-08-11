using EquipAI.Application.Services;
using EquipAI.Application.WorkOrders.DTOs;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders;

/// <summary>
/// 工单统计服务 — 聚合工单的多维度统计数据
/// 采用先查原始数据再内存分组的模式，兼容 InMemory 数据库
/// </summary>
public class WorkOrderStatisticsService
{
    private readonly AppDbContext _db;
    private readonly ILogger<WorkOrderStatisticsService> _logger;

    public WorkOrderStatisticsService(AppDbContext db, ILogger<WorkOrderStatisticsService> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// 获取工单统计数据
    /// </summary>
    /// <param name="tenantId">目标租户 ID，作为统计查询的显式数据边界</param>
    /// <param name="periodDays">统计周期天数（7/30/90）</param>
    public async Task<WorkOrderStatistics> GetStatisticsAsync(Guid tenantId, int periodDays, CancellationToken ct = default)
    {
        // 解析租户时区（与 DashboardStatsService 一致）：趋势按本地日期分组。
        // 原实现用 DateTime.UtcNow.Date / *.Date 按 UTC 分组，跨时区客户（如 UTC+8）在 UTC 0-8 点
        // 创建的工单会错归 UTC 当天，日报/月报日期边界偏移，影响 SLA 审计合规（#204 同类对称遗漏）。
        var tenantTimeZone = await _db.Tenants
            .IgnoreQueryFilters()
            .Where(t => t.Id == tenantId)
            .Select(t => new { t.TimeZone })
            .FirstOrDefaultAsync(ct);
        var timeZone = TimeZoneResolver.Resolve(tenantTimeZone?.TimeZone, _logger);

        // 本地「今天」的 N 天前，转回 UTC 作为 DB 查询起点（DB 存 UTC 时间）
        var todayLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZone).Date;
        var startLocal = todayLocal.AddDays(-periodDays + 1);
        var startDate = TimeZoneInfo.ConvertTimeToUtc(startLocal, timeZone);

        // 查询时间范围内的工单原始数据
        var workOrders = await _db.UnfilteredSet<Core.Entities.WorkOrder>()
            .Where(w => w.TenantId == tenantId && w.CreatedAt >= startDate)
            .Select(w => new
            {
                w.Status,
                w.Type,
                w.Priority,
                w.CreatedAt,
                CompletedAt = w.CompletedAt,
                DueDate = w.DueDate,
            })
            .ToListAsync(ct);

        var result = new WorkOrderStatistics
        {
            Total = workOrders.Count,
            ByStatus = workOrders
                .GroupBy(w => w.Status.ToString())
                .ToDictionary(g => g.Key, g => g.Count()),
            ByType = workOrders
                .GroupBy(w => w.Type.ToString())
                .ToDictionary(g => g.Key, g => g.Count()),
            ByPriority = workOrders
                .GroupBy(w => w.Priority.ToString())
                .ToDictionary(g => g.Key, g => g.Count()),
        };

        // 新建趋势（按租户本地日期分组，避免跨时区日期边界偏移）
        result.CreatedTrend = BuildTrend(startLocal, todayLocal, workOrders
            .GroupBy(w => TimeZoneInfo.ConvertTimeFromUtc(w.CreatedAt, timeZone).Date)
            .ToDictionary(g => g.Key, g => g.Count()));

        // 完成趋势（按租户本地日期分组）
        var completedOrders = workOrders.Where(w => w.CompletedAt.HasValue).ToList();
        result.CompletedTrend = BuildTrend(startLocal, todayLocal, completedOrders
            .GroupBy(w => TimeZoneInfo.ConvertTimeFromUtc(w.CompletedAt!.Value, timeZone).Date)
            .ToDictionary(g => g.Key, g => g.Count()));

        // 平均完成时长（按优先级分组）
        var completedWithTimes = workOrders
            .Where(w => w.CompletedAt.HasValue && w.CreatedAt < w.CompletedAt.Value)
            .ToList();

        result.AvgCompletionHoursByPriority = completedWithTimes
            .GroupBy(w => w.Priority.ToString())
            .ToDictionary(
                g => g.Key,
                g => Math.Round(g.Average(w => (w.CompletedAt!.Value - w.CreatedAt).TotalHours), 1));

        // SLA 达成率：在 DueDate 之前完成的工单比例
        var withDueDate = workOrders
            .Where(w => w.DueDate.HasValue)
            .ToList();

        if (withDueDate.Count > 0)
        {
            result.SlaRateByPriority = withDueDate
                .GroupBy(w => w.Priority.ToString())
                .ToDictionary(
                    g => g.Key,
                    g =>
                    {
                        var total = g.Count();
                        var onTime = g.Count(w =>
                            w.CompletedAt.HasValue && w.CompletedAt.Value <= w.DueDate!.Value ||
                            !w.CompletedAt.HasValue && DateTime.UtcNow <= w.DueDate!.Value);
                        return Math.Round((double)onTime / total * 100, 1);
                    });
        }

        return result;
    }

    /// <summary>
    /// 构建连续日期的趋势数据，无数据日期补零。
    /// startLocal/todayLocal 均为租户本地日期，保证趋势区间与分组键时区一致。
    /// </summary>
    private static List<TrendPoint> BuildTrend(DateTime startLocal, DateTime todayLocal, Dictionary<DateTime, int> dailyCounts)
    {
        var days = (int)(todayLocal - startLocal).Days + 1;
        var result = new List<TrendPoint>(days);
        for (var i = 0; i < days; i++)
        {
            var date = startLocal.AddDays(i);
            result.Add(new TrendPoint
            {
                Date = date.ToString("yyyy-MM-dd"),
                Count = dailyCounts.GetValueOrDefault(date, 0),
            });
        }
        return result;
    }
}
