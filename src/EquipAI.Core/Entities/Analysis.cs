using EquipAI.Core.Enums;

namespace EquipAI.Core.Entities;

/// <summary>
/// AI 分析结果实体，存储根因分析的输出
/// 由 RootCauseAnalysisEngine 在告警触发后自动创建
/// </summary>
public class Analysis : BaseEntity
{
    /// <summary>
    /// 所属租户 ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 关联告警 ID
    /// </summary>
    public Guid AlertId { get; set; }

    /// <summary>
    /// 设备 ID
    /// </summary>
    public Guid DeviceId { get; set; }

    /// <summary>
    /// 关联告警规则 ID
    /// </summary>
    public Guid? RuleId { get; set; }

    /// <summary>
    /// 分析级别（L1/L2/L3/L4）
    /// </summary>
    public AnalysisLevel Level { get; set; }

    /// <summary>
    /// 分析状态
    /// </summary>
    public AnalysisStatus Status { get; set; }

    /// <summary>
    /// 置信度（0.0 - 1.0）
    /// </summary>
    public double? Confidence { get; set; }

    /// <summary>
    /// 数据质量评分（0.0 - 1.0）
    /// </summary>
    public double? DataQualityScore { get; set; }

    /// <summary>
    /// 根因描述
    /// </summary>
    public string? RootCause { get; set; }

    /// <summary>
    /// 建议措施
    /// </summary>
    public string? Suggestion { get; set; }

    /// <summary>
    /// LLM 原始响应（JSONB）
    /// </summary>
    public string? RawResponse { get; set; }

    /// <summary>
    /// 处理耗时（毫秒）
    /// </summary>
    public long? ProcessingTimeMs { get; set; }

    /// <summary>
    /// 分析完成时间
    /// </summary>
    public DateTime? CompletedAt { get; set; }
}
