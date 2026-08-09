using EquipAI.Application.Approvals;
using EquipAI.Application.WorkOrders;
using EquipAI.Application.WorkOrders.DTOs;
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace EquipAI.Tests.Unit.WorkOrders;

/// <summary>
/// WorkOrderService 单元测试
/// 覆盖工单完整生命周期：创建、派工、执行、完成、验收、关闭、取消
/// 每个测试使用独立的 InMemory 数据库，避免租户过滤器冲突
/// </summary>
public class WorkOrderServiceTests
{
    private readonly Guid _tenantId = Guid.NewGuid();

    /// <summary>
    /// 为每个测试创建独立的数据库和服务实例
    /// </summary>
    private (AppDbContext db, Mock<IEventBus> eventBus, WorkOrderService service) CreateSut()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestWOService_{Guid.NewGuid()}")
            .Options;

        var db = new AppDbContext(options, new TestTenantContext(_tenantId));
        var eventBus = new Mock<IEventBus>();
        eventBus
            .Setup(e => e.PublishAsync(It.IsAny<IIntegrationEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var approvalMock = new Mock<IApprovalChainService>();

        var spMock = new Mock<IServiceProvider>();
        spMock.Setup(sp => sp.GetService(typeof(AppDbContext))).Returns(db);

        var scopeMock = new Mock<IServiceScope>();
        scopeMock.SetupGet(s => s.ServiceProvider).Returns(spMock.Object);

        var scopeFactoryMock = new Mock<IServiceScopeFactory>();
        scopeFactoryMock.Setup(f => f.CreateScope()).Returns(scopeMock.Object);

        var logger = LoggerFactory.Create(_ => { }).CreateLogger<WorkOrderService>();
        var service = new WorkOrderService(
            scopeFactoryMock.Object, eventBus.Object, logger, approvalMock.Object);

        return (db, eventBus, service);
    }

    private CreateWorkOrderRequest MakeCreateRequest(Guid? deviceId = null) => new()
    {
        Title = "测试工单",
        Type = "corrective",
        Priority = "medium",
        DeviceId = deviceId ?? Guid.NewGuid()
    };

    [Fact]
    public async Task CreateAsync_应创建工单并设置初始状态为PendingDispatch()
    {
        var (db, _, service) = CreateSut();

        var result = await service.CreateAsync(_tenantId, MakeCreateRequest(), ct: CancellationToken.None);

        result.Status.Should().Be("PendingDispatch");
        result.WorkOrderCode.Should().StartWith("WO-");
    }

    [Fact]
    public async Task CreateAsync_应发布WorkOrderCreatedEvent()
    {
        var (db, eventBus, service) = CreateSut();

        await service.CreateAsync(_tenantId, MakeCreateRequest(), ct: CancellationToken.None);

        eventBus.Verify(
            e => e.PublishAsync(It.IsAny<WorkOrderCreatedEvent>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CreateAsync_应写入审计日志()
    {
        var (db, eventBus, service) = CreateSut();

        await service.CreateAsync(_tenantId, MakeCreateRequest(), ct: CancellationToken.None);

        var logs = await db.WorkOrderLogs.IgnoreQueryFilters().ToListAsync();
        logs.Should().ContainSingle();
        logs[0].Action.Should().Be(WorkOrderLogAction.Created);
    }

    [Fact]
    public async Task CreateAsync_创建事件失败时_工单和审计日志应一起回滚()
    {
        // InMemory 提供程序不会真正执行数据库事务；这里使用 SQLite 内存库，验证与生产一致的回滚语义。
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;
        await using var db = new AppDbContext(options, new TestTenantContext(_tenantId));
        await db.Database.EnsureCreatedAsync();

        var eventBus = new Mock<IEventBus>();
        eventBus
            .Setup(e => e.PublishAsync(It.IsAny<IIntegrationEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        eventBus
            .Setup(e => e.PublishAsync(
                It.IsAny<WorkOrderCreatedEvent>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("事件发布失败"));

        var approvalMock = new Mock<IApprovalChainService>();
        var spMock = new Mock<IServiceProvider>();
        spMock.Setup(sp => sp.GetService(typeof(AppDbContext))).Returns(db);
        var scopeMock = new Mock<IServiceScope>();
        scopeMock.SetupGet(s => s.ServiceProvider).Returns(spMock.Object);
        var scopeFactoryMock = new Mock<IServiceScopeFactory>();
        scopeFactoryMock.Setup(f => f.CreateScope()).Returns(scopeMock.Object);
        var logger = LoggerFactory.Create(_ => { }).CreateLogger<WorkOrderService>();
        var service = new WorkOrderService(
            scopeFactoryMock.Object, eventBus.Object, logger, approvalMock.Object);

        var act = () => service.CreateAsync(
            _tenantId, MakeCreateRequest(), ct: CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
        (await db.WorkOrders.IgnoreQueryFilters().CountAsync()).Should().Be(0);
        (await db.WorkOrderLogs.IgnoreQueryFilters().CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task AssignAsync_应将状态从PendingDispatch变更为Assigned()
    {
        var (db, _, service) = CreateSut();
        var wo = await service.CreateAsync(_tenantId, MakeCreateRequest(), ct: CancellationToken.None);

        var assignee = Guid.NewGuid();
        var result = await service.AssignAsync(
            _tenantId, wo.Id, new AssignWorkOrderRequest { AssignedTo = assignee },
            Guid.NewGuid(), CancellationToken.None);

        result.Status.Should().Be("Assigned");
        result.AssignedTo.Should().Be(assignee);
    }

    [Fact]
    public async Task StartAsync_应将状态从Assigned变更为InProgress()
    {
        var (db, _, service) = CreateSut();
        var wo = await service.CreateAsync(_tenantId, MakeCreateRequest());
        await service.AssignAsync(_tenantId, wo.Id,
            new AssignWorkOrderRequest { AssignedTo = Guid.NewGuid() }, Guid.NewGuid());

        var result = await service.StartAsync(_tenantId, wo.Id, Guid.NewGuid(), CancellationToken.None);

        result.Status.Should().Be("InProgress");
    }

    [Fact]
    public async Task CompleteAsync_应将状态变更为Completed并记录解决措施()
    {
        var (db, _, service) = CreateSut();
        var wo = await service.CreateAsync(_tenantId, MakeCreateRequest());
        await service.AssignAsync(_tenantId, wo.Id,
            new AssignWorkOrderRequest { AssignedTo = Guid.NewGuid() }, Guid.NewGuid());
        await service.StartAsync(_tenantId, wo.Id, Guid.NewGuid());

        var result = await service.CompleteAsync(
            _tenantId, wo.Id,
            new CompleteWorkOrderRequest { Resolution = "更换零件" },
            Guid.NewGuid(), CancellationToken.None);

        result.Status.Should().Be("Completed");
        result.Resolution.Should().Be("更换零件");
    }

    [Fact]
    public async Task CompleteAsync_应计算实际维修工时ActualHours()
    {
        var (db, _, service) = CreateSut();

        // 创建 → 派工 → 开始执行（StartAsync 设 StartedAt）
        var wo = await service.CreateAsync(_tenantId, MakeCreateRequest());
        await service.AssignAsync(_tenantId, wo.Id,
            new AssignWorkOrderRequest { AssignedTo = Guid.NewGuid() }, Guid.NewGuid());
        await service.StartAsync(_tenantId, wo.Id, Guid.NewGuid());

        // 把开始时间拉到 2 小时前（StartAsync 设的是 now），制造可测的时间差
        var entity = await db.WorkOrders.FirstAsync(w => w.Id == wo.Id);
        entity.StartedAt = DateTime.UtcNow.AddHours(-2);
        await db.SaveChangesAsync();

        var result = await service.CompleteAsync(
            _tenantId, wo.Id,
            new CompleteWorkOrderRequest { Resolution = "已修复" },
            Guid.NewGuid(), CancellationToken.None);

        // ActualHours = CompletedAt - StartedAt ≈ 2 小时。
        // 原实现从不计算 ActualHours → 永远 null → 知识沉淀阈值 (ActualHours??0)<0.5 恒成立，
        // 跳过所有工单的知识沉淀，知识库自学习整体失效；MTTR/维修工时 KPI 也永远为空。
        result.ActualHours.Should().NotBeNull("完成后必须计算实际维修工时（核心 KPI + 知识沉淀阈值依赖）");
        result.ActualHours.Should().BeApproximately(2.0, 0.01, "ActualHours = CompletedAt - StartedAt");
    }

    [Fact]
    public async Task CompleteAsync_应持久化执行报告与使用零件()
    {
        var (db, _, service) = CreateSut();
        var wo = await service.CreateAsync(_tenantId, MakeCreateRequest());
        await service.AssignAsync(_tenantId, wo.Id,
            new AssignWorkOrderRequest { AssignedTo = Guid.NewGuid() }, Guid.NewGuid());
        await service.StartAsync(_tenantId, wo.Id, Guid.NewGuid());

        var result = await service.CompleteAsync(
            _tenantId, wo.Id,
            new CompleteWorkOrderRequest
            {
                Resolution = "已更换轴承",
                // 详细维修过程：知识沉淀 FaultCase.Solution 优先用 ExecutionReport，比 Resolution 更有价值
                ExecutionReport = "拆机后发现主轴轴承磨损，更换 6205-2RS 轴承并重新校准动平衡",
                // 使用零件清单（JSON）：知识沉淀 PartsUsed + 备件成本核算
                RequiredParts = """[{"name":"轴承 6205-2RS","qty":2,"unitCost":85.5}]"""
            },
            Guid.NewGuid(), CancellationToken.None);

        // 回归 #252：ExecutionReport/RequiredParts 原为死字段——CompleteAsync 只写 Resolution，
        // 两者永不写入 → 知识沉淀 FaultCase.Solution 永远降级为 Resolution（丢失详细维修过程）、
        // PartsUsed 永远空（备件成本无法核算）。完成工单时填写的执行报告与使用零件必须被持久化。
        result.ExecutionReport.Should().NotBeNull("完成时填写的执行报告必须返回");
        result.ExecutionReport.Should().Contain("6205-2RS");
        result.RequiredParts.Should().NotBeNull("完成时填写的使用零件必须返回");
        result.RequiredParts.Should().Contain("轴承 6205-2RS");

        // 验证真实持久化（非仅 DTO 映射）——避免测试只 seed 字段值绕过真实写入路径（#244 测试盲点）
        var entity = await db.WorkOrders.FirstAsync(w => w.Id == wo.Id);
        entity.ExecutionReport.Should().Contain("6205-2RS");
        entity.RequiredParts.Should().Contain("轴承 6205-2RS");
    }

    [Fact]
    public async Task SubmitAsync_应持久化执行报告与使用零件()
    {
        var (db, _, service) = CreateSut();
        var userId = Guid.NewGuid();
        var woId = await AdvanceToStatus(service, WorkOrderStatus.InProgress);

        var result = await service.SubmitAsync(_tenantId, woId,
            new CompleteWorkOrderRequest
            {
                Resolution = "已修复",
                ExecutionReport = "更换密封圈并清理管路积垢",
                RequiredParts = """[{"name":"O型密封圈","qty":4}]"""
            },
            userId);

        // 回归 #252：提交验收路径（InProgress/Completed → SubmittedForApproval）同样必须持久化
        // 执行报告与使用零件——知识沉淀在工单关闭时读取这两个字段，两条完成路径都覆盖
        result.ExecutionReport.Should().Contain("密封圈");
        result.RequiredParts.Should().Contain("O型密封圈");

        var entity = await db.WorkOrders.FirstAsync(w => w.Id == woId);
        entity.ExecutionReport.Should().Contain("密封圈");
        entity.RequiredParts.Should().Contain("O型密封圈");
    }

    [Fact]
    public async Task AcceptAsync_应将状态从Completed变更为Accepted()
    {
        var (db, _, service) = CreateSut();
        var woId = await AdvanceToStatus(service, WorkOrderStatus.Completed);

        var result = await service.AcceptAsync(_tenantId, woId, Guid.NewGuid(), ct: CancellationToken.None);

        result.Status.Should().Be("Accepted");
    }

    [Fact]
    public async Task RejectAsync_应将状态从Completed变更为Rejected()
    {
        var (db, _, service) = CreateSut();
        var woId = await AdvanceToStatus(service, WorkOrderStatus.Completed);

        var result = await service.RejectAsync(_tenantId, woId, Guid.NewGuid(), ct: CancellationToken.None);

        result.Status.Should().Be("Rejected");
    }

    [Fact]
    public async Task CloseAsync_应将状态从Accepted变更为Closed()
    {
        var (db, _, service) = CreateSut();
        var woId = await AdvanceToStatus(service, WorkOrderStatus.Accepted);

        var result = await service.CloseAsync(_tenantId, woId, Guid.NewGuid(), ct: CancellationToken.None);

        result.Status.Should().Be("Closed");
    }

    [Fact]
    public async Task CancelAsync_应允许从PendingDispatch取消()
    {
        var (db, _, service) = CreateSut();
        var wo = await service.CreateAsync(_tenantId, MakeCreateRequest());

        var result = await service.CancelAsync(_tenantId, wo.Id, Guid.NewGuid(), ct: CancellationToken.None);

        result.Status.Should().Be("Cancelled");
    }

    [Fact]
    public async Task 不合法的状态转换应抛出InvalidOperationException()
    {
        var (db, _, service) = CreateSut();
        // Closed 是终态，不允许任何变更
        var woId = await AdvanceToStatus(service, WorkOrderStatus.Closed);

        var act = () => service.AssignAsync(
            _tenantId, woId,
            new AssignWorkOrderRequest { AssignedTo = Guid.NewGuid() },
            Guid.NewGuid(), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task GetByIdAsync_工单不存在应抛出KeyNotFoundException()
    {
        var (db, _, service) = CreateSut();

        var act = () => service.GetByIdAsync(_tenantId, Guid.NewGuid(), CancellationToken.None);
        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task ListAsync_应返回分页结果()
    {
        var (db, _, service) = CreateSut();
        for (int i = 0; i < 5; i++)
            await service.CreateAsync(_tenantId, MakeCreateRequest());

        var result = await service.ListAsync(_tenantId, page: 1, pageSize: 3, ct: CancellationToken.None);

        result.Total.Should().Be(5);
        result.Items.Should().HaveCount(3);
    }

    [Fact]
    public async Task ListAsync_按状态过滤()
    {
        var (db, _, service) = CreateSut();
        await service.CreateAsync(_tenantId, MakeCreateRequest());
        await service.CreateAsync(_tenantId, MakeCreateRequest());

        var result = await service.ListAsync(
            _tenantId, page: 1, pageSize: 10, status: "PendingDispatch", ct: CancellationToken.None);

        result.Items.Should().OnlyContain(i => i.Status == "PendingDispatch");
    }

    [Fact]
    public async Task SubmitAsync_工单状态不合法应抛出异常()
    {
        var (db, _, service) = CreateSut();
        // PendingDispatch 状态不能直接提交验收
        var wo = await service.CreateAsync(_tenantId, MakeCreateRequest());

        var act = () => service.SubmitAsync(
            _tenantId, wo.Id,
            new CompleteWorkOrderRequest { Resolution = "测试" },
            Guid.NewGuid(), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task Cancelled状态为终态不允许任何变更()
    {
        var (db, _, service) = CreateSut();
        var woId = await AdvanceToStatus(service, WorkOrderStatus.PendingDispatch);
        await service.CancelAsync(_tenantId, woId, Guid.NewGuid());

        var act = () => service.AssignAsync(_tenantId, woId,
            new AssignWorkOrderRequest { AssignedTo = Guid.NewGuid() }, Guid.NewGuid());
        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task Rejected状态应允许转回InProgress()
    {
        var (db, _, service) = CreateSut();
        var userId = Guid.NewGuid();
        var woId = await AdvanceToStatus(service, WorkOrderStatus.Completed);
        await service.RejectAsync(_tenantId, woId, userId);

        var result = await service.StartAsync(_tenantId, woId, userId);
        result.Status.Should().Be("InProgress");
    }

    [Fact]
    public async Task 从Assigned直接跳到Completed应抛出异常()
    {
        var (db, _, service) = CreateSut();
        var woId = await AdvanceToStatus(service, WorkOrderStatus.Assigned);

        var act = () => service.CompleteAsync(_tenantId, woId,
            new CompleteWorkOrderRequest { Resolution = "跳步" }, Guid.NewGuid());
        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task 从InProgress直接跳到Accepted应抛出异常()
    {
        var (db, _, service) = CreateSut();
        var woId = await AdvanceToStatus(service, WorkOrderStatus.InProgress);

        var act = () => service.AcceptAsync(_tenantId, woId, Guid.NewGuid());
        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task 每次状态变更都应发布事件()
    {
        var (db, eventBus, service) = CreateSut();
        var userId = Guid.NewGuid();
        var wo = await service.CreateAsync(_tenantId, MakeCreateRequest(), userId);

        // Create 已发布 1 次
        eventBus.Verify(e => e.PublishAsync(It.IsAny<IIntegrationEvent>(), It.IsAny<CancellationToken>()), Times.Once);

        await service.AssignAsync(_tenantId, wo.Id,
            new AssignWorkOrderRequest { AssignedTo = Guid.NewGuid() }, userId);
        eventBus.Verify(e => e.PublishAsync(It.IsAny<WorkOrderStatusChangedEvent>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task 每次状态变更都应写入日志()
    {
        var (db, _, service) = CreateSut();
        var userId = Guid.NewGuid();
        var wo = await service.CreateAsync(_tenantId, MakeCreateRequest(), userId);

        await service.AssignAsync(_tenantId, wo.Id,
            new AssignWorkOrderRequest { AssignedTo = Guid.NewGuid() }, userId);

        var logs = await db.WorkOrderLogs.IgnoreQueryFilters().ToListAsync();
        logs.Should().HaveCount(2); // Created + StatusChanged
    }

    [Fact]
    public async Task 工单编码在同一天内递增()
    {
        var (db, _, service) = CreateSut();
        var wo1 = await service.CreateAsync(_tenantId, MakeCreateRequest());
        var wo2 = await service.CreateAsync(_tenantId, MakeCreateRequest());

        wo1.WorkOrderCode.Should().NotBe(wo2.WorkOrderCode);
        wo2.WorkOrderCode.Should().NotBe(wo1.WorkOrderCode);
    }

    [Fact]
    public async Task SubmitAsync_InProgress状态提交验收_应流转状态并发布事件()
    {
        var (db, eventBus, service) = CreateSut();
        var userId = Guid.NewGuid();
        var woId = await AdvanceToStatus(service, WorkOrderStatus.InProgress);

        // 记录提交验收前已发布的状态变更事件数（AdvanceToStatus 流程已发布多次）
        var statusChangedBefore = eventBus.Invocations
            .Count(i => i.Method.Name == nameof(IEventBus.PublishAsync)
                     && i.Arguments[0] is WorkOrderStatusChangedEvent);

        var result = await service.SubmitAsync(_tenantId, woId,
            new CompleteWorkOrderRequest { Resolution = "提交验收" }, userId);

        // 回归 bug #247：SubmitAsync 是 8 个状态变更方法中唯一不发布 WorkOrderStatusChangedEvent 的，
        // 它把状态流转外包给 ApprovalChainService.CreateApprovalRecordsAsync 的副作用。本测试用 Mock
        // IApprovalChainService（默认什么都不做 = 无审批链模板场景），导致：(1) 工单状态实际未流转
        // （只写了 "SubmittedForApproval" 日志字符串，实体 Status 仍是 InProgress），(2) 不发布事件 →
        // Dashboard/工单列表/详情页不实时刷新，用户提交验收后看不到任何变化。修复后 SubmitAsync 自己
        // 负责状态流转（→SubmittedForApproval）+ 发布事件，与 7 个兄弟方法（Assign/Start/Complete/
        // Accept/Reject/Close/Cancel）一致。
        result.Status.Should().Be("SubmittedForApproval",
            "提交验收应将工单流转到 SubmittedForApproval（无论有无审批链模板）");

        var statusChangedAfter = eventBus.Invocations
            .Count(i => i.Method.Name == nameof(IEventBus.PublishAsync)
                     && i.Arguments[0] is WorkOrderStatusChangedEvent);
        statusChangedAfter.Should().Be(statusChangedBefore + 1,
            "提交验收是状态变更，必须发布 1 次 WorkOrderStatusChangedEvent 供 SignalR 实时推送");
    }

    [Fact]
    public async Task SubmitAsync_Completed状态提交验收_应流转状态为SubmittedForApproval()
    {
        var (db, _, service) = CreateSut();
        var userId = Guid.NewGuid();
        var woId = await AdvanceToStatus(service, WorkOrderStatus.Completed);

        var result = await service.SubmitAsync(_tenantId, woId,
            new CompleteWorkOrderRequest { Resolution = "再次提交" }, userId);

        result.Status.Should().Be("SubmittedForApproval",
            "从 Completed 提交验收同样应流转到 SubmittedForApproval");
    }
    private async Task<Guid> AdvanceToStatus(WorkOrderService service, WorkOrderStatus targetStatus)
    {
        var userId = Guid.NewGuid();
        var wo = await service.CreateAsync(_tenantId, MakeCreateRequest(), userId);
        var woId = wo.Id;

        if (targetStatus == WorkOrderStatus.PendingDispatch) return woId;

        await service.AssignAsync(_tenantId, woId,
            new AssignWorkOrderRequest { AssignedTo = Guid.NewGuid() }, userId);
        if (targetStatus == WorkOrderStatus.Assigned) return woId;

        await service.StartAsync(_tenantId, woId, userId);
        if (targetStatus == WorkOrderStatus.InProgress) return woId;

        await service.CompleteAsync(_tenantId, woId,
            new CompleteWorkOrderRequest { Resolution = "完成" }, userId);
        if (targetStatus == WorkOrderStatus.Completed) return woId;

        await service.AcceptAsync(_tenantId, woId, userId);
        if (targetStatus == WorkOrderStatus.Accepted) return woId;

        await service.CloseAsync(_tenantId, woId, userId);
        return woId;
    }

    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode { get; } = "shared";
        public bool IsSystemAdmin { get; } = false;
        public Guid UserId { get; } = Guid.NewGuid();
    }
}
