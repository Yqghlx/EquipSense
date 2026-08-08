using EquipAI.Application.Devices;
using EquipAI.Core.Entities;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
    private readonly DeviceTypeTemplateService _service;

    public DeviceTypesController(DeviceTypeTemplateService service)
    {
        _service = service;
    }

    /// <summary>
    /// 获取设备类型模板列表（包含当前租户自定义模板和系统预置模板）
    /// 使用 IgnoreQueryFilters 跨租户查询，确保系统预置模板对所有租户可见
    /// </summary>
    /// <param name="industry">可选：按行业筛选模板</param>
    /// <returns>设备类型模板列表</returns>
    [HttpGet]
    [RequirePermission("device:read")]
    [ProducesResponseType(typeof(List<DeviceTypeTemplate>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<DeviceTypeTemplate>>> GetDeviceTypes([FromQuery] string? industry)
        => Ok(await _service.ListAsync(industry));

    /// <summary>
    /// 创建租户自定义设备类型模板
    /// </summary>
    /// <param name="request">创建设备类型模板请求</param>
    /// <returns>创建后的设备类型模板</returns>
    [HttpPost]
    [RequirePermission("device:create")]
    [ProducesResponseType(typeof(DeviceTypeTemplate), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<DeviceTypeTemplate>> CreateDeviceType([FromBody] CreateDeviceTypeTemplateRequest request)
    {
        var template = await _service.CreateAsync(request);
        return CreatedAtAction(nameof(GetDeviceTypes), new { }, template);
    }
}
