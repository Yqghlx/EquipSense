using EquipAI.Application.DTOs.Common;
using EquipAI.Application.DTOs.Tenants;
using EquipAI.Application.Interfaces;
using EquipAI.Application.Services;
using EquipAI.Core.Interfaces;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 租户管理控制器，提供租户 CRUD 和用量查询接口
/// 仅限系统管理员操作
/// </summary>
[ApiController]
[Route("api/v1/admin/tenants")]
[Authorize]
public class TenantsController : ControllerBase
{
    private readonly ITenantService _tenantService;
    private readonly ISubscriptionService _subscriptionService;
    private readonly BillingService _billingService;

    /// <summary>
    /// 初始化租户管理控制器
    /// </summary>
    /// <param name="tenantService">租户管理服务</param>
    /// <param name="subscriptionService">订阅管理服务</param>
    /// <param name="billingService">账单服务</param>
    public TenantsController(
        ITenantService tenantService,
        ISubscriptionService subscriptionService,
        BillingService billingService)
    {
        _tenantService = tenantService;
        _subscriptionService = subscriptionService;
        _billingService = billingService;
    }

    /// <summary>
    /// 分页查询租户列表
    /// </summary>
    /// <param name="query">分页查询参数</param>
    /// <returns>分页租户结果</returns>
    [HttpGet]
    [RequirePermission("tenant:read")]
    [ProducesResponseType(typeof(PagedResult<TenantDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<TenantDto>>> GetTenants([FromQuery] PagedQuery query)
    {
        var result = await _tenantService.GetTenantsAsync(query);
        return Ok(result);
    }

    /// <summary>
    /// 根据 ID 获取租户详情
    /// </summary>
    /// <param name="id">租户 ID</param>
    /// <returns>租户信息</returns>
    [HttpGet("{id:guid}")]
    [RequirePermission("tenant:read")]
    [ProducesResponseType(typeof(TenantDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TenantDto>> GetTenant(Guid id)
    {
        var tenant = await _tenantService.GetTenantByIdAsync(id);
        if (tenant == null)
        {
            return NotFound(new { code = 404, message = "租户不存在" });
        }
        return Ok(tenant);
    }

    /// <summary>
    /// 创建新租户
    /// </summary>
    /// <param name="request">创建租户请求</param>
    /// <returns>创建后的租户信息</returns>
    [HttpPost]
    [RequirePermission("tenant:create")]
    [ProducesResponseType(typeof(TenantDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<TenantDto>> CreateTenant([FromBody] CreateTenantRequest request)
    {
        var tenant = await _tenantService.CreateTenantAsync(request);
        return CreatedAtAction(nameof(GetTenant), new { id = tenant.Id }, tenant);
    }

    /// <summary>
    /// 更新租户信息
    /// </summary>
    /// <param name="id">租户 ID</param>
    /// <param name="request">更新租户请求</param>
    /// <returns>更新后的租户信息</returns>
    [HttpPut("{id:guid}")]
    [RequirePermission("tenant:update")]
    [ProducesResponseType(typeof(TenantDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TenantDto>> UpdateTenant(Guid id, [FromBody] UpdateTenantRequest request)
    {
        var tenant = await _tenantService.UpdateTenantAsync(id, request);
        return Ok(tenant);
    }

    /// <summary>
    /// 获取租户当前用量统计（设备数、用户数等）
    /// </summary>
    /// <param name="id">租户 ID</param>
    /// <returns>用量统计字典</returns>
    [HttpGet("{id:guid}/usage")]
    [RequirePermission("tenant:read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Dictionary<string, int>>> GetTenantUsage(Guid id)
    {
        var usage = await _tenantService.GetTenantUsageAsync(id);
        return Ok(usage);
    }

    /// <summary>
    /// 获取租户订阅信息（计划、用量、配额）
    /// </summary>
    [HttpGet("{id:guid}/subscription")]
    [RequirePermission("tenant:read")]
    [ProducesResponseType(typeof(SubscriptionInfo), StatusCodes.Status200OK)]
    public async Task<ActionResult<SubscriptionInfo>> GetSubscription(Guid id)
    {
        var subscription = await _subscriptionService.GetSubscriptionAsync(id);
        return Ok(subscription);
    }

    /// <summary>
    /// 变更租户计划（升级/降级）
    /// </summary>
    [HttpPut("{id:guid}/plan")]
    [RequirePermission("tenant:update")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> ChangePlan(Guid id, [FromBody] ChangePlanRequest request)
    {
        await _subscriptionService.ChangePlanAsync(id, request.Plan);
        return Ok(new { message = "计划变更成功" });
    }

    /// <summary>
    /// 获取租户详情（包含基础信息 + 资源用量）
    /// </summary>
    /// <param name="id">租户 ID</param>
    /// <returns>租户详情信息</returns>
    [HttpGet("{id:guid}/detail")]
    [RequirePermission("tenant:read")]
    [ProducesResponseType(typeof(TenantDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TenantDetailDto>> GetTenantDetail(Guid id)
    {
        var detail = await _tenantService.GetTenantDetailAsync(id);
        if (detail == null)
        {
            return NotFound(new { code = 404, message = "租户不存在" });
        }
        return Ok(detail);
    }

    /// <summary>
    /// 冻结租户 — 禁止创建资源，用于违规或欠费场景
    /// </summary>
    /// <param name="id">租户 ID</param>
    [HttpPut("{id:guid}/freeze")]
    [RequirePermission("tenant:update")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> FreezeTenant(Guid id)
    {
        await _tenantService.FreezeTenantAsync(id);
        return Ok(new { message = "租户已冻结" });
    }

    /// <summary>
    /// 解冻租户 — 恢复正常使用
    /// </summary>
    /// <param name="id">租户 ID</param>
    [HttpPut("{id:guid}/unfreeze")]
    [RequirePermission("tenant:update")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> UnfreezeTenant(Guid id)
    {
        await _tenantService.UnfreezeTenantAsync(id);
        return Ok(new { message = "租户已解冻" });
    }

    /// <summary>
    /// 获取全局统计（总租户数、活跃数、试用数、冻结数、总设备、总用户）
    /// 排除系统租户
    /// </summary>
    [HttpGet("stats")]
    [RequirePermission("tenant:read")]
    [ProducesResponseType(typeof(Dictionary<string, object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<Dictionary<string, object>>> GetGlobalStats()
    {
        var stats = await _tenantService.GetGlobalStatsAsync();
        return Ok(stats);
    }

    /// <summary>
    /// 获取租户账单历史
    /// </summary>
    /// <param name="id">租户 ID</param>
    /// <param name="page">页码</param>
    /// <param name="pageSize">每页条数</param>
    [HttpGet("{id:guid}/billing")]
    [RequirePermission("tenant:read")]
    public async Task<ActionResult> GetBillingHistory(Guid id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var (items, total) = await _billingService.GetBillingHistoryAsync(id, page, pageSize);
        return Ok(new { items, total, page, pageSize });
    }
}
