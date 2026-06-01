namespace EquipAI.Core.Entities;

/// <summary>
/// 技术人员画像 — 记录技能、工作负载和绩效数据，用于智能派工匹配
/// </summary>
public class TechnicianProfile : BaseEntity
{
    /// <summary>
    /// 所属租户 ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 关联用户 ID（对应 Users 表）
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// 技术人员姓名
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 擅长设备类型列表（JSON 数组，如 ["电机","CNC","注塑机"]）
    /// </summary>
    public string Skills { get; set; } = "[]";

    /// <summary>
    /// 当前进行中的工单数量（用于负载均衡）
    /// </summary>
    public int ActiveWorkCount { get; set; }

    /// <summary>
    /// 历史完成工单总数
    /// </summary>
    public int CompletedCount { get; set; }

    /// <summary>
    /// 平均完成工单时长（小时）
    /// </summary>
    public double? AvgCompletionHours { get; set; }

    /// <summary>
    /// 是否在线/可派工
    /// </summary>
    public bool IsAvailable { get; set; } = true;
}
