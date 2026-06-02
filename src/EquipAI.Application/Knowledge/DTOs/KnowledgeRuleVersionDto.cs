namespace EquipAI.Application.Knowledge.DTOs;

/// <summary>
/// 知识规则版本 DTO
/// </summary>
public class KnowledgeRuleVersionDto
{
    /// <summary>版本记录 ID</summary>
    public Guid Id { get; set; }

    /// <summary>关联规则 ID</summary>
    public Guid RuleId { get; set; }

    /// <summary>版本号</summary>
    public int Version { get; set; }

    /// <summary>规则快照（JSON）</summary>
    public string Snapshot { get; set; } = string.Empty;

    /// <summary>变更人 ID</summary>
    public Guid? ChangedBy { get; set; }

    /// <summary>变更摘要</summary>
    public string? ChangeSummary { get; set; }

    /// <summary>创建时间</summary>
    public DateTime CreatedAt { get; set; }
}
