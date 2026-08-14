using System.Linq.Expressions;
using EquipAI.Application.Services;
using EquipAI.Application.WorkOrders.DTOs;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders;

/// <summary>
/// 工单统计服务 — 聚合工单的多维度统计数据
/// 统计分布、趋势、完成时长和 SLA 均在数据库侧聚合，应用层只接收有限摘要。
/// </summary>
public class WorkOrderStatisticsService
{
    private const string NpgsqlProviderName = "Npgsql.EntityFrameworkCore.PostgreSQL";
    private const string SqliteProviderName = "Microsoft.EntityFrameworkCore.Sqlite";
    private const string InMemoryProviderName = "Microsoft.EntityFrameworkCore.InMemory";

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
        var boundariesUtc = BuildTrendBoundaries(startLocal, periodDays, timeZone);
        var startDate = boundariesUtc[0];
        var endDate = boundariesUtc[^1];
        var nowUtc = DateTime.UtcNow;

        // 所有后续统计共享同一个显式租户和半开时间窗口，避免统计周期外的未来数据混入结果。
        var workOrderQuery = _db.UnfilteredSet<Core.Entities.WorkOrder>()
            .Where(w => w.TenantId == tenantId
                     && w.CreatedAt >= startDate
                     && w.CreatedAt < endDate);

        // 分布统计按枚举值在数据库侧分组，返回行数最多为状态/类型/优先级的枚举数量。
        var statusRows = await workOrderQuery
            .GroupBy(w => w.Status)
            .Select(group => new { Status = group.Key, Count = group.Count() })
            .ToListAsync(ct);
        var typeRows = await workOrderQuery
            .GroupBy(w => w.Type)
            .Select(group => new { Type = group.Key, Count = group.Count() })
            .ToListAsync(ct);
        var priorityRows = await workOrderQuery
            .GroupBy(w => w.Priority)
            .Select(group => new { Priority = group.Key, Count = group.Count() })
            .ToListAsync(ct);

        var result = new WorkOrderStatistics
        {
            Total = statusRows.Sum(row => row.Count),
            ByStatus = statusRows.ToDictionary(row => row.Status.ToString(), row => row.Count),
            ByType = typeRows.ToDictionary(row => row.Type.ToString(), row => row.Count),
            ByPriority = priorityRows.ToDictionary(row => row.Priority.ToString(), row => row.Count),
        };

        // 按本地日期转换出的 UTC 半开区间分组，既保留跨时区语义，又不把每条工单搬到应用层。
        var createdRows = await workOrderQuery
            .GroupBy(BuildBucketSelector(nameof(Core.Entities.WorkOrder.CreatedAt), boundariesUtc))
            .Select(group => new { Day = group.Key, Count = group.Count() })
            .ToListAsync(ct);
        result.CreatedTrend = BuildTrend(
            startLocal,
            todayLocal,
            createdRows.ToDictionary(row => startLocal.AddDays(row.Day), row => row.Count));

        var completedQuery = workOrderQuery
            .Where(w => w.CompletedAt.HasValue
                     && w.CompletedAt.Value >= startDate
                     && w.CompletedAt.Value < endDate);
        var completedRows = await completedQuery
            .GroupBy(BuildBucketSelector(nameof(Core.Entities.WorkOrder.CompletedAt), boundariesUtc))
            .Select(group => new { Day = group.Key, Count = group.Count() })
            .ToListAsync(ct);
        result.CompletedTrend = BuildTrend(
            startLocal,
            todayLocal,
            completedRows.ToDictionary(row => startLocal.AddDays(row.Day), row => row.Count));

        // 完成时长的日期差表达式没有跨 SQLite/PostgreSQL 的统一 LINQ 翻译，
        // 因此按生产数据库提供程序使用参数化 SQL 聚合；InMemory 只保留测试回退路径。
        var completionRows = await GetCompletionDurationRowsAsync(
            workOrderQuery,
            tenantId,
            startDate,
            endDate,
            ct);
        result.AvgCompletionHoursByPriority = completionRows.ToDictionary(
            row => ((Core.Enums.WorkOrderPriority)row.Priority).ToString(),
            row => Math.Round(row.AverageHours, 1));

        // SLA 达成率：在 DueDate 之前完成，或未完成但当前仍未超时；只返回每个优先级一行。
        var slaRows = await workOrderQuery
            .Where(w => w.DueDate.HasValue)
            .GroupBy(w => w.Priority)
            .Select(group => new
            {
                Priority = group.Key,
                Total = group.Count(),
                OnTime = group.Count(w =>
                    (w.CompletedAt.HasValue && w.CompletedAt.Value <= w.DueDate!.Value)
                    || (!w.CompletedAt.HasValue && nowUtc <= w.DueDate!.Value)),
            })
            .ToListAsync(ct);
        result.SlaRateByPriority = slaRows.ToDictionary(
            row => row.Priority.ToString(),
            row => Math.Round((double)row.OnTime / row.Total * 100, 1));

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

