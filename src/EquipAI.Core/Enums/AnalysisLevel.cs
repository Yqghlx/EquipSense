namespace EquipAI.Core.Enums;

/// <summary>
/// AI 分析级别，按自动降级链排列
/// </summary>
public enum AnalysisLevel
{
    /// <summary>
    /// Level 1 — LLM 对话诊断（兜底）
    /// </summary>
    L1,

    /// <summary>
    /// Level 2 — 规则引擎诊断（需知识库，暂不实现）
    /// </summary>
    L2,

    /// <summary>
    /// Level 3 — 统计分析（基于历史基线）
    /// </summary>
    L3
}
