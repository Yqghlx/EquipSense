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
/// 多租户隔离由 AppDbContext 全局查询过滤器自动处理
/// </summary>
public class TelemetryQueryService
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<TelemetryQueryService> _logger;

    public TelemetryQueryService(
        AppDbContext dbContext,
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
    /// <returns>按时间升序排列的数据点列表</returns>
    public async Task<List<TelemetryDataPoint>> QueryAsync(
        Guid deviceId, string metric, DateTime startTime, DateTime endTime)
    {
        _logger.LogInformation("查询设备 {DeviceId} 指标 {Metric} 的遥测数据，时间范围：{Start} ~ {End}",
            deviceId, metric, startTime, endTime);

        return await _dbContext.DeviceTelemetry
            .Where(t => t.DeviceId == deviceId
                     && t.Metric == metric
                     && t.Time >= startTime
                     && t.Time <= endTime)
            .OrderBy(t => t.Time)
            .Select(t => new TelemetryDataPoint(t.Time, t.Value ?? 0))
            .ToListAsync();
    }

    /// <summary>
    /// 查询设备所有指标的最新遥测数据
    /// 用于设备详情页的实时数据展示
    /// </summary>
    /// <param name="deviceId">设备 ID</param>
    /// <returns>指标名 → 最新值的字典</returns>
    public async Task<Dictionary<string, double>> GetLatestAsync(Guid deviceId)
    {
        _logger.LogInformation("查询设备 {DeviceId} 的最新遥测数据", deviceId);

        // 先获取每个指标的最新时间点
        var latestTimes = await _dbContext.DeviceTelemetry
            .Where(t => t.DeviceId == deviceId)
            .GroupBy(t => t.Metric)
            .Select(g => new { Metric = g.Key, LatestTime = g.Max(t => t.Time) })
            .ToListAsync();

        var result = new Dictionary<string, double>();
        foreach (var item in latestTimes)
        {
            var value = await _dbContext.DeviceTelemetry
                .Where(t => t.DeviceId == deviceId
                         && t.Metric == item.Metric
                         && t.Time == item.LatestTime)
                .Select(t => t.Value ?? 0)
                .FirstOrDefaultAsync();
            result[item.Metric] = value;
        }

        return result;
    }
}
