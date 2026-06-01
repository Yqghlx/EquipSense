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
    /// Level 2 — 规则引擎诊断（基于知识库规则匹配）
    /// </summary>
    L2,

    /// <summary>
    /// Level 3 — 统计分析（基于历史基线）
    /// </summary>
    L3,

    /// <summary>
    /// Level 4 — ML.NET SrCnn 异常检测（基于机器学习模型）
    /// </summary>
    L4
}
