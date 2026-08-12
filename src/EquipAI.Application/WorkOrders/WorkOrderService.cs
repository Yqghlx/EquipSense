using EquipAI.Application.Approvals;
using EquipAI.Application.DTOs.Common;
using EquipAI.Core.Models;
using EquipAI.Core.Extensions;
using EquipAI.Application.WorkOrders.DTOs;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Metrics;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
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
        var eventBus = ResolveEventBus(scope.ServiceProvider);

        // 解析枚举字段，解析失败时使用默认值
        var type = Enum.TryParse<WorkOrderType>(request.Type, ignoreCase: true, out var t)
            ? t : WorkOrderType.Corrective;
        var priority = Enum.TryParse<WorkOrderPriority>(request.Priority, ignoreCase: true, out var p)
            ? p : WorkOrderPriority.Medium;

        // 编码生成器内部需要先 SaveChanges 才能捕获唯一约束冲突；把整个编码重试、
        // 审计日志和 Outbox 登记包进同一数据库事务，避免“工单已落库但创建事件未登记”的崩溃窗口。
        // Npgsql 启用了瞬时故障重试，因此必须由 execution strategy 包装用户事务。
        // InMemory 仅用于快速单元测试且不支持事务，跳过事务只影响测试提供程序，不改变生产路径。
        WorkOrder? workOrder = null;
        async Task PersistCreateAsync()
        {
            IDbContextTransaction? transaction = null;
            try
            {
                if (dbContext.Database.IsRelational())
                {
                    transaction = await dbContext.Database.BeginTransactionAsync(ct);
                }

                // 生成唯一工单编码并持久化（带并发冲突重试）。
                // 与 WorkOrderAutoCreateHandler 共用 WorkOrderCodeGenerator，保证两条路径行为一致：
                // 同样 IgnoreQueryFilters 读跨租户最大序号、同样在唯一约束冲突时重试。
                workOrder = await WorkOrderCodeGenerator.CreateWithUniqueCodeAsync(
                    dbContext,
                    code => new WorkOrder
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
                        // JSON 反序列化的 DueDate 可能 Kind=Unspecified，入库 timestamptz 列前需转 Utc
                        DueDate = request.DueDate.ToSafeUtc(),
                        CreatedBy = userId
                    },
                    _logger,
                    ct);

                if (workOrder is null)
                {
                    // 3 次重试后仍冲突：极少见（需同秒内 3 次并发），向上层暴露为可重试的冲突错误。
                    throw new InvalidOperationException("工单编码生成失败：并发冲突，请稍后重试。");
                }

                // 审计日志在编码重试成功后写入，避免冲突回滚后残留孤立日志。
                await WriteLogAsync(dbContext, workOrder.Id, WorkOrderLogAction.Created,
                    oldStatus: null, newStatus: WorkOrderStatus.PendingDispatch.ToString(),
                    operatorId: userId, note: null, ct: ct);

                // 事务总线会在当前事务内登记 Outbox；InMemory/测试总线则由下面的 SaveChanges 持久化工单和日志。
                var createdEvent = new WorkOrderCreatedEvent(
                    // 工单创建事件使用稳定的工单 ID，客户端重试或消费者重投时可由 Inbox 去重。
                    workOrder.Id, workOrder.CreatedAt, workOrder.TenantId,
                    workOrder.Id, workOrder.DeviceId, workOrder.Title, workOrder.Priority.ToString());
                await eventBus.PublishAsync(createdEvent, ct);
                await dbContext.SaveChangesAsync(ct);

                if (transaction is not null)
                {
                    await transaction.CommitAsync(ct);
                }
            }
            catch
            {
                if (transaction is not null)
                {
                    await transaction.RollbackAsync(ct);
                }

                throw;
            }
            finally
            {
                if (transaction is not null)
                {
                    await transaction.DisposeAsync();
                }
            }
        }

        if (dbContext.Database.IsRelational())
        {
            // 生产数据库需要执行策略包裹显式事务，瞬时故障重试时由策略重新创建事务。
            var executionStrategy = dbContext.Database.CreateExecutionStrategy();
            await executionStrategy.ExecuteAsync(PersistCreateAsync);
        }
        else
        {
            // InMemory 不支持事务，仅执行相同的业务步骤，避免测试被提供程序警告阻断。
            await PersistCreateAsync();
        }

        if (workOrder is null)
        {
            throw new InvalidOperationException("工单创建失败：事务未返回工单实体。");
        }

        _logger.LogInformation("工单已创建: {WorkOrderCode}（设备: {DeviceId}, 优先级: {Priority}）",
            workOrder.WorkOrderCode, request.DeviceId, priority);

        BusinessMetrics.WorkOrdersCreated.WithLabels(type.ToString(), priority.ToString()).Inc();

        // 返回已提交的工单；创建事件由 Outbox 分发器异步投递给下游模块。
        return MapToDto(workOrder);
    }

    /// <inheritdoc />
    public async Task<WorkOrderDto> GetByIdAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 全局过滤器是纵深防御；资源定位必须同时校验业务层传入的租户，避免上下文租户异常时跨租户读取。
        var workOrder = await dbContext.WorkOrders
            .FirstOrDefaultAsync(wo => wo.Id == id && wo.TenantId == tenantId, ct);
        if (workOrder == null)
        {
            throw new KeyNotFoundException($"工单不存在: {id}");
        }

        var assignedToNames = await LoadAssignedToNamesAsync(dbContext, tenantId, [workOrder], ct);
        return MapToDto(workOrder, ResolveAssignedToName(workOrder, assignedToNames));
    }

    /// <inheritdoc />
    public async Task<PagedResult<WorkOrderDto>> ListAsync(
        Guid tenantId, int page, int pageSize, string? status = null,
        Guid? deviceId = null, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 全局过滤器是纵深防御，分页总数和数据项都必须显式绑定业务租户。
        var query = dbContext.WorkOrders
            .Where(wo => wo.TenantId == tenantId)
            .AsQueryable();

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
        var assignedToNames = await LoadAssignedToNamesAsync(dbContext, tenantId, items, ct);

        return new PagedResult<WorkOrderDto>
        {
            Items = items
                .Select(workOrder => MapToDto(
                    workOrder,
                    ResolveAssignedToName(workOrder, assignedToNames)))
                .ToList(),
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
        var eventBus = ResolveEventBus(scope.ServiceProvider);

        var workOrder = await dbContext.WorkOrders
            .FirstOrDefaultAsync(wo => wo.Id == id && wo.TenantId == tenantId, ct);
        if (workOrder == null)
        {
            throw new KeyNotFoundException($"工单不存在: {id}");
        }

        // 工单只允许指派给当前租户内仍启用的真实用户，避免写入孤儿 UUID，
        // 让后续通知、审计和知识沉淀都能可靠关联到执行人。
        var assignee = await dbContext.Users
            .AsNoTracking()
            .Where(user => user.Id == request.AssignedTo
                && user.TenantId == tenantId
                && user.IsActive)
            .Select(user => new { user.Username, user.DisplayName })
            .FirstOrDefaultAsync(ct);
        if (assignee == null)
        {
            throw new ArgumentException("指定的执行人不存在或已停用。", nameof(request.AssignedTo));
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

        await PublishStatusChangedEvent(eventBus, tenantId, workOrder.Id, oldStatus, workOrder.Status, userId, ct);
        await dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("工单 {WorkOrderCode} 已派工给 {AssignedTo}", workOrder.WorkOrderCode, request.AssignedTo);

        // 发布状态变更事件
        var assignedToName = string.IsNullOrWhiteSpace(assignee.DisplayName)
            ? assignee.Username
            : assignee.DisplayName;
        return MapToDto(workOrder, assignedToName);
    }

    /// <inheritdoc />
    public async Task<WorkOrderDto> StartAsync(
        Guid tenantId, Guid id, Guid userId, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var eventBus = ResolveEventBus(scope.ServiceProvider);

        var workOrder = await dbContext.WorkOrders
            .FirstOrDefaultAsync(wo => wo.Id == id && wo.TenantId == tenantId, ct);
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

        await PublishStatusChangedEvent(eventBus, tenantId, workOrder.Id, oldStatus, workOrder.Status, userId, ct);
        await dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("工单 {WorkOrderCode} 已开始执行", workOrder.WorkOrderCode);

        return MapToDto(workOrder);
    }

    /// <inheritdoc />
    public async Task<WorkOrderDto> CompleteAsync(
        Guid tenantId, Guid id, CompleteWorkOrderRequest request, Guid userId, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var eventBus = ResolveEventBus(scope.ServiceProvider);

        var workOrder = await dbContext.WorkOrders
            .FirstOrDefaultAsync(wo => wo.Id == id && wo.TenantId == tenantId, ct);
        if (workOrder == null)
        {
            throw new KeyNotFoundException($"工单不存在: {id}");
        }

        var oldStatus = workOrder.Status;

        TransitionStatus(workOrder, WorkOrderStatus.Completed);

        // 记录解决措施、维修执行报告、使用零件和完成时间
        // 执行报告/使用零件是知识沉淀 FaultCase.Solution/PartsUsed 的数据源（回归 #252：原为死字段，
        // 完成工单时从不写入 → Solution 永远降级为 Resolution、PartsUsed 永远空）
        workOrder.Resolution = request.Resolution;
        workOrder.ExecutionReport = request.ExecutionReport;
        workOrder.RequiredParts = request.RequiredParts;
        workOrder.CompletedAt = DateTime.UtcNow;
        // 计算实际维修工时（CompletedAt - StartedAt），供知识沉淀阈值与 MTTR/KPI 核算（见 ComputeActualHours）
        ComputeActualHours(workOrder);

        await WriteLogAsync(dbContext, workOrder.Id, WorkOrderLogAction.StatusChanged,
            oldStatus.ToString(), WorkOrderStatus.Completed.ToString(),
            userId, note: $"解决措施: {request.Resolution}", ct);

        await PublishStatusChangedEvent(eventBus, tenantId, workOrder.Id, oldStatus, workOrder.Status, userId, ct);
        await dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("工单 {WorkOrderCode} 已完成（解决措施: {Resolution}）",
            workOrder.WorkOrderCode, request.Resolution);

        return MapToDto(workOrder);
    }

    /// <inheritdoc />
    public async Task<WorkOrderDto> AcceptAsync(
        Guid tenantId, Guid id, Guid userId, string? note = null, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var eventBus = ResolveEventBus(scope.ServiceProvider);

        var workOrder = await dbContext.WorkOrders
            .FirstOrDefaultAsync(wo => wo.Id == id && wo.TenantId == tenantId, ct);
        if (workOrder == null)
        {
            throw new KeyNotFoundException($"工单不存在: {id}");
        }

        var oldStatus = workOrder.Status;

        TransitionStatus(workOrder, WorkOrderStatus.Accepted);

        await WriteLogAsync(dbContext, workOrder.Id, WorkOrderLogAction.StatusChanged,
            oldStatus.ToString(), WorkOrderStatus.Accepted.ToString(),
            userId, note, ct);

        await PublishStatusChangedEvent(eventBus, tenantId, workOrder.Id, oldStatus, workOrder.Status, userId, ct);
        await dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("工单 {WorkOrderCode} 已验收通过", workOrder.WorkOrderCode);

        return MapToDto(workOrder);
    }

    /// <inheritdoc />
    public async Task<WorkOrderDto> RejectAsync(
        Guid tenantId, Guid id, Guid userId, string? note = null, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var eventBus = ResolveEventBus(scope.ServiceProvider);

        var workOrder = await dbContext.WorkOrders
            .FirstOrDefaultAsync(wo => wo.Id == id && wo.TenantId == tenantId, ct);
        if (workOrder == null)
        {
            throw new KeyNotFoundException($"工单不存在: {id}");
        }

        var oldStatus = workOrder.Status;

        TransitionStatus(workOrder, WorkOrderStatus.Rejected);

        await WriteLogAsync(dbContext, workOrder.Id, WorkOrderLogAction.StatusChanged,
            oldStatus.ToString(), WorkOrderStatus.Rejected.ToString(),
            userId, note ?? "验收不通过，返工", ct);

        await PublishStatusChangedEvent(eventBus, tenantId, workOrder.Id, oldStatus, workOrder.Status, userId, ct);
        await dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("工单 {WorkOrderCode} 验收不通过，已返工", workOrder.WorkOrderCode);

        return MapToDto(workOrder);
    }

    /// <inheritdoc />
    public async Task<WorkOrderDto> CloseAsync(
        Guid tenantId, Guid id, Guid userId, string? note = null, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var eventBus = ResolveEventBus(scope.ServiceProvider);

        var workOrder = await dbContext.WorkOrders
            .FirstOrDefaultAsync(wo => wo.Id == id && wo.TenantId == tenantId, ct);
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

        await PublishStatusChangedEvent(eventBus, tenantId, workOrder.Id, oldStatus, workOrder.Status, userId, ct);
        await dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("工单 {WorkOrderCode} 已关闭", workOrder.WorkOrderCode);

        return MapToDto(workOrder);
    }

    /// <inheritdoc />
    public async Task<WorkOrderDto> CancelAsync(
        Guid tenantId, Guid id, Guid userId, string? note = null, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var eventBus = ResolveEventBus(scope.ServiceProvider);

        var workOrder = await dbContext.WorkOrders
            .FirstOrDefaultAsync(wo => wo.Id == id && wo.TenantId == tenantId, ct);
        if (workOrder == null)
        {
            throw new KeyNotFoundException($"工单不存在: {id}");
        }

        var oldStatus = workOrder.Status;

        TransitionStatus(workOrder, WorkOrderStatus.Cancelled);

        await WriteLogAsync(dbContext, workOrder.Id, WorkOrderLogAction.StatusChanged,
            oldStatus.ToString(), WorkOrderStatus.Cancelled.ToString(),
            userId, note ?? "工单已取消", ct);

        await PublishStatusChangedEvent(eventBus, tenantId, workOrder.Id, oldStatus, workOrder.Status, userId, ct);
        await dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("工单 {WorkOrderCode} 已取消", workOrder.WorkOrderCode);

        return MapToDto(workOrder);
    }

    /// <inheritdoc />
    public async Task<WorkOrderDto> SubmitAsync(
        Guid tenantId, Guid id, CompleteWorkOrderRequest request, Guid userId, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var eventBus = ResolveEventBus(scope.ServiceProvider);

        var workOrder = await dbContext.WorkOrders
            .FirstOrDefaultAsync(wo => wo.Id == id && wo.TenantId == tenantId, ct);
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

        var oldStatus = workOrder.Status;

        // 状态流转：SubmitAsync 是状态流转的唯一负责人，无论是否匹配到审批链模板都应将工单
        // 置为 SubmittedForApproval。原实现把状态流转外包给 ApprovalChainService.CreateApprovalRecordsAsync
        // 的副作用，导致无审批链模板时工单状态实际未变更（只写了 "SubmittedForApproval" 日志字符串，
        // 实体 Status 仍是 InProgress/Completed），且不发布事件 → Dashboard/工单列表/详情页不实时刷新
        // （回归 bug #247）。
        TransitionStatus(workOrder, WorkOrderStatus.SubmittedForApproval);

        // 记录解决措施、维修执行报告、使用零件和完成时间
        // 执行报告/使用零件是知识沉淀 FaultCase.Solution/PartsUsed 的数据源（回归 #252：原为死字段，
        // 提交验收时从不写入 → Solution 永远降级为 Resolution、PartsUsed 永远空）
        workOrder.Resolution = request.Resolution;
        workOrder.ExecutionReport = request.ExecutionReport;
        workOrder.RequiredParts = request.RequiredParts;
        if (workOrder.CompletedAt == null)
        {
            workOrder.CompletedAt = DateTime.UtcNow;
        }
        // 计算实际维修工时。从 InProgress 直接提交验收时此处首次设 CompletedAt；
        // 从 Completed 提交时 CompletedAt 已有值，幂等重算结果一致（见 ComputeActualHours）
        ComputeActualHours(workOrder);

        await WriteLogAsync(dbContext, workOrder.Id, WorkOrderLogAction.StatusChanged,
            oldStatus.ToString(), WorkOrderStatus.SubmittedForApproval.ToString(),
            userId, note: $"提交验收（解决措施: {request.Resolution}）", ct);

        await PublishStatusChangedEvent(eventBus, tenantId, workOrder.Id, oldStatus, workOrder.Status, userId, ct);
        await dbContext.SaveChangesAsync(ct);

        // 匹配审批链模板并创建审批记录（仅创建记录，状态流转已由本方法完成，单一职责）
        await _approvalChainService.CreateApprovalRecordsAsync(
            tenantId, workOrder.Id, workOrder.Type, workOrder.Priority, ct);

        _logger.LogInformation(
            "工单 {WorkOrderCode} 已提交验收（解决措施: {Resolution}）",
            workOrder.WorkOrderCode, request.Resolution);

        return MapToDto(workOrder);
    }

    // ===================================================================
    // 辅助方法
    // ===================================================================

    /// <summary>
    /// 写入工单审计日志
    /// 所有工单操作都应调用此方法记录日志，确保操作可追溯
    /// </summary>
    /// <summary>
    /// 计算实际维修工时（小时）= CompletedAt - StartedAt，仅在两个时间戳都有值时计算（clamp 到 ≥0）。
    ///
    /// 关键不变量：ActualHours 是核心运维 KPI（维修人工成本、MTTR、技师效率），同时是知识沉淀
    /// 时长阈值的依据——KnowledgeCaptureService.CaptureFromWorkOrderAsync 用
    /// <c>(wo.ActualHours ?? 0) &lt; MinHoursForCapture</c> 过滤短工单。原实现工单完成时只设
    /// StartedAt/CompletedAt 却从不计算 ActualHours，导致该字段永远为 null → 知识沉淀阈值恒判
    /// 「时长不足」跳过所有工单 → 知识库自学习整体失效。本方法在工单完成/提交验收时调用以补齐。
    /// </summary>
    private static void ComputeActualHours(WorkOrder workOrder)
    {
        if (workOrder.StartedAt.HasValue && workOrder.CompletedAt.HasValue)
        {
            workOrder.ActualHours = Math.Max(0, (workOrder.CompletedAt.Value - workOrder.StartedAt.Value).TotalHours);
        }
    }

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
        IEventBus eventBus,
        Guid tenantId, Guid workOrderId, WorkOrderStatus oldStatus,
        WorkOrderStatus newStatus, Guid operatorId, CancellationToken ct)
    {
        BusinessMetrics.WorkOrderStatusChanges.WithLabels(oldStatus.ToString(), newStatus.ToString()).Inc();

        var evt = new WorkOrderStatusChangedEvent(
            Guid.NewGuid(), DateTime.UtcNow, tenantId,
            workOrderId, oldStatus.ToString(), newStatus.ToString(), operatorId);
        await eventBus.PublishAsync(evt, ct);
    }

    /// <summary>
    /// 解析当前数据库作用域的事件总线。
    /// 单元测试和旧宿主没有在子作用域注册事件总线时回退到构造函数注入实例。
    /// </summary>
    private IEventBus ResolveEventBus(IServiceProvider serviceProvider) =>
        serviceProvider.GetService<IEventBus>() ?? _eventBus;

    /// <summary>
    /// 批量加载工单执行人名称，避免列表查询出现 N+1。
    /// 显式限定 tenantId，与全局过滤器共同构成多租户纵深隔离。
    /// </summary>
    private static async Task<Dictionary<Guid, string>> LoadAssignedToNamesAsync(
        AppDbContext dbContext,
        Guid tenantId,
        IEnumerable<WorkOrder> workOrders,
        CancellationToken ct)
    {
        var assignedUserIds = workOrders
            .Where(workOrder => workOrder.AssignedTo.HasValue)
            .Select(workOrder => workOrder.AssignedTo!.Value)
            .Distinct()
            .ToArray();

        if (assignedUserIds.Length == 0)
        {
            return [];
        }

        var users = await dbContext.Users
            .AsNoTracking()
            .Where(user => user.TenantId == tenantId && assignedUserIds.Contains(user.Id))
            .Select(user => new { user.Id, user.Username, user.DisplayName })
            .ToListAsync(ct);

        return users.ToDictionary(
            user => user.Id,
            user => string.IsNullOrWhiteSpace(user.DisplayName) ? user.Username : user.DisplayName);
    }

    /// <summary>
    /// 从批量加载结果中解析单个工单的执行人名称。
    /// </summary>
    private static string? ResolveAssignedToName(
        WorkOrder workOrder,
        IReadOnlyDictionary<Guid, string> assignedToNames)
    {
        return workOrder.AssignedTo.HasValue
            && assignedToNames.TryGetValue(workOrder.AssignedTo.Value, out var assignedToName)
                ? assignedToName
                : null;
    }

    /// <summary>
    /// 手动映射 WorkOrder 实体为 WorkOrderDto
    /// 将枚举字段转换为字符串，避免依赖 AutoMapper 映射配置
    /// </summary>
    private static WorkOrderDto MapToDto(WorkOrder workOrder, string? assignedToName = null)
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
            ExecutionReport = workOrder.ExecutionReport,
            RequiredParts = workOrder.RequiredParts,
            AssignedTo = workOrder.AssignedTo,
            AssignedToName = assignedToName,
            DueDate = workOrder.DueDate,
            CompletedAt = workOrder.CompletedAt,
            ActualHours = workOrder.ActualHours,
            CreatedAt = workOrder.CreatedAt
        };
    }

    /// <inheritdoc />
    public async Task<List<WorkOrderLogDto>> GetLogsAsync(
        Guid tenantId, Guid workOrderId, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // WorkOrderLog 本身无 tenant_id 字段，通过关联的 WorkOrder 做租户隔离：
        // 先确认该工单属于当前租户，再查其日志，按时间正序（先发生的在前）
        var belongsToTenant = await dbContext.WorkOrders
            .AnyAsync(w => w.Id == workOrderId && w.TenantId == tenantId, ct);
        if (!belongsToTenant)
        {
            return new List<WorkOrderLogDto>();
        }

        var logs = await dbContext.WorkOrderLogs
            .Where(l => l.WorkOrderId == workOrderId)
            .OrderBy(l => l.CreatedAt)
            .ToListAsync(ct);

        return logs.Select(l => new WorkOrderLogDto
        {
            Id = l.Id,
            WorkOrderId = l.WorkOrderId,
            Action = l.Action.ToString(),
            OldStatus = l.OldStatus,
            NewStatus = l.NewStatus,
            OperatorId = l.OperatorId,
            Note = l.Note,
            CreatedAt = l.CreatedAt,
        }).ToList();
    }
}
