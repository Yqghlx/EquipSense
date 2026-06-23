using EquipAI.Application.Approvals;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Tests.Unit.Approvals;

/// <summary>
/// ApprovalChainService 审批链服务单元测试
/// </summary>
public class ApprovalChainServiceTests : IAsyncDisposable
{
    private readonly ServiceProvider _sp;
    private readonly string _dbName;
    private readonly MutableTenantContext _tenantContext;

    public ApprovalChainServiceTests()
    {
        _dbName = $"ApprovalTest_{Guid.NewGuid()}";
        _tenantContext = new MutableTenantContext();

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(_dbName));

        // 使用可变租户上下文，所有 scope 共享同一个实例
        // 这样可以在测试方法中动态设置 TenantId，确保 Service 内部通过 IServiceScopeFactory
        // 创建的新 scope 也能匹配到正确的租户数据
        services.AddSingleton<ITenantContext>(_tenantContext);

        services.AddLogging();

        // 注册 IEventBus 的 Mock 实现
        services.AddSingleton<IEventBus, TestEventBus>();

        services.AddScoped<IApprovalChainService, ApprovalChainService>();
        _sp = services.BuildServiceProvider();
    }

    // ===================================================================
    // 模板匹配三级回退测试
    // ===================================================================

    [Fact]
    public async Task CreateApprovalRecordsAsync_精确匹配类型和优先级应优先使用()
    {
        // 准备：创建精确匹配模板和类型默认模板
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        // 设置租户上下文，确保 Service 内部新 scope 的查询过滤器能匹配到正确的租户数据
        _tenantContext.SetTenantId(tenantId);

        // 全局默认链
        var globalTemplate = CreateTemplate(tenantId, "全局默认", null, null, isDefault: true,
            new ApprovalStep { StepOrder = 1, Role = "viewer" });

        // 类型默认链
        var typeDefault = CreateTemplate(tenantId, "纠正性默认", WorkOrderType.Corrective, null, isDefault: true,
            new ApprovalStep { StepOrder = 1, Role = "operator" });

        // 精确匹配链（纠正性 + 紧急）
        var exactMatch = CreateTemplate(tenantId, "纠正性紧急", WorkOrderType.Corrective, WorkOrderPriority.Critical, isDefault: false,
            new ApprovalStep { StepOrder = 1, Role = "maintenance_lead" });

        db.ApprovalChainTemplates.AddRange(globalTemplate, typeDefault, exactMatch);

        // 创建工单
        var workOrderId = Guid.NewGuid();
        db.WorkOrders.Add(new WorkOrder
        {
            Id = workOrderId, TenantId = tenantId,
            Title = "测试工单", Status = WorkOrderStatus.Completed,
            Type = WorkOrderType.Corrective, Priority = WorkOrderPriority.Critical,
            DeviceId = Guid.NewGuid()
        });

        await db.SaveChangesAsync();

        // 执行
        var service = scope.ServiceProvider.GetRequiredService<IApprovalChainService>();
        await service.CreateApprovalRecordsAsync(tenantId, workOrderId, WorkOrderType.Corrective, WorkOrderPriority.Critical);

        // 验证：应匹配精确链（期望角色为 maintenance_lead）
        var approvals = await db.WorkOrderApprovals
            .Where(a => a.WorkOrderId == workOrderId)
            .ToListAsync();

        approvals.Should().HaveCount(1);
        approvals[0].ExpectedRole.Should().Be("maintenance_lead");
    }

    [Fact]
    public async Task CreateApprovalRecordsAsync_无精确匹配应回退到类型默认链()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        _tenantContext.SetTenantId(tenantId);

        // 全局默认链
        var globalTemplate = CreateTemplate(tenantId, "全局默认", null, null, isDefault: true,
            new ApprovalStep { StepOrder = 1, Role = "viewer" });

        // 类型默认链（预防性）
        var typeDefault = CreateTemplate(tenantId, "预防性默认", WorkOrderType.Preventive, null, isDefault: true,
            new ApprovalStep { StepOrder = 1, Role = "operator" });

        db.ApprovalChainTemplates.AddRange(globalTemplate, typeDefault);

        var workOrderId = Guid.NewGuid();
        db.WorkOrders.Add(new WorkOrder
        {
            Id = workOrderId, TenantId = tenantId,
            Title = "测试工单", Status = WorkOrderStatus.Completed,
            Type = WorkOrderType.Preventive, Priority = WorkOrderPriority.Medium,
            DeviceId = Guid.NewGuid()
        });

        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<IApprovalChainService>();
        await service.CreateApprovalRecordsAsync(tenantId, workOrderId, WorkOrderType.Preventive, WorkOrderPriority.Medium);

        // 验证：应匹配类型默认链（期望角色为 operator）
        var approvals = await db.WorkOrderApprovals
            .Where(a => a.WorkOrderId == workOrderId)
            .ToListAsync();

        approvals.Should().HaveCount(1);
        approvals[0].ExpectedRole.Should().Be("operator");
    }

    [Fact]
    public async Task CreateApprovalRecordsAsync_无类型匹配应回退到全局默认链()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        _tenantContext.SetTenantId(tenantId);

        // 只有全局默认链
        var globalTemplate = CreateTemplate(tenantId, "全局默认", null, null, isDefault: true,
            new ApprovalStep { StepOrder = 1, Role = "system_admin" });

        db.ApprovalChainTemplates.Add(globalTemplate);

        var workOrderId = Guid.NewGuid();
        db.WorkOrders.Add(new WorkOrder
        {
            Id = workOrderId, TenantId = tenantId,
            Title = "测试工单", Status = WorkOrderStatus.Completed,
            Type = WorkOrderType.Predictive, Priority = WorkOrderPriority.Low,
            DeviceId = Guid.NewGuid()
        });

        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<IApprovalChainService>();
        await service.CreateApprovalRecordsAsync(tenantId, workOrderId, WorkOrderType.Predictive, WorkOrderPriority.Low);

        // 验证：应匹配全局默认链（期望角色为 system_admin）
        var approvals = await db.WorkOrderApprovals
            .Where(a => a.WorkOrderId == workOrderId)
            .ToListAsync();

        approvals.Should().HaveCount(1);
        approvals[0].ExpectedRole.Should().Be("system_admin");
    }

    // ===================================================================
    // 不存在模板时不创建审批记录
    // ===================================================================

    [Fact]
    public async Task CreateApprovalRecordsAsync_不存在模板时不应创建审批记录()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        _tenantContext.SetTenantId(tenantId);

        // 不创建任何模板

        var workOrderId = Guid.NewGuid();
        db.WorkOrders.Add(new WorkOrder
        {
            Id = workOrderId, TenantId = tenantId,
            Title = "测试工单", Status = WorkOrderStatus.Completed,
            Type = WorkOrderType.Corrective, Priority = WorkOrderPriority.Medium,
            DeviceId = Guid.NewGuid()
        });

        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<IApprovalChainService>();
        await service.CreateApprovalRecordsAsync(tenantId, workOrderId, WorkOrderType.Corrective, WorkOrderPriority.Medium);

        // 验证：不应创建任何审批记录
        var approvals = await db.WorkOrderApprovals
            .Where(a => a.WorkOrderId == workOrderId)
            .ToListAsync();

        approvals.Should().BeEmpty();
    }

    // ===================================================================
    // 全部通过后工单状态变更
    // ===================================================================

    [Fact]
    public async Task ApproveAsync_所有步骤通过后工单状态应变为Accepted()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        _tenantContext.SetTenantId(tenantId);

        var workOrderId = Guid.NewGuid();
        db.WorkOrders.Add(new WorkOrder
        {
            Id = workOrderId, TenantId = tenantId,
            Title = "测试工单", Status = WorkOrderStatus.SubmittedForApproval,
            Type = WorkOrderType.Corrective, Priority = WorkOrderPriority.High,
            DeviceId = Guid.NewGuid()
        });

        // 创建两个审批步骤
        db.WorkOrderApprovals.AddRange(
            new WorkOrderApproval
            {
                TenantId = tenantId, WorkOrderId = workOrderId,
                StepOrder = 1, ExpectedRole = "maintenance_lead", Action = ApprovalAction.Pending
            },
            new WorkOrderApproval
            {
                TenantId = tenantId, WorkOrderId = workOrderId,
                StepOrder = 2, ExpectedRole = "system_admin", Action = ApprovalAction.Pending
            }
        );

        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<IApprovalChainService>();
        var approverId = Guid.NewGuid();

        // 通过第一步
        await service.ApproveAsync(tenantId, workOrderId, approverId, "同意");

        // 验证：工单状态仍为 SubmittedForApproval（还有未完成步骤）
        // 注意：由于 Service 内部使用新的 scope/dbcontext，需要用 AsNoTracking 读取最新数据
        var woAfterFirst = await db.WorkOrders.AsNoTracking().FirstAsync(wo => wo.Id == workOrderId);
        woAfterFirst.Status.Should().Be(WorkOrderStatus.SubmittedForApproval);

        // 通过第二步
        var approverId2 = Guid.NewGuid();
        await service.ApproveAsync(tenantId, workOrderId, approverId2, "同意");

        // 验证：所有步骤通过，工单状态变为 Accepted
        var woAfterAll = await db.WorkOrders.AsNoTracking().FirstAsync(wo => wo.Id == workOrderId);
        woAfterAll.Status.Should().Be(WorkOrderStatus.Accepted);

        // 验证审批记录状态
        var approvals = await db.WorkOrderApprovals.AsNoTracking()
            .Where(a => a.WorkOrderId == workOrderId)
            .OrderBy(a => a.StepOrder)
            .ToListAsync();

        approvals.Should().HaveCount(2);
        approvals.All(a => a.Action == ApprovalAction.Approved).Should().BeTrue();
    }

    // ===================================================================
    // 驳回后工单回到执行中
    // ===================================================================

    [Fact]
    public async Task RejectAsync_驳回后工单状态应回到InProgress()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        _tenantContext.SetTenantId(tenantId);

        var workOrderId = Guid.NewGuid();
        db.WorkOrders.Add(new WorkOrder
        {
            Id = workOrderId, TenantId = tenantId,
            Title = "测试工单", Status = WorkOrderStatus.SubmittedForApproval,
            Type = WorkOrderType.Corrective, Priority = WorkOrderPriority.High,
            DeviceId = Guid.NewGuid()
        });

        // 创建两个审批步骤
        db.WorkOrderApprovals.AddRange(
            new WorkOrderApproval
            {
                TenantId = tenantId, WorkOrderId = workOrderId,
                StepOrder = 1, ExpectedRole = "maintenance_lead", Action = ApprovalAction.Pending
            },
            new WorkOrderApproval
            {
                TenantId = tenantId, WorkOrderId = workOrderId,
                StepOrder = 2, ExpectedRole = "system_admin", Action = ApprovalAction.Pending
            }
        );

        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<IApprovalChainService>();
        var approverId = Guid.NewGuid();

        // 驳回第一步
        await service.RejectAsync(tenantId, workOrderId, approverId, "不符合要求");

        // 验证：工单状态回到 InProgress（使用 AsNoTracking 读取最新数据）
        var wo = await db.WorkOrders.AsNoTracking().FirstAsync(w => w.Id == workOrderId);
        wo.Status.Should().Be(WorkOrderStatus.InProgress);

        // 验证：当前步骤被驳回
        var approvals = await db.WorkOrderApprovals.AsNoTracking()
            .Where(a => a.WorkOrderId == workOrderId)
            .OrderBy(a => a.StepOrder)
            .ToListAsync();

        approvals[0].Action.Should().Be(ApprovalAction.Rejected);
        approvals[0].Comment.Should().Be("不符合要求");

        // 后续步骤也应被标记为 Rejected（自动跳过）
        approvals[1].Action.Should().Be(ApprovalAction.Rejected);
        approvals[1].Comment.Should().Be("前置步骤被驳回，自动跳过");
    }

    // ===================================================================
    // 驳回返工后重新提交：旧审批记录不得阻塞新一轮审批
    // ===================================================================

    [Fact]
    public async Task CreateApprovalRecordsAsync_驳回返工后重新提交_应作废旧记录且工单可再次通过审批()
    {
        // 回归 bug：工单"提交验收 → 部分审批 → 驳回（回 InProgress）→ 返工后重新提交验收"时，
        // CreateApprovalRecordsAsync 会再创建一批审批记录，但此前不清理由 RejectAsync 留下的旧记录
        // （含 Rejected）。两批记录共存后，ApproveAsync 的"全部步骤通过"判定（allApprovals.All(Approved)）
        // 会被上一轮的 Rejected 永久判定为 false → 工单即使新一轮全部通过也无法进入 Accepted，
        // 永久卡在审批中，维修闭环（派工执行）被阻断。
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();
        _tenantContext.SetTenantId(tenantId);

        // 审批模板：2 步（维护主管 + 系统管理员）
        db.ApprovalChainTemplates.Add(CreateTemplate(tenantId, "纠正性默认", WorkOrderType.Corrective, null,
            isDefault: true,
            new ApprovalStep { StepOrder = 1, Role = "maintenance_lead" },
            new ApprovalStep { StepOrder = 2, Role = "system_admin" }));

        var workOrderId = Guid.NewGuid();
        db.WorkOrders.Add(new WorkOrder
        {
            Id = workOrderId, TenantId = tenantId,
            Title = "返工测试工单", Status = WorkOrderStatus.Completed,
            Type = WorkOrderType.Corrective, Priority = WorkOrderPriority.High,
            DeviceId = Guid.NewGuid()
        });
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<IApprovalChainService>();

        // 第一次提交验收：创建 2 个 Pending 步骤
        await service.CreateApprovalRecordsAsync(tenantId, workOrderId, WorkOrderType.Corrective, WorkOrderPriority.High);
        (await db.WorkOrderApprovals.AsNoTracking().CountAsync(a => a.WorkOrderId == workOrderId))
            .Should().Be(2);

        // 第 1 步通过，第 2 步驳回 → 工单回 InProgress（返工）
        await service.ApproveAsync(tenantId, workOrderId, Guid.NewGuid(), "同意");
        await service.RejectAsync(tenantId, workOrderId, Guid.NewGuid(), "需返工");
        (await db.WorkOrders.AsNoTracking().FirstAsync(w => w.Id == workOrderId)).Status
            .Should().Be(WorkOrderStatus.InProgress);

        // 返工后重新提交验收（WorkOrderService.SubmitAsync 会再次调用 CreateApprovalRecordsAsync）
        await service.CreateApprovalRecordsAsync(tenantId, workOrderId, WorkOrderType.Corrective, WorkOrderPriority.High);

        // 关键断言 1：重新提交应作废上一轮审批记录，只保留新一轮的 2 个步骤（而非累计 4 个）
        var approvalsAfterResubmit = await db.WorkOrderApprovals.AsNoTracking()
            .Where(a => a.WorkOrderId == workOrderId).ToListAsync();
        approvalsAfterResubmit.Should().HaveCount(2,
            "重新提交应作废上一轮审批记录，不应让旧记录（含 Rejected）与新记录共存");

        // 走完新一轮 2 步审批
        await service.ApproveAsync(tenantId, workOrderId, Guid.NewGuid(), "同意");
        await service.ApproveAsync(tenantId, workOrderId, Guid.NewGuid(), "同意");

        // 关键断言 2：新一轮全部通过后，工单应进入 Accepted（派工执行），不被上一轮 Rejected 永久阻塞
        var woFinal = await db.WorkOrders.AsNoTracking().FirstAsync(w => w.Id == workOrderId);
        woFinal.Status.Should().Be(WorkOrderStatus.Accepted,
            "驳回返工后重新提交的工单，只要新一轮审批全部通过，就应进入 Accepted");
    }

    // ===================================================================
    // 辅助方法
    // ===================================================================

    /// <summary>
    /// 创建审批链模板的快捷方法
    /// </summary>
    private static ApprovalChainTemplate CreateTemplate(
        Guid tenantId, string name,
        WorkOrderType? type, WorkOrderPriority? priority,
        bool isDefault, params ApprovalStep[] steps)
    {
        var template = new ApprovalChainTemplate
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Name = name,
            WorkOrderType = type,
            Priority = priority,
            IsDefault = isDefault,
            Enabled = true,
            Steps = steps.Select(s =>
            {
                s.Id = Guid.NewGuid();
                s.IsRequired = true;
                return s;
            }).ToList()
        };

        // 设置步骤的 ChainId
        foreach (var step in template.Steps)
        {
            step.ChainId = template.Id;
        }

        return template;
    }

    /// <summary>
    /// 可变的测试用租户上下文 — 允许在测试方法中动态设置 TenantId
    /// 注册为 Singleton，确保所有 scope（包括 Service 内部通过 IServiceScopeFactory 创建的）共享同一个实例
    /// </summary>
    [Fact]
    public async Task CreateApprovalRecordsAsync_无匹配模板不应创建审批记录()
    {
        _tenantContext.SetTenantId(Guid.NewGuid());
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var service = scope.ServiceProvider.GetRequiredService<IApprovalChainService>();

        var woId = Guid.NewGuid();
        db.WorkOrders.Add(new WorkOrder
        {
            Id = woId, TenantId = _tenantContext.TenantId,
            Title = "无模板工单", Status = WorkOrderStatus.InProgress
        });
        await db.SaveChangesAsync();

        await service.CreateApprovalRecordsAsync(
            _tenantContext.TenantId, woId, WorkOrderType.Corrective, WorkOrderPriority.Medium);

        var approvals = await db.WorkOrderApprovals.IgnoreQueryFilters().ToListAsync();
        approvals.Should().BeEmpty();
    }

    [Fact]
    public async Task ListTemplatesAsync_应返回当前租户模板()
    {
        _tenantContext.SetTenantId(Guid.NewGuid());
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var service = scope.ServiceProvider.GetRequiredService<IApprovalChainService>();

        db.ApprovalChainTemplates.Add(new ApprovalChainTemplate
        {
            TenantId = _tenantContext.TenantId, Name = "租户模板",
            Enabled = true, IsDefault = true
        });
        await db.SaveChangesAsync();

        var templates = await service.ListTemplatesAsync(_tenantContext.TenantId);
        templates.Should().ContainSingle(t => t.Name == "租户模板");
    }

    [Fact]
    public async Task GetApprovalsAsync_应返回工单的审批记录()
    {
        _tenantContext.SetTenantId(Guid.NewGuid());
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var service = scope.ServiceProvider.GetRequiredService<IApprovalChainService>();

        var woId = Guid.NewGuid();
        db.WorkOrders.Add(new WorkOrder
        {
            Id = woId, TenantId = _tenantContext.TenantId,
            Title = "审批测试", Status = WorkOrderStatus.InProgress
        });
        db.WorkOrderApprovals.Add(new WorkOrderApproval
        {
            TenantId = _tenantContext.TenantId, WorkOrderId = woId,
            StepOrder = 1, ExpectedRole = "maintenance_lead",
            Action = ApprovalAction.Pending, ApproverId = Guid.NewGuid()
        });
        await db.SaveChangesAsync();

        var approvals = await service.GetApprovalsAsync(_tenantContext.TenantId, woId);
        approvals.Should().HaveCount(1);
        approvals[0].ExpectedRole.Should().Be("maintenance_lead");
    }

    [Fact]
    public async Task GetPendingApprovalsAsync_应返回待审批记录()
    {
        _tenantContext.SetTenantId(Guid.NewGuid());
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var service = scope.ServiceProvider.GetRequiredService<IApprovalChainService>();

        var approverId = Guid.NewGuid();
        db.WorkOrderApprovals.Add(new WorkOrderApproval
        {
            TenantId = _tenantContext.TenantId, WorkOrderId = Guid.NewGuid(),
            StepOrder = 1, ExpectedRole = "maintenance_lead",
            Action = ApprovalAction.Pending, ApproverId = approverId
        });
        await db.SaveChangesAsync();

        var pending = await service.GetPendingApprovalsAsync(approverId, null);
        pending.Should().HaveCount(1);
    }

    private class MutableTenantContext : ITenantContext
    {
        public Guid TenantId { get; private set; }
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;

        /// <summary>
        /// 设置当前租户 ID（在每个测试方法中调用）
        /// </summary>
        public void SetTenantId(Guid tenantId) => TenantId = tenantId;
    }

    /// <summary>
    /// 测试用事件总线 — 仅记录发布的事件，不做实际分发
    /// </summary>
    private class TestEventBus : IEventBus, IDisposable
    {
        public List<IIntegrationEvent> PublishedEvents { get; } = [];

        public Task PublishAsync<TEvent>(TEvent @event, CancellationToken cancellationToken = default) where TEvent : IIntegrationEvent
        {
            PublishedEvents.Add(@event);
            return Task.CompletedTask;
        }

        public void Subscribe<TEvent, THandler>()
            where TEvent : IIntegrationEvent
            where THandler : IEventHandler<TEvent>
        {
            // 测试中不需要订阅
        }

        public void Dispose() { }
    }

    public async ValueTask DisposeAsync() => await _sp.DisposeAsync();
}
