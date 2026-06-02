using EquipAI.Application.DTOs.Common;
using EquipAI.Application.WorkOrders;
using EquipAI.Application.WorkOrders.DTOs;
using EquipAI.Core.Interfaces;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 工单管理控制器
/// 提供工单的完整生命周期管理：创建、派工、执行、验收和关闭
/// </summary>
[ApiController]
[Route("api/v1/work-orders")]
[Authorize]
public class WorkOrdersController : ControllerBase
{
    private readonly IWorkOrderService _workOrderService;
    private readonly ITenantContext _tenantContext;

    public WorkOrdersController(IWorkOrderService workOrderService, ITenantContext tenantContext)
    {
        _workOrderService = workOrderService;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 分页查询工单列表，支持按状态和设备 ID 筛选
    /// </summary>
    [HttpGet]
    [RequirePermission("workorder:read")]
    [ProducesResponseType(typeof(PagedResult<WorkOrderDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<WorkOrderDto>>> GetWorkOrders(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null, [FromQuery] Guid? deviceId = null)
    {
        var result = await _workOrderService.ListAsync(_tenantContext.TenantId, page, pageSize, status, deviceId);
        return Ok(result);
    }

    /// <summary>
    /// 根据 ID 获取工单详情
    /// </summary>
    [HttpGet("{id:guid}")]
    [RequirePermission("workorder:read")]
    [ProducesResponseType(typeof(WorkOrderDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkOrderDto>> GetWorkOrder(Guid id)
    {
        var wo = await _workOrderService.GetByIdAsync(_tenantContext.TenantId, id);
        if (wo == null)
            return NotFound(new { code = 404, message = "工单不存在" });

        return Ok(wo);
    }

    /// <summary>
    /// 手动创建工单
    /// </summary>
    [HttpPost]
    [RequirePermission("workorder:create")]
    [ProducesResponseType(typeof(WorkOrderDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<WorkOrderDto>> CreateWorkOrder([FromBody] CreateWorkOrderRequest request)
    {
        var wo = await _workOrderService.CreateAsync(_tenantContext.TenantId, request, _tenantContext.UserId);
        return CreatedAtAction(nameof(GetWorkOrder), new { id = wo.Id }, wo);
    }

    /// <summary>
    /// 派工：将工单指派给指定技术人员
    /// </summary>
    [HttpPut("{id:guid}/assign")]
    [RequirePermission("workorder:dispatch")]
    [ProducesResponseType(typeof(WorkOrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkOrderDto>> AssignWorkOrder(Guid id, [FromBody] AssignWorkOrderRequest request)
    {
        return Ok(await _workOrderService.AssignAsync(_tenantContext.TenantId, id, request, _tenantContext.UserId));
    }

    /// <summary>
    /// 开始执行工单
    /// </summary>
    [HttpPut("{id:guid}/start")]
    [RequirePermission("workorder:execute")]
    [ProducesResponseType(typeof(WorkOrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkOrderDto>> StartWorkOrder(Guid id)
    {
        return Ok(await _workOrderService.StartAsync(_tenantContext.TenantId, id, _tenantContext.UserId));
    }

    /// <summary>
    /// 完成工单：提交处理结果
    /// </summary>
    [HttpPut("{id:guid}/complete")]
    [RequirePermission("workorder:execute")]
    [ProducesResponseType(typeof(WorkOrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkOrderDto>> CompleteWorkOrder(Guid id, [FromBody] CompleteWorkOrderRequest request)
    {
        return Ok(await _workOrderService.CompleteAsync(_tenantContext.TenantId, id, request, _tenantContext.UserId));
    }

    /// <summary>
    /// 验收通过工单
    /// </summary>
    [HttpPut("{id:guid}/accept")]
    [RequirePermission("workorder:accept")]
    [ProducesResponseType(typeof(WorkOrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkOrderDto>> AcceptWorkOrder(Guid id, [FromBody] NoteRequest? note = null)
    {
        return Ok(await _workOrderService.AcceptAsync(_tenantContext.TenantId, id, _tenantContext.UserId, note?.Note));
    }

    /// <summary>
    /// 验收驳回工单
    /// </summary>
    [HttpPut("{id:guid}/reject")]
    [RequirePermission("workorder:accept")]
    [ProducesResponseType(typeof(WorkOrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkOrderDto>> RejectWorkOrder(Guid id, [FromBody] NoteRequest? note = null)
    {
        return Ok(await _workOrderService.RejectAsync(_tenantContext.TenantId, id, _tenantContext.UserId, note?.Note));
    }

    /// <summary>
    /// 关闭工单
    /// </summary>
    [HttpPut("{id:guid}/close")]
    [RequirePermission("workorder:close")]
    [ProducesResponseType(typeof(WorkOrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkOrderDto>> CloseWorkOrder(Guid id, [FromBody] NoteRequest? note = null)
    {
        return Ok(await _workOrderService.CloseAsync(_tenantContext.TenantId, id, _tenantContext.UserId, note?.Note));
    }

    /// <summary>
    /// 取消工单
    /// </summary>
    [HttpPut("{id:guid}/cancel")]
    [RequirePermission("workorder:cancel")]
    [ProducesResponseType(typeof(WorkOrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkOrderDto>> CancelWorkOrder(Guid id, [FromBody] NoteRequest? note = null)
    {
        return Ok(await _workOrderService.CancelAsync(_tenantContext.TenantId, id, _tenantContext.UserId, note?.Note));
    }
}

/// <summary>
/// 通用备注请求，用于验收、关闭、取消等操作
/// </summary>
public class NoteRequest
{
    /// <summary>
    /// 备注内容
    /// </summary>
    public string? Note { get; set; }
}
