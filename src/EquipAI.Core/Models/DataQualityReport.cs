namespace EquipAI.Core.Models;

/// <summary>
/// 数据质量评估报告，包含加权总分和 5 个维度的子评分
/// </summary>
public class DataQualityReport
{
    /// <summary>
    /// 设备 ID
    /// </summary>
    public Guid DeviceId { get; set; }

    /// <summary>
    /// 指标名称（如 temperature、pressure）
    /// </summary>
    public string Metric { get; set; } = string.Empty;

    /// <summary>
    /// 加权总分（0.0 - 1.0），为 5 个维度子分的加权平均
    /// 权重：完整性 30%、准确性 25%、时效性 15%、一致性 15%、有效性 15%
    /// </summary>
    public double Score { get; set; }

    /// <summary>
    /// 各维度的子评分（0.0 - 1.0）
    /// </summary>
    public DataQualityDimensions Dimensions { get; set; } = new();

    /// <summary>
    /// 评估使用的样本数量
    /// </summary>
    public int SampleCount { get; set; }

    /// <summary>
    /// 评估计算时间（UTC）
    /// </summary>
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// 数据质量 5 维度子评分
/// </summary>
public class DataQualityDimensions
{
    /// <summary>
    /// 完整性（权重 30%）：实际数据点数 / 预期数据点数
    /// 预期数据点数 = 时间窗口（秒） / 上报间隔（秒）
    /// </summary>
    public double Completeness { get; set; }

    /// <summary>
    /// 准确性（权重 25%）：合理值占比（3σ 范围内的数据点比例）
    /// 至少需要 10 个样本才能计算，否则返回默认值
    /// </summary>
    public double Accuracy { get; set; }

    /// <summary>
    /// 时效性（权重 15%）：在预期上报间隔内到达的数据点比例
    /// 比较相邻数据点的实际时间差与预期上报间隔
    /// </summary>
    public double Timeliness { get; set; }

    /// <summary>
    /// 一致性（权重 15%）：变异系数的逆，越低的变化率表示越高的一致性
    /// 即 1 - min(1.0, stddev / |mean|)
    /// </summary>
    public double Consistency { get; set; }

    /// <summary>
    /// 有效性（权重 15%）：通过基本合理性检查的数据点比例
    /// 检查：非 NaN、正值指标不为负数、在物理极限范围内
    /// </summary>
    public double Validity { get; set; }
}
