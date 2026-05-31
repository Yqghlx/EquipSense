using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Alerts;

/// <summary>
/// 基线计算后台服务
/// 定期从 telemetry_hourly 连续聚合视图查询最近 7 天的统计数据，
/// 按 tenant_id, device_id, metric 聚合后 UPSERT 到 metric_baselines 表。
/// 仅当样本数量 >= 100 时才写入基线（确保统计意义）。
/// </summary>
public class BaselineCalculationService : BackgroundService, IBaselineCalculationService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<BaselineCalculationService> _logger;

    public BaselineCalculationService(
        IServiceScopeFactory scopeFactory,
        ILogger<BaselineCalculationService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // 首次延迟 30 秒等待应用完全启动
        await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CalculateBaselinesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "基线计算执行失败");
            }

            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }

    /// <inheritdoc />
    public async Task CalculateBaselinesAsync(CancellationToken cancellationToken = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 从 telemetry_hourly 查询最近 7 天的统计数据，按设备+指标聚合
        var sql = """
            SELECT
                tenant_id AS "TenantId",
                device_id AS "DeviceId",
                metric AS "Metric",
                NOW() - INTERVAL '7 days' AS "PeriodStart",
                NOW() AS "PeriodEnd",
                AVG(avg_value) AS "AvgValue",
                STDDEV(avg_value) AS "StdDev",
                MIN(min_value) AS "MinValue",
                MAX(max_value) AS "MaxValue",
                PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY avg_value) AS "P95Value",
                SUM(sample_count)::INT AS "SampleCount"
            FROM telemetry_hourly
            WHERE bucket >= NOW() - INTERVAL '7 days'
            GROUP BY tenant_id, device_id, metric
            HAVING SUM(sample_count) >= 100
            """;

        var baselines = await dbContext.Database.SqlQueryRaw<BaselineRow>(sql).ToListAsync(cancellationToken);

        if (baselines.Count == 0)
        {
            _logger.LogDebug("暂无满足条件的基线数据（需要 7 天内 100+ 样本）");
            return;
        }

        // UPSERT 到 metric_baselines 表
        foreach (var row in baselines)
        {
            var upsertSql = """
                INSERT INTO metric_baselines (id, tenant_id, device_id, metric, period_start, period_end,
                    avg_value, std_dev, min_value, max_value, p95_value, sample_count, updated_at, created_at)
                VALUES (gen_random_uuid(), {0}, {1}, {2}, {3}, {4},
                    {5}, {6}, {7}, {8}, {9}, {10}, NOW(), NOW())
                ON CONFLICT (tenant_id, device_id, metric)
                DO UPDATE SET
                    period_start = EXCLUDED.period_start,
                    period_end = EXCLUDED.period_end,
                    avg_value = EXCLUDED.avg_value,
                    std_dev = EXCLUDED.std_dev,
                    min_value = EXCLUDED.min_value,
                    max_value = EXCLUDED.max_value,
                    p95_value = EXCLUDED.p95_value,
                    sample_count = EXCLUDED.sample_count,
                    updated_at = NOW()
                """;

            var parameters = new List<object?>
            {
                row.TenantId, row.DeviceId, row.Metric, row.PeriodStart, row.PeriodEnd,
                row.AvgValue, row.StdDev, row.MinValue, row.MaxValue, row.P95Value, row.SampleCount
            };
            await dbContext.Database.ExecuteSqlRawAsync(upsertSql, parameters!, cancellationToken);
        }

        _logger.LogInformation("基线计算完成，已更新 {Count} 条基线记录", baselines.Count);
    }

    /// <summary>
    /// telemetry_hourly 聚合查询的内部结果行
    /// </summary>
    private class BaselineRow
    {
        public Guid TenantId { get; set; }
        public Guid DeviceId { get; set; }
        public string Metric { get; set; } = string.Empty;
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public double? AvgValue { get; set; }
        public double? StdDev { get; set; }
        public double? MinValue { get; set; }
        public double? MaxValue { get; set; }
        public double? P95Value { get; set; }
        public int SampleCount { get; set; }
    }
}
