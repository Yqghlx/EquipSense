using EquipAI.Application.Analysis;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 设备对比分析控制器（Phase 5 新增）
/// </summary>
[ApiController]
[Route("api/v1/device-comparison")]
[Authorize]
public class DeviceComparisonController : ControllerBase
{
    private readonly DeviceComparisonService _comparisonService;
    private readonly ITenantContext _tenantContext;

    public DeviceComparisonController(DeviceComparisonService comparisonService, ITenantContext tenantContext)
    {
        _comparisonService = comparisonService;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 对比指定设备类型的多个设备指标
    /// </summary>
    [HttpGet]
    [RequirePermission("device:read")]
    [ProducesResponseType(typeof(DeviceComparisonResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<DeviceComparisonResult>> Compare(
        [FromQuery] string deviceType,
        [FromQuery] string metric,
        [FromQuery] int hours = 24,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(deviceType) || string.IsNullOrWhiteSpace(metric))
            return BadRequest(new { message = "deviceType 和 metric 不能为空" });

        var result = await _comparisonService.CompareAsync(
            _tenantContext.TenantId, deviceType, metric, hours, ct);
        return Ok(result);
    }
}
