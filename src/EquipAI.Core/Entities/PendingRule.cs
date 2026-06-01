using EquipAI.Core.Enums;

namespace EquipAI.Core.Entities;

/// <summary>
/// 候选规则（AI 自动生成，专家验证前不进入正式规则库）
/// </summary>
public class PendingRule : BaseEntity
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
    /// 来源工单 ID（AI 从工单中提取规则时关联）
    /// </summary>
    public Guid? SourceWorkorderId { get; set; }

    /// <summary>
    /// 来源故障案例 ID（AI 从案例中提取规则时关联）
    /// </summary>
    public Guid? SourceCaseId { get; set; }

    /// <summary>
    /// AI 给出的置信度评分（0-1）
    /// </summary>
    public decimal? Confidence { get; set; }

    /// <summary>
    /// 审核状态
    /// </summary>
    public ReviewStatus ReviewStatus { get; set; } = ReviewStatus.Pending;

    /// <summary>
    /// 审核人用户 ID
    /// </summary>
    public Guid? ReviewedBy { get; set; }

    /// <summary>
    /// 审核意见
    /// </summary>
    public string? ReviewComment { get; set; }

    /// <summary>
    /// 审核时间
    /// </summary>
    public DateTime? ReviewedAt { get; set; }
}
