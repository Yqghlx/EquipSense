namespace EquipAI.Core.Interfaces;

/// <summary>
/// 基线计算服务接口
/// 从 telemetry_hourly 视图聚合历史统计数据，写入 metric_baselines 表
/// </summary>
public interface IBaselineCalculationService
{
    /// <summary>
    /// 执行一次基线计算（从最近 7 天的小时聚合数据计算基线）
    /// </summary>
    Task CalculateBaselinesAsync(CancellationToken cancellationToken = default);
}
