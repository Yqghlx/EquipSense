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

    private (AppDbContext db, WorkOrderAnalysisHandler handler, Mock<ISignalRNotificationService> signalRMock) CreateSut()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestWOAnalysis_{Guid.NewGuid()}")
            .Options;

        var db = new AppDbContext(options, new TestTenantContext(_tenantId));

        // Mock ISignalRNotificationService：handler 更新工单后应推送分析完成事件（回归 #249）
        var signalRMock = new Mock<ISignalRNotificationService>();

        var spMock = new Mock<IServiceProvider>();
        spMock.Setup(sp => sp.GetService(typeof(AppDbContext))).Returns(db);
        spMock.Setup(sp => sp.GetService(typeof(ISignalRNotificationService))).Returns(signalRMock.Object);

        var scopeMock = new Mock<IServiceScope>();
        scopeMock.SetupGet(s => s.ServiceProvider).Returns(spMock.Object);

        var scopeFactoryMock = new Mock<IServiceScopeFactory>();
        scopeFactoryMock.Setup(f => f.CreateScope()).Returns(scopeMock.Object);

        var logger = LoggerFactory.Create(_ => { }).CreateLogger<WorkOrderAnalysisHandler>();
        var handler = new WorkOrderAnalysisHandler(logger, scopeFactoryMock.Object);

        return (db, handler, signalRMock);
    }

    private AnalysisCompletedEvent MakeEvent(Guid alertId, Guid analysisId) => new(
        EventId: Guid.NewGuid(), OccurredAt: DateTime.UtcNow, TenantId: _tenantId,
        AnalysisId: analysisId, AlertId: alertId, DeviceId: Guid.NewGuid(),
        Metric: "temperature", Level: AnalysisLevel.L3,
        Confidence: 0.85, RootCause: "轴承磨损", Suggestion: "更换轴承");

    [Fact]
    public async Task HandleAsync_有活跃工单时应更新AnalysisId和RootCause()
    {
        var (db, handler, _) = CreateSut();
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
    public async Task HandleAsync_事件租户与工单租户不一致_不应更新工单或推送通知()
    {
        var (db, handler, signalRMock) = CreateSut();
        var alertId = Guid.NewGuid();
        var analysisId = Guid.NewGuid();
        var eventTenantId = Guid.NewGuid();

        db.WorkOrders.Add(new Core.Entities.WorkOrder
        {
            TenantId = _tenantId, AlertId = alertId,
            Title = "其他租户活跃工单", Status = WorkOrderStatus.InProgress,
            RootCause = "原始根因"
        });
        await db.SaveChangesAsync();

        await handler.HandleAsync(
            new AnalysisCompletedEvent(
                EventId: Guid.NewGuid(), OccurredAt: DateTime.UtcNow,
                TenantId: eventTenantId, AnalysisId: analysisId, AlertId: alertId,
                DeviceId: Guid.NewGuid(), Metric: "temperature", Level: AnalysisLevel.L3,
                Confidence: 0.85, RootCause: "越权根因", Suggestion: "越权建议"),
            CancellationToken.None);

        var workOrder = await db.WorkOrders.IgnoreQueryFilters().SingleAsync();
        workOrder.AnalysisId.Should().BeNull();
        workOrder.RootCause.Should().Be("原始根因");
        signalRMock.Invocations
            .Should().NotContain(i =>
                i.Method.Name == nameof(ISignalRNotificationService.SendWorkOrderAnalysisUpdatedAsync));
    }

    [Fact]
    public async Task HandleAsync_更新工单后应推送分析完成事件让详情页实时刷新()
    {
        var (db, handler, signalRMock) = CreateSut();
        var alertId = Guid.NewGuid();
        var analysisId = Guid.NewGuid();
        var woId = Guid.NewGuid();

        db.WorkOrders.Add(new Core.Entities.WorkOrder
        {
            Id = woId, TenantId = _tenantId, AlertId = alertId,
            Title = "活跃工单", Status = WorkOrderStatus.InProgress
        });
        await db.SaveChangesAsync();

        await handler.HandleAsync(MakeEvent(alertId, analysisId), CancellationToken.None);

        // 回归 bug #249：WorkOrderAnalysisHandler 更新工单 RootCause 后不推送 SignalR，前端工单详情页
        // （useWorkOrder(id) queryKey ['work-orders', id]）不被 invalidate → 用户停留在详情页时 AI 根因
        // 区域一直空白/旧值，必须手动刷新。AI 根因分析是「告警→自动建单→异步分析」流程的核心价值点，
        // 分析完成却不展示严重降低产品可信度。修复后 handler 更新 DB 后推送 OnWorkOrderAnalysisUpdated。
        // 用 Invocations 逐参数断言（参考 moq-verify-closure-arg-flaky：闭包捕获 Guid 的 Verify 不稳定）
        var invocations = signalRMock.Invocations
            .Where(i => i.Method.Name == nameof(ISignalRNotificationService.SendWorkOrderAnalysisUpdatedAsync))
            .ToList();
        invocations.Should().HaveCount(1, "分析完成更新工单后应推送 1 次分析更新事件");
        invocations[0].Arguments[0].Should().Be(_tenantId, "tenantId 参数应为工单所属租户");
        invocations[0].Arguments[1].Should().Be(woId, "workOrderId 参数应为被更新的工单");
    }

    [Fact]
    public async Task HandleAsync_无活跃工单时不应抛出异常()
    {
        var (db, handler, _) = CreateSut();

        var act = () => handler.HandleAsync(
            MakeEvent(Guid.NewGuid(), Guid.NewGuid()), CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task HandleAsync_已关闭的工单不应被更新()
    {
        var (db, handler, _) = CreateSut();
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
        var (db, handler, _) = CreateSut();
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
