using EquipAI.Application.Analysis;
using EquipAI.Application.Analysis.DTOs;
using EquipAI.Application.DTOs.Common;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// AI 分析结果控制器
/// 提供分析结果的查询和手动触发根因分析的能力
/// </summary>
[ApiController]
[Route("api/v1/analyses")]
[Authorize]
public class AnalysesController : ControllerBase
{
    private readonly AnalysisQueryService _queryService;
    private readonly AnalysisTriggerService _triggerService;

    public AnalysesController(AnalysisQueryService queryService, AnalysisTriggerService triggerService)
    {
        _queryService = queryService;
        _triggerService = triggerService;
    }

    /// <summary>
    /// 分页查询分析结果，支持按设备 ID 筛选
    /// </summary>
    [HttpGet]
    [RequirePermission("analysis:read")]
    [ProducesResponseType(typeof(PagedResult<AnalysisDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<AnalysisDto>>> GetAnalyses(
        [FromQuery] PagedQuery query,
        [FromQuery] Guid? deviceId = null,
        CancellationToken ct = default)
        => Ok(await _queryService.ListAsync(query, deviceId, ct));

    /// <summary>
    /// 根据 ID 获取单条分析结果详情
    /// </summary>
    [HttpGet("{id:guid}")]
    [RequirePermission("analysis:read")]
    [ProducesResponseType(typeof(AnalysisDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AnalysisDto>> GetAnalysis(Guid id, CancellationToken ct = default)
    {
        var analysis = await _queryService.GetAsync(id, ct);
        if (analysis == null)
            return NotFound(new { code = 404, message = "分析记录不存在" });

        return Ok(analysis);
    }

    /// <summary>
    /// 手动触发根因分析
    /// 根据告警信息自动查询基线数据并调用分析引擎
    /// </summary>
    [HttpPost]
    [RequirePermission("analysis:trigger")]
    [ProducesResponseType(typeof(AnalysisDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AnalysisDto>> TriggerAnalysis([FromBody] CreateAnalysisRequest request, CancellationToken ct = default)
    {
        var (analysis, alertFound) = await _triggerService.TriggerFromAlertAsync(request.AlertId, ct);
        if (!alertFound || analysis is null)
            return NotFound(new { code = 404, message = "告警不存在" });

        return Ok(analysis);
    }
}
