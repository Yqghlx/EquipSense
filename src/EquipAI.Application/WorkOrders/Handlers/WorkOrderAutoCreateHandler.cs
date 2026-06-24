using EquipAI.Application.WorkOrders;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace EquipAI.Application.WorkOrders.Handlers;

/// <summary>
/// 工单自动创建处理器
/// 监听 AlertTriggeredEvent，当告警规则配置了自动创建工单时，
/// 自动生成纠正性工单并发布 WorkOrderCreatedEvent
/// </summary>
public class WorkOrderAutoCreateHandler : IEventHandler<AlertTriggeredEvent>
{
    private readonly ILogger<WorkOrderAutoCreateHandler> _logger;
    private readonly IEventBus _eventBus;
    private readonly IServiceScopeFactory _scopeFactory;

    public WorkOrderAutoCreateHandler(
        ILogger<WorkOrderAutoCreateHandler> logger,
        IEventBus eventBus,
        IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _eventBus = eventBus;
        _scopeFactory = scopeFactory;
    }

    /// <inheritdoc />
    public async Task HandleAsync(AlertTriggeredEvent @event, CancellationToken cancellationToken = default)
    {
        // RuleId 为空时无法查询规则，直接返回
        if (@event.RuleId is null)
        {
            _logger.LogDebug("告警事件缺少 RuleId，跳过自动创建工单: AlertId={AlertId}", @event.AlertId);
            return;
        }

        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 查询告警规则，检查是否配置了自动创建工单
        // 使用 IgnoreQueryFilters 绕过全局租户过滤器（后台事件处理器无 HttpContext）
        var rule = await dbContext.AlertRules
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(r => r.Id == @event.RuleId, cancellationToken);
        if (rule?.AutoCreateWorkorder != true)
        {
            _logger.LogDebug("告警规则未启用自动创建工单: RuleId={RuleId}", @event.RuleId);
            return;
        }

        // 防重复：同一告警不重复创建活跃工单（未关闭、未取消的工单视为活跃）
        var existingActiveWorkOrder = await dbContext.WorkOrders
            .IgnoreQueryFilters()
            .AnyAsync(wo => wo.AlertId == @event.AlertId
                && wo.Status != WorkOrderStatus.Closed
                && wo.Status != WorkOrderStatus.Cancelled, cancellationToken);
        if (existingActiveWorkOrder)
        {
            _logger.LogInformation(
                "告警已有关联的活跃工单，跳过创建: AlertId={AlertId}", @event.AlertId);
            return;
        }

        // 生成工单编码并创建工单（带冲突重试）
        // 并发场景下多个 AlertTriggeredEvent 同时到达，GenerateCodeAsync 可能产出相同序号，
        // 触发 IX_work_orders_workorder_code 唯一约束冲突。重试 3 次以避开竞态。
        // 注意：savedWorkOrder 仅在 SaveChangesAsync 真正成功后才赋值，作为"是否落库"的唯一判据。
        WorkOrder? savedWorkOrder = null;
        for (var attempt = 0; attempt < 3; attempt++)
        {
            var workOrderCode = await GenerateCodeAsync(dbContext, @event.TenantId, cancellationToken);
            var workOrder = new WorkOrder
            {
                TenantId = @event.TenantId,
                WorkOrderCode = workOrderCode,
                Title = $"告警工单：{@event.Metric} 异常",
                Type = WorkOrderType.Corrective,
                Priority = MapSeverity(@event.Severity),
                Status = WorkOrderStatus.PendingDispatch,
                DeviceId = @event.DeviceId,
                AlertId = @event.AlertId
            };
            // SLA 到期时间：自动建单必须设 DueDate 才能纳入 WorkOrderStatisticsService 的 SLA 达成率统计
            // （Where DueDate.HasValue），否则告警驱动工单被排除 → SLA KPI 失真（最该受 SLA 约束的工单反而不计入）。
            // 基于工单 CreatedAt + 优先级 SLA 时限（SlaTracker.CalculateDueDate），与 SlaManagementService
            // 的超时判断基准（createdAt + slaHours）保持一致（回归 #255）
            workOrder.DueDate = SlaTracker.CalculateDueDate(workOrder.Priority.ToString(), workOrder.CreatedAt);

            dbContext.WorkOrders.Add(workOrder);
            try
            {
                await dbContext.SaveChangesAsync(cancellationToken);
                // 仅当真正落库成功才认领该工单实例（与下方 savedWorkOrder is null 判据配套）
                savedWorkOrder = workOrder;
                break; // 成功
            }
            catch (DbUpdateException ex) when (IsUniqueViolation(ex))
            {
                // 工单编码冲突（并发），回滚本次变更
                // 关键：必须捕获【所有】 attempt 的冲突。原守卫 && attempt<2 会让最后一次（attempt=2）
                // 的冲突逃逸为未处理异常，被事件总线兜底吞掉而非进入下方的优雅失败处理。
                _logger.LogWarning("工单编码 {Code} 冲突（并发），第 {Attempt} 次重试", workOrderCode, attempt + 2);
                dbContext.Entry(workOrder).State = Microsoft.EntityFrameworkCore.EntityState.Detached;
                // 仅在仍有重试机会时退避；最后一次冲突不退避，直接退出循环交由下方优雅兜底
                if (attempt < 2)
                    await Task.Delay(TimeSpan.FromMilliseconds(50 * (attempt + 1)), cancellationToken);
            }
        }

        // 关键：用显式的"是否成功落库"标志判断，而非依赖 workOrder.Id。
        // BaseEntity.Id 在构造时即赋 Guid.NewGuid()，永不为 Guid.Empty，
        // 旧判断 (workOrder.Id == Guid.Empty) 恒为 false → 3 次编码冲突后会把【未落库】的工单
        // 误判为成功，进而发布 WorkOrderCreatedEvent，触发 WorkOrderNotificationHandler 向
        // Dashboard 推送一条【数据库里根本不存在】的幽灵工单通知。改为 savedWorkOrder 判据根除该隐患。
        if (savedWorkOrder is null)
        {
            _logger.LogError("自动建单失败：3 次重试后仍无法生成唯一编码，AlertId={AlertId}", @event.AlertId);
            return;
        }

        _logger.LogInformation(
            "已自动创建工单: WorkOrderId={WorkOrderId}, Code={WorkOrderCode}, AlertId={AlertId}",
            savedWorkOrder.Id, savedWorkOrder.WorkOrderCode, @event.AlertId);

        // 发布工单创建事件，供 SignalR 推送等下游模块消费
        await _eventBus.PublishAsync(new WorkOrderCreatedEvent(
            EventId: Guid.NewGuid(),
            OccurredAt: DateTime.UtcNow,
            TenantId: @event.TenantId,
            WorkOrderId: savedWorkOrder.Id,
            DeviceId: @event.DeviceId,
            Title: savedWorkOrder.Title,
            Priority: savedWorkOrder.Priority.ToString()
        ), cancellationToken);
    }

