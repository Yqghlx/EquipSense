namespace EquipAI.Application.WorkOrders.DTOs;

/// <summary>
/// 创建工单请求
/// </summary>
public class CreateWorkOrderRequest
{
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = "corrective";
    public string Priority { get; set; } = "medium";
    public Guid DeviceId { get; set; }
    public Guid? AlertId { get; set; }
    public string? RootCause { get; set; }
    public string? Description { get; set; }
    public DateTime? DueDate { get; set; }
}
