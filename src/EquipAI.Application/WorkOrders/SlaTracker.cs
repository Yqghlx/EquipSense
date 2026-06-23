using EquipAI.Core.Enums;

namespace EquipAI.Application.WorkOrders;

/// <summary>
/// SLA 时限追踪器
/// 根据工单优先级计算响应时限，提供逾期检测和剩余时间展示
/// </summary>
public static class SlaTracker
{
    /// <summary>
    /// 各优先级对应的 SLA 响应时长（小时）
    ///
    /// 关键不变量：这是全系统 SLA 时限的**单一来源**。
    /// SlaManagementService（后端超时扫描）必须引用此字典，
    /// 否则会出现前端倒计时显示 2h、后端判定 4h 才超时的矛盾。
    /// </summary>
    public static readonly Dictionary<string, int> SlaHours = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Critical"] = 2,
        ["High"] = 8,
        ["Medium"] = 24,
        ["Low"] = 72
    };

    /// <summary>
    /// 按枚举查询 SLA 时限（供 SlaManagementService 使用）
    /// </summary>
    public static int GetHours(WorkOrderPriority priority)
        => SlaHours.TryGetValue(priority.ToString(), out var h) ? h : 24;

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
