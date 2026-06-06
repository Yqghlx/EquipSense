using EquipAI.Application.WorkOrders.Handlers;
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
/// WorkOrderAnalysisHandler 单元测试
/// 验证分析完成后更新关联工单的逻辑
/// </summary>
public class WorkOrderAnalysisHandlerTests
{
    private readonly Guid _tenantId = Guid.NewGuid();

    private (AppDbContext db, WorkOrderAnalysisHandler handler) CreateSut()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestWOAnalysis_{Guid.NewGuid()}")
            .Options;

        var db = new AppDbContext(options, new TestTenantContext(_tenantId));

        var spMock = new Mock<IServiceProvider>();
        spMock.Setup(sp => sp.GetService(typeof(AppDbContext))).Returns(db);

        var scopeMock = new Mock<IServiceScope>();
        scopeMock.SetupGet(s => s.ServiceProvider).Returns(spMock.Object);

        var scopeFactoryMock = new Mock<IServiceScopeFactory>();
        scopeFactoryMock.Setup(f => f.CreateScope()).Returns(scopeMock.Object);

        var logger = LoggerFactory.Create(_ => { }).CreateLogger<WorkOrderAnalysisHandler>();
        var handler = new WorkOrderAnalysisHandler(logger, scopeFactoryMock.Object);

        return (db, handler);
    }

    private AnalysisCompletedEvent MakeEvent(Guid alertId, Guid analysisId) => new(
        EventId: Guid.NewGuid(), OccurredAt: DateTime.UtcNow, TenantId: _tenantId,
        AnalysisId: analysisId, AlertId: alertId, DeviceId: Guid.NewGuid(),
        Metric: "temperature", Level: AnalysisLevel.L3,
        Confidence: 0.85, RootCause: "轴承磨损", Suggestion: "更换轴承");

    [Fact]
    public async Task HandleAsync_有活跃工单时应更新AnalysisId和RootCause()
    {
        var (db, handler) = CreateSut();
        var alertId = Guid.NewGuid();
        var analysisId = Guid.NewGuid();

        db.WorkOrders.Add(new Core.Entities.WorkOrder
        {
            TenantId = _tenantId, AlertId = alertId,
            Title = "活跃工单", Status = WorkOrderStatus.InProgress
        });
        await db.SaveChangesAsync();

        await handler.HandleAsync(MakeEvent(alertId, analysisId), CancellationToken.None);

        var wo = await db.WorkOrders.IgnoreQueryFilters().FirstAsync();
        wo.AnalysisId.Should().Be(analysisId);
        wo.RootCause.Should().Be("轴承磨损");
    }

    [Fact]
    public async Task HandleAsync_无活跃工单时不应抛出异常()
    {
        var (db, handler) = CreateSut();

        var act = () => handler.HandleAsync(
            MakeEvent(Guid.NewGuid(), Guid.NewGuid()), CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task HandleAsync_已关闭的工单不应被更新()
    {
        var (db, handler) = CreateSut();
        var alertId = Guid.NewGuid();

        db.WorkOrders.Add(new Core.Entities.WorkOrder
        {
            TenantId = _tenantId, AlertId = alertId,
            Title = "已关闭工单", Status = WorkOrderStatus.Closed
        });
        await db.SaveChangesAsync();

        await handler.HandleAsync(MakeEvent(alertId, Guid.NewGuid()), CancellationToken.None);

        var wo = await db.WorkOrders.IgnoreQueryFilters().FirstAsync();
        wo.AnalysisId.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_已取消的工单不应被更新()
    {
        var (db, handler) = CreateSut();
        var alertId = Guid.NewGuid();

        db.WorkOrders.Add(new Core.Entities.WorkOrder
        {
            TenantId = _tenantId, AlertId = alertId,
            Title = "已取消工单", Status = WorkOrderStatus.Cancelled
        });
        await db.SaveChangesAsync();

        await handler.HandleAsync(MakeEvent(alertId, Guid.NewGuid()), CancellationToken.None);

        var wo = await db.WorkOrders.IgnoreQueryFilters().FirstAsync();
        wo.AnalysisId.Should().BeNull();
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
