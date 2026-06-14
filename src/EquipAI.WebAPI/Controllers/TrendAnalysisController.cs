using EquipAI.Application.Analysis;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 趋势预警分析控制器（Phase 5 新增）
/// </summary>
[ApiController]
[Route("api/v1/trend-analysis")]
[Authorize]
public class TrendAnalysisController : ControllerBase
{
    private readonly TrendAnalysisService _trendService;
    private readonly ITenantContext _tenantContext;

    public TrendAnalysisController(TrendAnalysisService trendService, ITenantContext tenantContext)
    {
        _trendService = trendService;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 分析指定设备的指定指标趋势
    /// </summary>
    [HttpGet("{deviceId:guid}/{metric}")]
    [RequirePermission("device:read")]
    [ProducesResponseType(typeof(TrendAnalysisResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<TrendAnalysisResult>> AnalyzeDeviceMetric(
        Guid deviceId, string metric, CancellationToken ct)
    {
        var result = await _trendService.AnalyzeTrendAsync(deviceId, metric, ct);
        if (result is null)
            return Ok(new { message = "数据不足，至少需要 10 个数据点" });

        return Ok(result);
    }

    /// <summary>
    /// 批量分析所有设备的趋势预警（返回 7 天内会超阈值的）
    /// </summary>
    [HttpGet("warnings")]
    [RequirePermission("device:read")]
    [ProducesResponseType(typeof(List<TrendAnalysisResult>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<TrendAnalysisResult>>> GetWarnings(CancellationToken ct)
    {
        var warnings = await _trendService.AnalyzeAllTrendsAsync(_tenantContext.TenantId, ct);
        return Ok(warnings);
    }
}
