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

    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode { get; } = "shared";
        public bool IsSystemAdmin { get; } = false;
        public Guid UserId { get; } = Guid.NewGuid();
    }
}
