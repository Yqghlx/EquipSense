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
        WorkOrder? workOrder = null;
        for (var attempt = 0; attempt < 3; attempt++)
        {
            var workOrderCode = await GenerateCodeAsync(dbContext, @event.TenantId, cancellationToken);
            workOrder = new WorkOrder
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

            dbContext.WorkOrders.Add(workOrder);
            try
            {
                await dbContext.SaveChangesAsync(cancellationToken);
                break; // 成功
            }
            catch (DbUpdateException ex) when (IsUniqueViolation(ex) && attempt < 2)
            {
                // 工单编码冲突（并发导致），回滚变更后重试生成新编码
                _logger.LogWarning("工单编码 {Code} 冲突（并发），第 {Attempt} 次重试", workOrderCode, attempt + 2);
                dbContext.Entry(workOrder).State = Microsoft.EntityFrameworkCore.EntityState.Detached;
                await Task.Delay(TimeSpan.FromMilliseconds(50 * (attempt + 1)), cancellationToken);
            }
        }

        if (workOrder == null || workOrder.Id == Guid.Empty)
        {
            _logger.LogError("自动建单失败：3 次重试后仍无法生成唯一编码，AlertId={AlertId}", @event.AlertId);
            return;
        }

        _logger.LogInformation(
            "已自动创建工单: WorkOrderId={WorkOrderId}, Code={WorkOrderCode}, AlertId={AlertId}",
            workOrder.Id, workOrder.WorkOrderCode, @event.AlertId);

        // 发布工单创建事件，供 SignalR 推送等下游模块消费
        await _eventBus.PublishAsync(new WorkOrderCreatedEvent(
            EventId: Guid.NewGuid(),
            OccurredAt: DateTime.UtcNow,
            TenantId: @event.TenantId,
            WorkOrderId: workOrder.Id,
            DeviceId: @event.DeviceId,
            Title: workOrder.Title,
            Priority: workOrder.Priority.ToString()
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
    private static bool IsUniqueViolation(DbUpdateException ex)
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
