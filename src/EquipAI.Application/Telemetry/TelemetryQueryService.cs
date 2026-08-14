using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Telemetry;

/// <summary>
/// 遥测数据查询 DTO：单个数据点
/// </summary>
public record TelemetryDataPoint(DateTime Time, double Value);

/// <summary>
/// 遥测数据查询服务
/// 负责查询设备历史遥测数据和最新实时数据，供前端图表展示使用
/// 多租户隔离由 AppReadDbContext 全局查询过滤器自动处理（继承自 AppDbContext）
///
/// v1.6 读路径分离：改注入只读上下文 AppReadDbContext（NoTracking + 可选只读副本），
/// 遥测时序聚合查询不再占用主库连接池，减轻写入路径压力。
/// </summary>
public class TelemetryQueryService
{
    /// <summary>
    /// 历史图表接口允许的最大时间范围（天）。
    ///
    /// 遥测表是高频时序表，开放任意时间范围会让一个设备详情请求扫描并序列化数百万条记录；
    /// 长周期统计应使用聚合服务或导出任务，不能占用在线查询连接和应用内存。
    /// </summary>
    public const int MaxHistoryRangeDays = 7;

    /// <summary>
    /// 单次历史图表查询最多返回的数据点数量。
    ///
    /// 取最近数据再恢复升序，保证高频设备在达到上限时仍展示最新状态，而不是返回窗口最早的一段。
    /// </summary>
    public const int MaxHistoryPoints = 10_000;

    private readonly AppReadDbContext _dbContext;
    private readonly ILogger<TelemetryQueryService> _logger;

    public TelemetryQueryService(
        AppReadDbContext dbContext,
        ILogger<TelemetryQueryService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// 查询设备指定指标的历史遥测数据
    /// </summary>
    /// <param name="deviceId">设备 ID</param>
    /// <param name="metric">指标名称（如 temperature、pressure）</param>
    /// <param name="startTime">查询起始时间</param>
    /// <param name="endTime">查询结束时间</param>
    /// <param name="ct">请求取消令牌，客户端断开或应用停机时终止数据库读取</param>
    /// <returns>按时间升序排列的数据点列表，最多返回最近的 MaxHistoryPoints 个点</returns>
    public async Task<List<TelemetryDataPoint>> QueryAsync(
        Guid deviceId, string metric, DateTime startTime, DateTime endTime,
        CancellationToken ct = default)
    {
        if (endTime <= startTime)
            throw new ArgumentException("结束时间必须晚于起始时间", nameof(endTime));

        if (endTime - startTime > TimeSpan.FromDays(MaxHistoryRangeDays))
        {
            throw new ArgumentOutOfRangeException(
                nameof(endTime), endTime, $"历史查询时间范围不能超过 {MaxHistoryRangeDays} 天");
        }

        _logger.LogInformation("查询设备 {DeviceId} 指标 {Metric} 的遥测数据，时间范围：{Start} ~ {End}",
            deviceId, metric, startTime, endTime);

        var points = await _dbContext.DeviceTelemetry
            .Where(t => t.DeviceId == deviceId
                     && t.Metric == metric
                     && t.Time >= startTime
                     && t.Time <= endTime)
            // 先取最近数据再在内存中恢复升序，避免高频设备的历史窗口把海量点加载到应用层。
            .OrderByDescending(t => t.Time)
            .Take(MaxHistoryPoints)
            .Select(t => new TelemetryDataPoint(t.Time, t.Value ?? 0))
            .ToListAsync(ct);

        return points.OrderBy(point => point.Time).ToList();
    }

    /// <summary>
    /// 校验历史遥测查询的时间范围，供 HTTP 层在访问数据库前返回明确的 400。
    /// </summary>
    public static string? ValidateHistoryRange(DateTime startTime, DateTime endTime)
    {
        if (endTime <= startTime)
            return "结束时间必须晚于起始时间";

        if (endTime - startTime > TimeSpan.FromDays(MaxHistoryRangeDays))
            return $"历史查询时间范围不能超过 {MaxHistoryRangeDays} 天";

        return null;
    }

    /// <summary>
    /// 查询设备所有指标的最新遥测数据
    /// 用于设备详情页的实时数据展示
    /// </summary>
    /// <param name="deviceId">设备 ID</param>
    /// <returns>指标名 → 最新值的字典</returns>
    public async Task<Dictionary<string, double>> GetLatestAsync(
        Guid deviceId, CancellationToken ct = default)
    {
        _logger.LogInformation("查询设备 {DeviceId} 的最新遥测数据", deviceId);

        // 在数据库内按指标排序并取首条，避免先查最新时间、再按指标逐条查值的 N+1 往返。
        // 设备指标数量来自现场配置，必须让查询次数保持为常数，否则详情页会放大数据库连接池压力。
        return await _dbContext.DeviceTelemetry
            .Where(t => t.DeviceId == deviceId)
            .GroupBy(t => t.Metric)
            .Select(g => g
                .OrderByDescending(t => t.Time)
                .Select(t => new
                {
                    Metric = t.Metric,
                    Value = t.Value ?? 0,
                })
                .First())
            .ToDictionaryAsync(t => t.Metric, t => t.Value, ct);
    }
}
