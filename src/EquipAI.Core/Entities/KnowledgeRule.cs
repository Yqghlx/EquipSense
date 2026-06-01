namespace EquipAI.Core.Entities;

/// <summary>
/// 正式知识规则（专家验证后的规则）
/// </summary>
public class KnowledgeRule : BaseEntity
{
    /// <summary>
    /// 租户 ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 适用设备类型
    /// </summary>
    public string DeviceType { get; set; } = string.Empty;

    /// <summary>
    /// 规则名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 触发条件（JSONB 格式）
    /// </summary>
    public string Conditions { get; set; } = string.Empty;

    /// <summary>
    /// 结论描述（JSONB 格式）
    /// </summary>
    public string Conclusion { get; set; } = string.Empty;

    /// <summary>
    /// 推荐处理措施
    /// </summary>
    public string? RecommendedActions { get; set; }

    /// <summary>
    /// 检查步骤
    /// </summary>
    public string? CheckSteps { get; set; }

    /// <summary>
    /// 置信度权重（0-1），用于 AI 分析时的规则权重计算
    /// </summary>
    public decimal ConfidenceWeight { get; set; } = 0.5m;

    /// <summary>
    /// 规则来源（imported=导入、expert=专家创建、ai_generated=AI 生成并已验证）
    /// </summary>
    public string Source { get; set; } = "imported";

    /// <summary>
    /// 准确率（历史匹配统计）
    /// </summary>
    public decimal? AccuracyRate { get; set; }

    /// <summary>
    /// 成功匹配次数
    /// </summary>
    public int SuccessCount { get; set; }

    /// <summary>
    /// 是否启用
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// 创建人
    /// </summary>
    public string? CreatedBy { get; set; }
}
