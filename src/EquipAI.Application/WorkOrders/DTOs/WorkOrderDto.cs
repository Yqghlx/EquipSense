namespace EquipAI.Application.WorkOrders.DTOs;

/// <summary>
/// 工单 DTO
/// </summary>
public class WorkOrderDto
{
    public Guid Id { get; set; }
    public string WorkOrderCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public Guid DeviceId { get; set; }
    public Guid? AlertId { get; set; }
    public Guid? AnalysisId { get; set; }
    public string? RootCause { get; set; }
    public string? Resolution { get; set; }

    /// <summary>
    /// 维修执行报告（详细维修过程）。知识沉淀生成故障案例 Solution 时优先使用本字段（为空则降级到 Resolution）。
    /// </summary>
    public string? ExecutionReport { get; set; }

    /// <summary>
    /// 使用零件（JSON 数组字符串）。知识沉淀记入故障案例 PartsUsed，并供备件成本核算。
    /// </summary>
    public string? RequiredParts { get; set; }

    public Guid? AssignedTo { get; set; }

    /// <summary>
    /// 被指派人的可读名称，优先使用显示名称，未配置时回退到登录用户名。
    /// </summary>
    public string? AssignedToName { get; set; }

    public DateTime? DueDate { get; set; }
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// 实际维修工时（小时）= CompletedAt - StartedAt。
    /// 核心运维 KPI：维修人工成本核算、MTTR（平均修复时间）、技师效率评估。
    /// 亦是知识沉淀时长阈值的依据（见 KnowledgeCaptureService）。
    /// </summary>
    public double? ActualHours { get; set; }

    public DateTime CreatedAt { get; set; }
}
