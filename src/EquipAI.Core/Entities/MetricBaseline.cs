namespace EquipAI.Core.Entities;

/// <summary>
/// 指标基线数据实体，存储基于历史遥测数据计算的统计基线
/// 由 BaselineCalculationService 定期从 telemetry_hourly 聚合更新
/// BaselineEvaluator 读取基线判断当前值是否偏离历史正常范围
/// </summary>
public class MetricBaseline : BaseEntity
{
    /// <summary>
    /// 所属租户 ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 设备 ID
    /// </summary>
    public Guid DeviceId { get; set; }

    /// <summary>
    /// 指标名称（如 temperature、vibration）
    /// </summary>
    public string Metric { get; set; } = string.Empty;

    /// <summary>
    /// 基线统计周期的起始时间
    /// </summary>
    public DateTime PeriodStart { get; set; }

    /// <summary>
    /// 基线统计周期的结束时间
    /// </summary>
    public DateTime PeriodEnd { get; set; }

    /// <summary>
    /// 均值
    /// </summary>
    public double? AvgValue { get; set; }

    /// <summary>
    /// 标准差
    /// </summary>
    public double? StdDev { get; set; }

    /// <summary>
    /// 最小值
    /// </summary>
    public double? MinValue { get; set; }

    /// <summary>
    /// 最大值
    /// </summary>
    public double? MaxValue { get; set; }

    /// <summary>
    /// 95 百分位值
    /// </summary>
    public double? P95Value { get; set; }

    /// <summary>
    /// 样本数量
    /// </summary>
    public int? SampleCount { get; set; }

    /// <summary>
    /// 最后更新时间
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
