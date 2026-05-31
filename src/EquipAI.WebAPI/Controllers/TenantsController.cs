using EquipAI.Application.DTOs.Common;
using EquipAI.Application.DTOs.Tenants;
using EquipAI.Application.Interfaces;
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

    /// <summary>
    /// 初始化租户管理控制器
    /// </summary>
    /// <param name="tenantService">租户管理服务</param>
    public TenantsController(ITenantService tenantService)
    {
        _tenantService = tenantService;
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
}
