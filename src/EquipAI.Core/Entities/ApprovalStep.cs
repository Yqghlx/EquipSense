namespace EquipAI.Core.Entities;

/// <summary>
/// 审批步骤 — 审批链模板中的一级审批节点
/// </summary>
public class ApprovalStep : BaseEntity
{
    /// <summary>所属审批链 ID</summary>
    public Guid ChainId { get; set; }

    /// <summary>步骤顺序（从 1 开始）</summary>
    public int StepOrder { get; set; }

    /// <summary>期望审批角色（如 "maintenance_lead"、"system_admin"）</summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>指定审批人 ID（可选，null = 按角色匹配）</summary>
    public Guid? SpecificApproverId { get; set; }

    /// <summary>是否必须（预留会签场景）</summary>
    public bool IsRequired { get; set; } = true;
}
