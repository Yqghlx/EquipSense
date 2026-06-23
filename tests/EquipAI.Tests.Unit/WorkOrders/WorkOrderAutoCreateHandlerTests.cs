using EquipAI.Application.WorkOrders.Handlers;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Npgsql;
using Xunit;

namespace EquipAI.Tests.Unit.WorkOrders;

/// <summary>
/// WorkOrderAutoCreateHandler 单元测试
/// 验证告警触发后自动创建工单的逻辑
/// </summary>
public class WorkOrderAutoCreateHandlerTests
{
    private readonly Guid _tenantId = Guid.NewGuid();

    private (AppDbContext db, Mock<IEventBus> eventBus, WorkOrderAutoCreateHandler handler) CreateSut()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestAutoCreate_{Guid.NewGuid()}")
            .Options;

        var db = new AppDbContext(options, new TestTenantContext(_tenantId));
        var eventBus = new Mock<IEventBus>();
        eventBus
            .Setup(e => e.PublishAsync(It.IsAny<IIntegrationEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var spMock = new Mock<IServiceProvider>();
        spMock.Setup(sp => sp.GetService(typeof(AppDbContext))).Returns(db);

        var scopeMock = new Mock<IServiceScope>();
        scopeMock.SetupGet(s => s.ServiceProvider).Returns(spMock.Object);

        var scopeFactoryMock = new Mock<IServiceScopeFactory>();
        scopeFactoryMock.Setup(f => f.CreateScope()).Returns(scopeMock.Object);

        var logger = LoggerFactory.Create(_ => { }).CreateLogger<WorkOrderAutoCreateHandler>();
        var handler = new WorkOrderAutoCreateHandler(logger, eventBus.Object, scopeFactoryMock.Object);

        return (db, eventBus, handler);
    }

    private AlertTriggeredEvent MakeAlertEvent(Guid? ruleId = null, string severity = "High")
    {
        return new AlertTriggeredEvent(
            EventId: Guid.NewGuid(), OccurredAt: DateTime.UtcNow, TenantId: _tenantId,
            AlertId: Guid.NewGuid(), DeviceId: Guid.NewGuid(),
            RuleId: ruleId, Metric: "temperature", Value: 100.0, Severity: severity);
    }

    [Fact]
    public async Task HandleAsync_RuleId为空应跳过不创建工单()
    {
        var (db, _, handler) = CreateSut();

        await handler.HandleAsync(MakeAlertEvent(ruleId: null), CancellationToken.None);

        var workOrders = await db.WorkOrders.IgnoreQueryFilters().ToListAsync();
        workOrders.Should().BeEmpty();
    }

    [Fact]
    public async Task HandleAsync_规则未开启AutoCreateWorkorder应跳过()
    {
        var (db, _, handler) = CreateSut();
        var ruleId = Guid.NewGuid();

        db.AlertRules.Add(new AlertRule
        {
            TenantId = _tenantId, Name = "测试规则",
            Metric = "temperature", Conditions = """{"operator":">","threshold":80}""",
            Severity = AlertSeverity.High, AutoCreateWorkorder = false
        });
        await db.SaveChangesAsync();

        await handler.HandleAsync(MakeAlertEvent(ruleId: ruleId), CancellationToken.None);

        var workOrders = await db.WorkOrders.IgnoreQueryFilters().ToListAsync();
        workOrders.Should().BeEmpty();
    }

    [Fact]
    public async Task HandleAsync_规则开启了应自动创建工单()
    {
        var (db, _, handler) = CreateSut();
        var ruleId = Guid.NewGuid();

        db.AlertRules.Add(new AlertRule
        {
            Id = ruleId, TenantId = _tenantId, Name = "自动创建规则",
            Metric = "temperature", Conditions = """{"operator":">","threshold":80}""",
            Severity = AlertSeverity.High, AutoCreateWorkorder = true
        });
        await db.SaveChangesAsync();

        var evt = MakeAlertEvent(ruleId: ruleId);
        await handler.HandleAsync(evt, CancellationToken.None);

        var workOrders = await db.WorkOrders.IgnoreQueryFilters().ToListAsync();
        workOrders.Should().ContainSingle();
        workOrders[0].Type.Should().Be(WorkOrderType.Corrective);
        workOrders[0].Status.Should().Be(WorkOrderStatus.PendingDispatch);
        workOrders[0].AlertId.Should().Be(evt.AlertId);
    }

    [Fact]
    public async Task HandleAsync_同一告警已有活跃工单应跳过()
    {
        var (db, _, handler) = CreateSut();
        var ruleId = Guid.NewGuid();
        var alertId = Guid.NewGuid();

        db.AlertRules.Add(new AlertRule
        {
            Id = ruleId, TenantId = _tenantId, Name = "自动创建规则",
            Metric = "temperature", Conditions = """{"operator":">","threshold":80}""",
            Severity = AlertSeverity.High, AutoCreateWorkorder = true
        });
        db.WorkOrders.Add(new WorkOrder
        {
            TenantId = _tenantId, AlertId = alertId,
            Title = "已有工单", Status = WorkOrderStatus.InProgress
        });
        await db.SaveChangesAsync();

        var evt = new AlertTriggeredEvent(
            Guid.NewGuid(), DateTime.UtcNow, _tenantId,
            alertId, Guid.NewGuid(), ruleId, "temperature", 100.0, "High");
        await handler.HandleAsync(evt, CancellationToken.None);

        var workOrders = await db.WorkOrders.IgnoreQueryFilters().ToListAsync();
        workOrders.Should().HaveCount(1);
    }

    [Fact]
    public async Task HandleAsync_Critical严重级别应映射为Critical优先级()
    {
        var (db, _, handler) = CreateSut();
        var ruleId = Guid.NewGuid();

        db.AlertRules.Add(new AlertRule
        {
            Id = ruleId, TenantId = _tenantId, Name = "Critical规则",
            Metric = "temperature", Conditions = "[]",
            Severity = AlertSeverity.Critical, AutoCreateWorkorder = true
        });
        await db.SaveChangesAsync();

        await handler.HandleAsync(MakeAlertEvent(ruleId: ruleId, severity: "critical"), CancellationToken.None);

        var wo = await db.WorkOrders.IgnoreQueryFilters().FirstAsync();
        wo.Priority.Should().Be(WorkOrderPriority.Critical);
    }

    [Fact]
    public async Task HandleAsync_创建工单后应发布WorkOrderCreatedEvent()
    {
        var (db, eventBus, handler) = CreateSut();
        var ruleId = Guid.NewGuid();

        db.AlertRules.Add(new AlertRule
        {
            Id = ruleId, TenantId = _tenantId, Name = "自动创建规则",
            Metric = "temperature", Conditions = "[]",
            Severity = AlertSeverity.High, AutoCreateWorkorder = true
        });
        await db.SaveChangesAsync();

        await handler.HandleAsync(MakeAlertEvent(ruleId: ruleId), CancellationToken.None);

        eventBus.Verify(
            e => e.PublishAsync(It.IsAny<WorkOrderCreatedEvent>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    /// <summary>
    /// 回归：工单编码连续 3 次唯一约束冲突时，处理器应优雅返回（不抛异常、不发布事件），
    /// 而非让最后一次冲突逃逸为未处理异常。
    ///
    /// 旧版 catch 守卫 && attempt<2 使第 3 次 attempt（attempt=2）的冲突不被捕获，
    /// 直接抛出 DbUpdateException，绕过下方"3 次重试后仍失败"的优雅兜底。事件总线虽能
    /// catch 住不致崩溃，但优雅路径沦为死代码、错误信息失真。修复后应优雅返回。
    /// </summary>
    [Fact]
    public async Task HandleAsync_编码连续冲突三次应优雅返回不抛异常且不发布事件()
    {
        // 用"保存 WorkOrder 时恒抛唯一约束冲突"的 DbContext 模拟极端并发下的连续冲突
        var ruleId = Guid.NewGuid();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestConflict_{Guid.NewGuid()}")
            .Options;
        var db = new ThrowingOnWorkOrderSaveDbContext(options, new TestTenantContext(_tenantId));

        // 先 seed 规则（seed 时无 WorkOrder，SaveChanges 正常通过，便于走完前置校验）
        db.AlertRules.Add(new AlertRule
        {
            Id = ruleId, TenantId = _tenantId, Name = "自动创建规则",
            Metric = "temperature", Conditions = "[]",
            Severity = AlertSeverity.High, AutoCreateWorkorder = true
        });
        await db.SaveChangesAsync();

        var eventBus = new Mock<IEventBus>();
        eventBus
            .Setup(e => e.PublishAsync(It.IsAny<IIntegrationEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        var spMock = new Mock<IServiceProvider>();
        spMock.Setup(sp => sp.GetService(typeof(AppDbContext))).Returns(db);
        var scopeMock = new Mock<IServiceScope>();
        scopeMock.SetupGet(s => s.ServiceProvider).Returns(spMock.Object);
        var scopeFactoryMock = new Mock<IServiceScopeFactory>();
        scopeFactoryMock.Setup(f => f.CreateScope()).Returns(scopeMock.Object);
        var logger = LoggerFactory.Create(_ => { }).CreateLogger<WorkOrderAutoCreateHandler>();
        var handler = new WorkOrderAutoCreateHandler(logger, eventBus.Object, scopeFactoryMock.Object);

        // 关键断言：连续 3 次冲突应优雅兜底，不得抛异常污染事件总线日志
        var act = async () => await handler.HandleAsync(MakeAlertEvent(ruleId: ruleId), CancellationToken.None);
        await act.Should().NotThrowAsync();
        // 工单未创建成功，不应发布 WorkOrderCreatedEvent
        eventBus.Verify(
            e => e.PublishAsync(It.IsAny<WorkOrderCreatedEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    /// <summary>
    /// 测试用 DbContext：当变更跟踪器中有 WorkOrder 处于 Added 状态时，
    /// SaveChangesAsync 恒抛 PostgreSQL 唯一约束冲突（SQLSTATE 23505），
    /// 用于模拟极端并发下工单编码连续冲突。其它保存（如 seed 规则）正常通过。
    /// </summary>
    /// <remarks>
    /// 重写 OnModelCreating 且不调用 base：基类用 Expression.Call 反射【私有】方法
    /// GetCurrentTenantId 构建全局租户过滤器，子类无法继承私有方法，导致模型构建时
    /// "No method 'GetCurrentTenantId' ... compatible" 绑定失败。本测试被测处理器全程
    /// IgnoreQueryFilters，无需全局过滤器，故仅应用实体配置、跳过过滤器构建即可。
    /// </remarks>
    private sealed class ThrowingOnWorkOrderSaveDbContext : AppDbContext
    {
        public ThrowingOnWorkOrderSaveDbContext(DbContextOptions<AppDbContext> options, ITenantContext tenantContext)
            : base(options, tenantContext) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // 仅应用实体映射配置，跳过基类的全局租户过滤器构建（见类备注）
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            // 仅当有 WorkOrder 处于 Added 时模拟唯一约束冲突（工单创建场景）；
            // seed 规则等其它保存无 WorkOrder，走基类正常保存
            if (ChangeTracker.Entries<WorkOrder>().Any(e => e.State == EntityState.Added))
            {
                // 构造真实的 PostgresException（SQLSTATE 23505），让 IsUniqueViolation 正确识别
                var pgEx = new PostgresException("duplicate key value", "ERROR", "unique_violation", "23505");
                throw new DbUpdateException("工单编码唯一约束冲突（模拟）", pgEx);
            }
            return base.SaveChangesAsync(cancellationToken);
        }
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
