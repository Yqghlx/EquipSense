using EquipAI.Application.Approvals.DTOs;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Core.Exceptions;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Approvals;

/// <summary>
/// 审批链服务实现 — 管理审批链模板和工单多级审批流程
///
/// 设计要点：
/// 1. 使用 IServiceScopeFactory 获取 scoped AppDbContext，避免 Singleton 服务直接注入 Scoped 依赖
/// 2. 模板匹配采用三级回退策略：精确匹配 > 类型默认链 > 全局默认链
/// 3. 审批通过/驳回后通过 IEventBus 发布工单状态变更事件，实现模块间解耦
/// 4. 使用 UnfilteredSet 绕过租户过滤器查询模板（模板匹配需要跨租户查询系统模板）
/// </summary>
public class ApprovalChainService : IApprovalChainService
{
    /// <summary>
    /// 单次待审批查询从数据库读取的最大记录数，避免大租户待办请求无界加载。
    /// </summary>
    private const int PendingApprovalBatchSize = 500;

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IEventBus _eventBus;
    private readonly ILogger<ApprovalChainService> _logger;

    public ApprovalChainService(
        IServiceScopeFactory scopeFactory,
        IEventBus eventBus,
        ILogger<ApprovalChainService> logger)
    {
        _scopeFactory = scopeFactory;
        _eventBus = eventBus;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<List<ApprovalChainTemplateDto>> ListTemplatesAsync(Guid tenantId, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var templates = await dbContext.ApprovalChainTemplates
            .Include(t => t.Steps)
            .Where(t => t.TenantId == tenantId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(ct);

        return templates.Select(MapTemplateToDto).ToList();
    }

    /// <inheritdoc />
    public async Task<ApprovalChainTemplateDto> CreateTemplateAsync(
        Guid tenantId, CreateApprovalChainRequest request, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 解析工单类型和优先级枚举
        WorkOrderType? woType = Enum.TryParse<WorkOrderType>(request.WorkOrderType, ignoreCase: true, out var t) ? t : null;
        WorkOrderPriority? priority = Enum.TryParse<WorkOrderPriority>(request.Priority, ignoreCase: true, out var p) ? p : null;

        var template = new ApprovalChainTemplate
        {
            TenantId = tenantId,
            WorkOrderType = woType,
            Priority = priority,
            Name = request.Name,
            IsDefault = request.IsDefault,
            Enabled = true,
            Steps = request.Steps.Select(s => new ApprovalStep
            {
                StepOrder = s.StepOrder,
                Role = s.Role,
                SpecificApproverId = s.SpecificApproverId,
                IsRequired = s.IsRequired
            }).ToList()
        };

        dbContext.ApprovalChainTemplates.Add(template);
        await dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("审批链模板已创建: {Name}（租户: {TenantId}）", request.Name, tenantId);

        return MapTemplateToDto(template);
    }

    /// <inheritdoc />
    public async Task<ApprovalChainTemplateDto> UpdateTemplateAsync(
        Guid tenantId, Guid templateId, UpdateApprovalChainRequest request, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var template = await dbContext.ApprovalChainTemplates
            .Include(t => t.Steps)
            .FirstOrDefaultAsync(t => t.Id == templateId && t.TenantId == tenantId, ct);

        if (template == null)
        {
            throw new KeyNotFoundException($"审批链模板不存在: {templateId}");
        }

        // 更新模板字段（仅更新非 null 的字段）
        if (request.Name is not null) template.Name = request.Name;
        if (request.Enabled.HasValue) template.Enabled = request.Enabled.Value;

        // 如果提供了新的步骤列表，替换已有步骤
        if (request.Steps is not null)
        {
            // 先删除旧步骤
            dbContext.ApprovalSteps.RemoveRange(template.Steps);

            // 添加新步骤
            template.Steps = request.Steps.Select(s => new ApprovalStep
            {
                ChainId = template.Id,
                StepOrder = s.StepOrder,
                Role = s.Role,
                SpecificApproverId = s.SpecificApproverId,
                IsRequired = s.IsRequired
            }).ToList();
        }

        await dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("审批链模板已更新: {Name}（ID: {TemplateId}）", template.Name, templateId);

        return MapTemplateToDto(template);
    }

    /// <inheritdoc />
    public async Task DeleteTemplateAsync(Guid tenantId, Guid templateId, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var template = await dbContext.ApprovalChainTemplates
            .Include(t => t.Steps)
            .FirstOrDefaultAsync(t => t.Id == templateId && t.TenantId == tenantId, ct);

        if (template == null)
        {
            throw new KeyNotFoundException($"审批链模板不存在: {templateId}");
        }

        dbContext.ApprovalChainTemplates.Remove(template);
        await dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("审批链模板已删除: {Name}（ID: {TemplateId}）", template.Name, templateId);
    }

    /// <inheritdoc />
    public async Task CreateApprovalRecordsAsync(
        Guid tenantId, Guid workOrderId, WorkOrderType type, WorkOrderPriority priority, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 三级回退匹配审批链模板
        var template = await MatchTemplateAsync(dbContext, tenantId, type, priority, ct);

        if (template == null)
        {
            _logger.LogInformation(
                "未找到匹配的审批链模板（租户: {TenantId}, 类型: {Type}, 优先级: {Priority}），跳过审批记录创建",
                tenantId, type, priority);
            return;
        }

        // 确保加载步骤
        if (template.Steps.Count == 0)
        {
            await dbContext.Entry(template).Collection(t => t.Steps).LoadAsync(ct);
        }

        // 按步骤顺序创建审批记录
        var approvals = template.Steps
            .OrderBy(s => s.StepOrder)
            .Select(step => new WorkOrderApproval
            {
                TenantId = tenantId,
                WorkOrderId = workOrderId,
                StepOrder = step.StepOrder,
                ExpectedRole = step.Role,
                SpecificApproverId = step.SpecificApproverId,
                Action = ApprovalAction.Pending
            })
            .ToList();

        // 重新提交（驳回返工后再次提交验收）时，必须先作废上一轮的审批记录。
        // 否则上一轮的记录（含被驳回的 Rejected）会与本轮新记录共存，ApproveAsync 的"全部步骤通过"
        // 判定（allApprovals.All(a => a.Action == Approved)）会被上一轮的 Rejected 永久判定为 false，
        // 工单即使本轮全部通过也无法进入 Accepted → 永久卡在审批中，维修闭环（派工执行）被阻断。
        // 安全性：WorkOrderApproval 无外键被其他表引用，审批人/意见的审计由 WorkOrderLog
        // 状态变更日志保留，删除上一轮作废记录不丢审计。
        var previousApprovals = await dbContext.WorkOrderApprovals
            .Where(a => a.TenantId == tenantId && a.WorkOrderId == workOrderId)
            .ToListAsync(ct);
        if (previousApprovals.Count > 0)
        {
            dbContext.WorkOrderApprovals.RemoveRange(previousApprovals);
            _logger.LogInformation(
                "工单 {WorkOrderId} 重新提交验收，作废上一轮 {Count} 条审批记录",
                workOrderId, previousApprovals.Count);
        }

        dbContext.WorkOrderApprovals.AddRange(approvals);
        await dbContext.SaveChangesAsync(ct);

        _logger.LogInformation(
            "工单 {WorkOrderId} 已匹配审批链模板「{TemplateName}」，创建了 {StepCount} 个审批步骤",
            workOrderId, template.Name, approvals.Count);

        // 注意：工单状态流转（→SubmittedForApproval）与状态变更事件发布由调用方 WorkOrderService.SubmitAsync
        // 统一负责（单一职责），本方法只创建审批记录，不再越权改状态/发事件（回归 bug #247 重构）。
    }

    /// <inheritdoc />
    public async Task ApproveAsync(
        Guid tenantId, Guid workOrderId, Guid approverId, string? approverRole,
        string? comment, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var eventBus = scope.ServiceProvider.GetService<IEventBus>() ?? _eventBus;

        // 先确认工单属于显式租户。跨租户或不存在的工单必须返回 404，
        // 避免把“资源不可见”误报为“审批状态冲突”，也不向调用方泄露资源存在性。
        await EnsureWorkOrderExistsAsync(dbContext, tenantId, workOrderId, ct);

        // 获取当前待审批的步骤（按步骤顺序取第一个 Pending 的记录）
        var currentApproval = await dbContext.WorkOrderApprovals
            .Where(a => a.TenantId == tenantId
                && a.WorkOrderId == workOrderId
                && a.Action == ApprovalAction.Pending)
            .OrderBy(a => a.StepOrder)
            .FirstOrDefaultAsync(ct);

        if (currentApproval == null)
        {
            throw new InvalidOperationException($"工单 {workOrderId} 没有待审批的步骤");
        }

        EnsureApprovalActor(currentApproval, approverId, approverRole);

        // 更新当前步骤的审批信息
        currentApproval.ApproverId = approverId;
        currentApproval.Action = ApprovalAction.Approved;
        currentApproval.Comment = comment;
        currentApproval.ActedAt = DateTime.UtcNow;

        // 检查是否所有步骤都已通过
        var allApprovals = await dbContext.WorkOrderApprovals
            .Where(a => a.TenantId == tenantId && a.WorkOrderId == workOrderId)
            .OrderBy(a => a.StepOrder)
            .ToListAsync(ct);

        var allApproved = allApprovals.All(a => a.Action == ApprovalAction.Approved);

        if (allApproved)
        {
            // 所有步骤通过，将工单状态变为 Accepted
            var workOrder = await dbContext.WorkOrders
                .FirstOrDefaultAsync(wo => wo.TenantId == tenantId && wo.Id == workOrderId, ct);
            if (workOrder != null)
            {
                var oldStatus = workOrder.Status;
                workOrder.Status = WorkOrderStatus.Accepted;

                _logger.LogInformation(
                    "工单 {WorkOrderId} 所有审批步骤已通过，状态变更为 Accepted", workOrderId);

                // 发布工单状态变更事件
                await PublishStatusChangedEvent(eventBus, tenantId, workOrderId, oldStatus, workOrder.Status, approverId, ct);
                await dbContext.SaveChangesAsync(ct);
            }
            else
            {
                await dbContext.SaveChangesAsync(ct);
            }
        }
        else
        {
            await dbContext.SaveChangesAsync(ct);

            _logger.LogInformation(
                "工单 {WorkOrderId} 第 {StepOrder} 步审批已通过（审批人: {ApproverId}）",
                workOrderId, currentApproval.StepOrder, approverId);
        }
    }

    /// <inheritdoc />
    public async Task RejectAsync(
        Guid tenantId, Guid workOrderId, Guid approverId, string? approverRole,
        string? comment, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var eventBus = scope.ServiceProvider.GetService<IEventBus>() ?? _eventBus;

        // 与通过路径保持相同的资源可见性语义：跨租户或不存在的工单统一返回 404。
        await EnsureWorkOrderExistsAsync(dbContext, tenantId, workOrderId, ct);

        // 获取当前待审批的步骤
        var currentApproval = await dbContext.WorkOrderApprovals
            .Where(a => a.TenantId == tenantId
                && a.WorkOrderId == workOrderId
                && a.Action == ApprovalAction.Pending)
            .OrderBy(a => a.StepOrder)
            .FirstOrDefaultAsync(ct);

        if (currentApproval == null)
        {
            throw new InvalidOperationException($"工单 {workOrderId} 没有待审批的步骤");
        }

        EnsureApprovalActor(currentApproval, approverId, approverRole);

        // 更新当前步骤为驳回
        currentApproval.ApproverId = approverId;
        currentApproval.Action = ApprovalAction.Rejected;
        currentApproval.Comment = comment;
        currentApproval.ActedAt = DateTime.UtcNow;

        // 将后续未处理的步骤也标记为 Rejected（因为链式审批中，某一步驳回后后续步骤不再执行）
        var laterApprovals = await dbContext.WorkOrderApprovals
            .Where(a => a.TenantId == tenantId
                && a.WorkOrderId == workOrderId
                && a.StepOrder > currentApproval.StepOrder
                && a.Action == ApprovalAction.Pending)
            .ToListAsync(ct);

        foreach (var later in laterApprovals)
        {
            later.Action = ApprovalAction.Rejected;
            later.Comment = "前置步骤被驳回，自动跳过";
        }

        // 工单状态回到 InProgress
        var workOrder = await dbContext.WorkOrders
            .FirstOrDefaultAsync(wo => wo.TenantId == tenantId && wo.Id == workOrderId, ct);
        if (workOrder != null)
        {
            var oldStatus = workOrder.Status;
            workOrder.Status = WorkOrderStatus.InProgress;

            _logger.LogInformation(
                "工单 {WorkOrderId} 第 {StepOrder} 步审批被驳回（审批人: {ApproverId}），工单回到 InProgress",
                workOrderId, currentApproval.StepOrder, approverId);

            // 发布工单状态变更事件
            await PublishStatusChangedEvent(eventBus, tenantId, workOrderId, oldStatus, workOrder.Status, approverId, ct);
            await dbContext.SaveChangesAsync(ct);
        }
        else
        {
            await dbContext.SaveChangesAsync(ct);
        }
    }

    /// <inheritdoc />
    public async Task<List<WorkOrderApprovalDto>> GetApprovalsAsync(
        Guid tenantId, Guid workOrderId, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var approvals = await dbContext.WorkOrderApprovals
            .Where(a => a.TenantId == tenantId && a.WorkOrderId == workOrderId)
            .OrderBy(a => a.StepOrder)
            .ToListAsync(ct);

        return approvals.Select(MapApprovalToDto).ToList();
    }

    /// <inheritdoc />
    public async Task<List<WorkOrderApprovalDto>> GetPendingApprovalsAsync(
        Guid tenantId, Guid approverId, string? role, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 缺少角色时必须 fail-closed，不能因为调用方没有传角色而返回当前租户全部审批任务。
        if (string.IsNullOrWhiteSpace(role))
        {
            return [];
        }

        // 查询待审批记录：先显式限定租户，再在内存中按统一规则比较角色。
        // 审批模板历史数据同时存在 PascalCase 和 snake_case，直接使用数据库等值比较会导致
        // 合法用户看不到自己的任务；在租户范围内做规范化比较可兼容旧数据且不会扩大跨租户范围。
        // 使用稳定主键游标分批读取，避免租户待办规模增长后形成无界查询结果集。
        var pendingQuery = dbContext.WorkOrderApprovals
            .AsNoTracking()
            .Where(a => a.TenantId == tenantId
                && a.Action == ApprovalAction.Pending
                && (a.SpecificApproverId == null || a.SpecificApproverId == approverId));

        var normalizedRole = NormalizeRole(role);
        var result = new List<WorkOrderApprovalDto>();
        Guid? lastApprovalId = null;

        while (true)
        {
            var batchQuery = pendingQuery;
            if (lastApprovalId.HasValue)
            {
                batchQuery = batchQuery.Where(a => a.Id > lastApprovalId.Value);
            }

            var approvals = await batchQuery
                .OrderBy(a => a.Id)
                .Take(PendingApprovalBatchSize)
                .Select(a => new
                {
                    a.Id,
                    a.WorkOrderId,
                    a.StepOrder,
                    a.ExpectedRole,
                    a.SpecificApproverId,
                    a.ApproverId,
                    a.Action,
                    a.Comment,
                    a.ActedAt,
                })
                .ToListAsync(ct);

            if (approvals.Count == 0)
            {
                break;
            }

            result.AddRange(approvals
                .Where(a => NormalizeRole(a.ExpectedRole) == normalizedRole)
                .Select(a => new WorkOrderApprovalDto(
                    a.Id,
                    a.WorkOrderId,
                    a.StepOrder,
                    a.ExpectedRole,
                    a.SpecificApproverId,
                    a.ApproverId,
                    a.Action.ToString(),
                    a.Comment,
                    a.ActedAt)));

            lastApprovalId = approvals[^1].Id;
            if (approvals.Count < PendingApprovalBatchSize)
            {
                break;
            }
        }

        return result
            .OrderBy(a => a.StepOrder)
            .ThenBy(a => a.Id)
            .ToList();
    }

    // ===================================================================
    // 辅助方法
    // ===================================================================

    /// <summary>
    /// 验证工单属于调用方显式指定的租户。
    /// 使用显式租户条件而不是依赖当前请求的全局过滤器，确保后台新 scope 和跨租户调用都保持一致。
    /// </summary>
    /// <param name="dbContext">数据库上下文。</param>
    /// <param name="tenantId">调用方租户 ID。</param>
    /// <param name="workOrderId">工单 ID。</param>
    /// <param name="ct">取消令牌。</param>
    /// <exception cref="KeyNotFoundException">工单不存在或不属于指定租户时抛出。</exception>
    private static async Task EnsureWorkOrderExistsAsync(
        AppDbContext dbContext,
        Guid tenantId,
        Guid workOrderId,
        CancellationToken ct)
    {
        var exists = await dbContext.WorkOrders
            .IgnoreQueryFilters()
            .AnyAsync(workOrder => workOrder.TenantId == tenantId && workOrder.Id == workOrderId, ct);

        if (!exists)
        {
            throw new KeyNotFoundException($"工单 {workOrderId} 不存在");
        }
    }

    /// <summary>
    /// 校验当前用户是否具备当前审批步骤要求的角色，并且在步骤指定审批人时校验用户 ID。
    /// </summary>
    /// <param name="approval">当前待审批记录。</param>
    /// <param name="approverId">当前审批人的用户 ID。</param>
    /// <param name="approverRole">当前用户 JWT 中的角色。</param>
    /// <exception cref="ForbiddenAccessException">角色缺失或不匹配时抛出。</exception>
    private static void EnsureApprovalActor(
        WorkOrderApproval approval, Guid approverId, string? approverRole)
    {
        var isSpecificApproverMismatch = approval.SpecificApproverId.HasValue
            && approval.SpecificApproverId.Value != approverId;
        if (isSpecificApproverMismatch || !RolesMatch(approval.ExpectedRole, approverRole))
        {
            throw new ForbiddenAccessException("当前用户没有执行该审批步骤的权限");
        }
    }

    /// <summary>
    /// 比较审批角色。角色配置历史上允许 PascalCase、snake_case 和大小写差异，
    /// 因此统一移除分隔符并转小写；空角色永远不匹配，确保权限校验默认拒绝。
    /// </summary>
    private static bool RolesMatch(string? expectedRole, string? actualRole)
    {
        var normalizedExpectedRole = NormalizeRole(expectedRole);
        var normalizedActualRole = NormalizeRole(actualRole);
        return normalizedExpectedRole.Length > 0
            && normalizedExpectedRole == normalizedActualRole;
    }

    /// <summary>
    /// 规范化角色名称，兼容 PascalCase、snake_case、短横线和大小写差异。
    /// </summary>
    private static string NormalizeRole(string? role)
        => string.IsNullOrWhiteSpace(role)
            ? string.Empty
            : new string(role.Where(char.IsLetterOrDigit)
                .Select(char.ToLowerInvariant)
                .ToArray());

    /// <summary>
    /// 三级回退匹配审批链模板
    /// 匹配优先级：
    /// 1. 精确匹配 (Type, Priority)
    /// 2. 类型默认链 (Type, IsDefault=true)
    /// 3. 全局默认链 (Type=null, IsDefault=true)
    /// </summary>
    private static async Task<ApprovalChainTemplate?> MatchTemplateAsync(
        AppDbContext dbContext, Guid tenantId, WorkOrderType type, WorkOrderPriority priority, CancellationToken ct)
    {
        // 第一级：精确匹配 (Type, Priority)
        var template = await dbContext.ApprovalChainTemplates
            .Include(t => t.Steps)
            .Where(t => t.TenantId == tenantId && t.Enabled
                && t.WorkOrderType == type && t.Priority == priority)
            .FirstOrDefaultAsync(ct);

        if (template != null) return template;

        // 第二级：类型默认链 (Type, IsDefault=true, Priority=null)
        template = await dbContext.ApprovalChainTemplates
            .Include(t => t.Steps)
            .Where(t => t.TenantId == tenantId && t.Enabled
                && t.WorkOrderType == type && t.Priority == null && t.IsDefault)
            .FirstOrDefaultAsync(ct);

        if (template != null) return template;

        // 第三级：全局默认链 (Type=null, IsDefault=true)
        template = await dbContext.ApprovalChainTemplates
            .Include(t => t.Steps)
            .Where(t => t.TenantId == tenantId && t.Enabled
                && t.WorkOrderType == null && t.IsDefault)
            .FirstOrDefaultAsync(ct);

        return template;
    }

    /// <summary>
    /// 发布工单状态变更事件
    /// </summary>
    private async Task PublishStatusChangedEvent(
        IEventBus eventBus,
        Guid tenantId, Guid workOrderId, WorkOrderStatus oldStatus,
        WorkOrderStatus newStatus, Guid? operatorId, CancellationToken ct)
    {
        var evt = new WorkOrderStatusChangedEvent(
            Guid.NewGuid(), DateTime.UtcNow, tenantId,
            workOrderId, oldStatus.ToString(), newStatus.ToString(), operatorId);
        await eventBus.PublishAsync(evt, ct);
    }

    /// <summary>
    /// 映射审批链模板实体为 DTO
    /// </summary>
    private static ApprovalChainTemplateDto MapTemplateToDto(ApprovalChainTemplate template)
    {
        return new ApprovalChainTemplateDto(
            template.Id,
            template.WorkOrderType?.ToString(),
            template.Priority?.ToString(),
            template.Name,
            template.IsDefault,
            template.Enabled,
            template.Steps.Select(s => new ApprovalStepDto(
                s.Id, s.StepOrder, s.Role, s.SpecificApproverId, s.IsRequired)).ToList(),
            template.CreatedAt);
    }

    /// <summary>
    /// 映射审批记录实体为 DTO
    /// </summary>
    private static WorkOrderApprovalDto MapApprovalToDto(WorkOrderApproval approval)
    {
        return new WorkOrderApprovalDto(
            approval.Id,
            approval.WorkOrderId,
            approval.StepOrder,
            approval.ExpectedRole,
            approval.SpecificApproverId,
            approval.ApproverId,
            approval.Action.ToString(),
            approval.Comment,
            approval.ActedAt);
    }
}
