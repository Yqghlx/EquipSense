using EquipAI.Application.Approvals;
using EquipAI.Application.Approvals.DTOs;
using EquipAI.Application.DTOs.Common;
using EquipAI.Application.WorkOrders;
using EquipAI.Application.WorkOrders.DTOs;
using EquipAI.Core.Interfaces;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 工单管理控制器
/// 提供工单的完整生命周期管理：创建、派工、执行、审批、验收和关闭
/// </summary>
[ApiController]
[Route("api/v1/work-orders")]
[Authorize]
public class WorkOrdersController : ControllerBase
{
    private readonly IWorkOrderService _workOrderService;
    private readonly IApprovalChainService _approvalChainService;
    private readonly WorkOrderStatisticsService _statisticsService;
    private readonly ITenantContext _tenantContext;

    public WorkOrdersController(
        IWorkOrderService workOrderService,
        IApprovalChainService approvalChainService,
        WorkOrderStatisticsService statisticsService,
        ITenantContext tenantContext)
    {
        _workOrderService = workOrderService;
        _statisticsService = statisticsService;
        _approvalChainService = approvalChainService;
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
    /// 获取工单统计数据（按状态/类型/优先级分布 + 时间趋势 + SLA 达成率）
    /// </summary>
    [HttpGet("statistics")]
    [RequirePermission("workorder:read")]
    [ProducesResponseType(typeof(WorkOrderStatistics), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkOrderStatistics>> GetStatistics(
        [FromQuery] int period = 30)
    {
        // 限定合法的统计周期：7/30/90 天
        var periodDays = period is 7 or 30 or 90 ? period : 30;
        var stats = await _statisticsService.GetStatisticsAsync(
            _tenantContext.TenantId, periodDays, HttpContext.RequestAborted);
        return Ok(stats);
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
        try
        {
            return Ok(await _workOrderService.AssignAsync(_tenantContext.TenantId, id, request, _tenantContext.UserId));
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict(new { code = 409, message = "工单数据已被其他操作修改，请刷新后重试" });
        }
    }

    /// <summary>
    /// 开始执行工单
    /// </summary>
    [HttpPut("{id:guid}/start")]
    [RequirePermission("workorder:execute")]
    [ProducesResponseType(typeof(WorkOrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkOrderDto>> StartWorkOrder(Guid id)
    {
        try
        {
            return Ok(await _workOrderService.StartAsync(_tenantContext.TenantId, id, _tenantContext.UserId));
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict(new { code = 409, message = "工单数据已被其他操作修改，请刷新后重试" });
        }
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

    /// <summary>
    /// 提交验收 — 触发审批链
    /// 工单状态必须为 InProgress 或 Completed，提交后自动匹配审批链模板并创建审批记录
    /// 若无匹配的审批链模板，则直接走原来的 Complete 流程
    /// </summary>
    [HttpPost("{id:guid}/submit")]
    [RequirePermission("workorder:execute")]
    [ProducesResponseType(typeof(WorkOrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkOrderDto>> SubmitWorkOrder(Guid id, [FromBody] CompleteWorkOrderRequest request)
    {
        return Ok(await _workOrderService.SubmitAsync(
            _tenantContext.TenantId, id, request, _tenantContext.UserId));
    }

    /// <summary>
    /// 审批通过 — 当前审批步骤通过
    /// 所有步骤通过后，工单状态自动变为 Accepted
    /// </summary>
    [HttpPost("{id:guid}/approve")]
    [RequirePermission("workorder:accept")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult> ApproveWorkOrder(Guid id, [FromBody] ApprovalActionRequest? request = null)
    {
        await _approvalChainService.ApproveAsync(
            _tenantContext.TenantId, id, _tenantContext.UserId, request?.Comment);
        return Ok(new { message = "审批通过" });
    }

    /// <summary>
    /// 审批驳回 — 当前审批步骤驳回，工单回到 InProgress
    /// </summary>
    [HttpPost("{id:guid}/reject-approval")]
    [RequirePermission("workorder:accept")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult> RejectApproval(Guid id, [FromBody] ApprovalActionRequest? request = null)
    {
        await _approvalChainService.RejectAsync(
            _tenantContext.TenantId, id, _tenantContext.UserId, request?.Comment);
        return Ok(new { message = "审批已驳回" });
    }

    /// <summary>
    /// 获取工单审批记录
    /// 按步骤顺序返回该工单的所有审批记录
    /// </summary>
    [HttpGet("{id:guid}/approvals")]
    [RequirePermission("workorder:read")]
    [ProducesResponseType(typeof(List<WorkOrderApprovalDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<WorkOrderApprovalDto>>> GetApprovals(Guid id)
    {
        return Ok(await _approvalChainService.GetApprovalsAsync(_tenantContext.TenantId, id));
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
