namespace EquipAI.Application.WorkOrders.DTOs;

/// <summary>
/// 工单统计 DTO — 包含分布、趋势、时长和 SLA 数据
/// </summary>
public class WorkOrderStatistics
{
    /// <summary>
    /// 按状态分布（键为枚举名，值为数量）
    /// </summary>
    public Dictionary<string, int> ByStatus { get; set; } = new();

    /// <summary>
    /// 按类型分布
    /// </summary>
    public Dictionary<string, int> ByType { get; set; } = new();

    /// <summary>
    /// 按优先级分布
    /// </summary>
    public Dictionary<string, int> ByPriority { get; set; } = new();

    /// <summary>
    /// 每日新建工单趋势
    /// </summary>
    public List<TrendPoint> CreatedTrend { get; set; } = new();

    /// <summary>
    /// 每日完成工单趋势
    /// </summary>
    public List<TrendPoint> CompletedTrend { get; set; } = new();

    /// <summary>
    /// 按优先级分组的平均完成时长（小时）
    /// </summary>
    public Dictionary<string, double> AvgCompletionHoursByPriority { get; set; } = new();

    /// <summary>
    /// SLA 达成率（百分比 0-100），按优先级分组
    /// </summary>
    public Dictionary<string, double> SlaRateByPriority { get; set; } = new();

    /// <summary>
    /// 总工单数
    /// </summary>
    public int Total { get; set; }
}

/// <summary>
/// 趋势数据点
/// </summary>
public class TrendPoint
{
    public string Date { get; set; } = string.Empty;
    public int Count { get; set; }
}