    /// <summary>
    /// 生成工单编码（格式：WO-{yyyyMMdd}-{4位序号}）
    /// 全局唯一（跨租户），避免多租户过滤器让查询漏掉其他租户已存在的编码导致 unique 冲突
    /// </summary>
    private static async Task<string> GenerateCodeAsync(
        AppDbContext dbContext, Guid tenantId, CancellationToken ct)
    {
        var today = DateTime.UtcNow.ToString("yyyyMMdd");
        var prefix = $"WO-{today}-";

        // IgnoreQueryFilters: 后台事件处理器无 HttpContext，必须绕过全局多租户过滤器
        // 否则查不到其他租户的工单编码，nextSeq 永远从 1 开始，触发 IX_work_orders_workorder_code 冲突
        var maxCode = await dbContext.WorkOrders
            .IgnoreQueryFilters()
            .Where(wo => wo.WorkOrderCode.StartsWith(prefix))
            .OrderByDescending(wo => wo.WorkOrderCode)
            .Select(wo => wo.WorkOrderCode)
            .FirstOrDefaultAsync(ct);

        var nextSeq = 1;
        if (!string.IsNullOrEmpty(maxCode) && maxCode.Length > prefix.Length)
        {
            var seqPart = maxCode[prefix.Length..];
            if (int.TryParse(seqPart, out var currentMax))
            {
                nextSeq = currentMax + 1;
            }
        }

        return $"{prefix}{nextSeq:D4}";
    }

    /// <summary>
    /// 判断 EF 保存异常是否为唯一约束冲突（PostgreSQL SQLSTATE 23505）
    /// 用于工单编码并发冲突时识别并触发重试
    /// </summary>
    internal static bool IsUniqueViolation(DbUpdateException ex)
    {
        for (var inner = (Exception?)ex; inner != null; inner = inner.InnerException)
        {
            if (inner is Npgsql.PostgresException pg && pg.SqlState == "23505")
                return true;
        }
        return false;
    }

    /// <summary>
    /// 将告警严重级别映射为工单优先级
    /// </summary>
    private static WorkOrderPriority MapSeverity(string severity) => severity.ToLowerInvariant() switch
    {
        "critical" => WorkOrderPriority.Critical,
        "high" => WorkOrderPriority.High,
        "normal" => WorkOrderPriority.Medium,
        _ => WorkOrderPriority.Low
    };
}
