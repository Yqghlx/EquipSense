namespace EquipAI.Application.WorkOrders;

/// <summary>
/// SLA 时限追踪器
/// 根据工单优先级计算响应时限，提供逾期检测和剩余时间展示
/// </summary>
public static class SlaTracker
{
    /// <summary>
    /// 各优先级对应的 SLA 响应时长（小时）
    /// </summary>
    private static readonly Dictionary<string, int> SlaHours = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Critical"] = 2,
        ["High"] = 8,
        ["Medium"] = 24,
        ["Low"] = 72
    };

    /// <summary>
    /// 根据优先级计算工单到期时间
    /// </summary>
    public static DateTime CalculateDueDate(string priority, DateTime createdAt)
    {
        var hours = SlaHours.GetValueOrDefault(priority, 24);
        return createdAt.AddHours(hours);
    }

    /// <summary>
    /// 判断工单是否已逾期
    /// </summary>
    public static bool IsOverdue(DateTime? dueDate)
    {
        return dueDate.HasValue && DateTime.UtcNow > dueDate.Value;
    }

    /// <summary>
    /// 获取剩余时间的中文文本描述
    /// </summary>
    public static string GetRemainingText(DateTime? dueDate)
    {
        if (!dueDate.HasValue) return "无期限";

        var remaining = dueDate.Value - DateTime.UtcNow;
        if (remaining.TotalMinutes <= 0)
        {
            return $"逾期 {Math.Abs((int)remaining.TotalHours)}h{Math.Abs(remaining.Minutes)}m";
        }

        if (remaining.TotalHours < 1)
            return $"剩余 {(int)remaining.TotalMinutes}m";

        return $"剩余 {(int)remaining.TotalHours}h{remaining.Minutes}m";
    }
}
