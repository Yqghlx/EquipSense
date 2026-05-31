using AutoMapper;
using EquipAI.Application.Analysis.DTOs;
using EquipAI.Application.DTOs.Common;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
    private readonly AppDbContext _dbContext;
    private readonly IMapper _mapper;
    private readonly IAnalysisService _analysisService;

    public AnalysesController(AppDbContext dbContext, IMapper mapper, IAnalysisService analysisService)
    {
        _dbContext = dbContext;
        _mapper = mapper;
        _analysisService = analysisService;
    }

    /// <summary>
    /// 分页查询分析结果，支持按设备 ID 筛选
    /// </summary>
    [HttpGet]
    [RequirePermission("analysis:read")]
    [ProducesResponseType(typeof(PagedResult<AnalysisDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<AnalysisDto>>> GetAnalyses(
        [FromQuery] PagedQuery query,
        [FromQuery] Guid? deviceId = null)
    {
        var analyses = _dbContext.Analyses.AsQueryable();

        if (deviceId.HasValue)
            analyses = analyses.Where(a => a.DeviceId == deviceId.Value);

        var (items, total) = await analyses.ToPagedAsync(query);

        return Ok(new PagedResult<AnalysisDto>
        {
            Items = _mapper.Map<List<AnalysisDto>>(items)!,
            Total = total,
            Page = query.Page,
            PageSize = query.PageSize
        });
    }

    /// <summary>
    /// 根据 ID 获取单条分析结果详情
    /// </summary>
    [HttpGet("{id:guid}")]
    [RequirePermission("analysis:read")]
    [ProducesResponseType(typeof(AnalysisDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AnalysisDto>> GetAnalysis(Guid id)
    {
        var analysis = await _dbContext.Analyses.FindAsync(id);
        if (analysis == null)
            return NotFound(new { code = 404, message = "分析记录不存在" });

        return Ok(_mapper.Map<AnalysisDto>(analysis));
    }

    /// <summary>
    /// 手动触发根因分析
    /// 根据告警信息自动查询基线数据并调用分析引擎
    /// </summary>
    [HttpPost]
    [RequirePermission("analysis:trigger")]
    [ProducesResponseType(typeof(AnalysisDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AnalysisDto>> TriggerAnalysis([FromBody] CreateAnalysisRequest request)
    {
        var alert = await _dbContext.Alerts.FindAsync(request.AlertId);
        if (alert == null)
            return NotFound(new { code = 404, message = "告警不存在" });

        // 查询该设备该指标的基线数据，用于 L2 级别分析
        var baseline = await _dbContext.MetricBaselines
            .FirstOrDefaultAsync(b => b.DeviceId == alert.DeviceId && b.Metric == alert.Metric);

        // Alert.Value 类型为 decimal，IAnalysisService 接口要求 double 参数
        var analysis = await _analysisService.AnalyzeAsync(
            alert.TenantId, alert.Id, alert.DeviceId,
            alert.Metric, (double)alert.Value, baseline);

        _dbContext.Analyses.Add(analysis);
        await _dbContext.SaveChangesAsync();

        return Ok(_mapper.Map<AnalysisDto>(analysis));
    }
}
