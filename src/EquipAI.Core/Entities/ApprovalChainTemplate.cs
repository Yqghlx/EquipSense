using EquipAI.Core.Enums;

namespace EquipAI.Core.Entities;

/// <summary>
/// 审批链模板 — 按（工单类型, 优先级）匹配审批流程
/// </summary>
public class ApprovalChainTemplate : BaseEntity
{
    /// <summary>所属租户 ID</summary>
    public Guid TenantId { get; set; }

    /// <summary>适用的工单类型（null = 全局默认）</summary>
    public WorkOrderType? WorkOrderType { get; set; }

    /// <summary>适用的优先级（null = 该类型的默认链）</summary>
    public WorkOrderPriority? Priority { get; set; }

    /// <summary>模板名称</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>是否为该类型的默认链</summary>
    public bool IsDefault { get; set; }

    /// <summary>是否启用</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>审批步骤列表</summary>
    public List<ApprovalStep> Steps { get; set; } = [];
}
