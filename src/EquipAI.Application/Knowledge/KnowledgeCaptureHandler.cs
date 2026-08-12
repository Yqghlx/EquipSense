using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Knowledge;

/// <summary>
/// 工单状态变更事件处理器
/// 当工单状态变为 Closed 时触发知识沉淀和规则准确率追踪
/// </summary>
public class KnowledgeCaptureHandler : IEventHandler<WorkOrderStatusChangedEvent>
{
    private readonly KnowledgeCaptureService _captureService;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<KnowledgeCaptureHandler> _logger;

    public KnowledgeCaptureHandler(
        KnowledgeCaptureService captureService,
        IServiceScopeFactory scopeFactory,
        ILogger<KnowledgeCaptureHandler> logger)
    {
        _captureService = captureService;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    /// <summary>
    /// 处理工单状态变更事件
    /// 仅当工单关闭（Closed）时触发知识沉淀流程和规则准确率追踪
    /// </summary>
    /// <param name="event">工单状态变更事件</param>
    /// <param name="ct">取消令牌</param>
    public async Task HandleAsync(WorkOrderStatusChangedEvent @event, CancellationToken ct)
    {
        if (@event.NewStatus != "Closed")
            return;

        _logger.LogInformation("工单关闭，触发知识沉淀: WorkOrderId={WorkOrderId}", @event.WorkOrderId);

        try
        {
            await _captureService.ProcessWorkOrderClosedAsync(
                @event.TenantId, @event.WorkOrderId, ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // 普通知识沉淀故障可以隔离，但停机取消必须向消息总线传播，避免工单关闭事件被错误确认。
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "知识沉淀处理失败: WorkOrderId={WorkOrderId}", @event.WorkOrderId);
        }

        // 规则准确率追踪：工单关闭后检查关联分析使用的规则是否准确
        await TrackRuleAccuracyAsync(@event.TenantId, @event.WorkOrderId, ct);
    }

    /// <summary>
    /// 追踪规则准确率 — 根据工单是否填写了根因和解决措施来判断规则诊断是否准确
    /// </summary>
    /// <param name="tenantId">租户 ID（来自事件载荷，后台 scope 无 HttpContext，用于显式过滤）</param>
    /// <param name="workOrderId">工单 ID</param>
    /// <param name="ct">取消令牌</param>
    private async Task TrackRuleAccuracyAsync(Guid tenantId, Guid workOrderId, CancellationToken ct)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // 后台 scope 无 HttpContext，ITenantContext 走回退 → TenantId == Guid.Empty，
            // 默认过滤器会让 FindAsync 查不到真实租户的工单 → 准确率追踪永久失效。
            // 故 IgnoreQueryFilters + 显式按事件 tenantId 限定。
            var wo = await db.WorkOrders
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Id == workOrderId && x.TenantId == tenantId, ct);
            if (wo?.AnalysisId is not null)
            {
                var analysis = await db.Analyses
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(a => a.Id == wo.AnalysisId.Value && a.TenantId == tenantId, ct);
                if (analysis?.RuleId.HasValue == true)
                {
                    // 工单填写了根因和解决措施，说明规则诊断有一定参考价值
                    var wasAccurate = !string.IsNullOrEmpty(wo.RootCause)
                                   && !string.IsNullOrEmpty(wo.Resolution);

                    var tracker = scope.ServiceProvider.GetRequiredService<IRuleAccuracyTracker>();
                    await tracker.RecordAsync(analysis.RuleId.Value, wasAccurate, ct);
                }
            }
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // 准确率追踪属于事件处理链的一部分，停机取消时交由消息总线重试，不能静默吞掉。
            throw;
        }
        catch (Exception ex)
        {
            // 准确率追踪失败不应影响主流程，仅记录日志
            _logger.LogError(ex, "规则准确率追踪失败: WorkOrderId={WorkOrderId}", workOrderId);
        }
    }
}
