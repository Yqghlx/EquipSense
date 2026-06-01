namespace EquipAI.Core.Interfaces;

/// <summary>
/// 规则准确率追踪器 — 工单关闭时更新关联规则的准确率统计
/// </summary>
public interface IRuleAccuracyTracker
{
    /// <summary>
    /// 记录规则匹配结果的准确性
    /// </summary>
    /// <param name="ruleId">匹配到的规则 ID</param>
    /// <param name="wasAccurate">规则诊断是否准确</param>
    /// <param name="ct">取消令牌</param>
    Task RecordAsync(Guid ruleId, bool wasAccurate, CancellationToken ct = default);
}