    /// <summary>
    /// 构造每个租户本地自然日对应的 UTC 半开区间。
    /// 用 CASE 分桶交给数据库执行，避免按天发起大量查询，也避免按 UTC 日期分组造成跨时区错位。
    /// </summary>
    private static DateTime[] BuildTrendBoundaries(DateTime startLocal, int periodDays, TimeZoneInfo timeZone)
    {
        return Enumerable.Range(0, periodDays + 1)
            .Select(offset => TimeZoneInfo.ConvertTimeToUtc(
                DateTime.SpecifyKind(startLocal.AddDays(offset), DateTimeKind.Unspecified),
                timeZone))
            .ToArray();
    }

    /// <summary>
    /// 构造数据库可翻译的日期分桶表达式。
    /// 将边界写成 CASE 条件后，PostgreSQL 和 SQLite 都能在数据库侧完成分组。
    /// </summary>
    private static Expression<Func<Core.Entities.WorkOrder, int>> BuildBucketSelector(
        string propertyName,
        IReadOnlyList<DateTime> boundariesUtc)
    {
        var workOrder = Expression.Parameter(typeof(Core.Entities.WorkOrder), "workOrder");
        var property = Expression.Property(workOrder, propertyName);
        var timestamp = property.Type == typeof(DateTime?)
            ? Expression.Property(property, nameof(Nullable<DateTime>.Value))
            : property;
        Expression body = Expression.Constant(-1);

        for (var index = boundariesUtc.Count - 2; index >= 0; index--)
        {
            var startsAt = Expression.GreaterThanOrEqual(
                timestamp,
                Expression.Constant(boundariesUtc[index], typeof(DateTime)));
            var endsBefore = Expression.LessThan(
                timestamp,
                Expression.Constant(boundariesUtc[index + 1], typeof(DateTime)));
            body = Expression.Condition(
                Expression.AndAlso(startsAt, endsBefore),
                Expression.Constant(index),
                body);
        }

        return Expression.Lambda<Func<Core.Entities.WorkOrder, int>>(body, workOrder);
    }

    /// <summary>
    /// 按优先级从数据库聚合完成时长。
    /// PostgreSQL 使用时间间隔的秒数，SQLite 使用 julianday 差值；两者都只返回每个优先级一行。
    /// </summary>
    private async Task<List<CompletionDurationRow>> GetCompletionDurationRowsAsync(
        IQueryable<Core.Entities.WorkOrder> workOrderQuery,
        Guid tenantId,
        DateTime startDate,
        DateTime endDate,
        CancellationToken ct)
    {
        var providerName = _db.Database.ProviderName;

        if (string.Equals(providerName, InMemoryProviderName, StringComparison.Ordinal))
        {
            // InMemory 仅用于现有单元测试，不代表生产数据库的资源行为。
            return await workOrderQuery
                .Where(w => w.CompletedAt.HasValue && w.CreatedAt < w.CompletedAt.Value)
                .GroupBy(w => w.Priority)
                .Select(group => new CompletionDurationRow
                {
                    Priority = (int)group.Key,
                    AverageHours = group.Average(w => (w.CompletedAt!.Value - w.CreatedAt).TotalHours),
                })
                .ToListAsync(ct);
        }

        if (string.Equals(providerName, SqliteProviderName, StringComparison.Ordinal))
        {
            return await _db.Database.SqlQuery<CompletionDurationRow>($"""
                SELECT priority AS "Priority",
                       AVG((julianday(completed_at) - julianday(created_at)) * 24.0) AS "AverageHours"
                FROM work_orders
                WHERE tenant_id = {tenantId}
                  AND created_at >= {startDate}
                  AND created_at < {endDate}
                  AND completed_at IS NOT NULL
                  AND created_at < completed_at
                GROUP BY priority
                """).ToListAsync(ct);
        }

        if (string.Equals(providerName, NpgsqlProviderName, StringComparison.Ordinal))
        {
            return await _db.Database.SqlQuery<CompletionDurationRow>($"""
                SELECT priority AS "Priority",
                       AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600.0)::double precision AS "AverageHours"
                FROM work_orders
                WHERE tenant_id = {tenantId}
                  AND created_at >= {startDate}
                  AND created_at < {endDate}
                  AND completed_at IS NOT NULL
                  AND created_at < completed_at
                GROUP BY priority
                """).ToListAsync(ct);
        }

        throw new NotSupportedException(
            $"数据库提供程序 {providerName ?? "<unknown>"} 未实现工单完成时长统计");
    }

    /// <summary>
    /// 完成时长聚合查询的内部结果行。
    /// </summary>
    private sealed class CompletionDurationRow
    {
        /// <summary>工单优先级的底层枚举值。</summary>
        public int Priority { get; set; }

        /// <summary>平均完成时长，单位为小时。</summary>
        public double AverageHours { get; set; }
    }
}
