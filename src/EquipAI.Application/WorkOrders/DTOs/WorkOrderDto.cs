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
    public Guid? AssignedTo { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
