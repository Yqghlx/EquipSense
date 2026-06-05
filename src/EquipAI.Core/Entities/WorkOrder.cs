using System.ComponentModel.DataAnnotations;
using EquipAI.Core.Enums;

namespace EquipAI.Core.Entities;

/// <summary>
/// 工单实体，支持完整的工单生命周期管理
/// 可由告警自动创建或手动创建
/// </summary>
public class WorkOrder : BaseEntity
{
    /// <summary>
    /// 所属租户 ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 工单编码（格式：WO-{yyyyMMdd}-{4位序号}）
    /// </summary>
    public string WorkOrderCode { get; set; } = string.Empty;

    /// <summary>
    /// 工单标题
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// 工单类型（纠正性/预防性/预测性）
    /// </summary>
    public WorkOrderType Type { get; set; }

    /// <summary>
    /// 工单状态
    /// </summary>
    public WorkOrderStatus Status { get; set; }

    /// <summary>
    /// 优先级
    /// </summary>
    public WorkOrderPriority Priority { get; set; }

    /// <summary>
    /// 关联设备 ID
    /// </summary>
    public Guid DeviceId { get; set; }

    /// <summary>
    /// 关联告警 ID（告警自动创建时有值）
    /// </summary>
    public Guid? AlertId { get; set; }

    /// <summary>
    /// 关联分析 ID（分析完成后更新）
    /// </summary>
    public Guid? AnalysisId { get; set; }

    /// <summary>
    /// 根因描述（来自 AI 分析或人工填写）
    /// </summary>
    public string? RootCause { get; set; }

    /// <summary>
    /// 解决措施
    /// </summary>
    public string? Resolution { get; set; }

    /// <summary>
    /// 实际维修时长（小时）
    /// </summary>
    public double? ActualHours { get; set; }

    /// <summary>
    /// 维修执行报告
    /// </summary>
    public string? ExecutionReport { get; set; }

    /// <summary>
    /// 使用零件（JSON 数组字符串）
    /// </summary>
    public string? RequiredParts { get; set; }

    /// <summary>
    /// 派工给谁（用户 ID）
    /// </summary>
    public Guid? AssignedTo { get; set; }

    /// <summary>
    /// 预计完成时间
    /// </summary>
    public DateTime? DueDate { get; set; }

    /// <summary>
    /// 开始执行时间
    /// </summary>
    public DateTime? StartedAt { get; set; }

    /// <summary>
    /// 完成时间
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// 关闭时间
    /// </summary>
    public DateTime? ClosedAt { get; set; }

    /// <summary>
    /// 创建者 ID
    /// </summary>
    public Guid? CreatedBy { get; set; }

    /// <summary>
    /// 乐观并发控制版本号（EF Core 自动管理）
    /// </summary>
    [Timestamp]
    public byte[]? RowVersion { get; set; }
}
