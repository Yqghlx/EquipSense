using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
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
            // 关键：本处理器运行在后台事件管线（无 HttpContext），从 scope 解析出的 ITenantContext 走
            // DI 回退分支 → TenantId == Guid.Empty。若沿用默认全局租户过滤器，查询恒为
            // TenantId == Guid.Empty，查不到任何真实租户的基线 → baseline 恒为 null →
            // 根因分析四级降级链中的 L3 统计分析永不触发，且 L1 LLM 诊断失去历史基线上下文。
            // 故必须 IgnoreQueryFilters 绕过失效的过滤器，并显式按事件载荷中的租户限定
            // （@event.TenantId 由服务端告警管线产生，可信）。
            MetricBaselineEntity? baseline;
            using (var scope = _scopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                baseline = await dbContext.MetricBaselines
                    .IgnoreQueryFilters()
                    .Where(b => b.TenantId == @event.TenantId
                        && b.DeviceId == @event.DeviceId
                        && b.Metric == @event.Metric)
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

            // 分析完成后自动生成候选规则（置信度 >= 0.7 且根因非空）
            if (analysis.Confidence >= 0.7 && !string.IsNullOrWhiteSpace(analysis.RootCause))
            {
                await GenerateCandidateRuleFromAnalysisAsync(
                    @event.TenantId, @event.DeviceId, @event.Metric,
                    @event.AlertId, analysis, cancellationToken);
            }
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

    /// <summary>
    /// 从分析结果中提取因果模式，自动生成候选规则
    /// </summary>
    private async Task GenerateCandidateRuleFromAnalysisAsync(
        Guid tenantId, Guid deviceId, string metric,
        Guid alertId, AnalysisEntity analysis, CancellationToken ct)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var device = await db.Devices
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(d => d.Id == deviceId, ct);
            var deviceType = device?.Type ?? "通用";

            var conditions = System.Text.Json.JsonSerializer.Serialize(new
            {
                metric,
                level = analysis.Level.ToString(),
                confidence = Math.Round(analysis.Confidence ?? 0, 2)
            });

            var conclusion = System.Text.Json.JsonSerializer.Serialize(new
            {
                rootCause = analysis.RootCause,
                suggestion = analysis.Suggestion
            });

            var pendingRule = new PendingRule
            {
                TenantId = tenantId,
                DeviceType = deviceType,
                Name = $"AI推荐: {metric} 异常处理规则",
                Conditions = conditions,
                Conclusion = conclusion,
                RecommendedActions = analysis.Suggestion,
                Confidence = (decimal)(analysis.Confidence ?? 0),
                SourceAlertId = alertId,
                SourceAnalysisId = analysis.Id,
                ReviewStatus = ReviewStatus.Pending
            };

            db.PendingRules.Add(pendingRule);
            await db.SaveChangesAsync(ct);

            // 推送候选规则产生事件，让停留在「知识库审核」页面的专家实时看到新候选（回归 #251）。
            // 原实现只写 DB 不推送，专家须手动刷新才能看到 AI 推荐规则——AI 知识自学习闭环实时性缺失。
            // 从 scope 解析推送服务（与 AppDbContext 同 scope）；解析失败降级（DB 已写入，手动刷新仍可见）。
            var notificationService = scope.ServiceProvider.GetService<ISignalRNotificationService>();
            if (notificationService is not null)
            {
                await notificationService.SendPendingRuleCreatedAsync(tenantId);
            }

            _logger.LogInformation(
                "已从分析结果生成候选规则: PendingRuleId={PendingRuleId}, 置信度={Confidence:F2}",
                pendingRule.Id, analysis.Confidence);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "生成候选规则失败: AlertId={AlertId}", alertId);
        }
    }
}
