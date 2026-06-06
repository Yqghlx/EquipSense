using EquipAI.Application.WorkOrders.Handlers;
using EquipAI.Application.WorkOrders.Router;
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
/// WorkOrderIntegrationHandler 单元测试
/// 验证工单状态变更后的集成路由分发逻辑
/// </summary>
public class WorkOrderIntegrationHandlerTests
{
    private readonly Guid _tenantId = Guid.NewGuid();

    private (AppDbContext db, WorkOrderIntegrationHandler handler) CreateSut()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestWOIntegration_{Guid.NewGuid()}")
            .Options;

        var db = new AppDbContext(options, new TestTenantContext(_tenantId));

        var spMock = new Mock<IServiceProvider>();
        spMock.Setup(sp => sp.GetService(typeof(AppDbContext))).Returns(db);

        var scopeMock = new Mock<IServiceScope>();
        scopeMock.SetupGet(s => s.ServiceProvider).Returns(spMock.Object);

        var scopeFactoryMock = new Mock<IServiceScopeFactory>();
        scopeFactoryMock.Setup(f => f.CreateScope()).Returns(scopeMock.Object);

        var routerLogger = LoggerFactory.Create(_ => { }).CreateLogger<IntegrationRouter>();
        var router = new IntegrationRouter(scopeFactoryMock.Object, routerLogger);

        var handlerLogger = LoggerFactory.Create(_ => { }).CreateLogger<WorkOrderIntegrationHandler>();
        var handler = new WorkOrderIntegrationHandler(router, handlerLogger);

        return (db, handler);
    }

    private WorkOrderStatusChangedEvent MakeEvent(string newStatus, Guid woId) => new(
        EventId: Guid.NewGuid(), OccurredAt: DateTime.UtcNow, TenantId: _tenantId,
        WorkOrderId: woId, OldStatus: "PendingDispatch", NewStatus: newStatus,
        OperatorId: Guid.NewGuid());

    [Fact]
    public async Task HandleAsync_PendingDispatch状态不应抛出异常()
    {
        var (db, handler) = CreateSut();
        var woId = Guid.NewGuid();

        // 工单不存在时路由会失败，但 handler 应捕获异常
        var act = () => handler.HandleAsync(MakeEvent("PendingDispatch", woId), CancellationToken.None);
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task HandleAsync_非PendingDispatch状态不应抛出异常()
    {
        var (db, handler) = CreateSut();
        var woId = Guid.NewGuid();

        var act = () => handler.HandleAsync(MakeEvent("InProgress", woId), CancellationToken.None);
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task HandleAsync_Closed状态应正常处理()
    {
        var (db, handler) = CreateSut();
        var woId = Guid.NewGuid();

        var act = () => handler.HandleAsync(MakeEvent("Closed", woId), CancellationToken.None);
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task HandleAsync_工单存在时不应抛出异常()
    {
        var (db, handler) = CreateSut();
        var woId = Guid.NewGuid();

        db.WorkOrders.Add(new WorkOrder
        {
            Id = woId, TenantId = _tenantId,
            Title = "测试工单", Status = WorkOrderStatus.PendingDispatch
        });
        await db.SaveChangesAsync();

        var act = () => handler.HandleAsync(MakeEvent("PendingDispatch", woId), CancellationToken.None);
        await act.Should().NotThrowAsync();
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
