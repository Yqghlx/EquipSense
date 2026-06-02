using EquipAI.Application.DTOs.Common;
using EquipAI.Core.Models;
using EquipAI.Application.WorkOrders.DTOs;

namespace EquipAI.Application.WorkOrders;

/// <summary>
/// 工单服务接口，提供工单生命周期管理
/// </summary>
public interface IWorkOrderService
{
    Task<WorkOrderDto> CreateAsync(Guid tenantId, CreateWorkOrderRequest request, Guid? userId = null, CancellationToken ct = default);
    Task<WorkOrderDto> GetByIdAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<PagedResult<WorkOrderDto>> ListAsync(Guid tenantId, int page, int pageSize, string? status = null, Guid? deviceId = null, CancellationToken ct = default);
    Task<WorkOrderDto> AssignAsync(Guid tenantId, Guid id, AssignWorkOrderRequest request, Guid userId, CancellationToken ct = default);
    Task<WorkOrderDto> StartAsync(Guid tenantId, Guid id, Guid userId, CancellationToken ct = default);
    Task<WorkOrderDto> CompleteAsync(Guid tenantId, Guid id, CompleteWorkOrderRequest request, Guid userId, CancellationToken ct = default);
    Task<WorkOrderDto> AcceptAsync(Guid tenantId, Guid id, Guid userId, string? note = null, CancellationToken ct = default);
    Task<WorkOrderDto> RejectAsync(Guid tenantId, Guid id, Guid userId, string? note = null, CancellationToken ct = default);
    Task<WorkOrderDto> CloseAsync(Guid tenantId, Guid id, Guid userId, string? note = null, CancellationToken ct = default);
    Task<WorkOrderDto> CancelAsync(Guid tenantId, Guid id, Guid userId, string? note = null, CancellationToken ct = default);
}
