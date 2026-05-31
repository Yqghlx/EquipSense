namespace EquipAI.Application.WorkOrders.DTOs;

/// <summary>
/// 派工请求
/// </summary>
public class AssignWorkOrderRequest
{
    public Guid AssignedTo { get; set; }
    public string? Note { get; set; }
}
