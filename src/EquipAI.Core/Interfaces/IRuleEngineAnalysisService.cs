namespace EquipAI.Core.Interfaces;

/// <summary>
/// L2 规则引擎诊断服务 — 从知识库匹配规则条件，输出诊断结论
/// 通过解析 knowledge_rules 表中的条件 JSON（指标名 + 操作符 + 阈值），
/// 与当前告警数据比对，找到匹配规则后返回结论和建议措施。
/// </summary>
public interface IRuleEngineAnalysisService
{
    /// <summary>
    /// 尝试匹配知识库规则并返回诊断结论
    /// 查询同租户 + 同设备类型的启用规则，逐一评估条件是否满足
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="deviceId">设备 ID（用于查询设备类型以匹配规则）</param>
    /// <param name="metric">告警指标名（如 temperature、vibration）</param>
    /// <param name="value">当前指标值</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>匹配到的第一条规则结果；无匹配时返回 null</returns>
    Task<RuleMatchResult?> MatchRuleAsync(
        Guid tenantId, Guid deviceId, string metric, double value, CancellationToken ct = default);
}

/// <summary>
/// 规则匹配结果，包含诊断结论和后续建议
/// </summary>
/// <param name="RuleId">匹配到的知识规则 ID</param>
/// <param name="RuleName">规则名称</param>
/// <param name="Conclusion">诊断结论描述</param>
/// <param name="RecommendedActions">推荐处理措施（JSON 数组格式）</param>
/// <param name="CheckSteps">检查步骤（JSON 格式）</param>
/// <param name="ConfidenceWeight">置信度权重（0-1），用于分析引擎加权计算</param>
public record RuleMatchResult(
    Guid RuleId,
    string RuleName,
    string Conclusion,
    string? RecommendedActions,
    string? CheckSteps,
    double ConfidenceWeight);
