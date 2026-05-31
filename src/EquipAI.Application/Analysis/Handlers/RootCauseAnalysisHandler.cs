using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

using AnalysisEntity = EquipAI.Core.Entities.Analysis;
using MetricBaselineEntity = EquipAI.Core.Entities.MetricBaseline;

namespace EquipAI.Application.Analysis.Handlers;

/// <summary>
/// 告警触发后的根因分析事件处理器
/// 监听 AlertTriggeredEvent，执行以下流程：
/// 1. 查询该设备指标的历史基线数据
/// 2. 调用根因分析引擎（L3 统计分析 → L1 LLM 诊断自动降级）
/// 3. 将分析结果持久化到数据库
/// 4. 发布 AnalysisCompletedEvent 供工单等下游模块消费
/// </summary>
public class RootCauseAnalysisHandler : IEventHandler<AlertTriggeredEvent>
{
    private readonly ILogger<RootCauseAnalysisHandler> _logger;
    private readonly IAnalysisService _analysisService;
    private readonly IEventBus _eventBus;
    private readonly IServiceScopeFactory _scopeFactory;

    public RootCauseAnalysisHandler(
        ILogger<RootCauseAnalysisHandler> logger,
        IAnalysisService analysisService,
        IEventBus eventBus,
        IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _analysisService = analysisService;
        _eventBus = eventBus;
        _scopeFactory = scopeFactory;
    }

    /// <inheritdoc />
    public async Task HandleAsync(AlertTriggeredEvent @event, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "开始根因分析: AlertId={AlertId}, 设备={DeviceId}, 指标={Metric}, 值={Value}",
            @event.AlertId, @event.DeviceId, @event.Metric, @event.Value);

        try
        {
            // 查询该设备指标的历史基线数据，用于 L3 统计分析
            MetricBaselineEntity? baseline;
            using (var scope = _scopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                baseline = await dbContext.MetricBaselines
                    .Where(b => b.DeviceId == @event.DeviceId && b.Metric == @event.Metric)
                    .OrderByDescending(b => b.PeriodEnd)
                    .FirstOrDefaultAsync(cancellationToken);
            }

            if (baseline != null)
            {
                _logger.LogDebug(
                    "找到基线数据: DeviceId={DeviceId}, Metric={Metric}, 均值={Avg}, 标准差={StdDev}, 样本数={SampleCount}",
                    @event.DeviceId, @event.Metric, baseline.AvgValue, baseline.StdDev, baseline.SampleCount);
            }
            else
            {
                _logger.LogDebug(
                    "未找到基线数据: DeviceId={DeviceId}, Metric={Metric}，将降级到 LLM 诊断",
                    @event.DeviceId, @event.Metric);
            }

            // 调用分析引擎执行根因分析（内部自动降级决策）
            var analysis = await _analysisService.AnalyzeAsync(
                @event.TenantId,
                @event.AlertId,
                @event.DeviceId,
                @event.Metric,
                @event.Value,
                baseline,
                cancellationToken);

            // 持久化分析结果到数据库
            using (var scope = _scopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                dbContext.Analyses.Add(analysis);
                await dbContext.SaveChangesAsync(cancellationToken);
            }

            _logger.LogInformation(
                "根因分析完成: AnalysisId={AnalysisId}, 级别={Level}, 置信度={Confidence:F2}, 耗时={ProcessingTimeMs}ms",
                analysis.Id, analysis.Level, analysis.Confidence, analysis.ProcessingTimeMs);

            // 发布分析完成事件，供工单模块等下游消费者使用
            await _eventBus.PublishAsync(new AnalysisCompletedEvent(
                EventId: Guid.NewGuid(),
                OccurredAt: DateTime.UtcNow,
                TenantId: @event.TenantId,
                AnalysisId: analysis.Id,
                AlertId: @event.AlertId,
                DeviceId: @event.DeviceId,
                Metric: @event.Metric,
                Level: analysis.Level,
                Confidence: analysis.Confidence,
                RootCause: analysis.RootCause,
                Suggestion: analysis.Suggestion
            ), cancellationToken);

            _logger.LogDebug("已发布 AnalysisCompletedEvent: AnalysisId={AnalysisId}", analysis.Id);
        }
        catch (Exception ex)
        {
            // 分析失败不应阻塞告警流程，仅记录错误日志
            // 后续可由运维人员手动触发重新分析
            _logger.LogError(ex,
                "根因分析失败: AlertId={AlertId}, DeviceId={DeviceId}, Metric={Metric}",
                @event.AlertId, @event.DeviceId, @event.Metric);
        }
    }
}
