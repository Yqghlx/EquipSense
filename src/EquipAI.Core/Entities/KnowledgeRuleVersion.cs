namespace EquipAI.Core.Entities;

/// <summary>
/// 知识规则版本快照 — 记录每次编辑的历史版本，支持版本回滚
/// </summary>
public class KnowledgeRuleVersion : BaseEntity
{
    /// <summary>
    /// 租户 ID（用于多租户隔离）
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 关联的知识规则 ID
    /// </summary>
    public Guid RuleId { get; set; }

    /// <summary>
    /// 版本号（从 1 开始递增）
    /// </summary>
    public int Version { get; set; }

    /// <summary>
    /// 规则完整快照（JSONB 格式，包含编辑时刻的所有规则字段）
    /// </summary>
    public string Snapshot { get; set; } = string.Empty;

    /// <summary>
    /// 本次变更的操作人 ID
    /// </summary>
    public Guid? ChangedBy { get; set; }

    /// <summary>
    /// 变更摘要（如 "编辑条件"、"修改阈值"、"回滚至版本 3"）
    /// </summary>
    public string? ChangeSummary { get; set; }
}
