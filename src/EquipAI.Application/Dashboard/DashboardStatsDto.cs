namespace EquipAI.Application.Dashboard;

/// <summary>
/// 仪表盘统计数据 — 一次请求返回所有仪表盘所需指标
/// </summary>
public class DashboardStats
{
    /// <summary>设备总数</summary>
    public int TotalDevices { get; set; }

    /// <summary>在线设备数</summary>
    public int OnlineDevices { get; set; }

    /// <summary>活跃告警数</summary>
    public int ActiveAlerts { get; set; }

    /// <summary>待派工工单数</summary>
    public int PendingWorkOrders { get; set; }

    /// <summary>设备可用率（百分比）</summary>
    public double Availability { get; set; }

    /// <summary>告警级别分布（级别名 → 数量）</summary>
    public Dictionary<string, int> AlertsBySeverity { get; set; } = [];

    /// <summary>工单状态分布（状态名 → 数量）</summary>
    public Dictionary<string, int> WorkOrdersByStatus { get; set; } = [];

    /// <summary>告警趋势（最近 7 天，每天一条）</summary>
    public List<TrendPoint> AlertTrend { get; set; } = [];

    /// <summary>工单趋势（最近 7 天，每天一条）</summary>
    public List<TrendPoint> WorkOrderTrend { get; set; } = [];
}

/// <summary>
/// 趋势数据点
/// </summary>
public class TrendPoint
{
    /// <summary>日期（yyyy-MM-dd 格式）</summary>
    public string Date { get; set; } = string.Empty;

    /// <summary>数量</summary>
    public int Count { get; set; }
}
