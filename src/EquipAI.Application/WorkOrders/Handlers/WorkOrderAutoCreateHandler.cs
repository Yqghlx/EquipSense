using EquipAI.Application.WorkOrders;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

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
        var eventBus = scope.ServiceProvider.GetService<IEventBus>() ?? _eventBus;

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

        // 防重复：同一告警不重复创建活跃工单（未关闭、未取消的工单视为活跃）。
        // 但不能只返回：旧实例可能已经把工单写入数据库，却在写入 WorkOrderCreatedEvent
        // 前宕机。重试时必须使用同一个事件 ID 幂等补发，才能避免“有工单、无通知”的断链。
        var existingActiveWorkOrder = await dbContext.WorkOrders
            .IgnoreQueryFilters()
            .Where(wo => wo.TenantId == @event.TenantId
                && wo.AlertId == @event.AlertId
                && wo.Status != WorkOrderStatus.Closed
                && wo.Status != WorkOrderStatus.Cancelled)
            .OrderBy(wo => wo.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
        if (existingActiveWorkOrder is not null)
        {
            _logger.LogInformation(
                "告警已有关联的活跃工单，将幂等补发创建事件: AlertId={AlertId}, WorkOrderId={WorkOrderId}",
                @event.AlertId, existingActiveWorkOrder.Id);
            await eventBus.PublishAsync(new WorkOrderCreatedEvent(
                EventId: existingActiveWorkOrder.Id,
                OccurredAt: existingActiveWorkOrder.CreatedAt,
                TenantId: existingActiveWorkOrder.TenantId,
                WorkOrderId: existingActiveWorkOrder.Id,
                DeviceId: existingActiveWorkOrder.DeviceId,
                Title: existingActiveWorkOrder.Title,
                Priority: existingActiveWorkOrder.Priority.ToString()), cancellationToken);
            return;
        }

        // 生成工单编码并创建工单（带冲突重试）
        // 与 WorkOrderService.CreateAsync 共用 WorkOrderCodeGenerator，保证两条路径行为一致：
        // 同样 IgnoreQueryFilters 读跨租户最大序号、同样在唯一约束冲突（SQLSTATE 23505）时重试。
        // savedWorkOrder 仅在 SaveChangesAsync 真正成功后才被赋值，作为"是否落库"的唯一判据。
        var savedWorkOrder = await WorkOrderCodeGenerator.CreateWithUniqueCodeAsync(
            dbContext,
            code =>
            {
                var workOrder = new WorkOrder
                {
                    TenantId = @event.TenantId,
                    WorkOrderCode = code,
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
                return workOrder;
            },
            _logger,
            cancellationToken);

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
        await eventBus.PublishAsync(new WorkOrderCreatedEvent(
            // 工单创建事件的一次性语义由工单 ID 稳定标识；消费失败重试时可安全补发。
            EventId: savedWorkOrder.Id,
            OccurredAt: savedWorkOrder.CreatedAt,
            TenantId: savedWorkOrder.TenantId,
            WorkOrderId: savedWorkOrder.Id,
            DeviceId: savedWorkOrder.DeviceId,
            Title: savedWorkOrder.Title,
            Priority: savedWorkOrder.Priority.ToString()
        ), cancellationToken);
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
