using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 数据质量控制器，提供遥测数据质量评分和维度明细查询接口
/// </summary>
[ApiController]
[Route("api/v1/data-quality")]
[Authorize]
public class DataQualityController : ControllerBase
{
    private readonly IDataQualityService _dataQualityService;
    private readonly ITenantContext _tenantContext;

    public DataQualityController(
        IDataQualityService dataQualityService,
        ITenantContext tenantContext)
    {
        _dataQualityService = dataQualityService;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 查询指定设备某个指标的数据质量评分和维度明细
    /// </summary>
    /// <param name="deviceId">设备 ID</param>
    /// <param name="metric">指标名称（如 temperature、pressure）</param>
    [HttpGet("{deviceId:guid}")]
    [RequirePermission("device:read")]
    [ProducesResponseType(typeof(Core.Models.DataQualityReport), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetQualityScore(
        Guid deviceId,
        [FromQuery] string? metric)
    {
        if (string.IsNullOrWhiteSpace(metric))
        {
            return BadRequest(new { code = 400, message = "必须指定 metric 参数（如 temperature、pressure）" });
        }

        var report = await _dataQualityService.CalculateReportAsync(
            _tenantContext.TenantId, deviceId, metric, HttpContext.RequestAborted);

        if (report == null)
        {
            return NotFound(new { code = 404, message = $"设备 {deviceId} 的指标 {metric} 数据不足（少于 5 个样本），无法计算质量评分" });
        }

        return Ok(report);
    }

    /// <summary>
    /// 查询指定设备所有指标的数据质量概览
    /// </summary>
    /// <param name="deviceId">设备 ID</param>
    [HttpGet("{deviceId:guid}/overview")]
    [RequirePermission("device:read")]
    [ProducesResponseType(typeof(List<Core.Models.DataQualityReport>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetQualityOverview(Guid deviceId)
    {
        var reports = await _dataQualityService.CalculateOverviewAsync(
            _tenantContext.TenantId, deviceId, HttpContext.RequestAborted);

        return Ok(reports);
    }
}
