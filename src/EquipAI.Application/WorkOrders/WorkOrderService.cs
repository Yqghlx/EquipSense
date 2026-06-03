using EquipAI.Application.Approvals;
using EquipAI.Application.DTOs.Common;
using EquipAI.Core.Models;
using EquipAI.Application.WorkOrders.DTOs;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders;

/// <summary>
/// 工单服务实现，提供工单完整生命周期管理
///
/// 设计要点：
/// 1. 使用 IServiceScopeFactory 获取 scoped AppDbContext，避免 Singleton 服务直接注入 Scoped 依赖
/// 2. 每次状态变更写入 WorkOrderLog 审计日志，确保操作可追溯
/// 3. 状态变更后通过 IEventBus 发布事件，实现模块间解耦
/// 4. 工单编码格式: WO-{yyyyMMdd}-{4位序号}，保证唯一性
/// </summary>
public class WorkOrderService : IWorkOrderService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IEventBus _eventBus;
    private readonly ILogger<WorkOrderService> _logger;
    private readonly IApprovalChainService _approvalChainService;

    /// <summary>
    /// 合法的状态流转映射表
    /// Key: 当前状态, Value: 允许转换到的状态集合
    /// </summary>
    private static readonly Dictionary<WorkOrderStatus, HashSet<WorkOrderStatus>> _validTransitions = new()
    {
        [WorkOrderStatus.PendingDispatch] = [WorkOrderStatus.Assigned, WorkOrderStatus.Cancelled],
        [WorkOrderStatus.Assigned] = [WorkOrderStatus.InProgress, WorkOrderStatus.Cancelled],
        [WorkOrderStatus.InProgress] = [WorkOrderStatus.Completed, WorkOrderStatus.Cancelled, WorkOrderStatus.SubmittedForApproval],
        [WorkOrderStatus.Completed] = [WorkOrderStatus.Accepted, WorkOrderStatus.Rejected, WorkOrderStatus.SubmittedForApproval],
        [WorkOrderStatus.SubmittedForApproval] = [WorkOrderStatus.Accepted, WorkOrderStatus.InProgress],
        [WorkOrderStatus.Accepted] = [WorkOrderStatus.Closed],
        [WorkOrderStatus.Rejected] = [WorkOrderStatus.InProgress],
        // Closed 和 Cancelled 为终态，不允许再变更
    };

    public WorkOrderService(
        IServiceScopeFactory scopeFactory,
        IEventBus eventBus,
        ILogger<WorkOrderService> logger,
        IApprovalChainService approvalChainService)
    {
        _scopeFactory = scopeFactory;
        _eventBus = eventBus;
        _logger = logger;
        _approvalChainService = approvalChainService;
    }

    /// <inheritdoc />
    public async Task<WorkOrderDto> CreateAsync(
        Guid tenantId, CreateWorkOrderRequest request, Guid? userId = null, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 解析枚举字段，解析失败时使用默认值
        var type = Enum.TryParse<WorkOrderType>(request.Type, ignoreCase: true, out var t)
            ? t : WorkOrderType.Corrective;
        var priority = Enum.TryParse<WorkOrderPriority>(request.Priority, ignoreCase: true, out var p)
            ? p : WorkOrderPriority.Medium;

        // 生成唯一工单编码
        var code = await GenerateCodeAsync(dbContext, tenantId, ct);

        var workOrder = new WorkOrder
        {
            TenantId = tenantId,
            WorkOrderCode = code,
            Title = request.Title,
            Type = type,
            Priority = priority,
            Status = WorkOrderStatus.PendingDispatch,
            DeviceId = request.DeviceId,
            AlertId = request.AlertId,
            RootCause = request.RootCause,
            AssignedTo = null,
            DueDate = request.DueDate,
            CreatedBy = userId
        };

        dbContext.WorkOrders.Add(workOrder);

        // 写入创建审计日志
        await WriteLogAsync(dbContext, workOrder.Id, WorkOrderLogAction.Created,
            oldStatus: null, newStatus: WorkOrderStatus.PendingDispatch.ToString(),
            operatorId: userId, note: null, ct: ct);

        await dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("工单已创建: {WorkOrderCode}（设备: {DeviceId}, 优先级: {Priority}）",
            code, request.DeviceId, priority);

        // 发布工单创建事件，供 SignalR 推送、通知等下游模块消费
        var createdEvent = new WorkOrderCreatedEvent(
            Guid.NewGuid(), DateTime.UtcNow, tenantId,
            workOrder.Id, request.DeviceId, request.Title, priority.ToString());
        await _eventBus.PublishAsync(createdEvent, ct);

        return MapToDto(workOrder);
    }

    /// <inheritdoc />
    public async Task<WorkOrderDto> GetByIdAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var workOrder = await dbContext.WorkOrders.FirstOrDefaultAsync(wo => wo.Id == id, ct);
        if (workOrder == null)
        {
            throw new KeyNotFoundException($"工单不存在: {id}");
        }

        return MapToDto(workOrder);
    }

    /// <inheritdoc />
    public async Task<PagedResult<WorkOrderDto>> ListAsync(
        Guid tenantId, int page, int pageSize, string? status = null,
        Guid? deviceId = null, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 构建查询条件，全局查询过滤器已自动按租户隔离
        var query = dbContext.WorkOrders.AsQueryable();

        // 按状态过滤（支持字符串传入，不区分大小写）
        if (!string.IsNullOrWhiteSpace(status)
            && Enum.TryParse<WorkOrderStatus>(status, ignoreCase: true, out var statusFilter))
        {
            query = query.Where(wo => wo.Status == statusFilter);
        }

        // 按设备过滤
        if (deviceId.HasValue)
        {
            query = query.Where(wo => wo.DeviceId == deviceId.Value);
        }

        // 按创建时间倒序排列，最新的工单排在前面
        query = query.OrderByDescending(wo => wo.CreatedAt);

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResult<WorkOrderDto>
        {
            Items = items.Select(MapToDto).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    /// <inheritdoc />
    public async Task<WorkOrderDto> AssignAsync(
        Guid tenantId, Guid id, AssignWorkOrderRequest request, Guid userId, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var workOrder = await dbContext.WorkOrders.FirstOrDefaultAsync(wo => wo.Id == id, ct);
        if (workOrder == null)
        {
            throw new KeyNotFoundException($"工单不存在: {id}");
        }

        var oldStatus = workOrder.Status;

        // 状态转换校验与执行
        TransitionStatus(workOrder, WorkOrderStatus.Assigned);

        // 设置派工信息
        workOrder.AssignedTo = request.AssignedTo;

        // 写入状态变更审计日志
        await WriteLogAsync(dbContext, workOrder.Id, WorkOrderLogAction.StatusChanged,
            oldStatus.ToString(), WorkOrderStatus.Assigned.ToString(),
            userId, request.Note, ct);

        await dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("工单 {WorkOrderCode} 已派工给 {AssignedTo}", workOrder.WorkOrderCode, request.AssignedTo);

        // 发布状态变更事件
        await PublishStatusChangedEvent(tenantId, workOrder.Id, oldStatus, workOrder.Status, userId, ct);

        return MapToDto(workOrder);
    }

    /// <inheritdoc />
    public async Task<WorkOrderDto> StartAsync(
        Guid tenantId, Guid id, Guid userId, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var workOrder = await dbContext.WorkOrders.FirstOrDefaultAsync(wo => wo.Id == id, ct);
        if (workOrder == null)
        {
            throw new KeyNotFoundException($"工单不存在: {id}");
        }

        var oldStatus = workOrder.Status;

        TransitionStatus(workOrder, WorkOrderStatus.InProgress);

        // 记录开始执行时间
        workOrder.StartedAt = DateTime.UtcNow;

        await WriteLogAsync(dbContext, workOrder.Id, WorkOrderLogAction.StatusChanged,
            oldStatus.ToString(), WorkOrderStatus.InProgress.ToString(),
            userId, note: null, ct);

        await dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("工单 {WorkOrderCode} 已开始执行", workOrder.WorkOrderCode);

        await PublishStatusChangedEvent(tenantId, workOrder.Id, oldStatus, workOrder.Status, userId, ct);

        return MapToDto(workOrder);
    }

    /// <inheritdoc />
    public async Task<WorkOrderDto> CompleteAsync(
        Guid tenantId, Guid id, CompleteWorkOrderRequest request, Guid userId, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var workOrder = await dbContext.WorkOrders.FirstOrDefaultAsync(wo => wo.Id == id, ct);
        if (workOrder == null)
        {
            throw new KeyNotFoundException($"工单不存在: {id}");
        }

        var oldStatus = workOrder.Status;

        TransitionStatus(workOrder, WorkOrderStatus.Completed);

        // 记录解决措施和完成时间
        workOrder.Resolution = request.Resolution;
        workOrder.CompletedAt = DateTime.UtcNow;

        await WriteLogAsync(dbContext, workOrder.Id, WorkOrderLogAction.StatusChanged,
            oldStatus.ToString(), WorkOrderStatus.Completed.ToString(),
            userId, note: $"解决措施: {request.Resolution}", ct);

        await dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("工单 {WorkOrderCode} 已完成（解决措施: {Resolution}）",
            workOrder.WorkOrderCode, request.Resolution);

        await PublishStatusChangedEvent(tenantId, workOrder.Id, oldStatus, workOrder.Status, userId, ct);

        return MapToDto(workOrder);
    }

    /// <inheritdoc />
    public async Task<WorkOrderDto> AcceptAsync(
        Guid tenantId, Guid id, Guid userId, string? note = null, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var workOrder = await dbContext.WorkOrders.FirstOrDefaultAsync(wo => wo.Id == id, ct);
        if (workOrder == null)
        {
            throw new KeyNotFoundException($"工单不存在: {id}");
        }

        var oldStatus = workOrder.Status;

        TransitionStatus(workOrder, WorkOrderStatus.Accepted);

        await WriteLogAsync(dbContext, workOrder.Id, WorkOrderLogAction.StatusChanged,
            oldStatus.ToString(), WorkOrderStatus.Accepted.ToString(),
            userId, note, ct);

        await dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("工单 {WorkOrderCode} 已验收通过", workOrder.WorkOrderCode);

        await PublishStatusChangedEvent(tenantId, workOrder.Id, oldStatus, workOrder.Status, userId, ct);

        return MapToDto(workOrder);
    }

    /// <inheritdoc />
    public async Task<WorkOrderDto> RejectAsync(
        Guid tenantId, Guid id, Guid userId, string? note = null, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var workOrder = await dbContext.WorkOrders.FirstOrDefaultAsync(wo => wo.Id == id, ct);
        if (workOrder == null)
        {
            throw new KeyNotFoundException($"工单不存在: {id}");
        }

        var oldStatus = workOrder.Status;

        TransitionStatus(workOrder, WorkOrderStatus.Rejected);

        await WriteLogAsync(dbContext, workOrder.Id, WorkOrderLogAction.StatusChanged,
            oldStatus.ToString(), WorkOrderStatus.Rejected.ToString(),
            userId, note ?? "验收不通过，返工", ct);

        await dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("工单 {WorkOrderCode} 验收不通过，已返工", workOrder.WorkOrderCode);

        await PublishStatusChangedEvent(tenantId, workOrder.Id, oldStatus, workOrder.Status, userId, ct);

        return MapToDto(workOrder);
    }

    /// <inheritdoc />
    public async Task<WorkOrderDto> CloseAsync(
        Guid tenantId, Guid id, Guid userId, string? note = null, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var workOrder = await dbContext.WorkOrders.FirstOrDefaultAsync(wo => wo.Id == id, ct);
        if (workOrder == null)
        {
            throw new KeyNotFoundException($"工单不存在: {id}");
        }

        var oldStatus = workOrder.Status;

        TransitionStatus(workOrder, WorkOrderStatus.Closed);

        // 记录关闭时间
        workOrder.ClosedAt = DateTime.UtcNow;

        await WriteLogAsync(dbContext, workOrder.Id, WorkOrderLogAction.StatusChanged,
            oldStatus.ToString(), WorkOrderStatus.Closed.ToString(),
            userId, note, ct);

        await dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("工单 {WorkOrderCode} 已关闭", workOrder.WorkOrderCode);

        await PublishStatusChangedEvent(tenantId, workOrder.Id, oldStatus, workOrder.Status, userId, ct);

        return MapToDto(workOrder);
    }

    /// <inheritdoc />
    public async Task<WorkOrderDto> CancelAsync(
        Guid tenantId, Guid id, Guid userId, string? note = null, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var workOrder = await dbContext.WorkOrders.FirstOrDefaultAsync(wo => wo.Id == id, ct);
        if (workOrder == null)
        {
            throw new KeyNotFoundException($"工单不存在: {id}");
        }

        var oldStatus = workOrder.Status;

        TransitionStatus(workOrder, WorkOrderStatus.Cancelled);

        await WriteLogAsync(dbContext, workOrder.Id, WorkOrderLogAction.StatusChanged,
            oldStatus.ToString(), WorkOrderStatus.Cancelled.ToString(),
            userId, note ?? "工单已取消", ct);

        await dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("工单 {WorkOrderCode} 已取消", workOrder.WorkOrderCode);

        await PublishStatusChangedEvent(tenantId, workOrder.Id, oldStatus, workOrder.Status, userId, ct);

        return MapToDto(workOrder);
    }

    /// <inheritdoc />
    public async Task<WorkOrderDto> SubmitAsync(
        Guid tenantId, Guid id, CompleteWorkOrderRequest request, Guid userId, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var workOrder = await dbContext.WorkOrders.FirstOrDefaultAsync(wo => wo.Id == id, ct);
        if (workOrder == null)
        {
            throw new KeyNotFoundException($"工单不存在: {id}");
        }

        // 提交验收前置校验：工单必须处于 InProgress 或 Completed 状态
        if (workOrder.Status != WorkOrderStatus.InProgress && workOrder.Status != WorkOrderStatus.Completed)
        {
            throw new InvalidOperationException(
                $"工单 {workOrder.WorkOrderCode} 当前状态为 {workOrder.Status}，仅支持从 InProgress 或 Completed 状态提交验收");
        }

        // 记录解决措施和完成时间
        var oldStatus = workOrder.Status;
        workOrder.Resolution = request.Resolution;
        if (workOrder.CompletedAt == null)
        {
            workOrder.CompletedAt = DateTime.UtcNow;
        }

        await WriteLogAsync(dbContext, workOrder.Id, WorkOrderLogAction.StatusChanged,
            oldStatus.ToString(), "SubmittedForApproval",
            userId, note: $"提交验收（解决措施: {request.Resolution}）", ct);

        await dbContext.SaveChangesAsync(ct);

        // 尝试匹配审批链模板并创建审批记录
        // CreateApprovalRecordsAsync 内部会匹配模板，若无匹配则不创建审批记录，工单状态不变
        await _approvalChainService.CreateApprovalRecordsAsync(
            tenantId, workOrder.Id, workOrder.Type, workOrder.Priority, ct);

        _logger.LogInformation(
            "工单 {WorkOrderCode} 已提交验收（解决措施: {Resolution}）",
            workOrder.WorkOrderCode, request.Resolution);

        // 重新加载工单以获取最新状态（CreateApprovalRecordsAsync 可能已更新状态）
        await dbContext.Entry(workOrder).ReloadAsync(ct);

        return MapToDto(workOrder);
    }

    // ===================================================================
    // 辅助方法
    // ===================================================================

    /// <summary>
    /// 生成工单编码，格式: WO-{yyyyMMdd}-{4位序号}
    /// 编码在同一天内按序号递增，保证唯一性
    /// </summary>
    /// <param name="dbContext">数据库上下文</param>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>生成的工单编码</returns>
    private static async Task<string> GenerateCodeAsync(
        AppDbContext dbContext, Guid tenantId, CancellationToken ct)
    {
        var today = DateTime.UtcNow;
        var prefix = $"WO-{today:yyyyMMdd}";

        // 查询今天已有的最大编码序号
        var lastCode = await dbContext.WorkOrders
            .Where(wo => wo.WorkOrderCode.StartsWith(prefix))
            .OrderByDescending(wo => wo.WorkOrderCode)
            .Select(wo => wo.WorkOrderCode)
            .FirstOrDefaultAsync(ct);

        var nextSeq = 1;
        if (!string.IsNullOrEmpty(lastCode) && lastCode.Length > prefix.Length)
        {
            // 从编码中提取序号部分并递增
            var seqPart = lastCode[(prefix.Length + 1)..]; // 跳过 prefix + "-"
            if (int.TryParse(seqPart, out var lastSeq))
            {
                nextSeq = lastSeq + 1;
            }
        }

        return $"{prefix}-{nextSeq:D4}";
    }

    /// <summary>
    /// 写入工单审计日志
    /// 所有工单操作都应调用此方法记录日志，确保操作可追溯
    /// </summary>
    private static async Task WriteLogAsync(
        AppDbContext dbContext, Guid workOrderId, WorkOrderLogAction action,
        string? oldStatus, string? newStatus, Guid? operatorId,
        string? note, CancellationToken ct)
    {
        var log = new WorkOrderLog
        {
            WorkOrderId = workOrderId,
            Action = action,
            OldStatus = oldStatus,
            NewStatus = newStatus,
            OperatorId = operatorId,
            Note = note
        };

        dbContext.WorkOrderLogs.Add(log);
        await Task.CompletedTask; // 保持签名一致性，实际写入在调用方的 SaveChanges 中完成
    }

    /// <summary>
    /// 通用状态转换方法，校验状态流转合法性
    /// 通过 _validTransitions 字典判断当前状态是否允许转换到目标状态
    /// </summary>
    /// <param name="workOrder">工单实体</param>
    /// <param name="targetStatus">目标状态</param>
    /// <exception cref="InvalidOperationException">当状态流转不合法时抛出</exception>
    private static void TransitionStatus(WorkOrder workOrder, WorkOrderStatus targetStatus)
    {
        if (!_validTransitions.TryGetValue(workOrder.Status, out var allowedTargets))
        {
            throw new InvalidOperationException(
                $"工单 {workOrder.WorkOrderCode} 当前状态为 {workOrder.Status}，不允许进行任何状态变更");
        }

        if (!allowedTargets.Contains(targetStatus))
        {
            throw new InvalidOperationException(
                $"工单 {workOrder.WorkOrderCode} 不允许从 {workOrder.Status} 转换到 {targetStatus}。" +
                $"允许的目标状态: {string.Join(", ", allowedTargets)}");
        }

        workOrder.Status = targetStatus;
    }

    /// <summary>
    /// 发布工单状态变更事件
    /// 事件通过 IEventBus 发布，供 SignalR 推送、通知模块等下游消费者处理
    /// </summary>
    private async Task PublishStatusChangedEvent(
        Guid tenantId, Guid workOrderId, WorkOrderStatus oldStatus,
        WorkOrderStatus newStatus, Guid operatorId, CancellationToken ct)
    {
        var evt = new WorkOrderStatusChangedEvent(
            Guid.NewGuid(), DateTime.UtcNow, tenantId,
            workOrderId, oldStatus.ToString(), newStatus.ToString(), operatorId);
        await _eventBus.PublishAsync(evt, ct);
    }

    /// <summary>
    /// 手动映射 WorkOrder 实体为 WorkOrderDto
    /// 将枚举字段转换为字符串，避免依赖 AutoMapper 映射配置
    /// </summary>
    private static WorkOrderDto MapToDto(WorkOrder workOrder)
    {
        return new WorkOrderDto
        {
            Id = workOrder.Id,
            WorkOrderCode = workOrder.WorkOrderCode,
            Title = workOrder.Title,
            Type = workOrder.Type.ToString(),
            Status = workOrder.Status.ToString(),
            Priority = workOrder.Priority.ToString(),
            DeviceId = workOrder.DeviceId,
            AlertId = workOrder.AlertId,
            AnalysisId = workOrder.AnalysisId,
            RootCause = workOrder.RootCause,
            Resolution = workOrder.Resolution,
            AssignedTo = workOrder.AssignedTo,
            DueDate = workOrder.DueDate,
            CompletedAt = workOrder.CompletedAt,
            CreatedAt = workOrder.CreatedAt
        };
    }
}
