using EquipAI.Application.Approvals.DTOs;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
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
                Action = ApprovalAction.Pending
            })
            .ToList();

        dbContext.WorkOrderApprovals.AddRange(approvals);

        // 同时更新工单状态为 SubmittedForApproval
        var workOrder = await dbContext.WorkOrders.FirstOrDefaultAsync(wo => wo.Id == workOrderId, ct);
        if (workOrder != null)
        {
            var oldStatus = workOrder.Status;
            workOrder.Status = WorkOrderStatus.SubmittedForApproval;

            await dbContext.SaveChangesAsync(ct);

            _logger.LogInformation(
                "工单 {WorkOrderId} 已匹配审批链模板「{TemplateName}」，创建了 {StepCount} 个审批步骤",
                workOrderId, template.Name, approvals.Count);

            // 发布工单状态变更事件
            await PublishStatusChangedEvent(tenantId, workOrderId, oldStatus, workOrder.Status, null, ct);
        }
        else
        {
            await dbContext.SaveChangesAsync(ct);

            _logger.LogInformation(
                "工单 {WorkOrderId} 已匹配审批链模板「{TemplateName}」，创建了 {StepCount} 个审批步骤（工单不存在，仅创建审批记录）",
                workOrderId, template.Name, approvals.Count);
        }
    }

    /// <inheritdoc />
    public async Task ApproveAsync(
        Guid tenantId, Guid workOrderId, Guid approverId, string? comment, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 获取当前待审批的步骤（按步骤顺序取第一个 Pending 的记录）
        var currentApproval = await dbContext.WorkOrderApprovals
            .Where(a => a.WorkOrderId == workOrderId && a.Action == ApprovalAction.Pending)
            .OrderBy(a => a.StepOrder)
            .FirstOrDefaultAsync(ct);

        if (currentApproval == null)
        {
            throw new InvalidOperationException($"工单 {workOrderId} 没有待审批的步骤");
        }

        // 更新当前步骤的审批信息
        currentApproval.ApproverId = approverId;
        currentApproval.Action = ApprovalAction.Approved;
        currentApproval.Comment = comment;
        currentApproval.ActedAt = DateTime.UtcNow;

        // 检查是否所有步骤都已通过
        var allApprovals = await dbContext.WorkOrderApprovals
            .Where(a => a.WorkOrderId == workOrderId)
            .OrderBy(a => a.StepOrder)
            .ToListAsync(ct);

        var allApproved = allApprovals.All(a => a.Action == ApprovalAction.Approved);

        if (allApproved)
        {
            // 所有步骤通过，将工单状态变为 Accepted
            var workOrder = await dbContext.WorkOrders.FirstOrDefaultAsync(wo => wo.Id == workOrderId, ct);
            if (workOrder != null)
            {
                var oldStatus = workOrder.Status;
                workOrder.Status = WorkOrderStatus.Accepted;

                _logger.LogInformation(
                    "工单 {WorkOrderId} 所有审批步骤已通过，状态变更为 Accepted", workOrderId);

                await dbContext.SaveChangesAsync(ct);

                // 发布工单状态变更事件
                await PublishStatusChangedEvent(tenantId, workOrderId, oldStatus, workOrder.Status, approverId, ct);
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
        Guid tenantId, Guid workOrderId, Guid approverId, string? comment, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 获取当前待审批的步骤
        var currentApproval = await dbContext.WorkOrderApprovals
            .Where(a => a.WorkOrderId == workOrderId && a.Action == ApprovalAction.Pending)
            .OrderBy(a => a.StepOrder)
            .FirstOrDefaultAsync(ct);

        if (currentApproval == null)
        {
            throw new InvalidOperationException($"工单 {workOrderId} 没有待审批的步骤");
        }

        // 更新当前步骤为驳回
        currentApproval.ApproverId = approverId;
        currentApproval.Action = ApprovalAction.Rejected;
        currentApproval.Comment = comment;
        currentApproval.ActedAt = DateTime.UtcNow;

        // 将后续未处理的步骤也标记为 Rejected（因为链式审批中，某一步驳回后后续步骤不再执行）
        var laterApprovals = await dbContext.WorkOrderApprovals
            .Where(a => a.WorkOrderId == workOrderId && a.StepOrder > currentApproval.StepOrder && a.Action == ApprovalAction.Pending)
            .ToListAsync(ct);

        foreach (var later in laterApprovals)
        {
            later.Action = ApprovalAction.Rejected;
            later.Comment = "前置步骤被驳回，自动跳过";
        }

        // 工单状态回到 InProgress
        var workOrder = await dbContext.WorkOrders.FirstOrDefaultAsync(wo => wo.Id == workOrderId, ct);
        if (workOrder != null)
        {
            var oldStatus = workOrder.Status;
            workOrder.Status = WorkOrderStatus.InProgress;

            _logger.LogInformation(
                "工单 {WorkOrderId} 第 {StepOrder} 步审批被驳回（审批人: {ApproverId}），工单回到 InProgress",
                workOrderId, currentApproval.StepOrder, approverId);

            await dbContext.SaveChangesAsync(ct);

            // 发布工单状态变更事件
            await PublishStatusChangedEvent(tenantId, workOrderId, oldStatus, workOrder.Status, approverId, ct);
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
            .Where(a => a.WorkOrderId == workOrderId)
            .OrderBy(a => a.StepOrder)
            .ToListAsync(ct);

        return approvals.Select(MapApprovalToDto).ToList();
    }

    /// <inheritdoc />
    public async Task<List<WorkOrderApprovalDto>> GetPendingApprovalsAsync(
        Guid approverId, string? role, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 查询待审批记录：按审批人或角色匹配
        var query = dbContext.WorkOrderApprovals
            .Where(a => a.Action == ApprovalAction.Pending);

        if (!string.IsNullOrWhiteSpace(role))
        {
            // 按角色匹配：查找期望角色匹配的待审批记录
            query = query.Where(a => a.ExpectedRole == role);
        }

        // 如果指定了审批人 ID，也可以匹配 SpecificApproverId（通过审批链模板中的步骤配置）
        // 这里暂时只按角色匹配

        var approvals = await query
            .OrderBy(a => a.StepOrder)
            .ToListAsync(ct);

        return approvals.Select(MapApprovalToDto).ToList();
    }

    // ===================================================================
    // 辅助方法
    // ===================================================================

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
        Guid tenantId, Guid workOrderId, WorkOrderStatus oldStatus,
        WorkOrderStatus newStatus, Guid? operatorId, CancellationToken ct)
    {
        var evt = new WorkOrderStatusChangedEvent(
            Guid.NewGuid(), DateTime.UtcNow, tenantId,
            workOrderId, oldStatus.ToString(), newStatus.ToString(), operatorId);
        await _eventBus.PublishAsync(evt, ct);
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
            approval.ApproverId,
            approval.Action.ToString(),
            approval.Comment,
            approval.ActedAt);
    }
}
