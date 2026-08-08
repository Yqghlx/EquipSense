using AutoMapper;
using EquipAI.Application.Analysis.DTOs;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Analysis;

/// <summary>
/// 手动触发根因分析的编排服务。
/// 完整编排：查告警 → 查基线 → 调用 <see cref="IAnalysisService"/> 分析 → 持久化结果。
/// 将原本散落在 Controller 中的 DbContext 依赖集中到 Application 层，
/// 使 Controller 仅负责 HTTP 契约，不直接依赖 AppDbContext。
/// </summary>
public class AnalysisTriggerService
{
    private readonly AppDbContext _dbContext;
    private readonly IAnalysisService _analysisService;
    private readonly IMapper _mapper;
    private readonly ILogger<AnalysisTriggerService> _logger;

    public AnalysisTriggerService(
        AppDbContext dbContext,
        IAnalysisService analysisService,
        IMapper mapper,
        ILogger<AnalysisTriggerService> logger)
    {
        _dbContext = dbContext;
        _analysisService = analysisService;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// 根据告警 ID 手动触发根因分析。
    /// </summary>
    /// <param name="alertId">触发的告警 ID</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>
    /// (AnalysisDto?, AlertFound) —— AlertFound=false 表示告警不存在（AnalysisDto 为 null）。
    /// </returns>
    public async Task<(AnalysisDto? Analysis, bool AlertFound)> TriggerFromAlertAsync(Guid alertId, CancellationToken ct = default)
    {
        var alert = await _dbContext.Alerts.FindAsync(new object?[] { alertId }, ct);
        if (alert is null)
        {
            _logger.LogWarning("手动触发分析失败：告警 {AlertId} 不存在", alertId);
            return (null, false);
        }

        // 查询该设备该指标的基线数据，用于 L3 级别分析
        var baseline = await _dbContext.MetricBaselines
            .FirstOrDefaultAsync(b => b.DeviceId == alert.DeviceId && b.Metric == alert.Metric, ct);

        // Alert.Value 类型为 decimal，IAnalysisService 接口要求 double 参数
        var analysis = await _analysisService.AnalyzeAsync(
            alert.TenantId, alert.Id, alert.DeviceId,
            alert.Metric, (double)alert.Value, baseline, ct);

        _dbContext.Analyses.Add(analysis);
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("手动触发分析完成：告警 {AlertId} → 分析 {AnalysisId}（级别 {Level}）",
            alertId, analysis.Id, analysis.Level);

        return (_mapper.Map<AnalysisDto>(analysis), true);
    }
}
