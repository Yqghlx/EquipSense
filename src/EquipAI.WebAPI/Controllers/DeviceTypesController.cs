using EquipAI.Core.Constants;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 设备类型模板控制器，提供行业预置模板和租户自定义模板的管理接口
/// 查询时同时返回当前租户模板和系统租户的预置模板
/// </summary>
[ApiController]
[Route("api/v1/device-types")]
[Authorize]
public class DeviceTypesController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly ITenantContext _tenantContext;

    /// <summary>
    /// 初始化设备类型模板控制器
    /// </summary>
    /// <param name="dbContext">数据库上下文，直接操作以使用 IgnoreQueryFilters</param>
    /// <param name="tenantContext">租户上下文，用于获取当前租户 ID</param>
    public DeviceTypesController(AppDbContext dbContext, ITenantContext tenantContext)
    {
        _dbContext = dbContext;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 获取设备类型模板列表（包含当前租户自定义模板和系统预置模板）
    /// 使用 IgnoreQueryFilters 跨租户查询，确保系统预置模板对所有租户可见
    /// </summary>
    /// <returns>设备类型模板列表</returns>
    [HttpGet]
    [RequirePermission("device:read")]
    [ProducesResponseType(typeof(List<DeviceTypeTemplate>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<DeviceTypeTemplate>>> GetDeviceTypes()
    {
        // 查询当前租户模板 + 系统租户预置模板
        var templates = await _dbContext.DeviceTypeTemplates
            .IgnoreQueryFilters()
            .Where(t => t.TenantId == _tenantContext.TenantId
                     || t.TenantId == SystemConstants.SystemTenantId)
            .OrderByDescending(t => t.TenantId == _tenantContext.TenantId)
            .ThenBy(t => t.Name)
            .ToListAsync();

        return Ok(templates);
    }

    /// <summary>
    /// 创建租户自定义设备类型模板
    /// </summary>
    /// <param name="request">创建设备类型模板请求</param>
    /// <returns>创建后的设备类型模板</returns>
    [HttpPost]
    [RequirePermission("device:create")]
    [ProducesResponseType(typeof(DeviceTypeTemplate), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<DeviceTypeTemplate>> CreateDeviceType([FromBody] CreateDeviceTypeRequest request)
    {
        var template = new DeviceTypeTemplate
        {
            TenantId = _tenantContext.TenantId,
            Name = request.Name,
            Industry = request.Industry,
            Parameters = request.Parameters ?? "{}"
        };

        _dbContext.DeviceTypeTemplates.Add(template);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetDeviceTypes), new { }, template);
    }
}

/// <summary>
/// 创建设备类型模板请求 DTO
/// </summary>
public class CreateDeviceTypeRequest
{
    /// <summary>
    /// 模板名称（如 "三相异步电机"、"离心泵"）
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 所属行业（如 "制造业"、"化工"、"电力"）
    /// </summary>
    public string? Industry { get; set; }

    /// <summary>
    /// 设备参数定义（JSONB），描述该类型设备的监控指标、单位、范围等
    /// </summary>
    public string? Parameters { get; set; }
}
