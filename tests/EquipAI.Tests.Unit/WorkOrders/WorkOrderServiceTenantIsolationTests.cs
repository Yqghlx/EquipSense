using EquipAI.Application.Approvals;
using EquipAI.Application.WorkOrders;
using EquipAI.Application.WorkOrders.DTOs;
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

namespace EquipAI.Tests.Unit.WorkOrders;

/// <summary>
/// 工单服务显式租户边界回归测试。
/// </summary>
public sealed class WorkOrderServiceTenantIsolationTests
{
    [Fact]
    public async Task ListAsync_传入其他租户_不应返回当前上下文租户工单()
    {
        var (db, _, service, contextTenantId) = CreateSut();
        SeedWorkOrder(db, contextTenantId, WorkOrderStatus.PendingDispatch);

        var result = await service.ListAsync(
            DifferentTenant(contextTenantId), page: 1, pageSize: 20, ct: CancellationToken.None);

        result.Items.Should().BeEmpty("工单列表必须显式绑定传入的租户");
        result.Total.Should().Be(0, "跨租户工单不应计入分页总数");
    }

    [Fact]
    public async Task GetByIdAsync_传入其他租户_应按不存在处理()
    {
        var (db, _, service, contextTenantId) = CreateSut();
        var workOrder = SeedWorkOrder(db, contextTenantId, WorkOrderStatus.PendingDispatch);

        var act = () => service.GetByIdAsync(
            DifferentTenant(contextTenantId), workOrder.Id, CancellationToken.None);

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task AssignAsync_传入其他租户_不应派工或发布事件()
    {
        var (db, eventBus, service, contextTenantId) = CreateSut();
        var workOrder = SeedWorkOrder(db, contextTenantId, WorkOrderStatus.PendingDispatch);
        var contextTenantAssignee = new User
        {
            Id = Guid.NewGuid(),
            TenantId = contextTenantId,
            Username = "context-tenant-technician",
            PasswordHash = "测试密码摘要",
            Role = UserRole.Technician,
            IsActive = true,
        };
        db.Users.Add(contextTenantAssignee);
        db.SaveChanges();

        var act = () => service.AssignAsync(
            DifferentTenant(contextTenantId),
            workOrder.Id,
            // 该执行人真实属于工单租户；旧实现命中工单后会继续校验执行人，
            // 暴露“执行人不存在”而不是把工单按当前租户不存在处理。
            new AssignWorkOrderRequest { AssignedTo = contextTenantAssignee.Id },
            Guid.NewGuid(),
            CancellationToken.None);

        await act.Should().ThrowAsync<KeyNotFoundException>();
        await AssertStatusAsync(db, workOrder.Id, WorkOrderStatus.PendingDispatch);
        VerifyNoStatusChangedEvent(eventBus);
    }

    [Fact]
    public async Task StartAsync_传入其他租户_不应开始工单或发布事件()
    {
        var (db, eventBus, service, contextTenantId) = CreateSut();
        var workOrder = SeedWorkOrder(db, contextTenantId, WorkOrderStatus.Assigned);

        var act = () => service.StartAsync(
            DifferentTenant(contextTenantId), workOrder.Id, Guid.NewGuid(), CancellationToken.None);

        await act.Should().ThrowAsync<KeyNotFoundException>();
        await AssertStatusAsync(db, workOrder.Id, WorkOrderStatus.Assigned);
        VerifyNoStatusChangedEvent(eventBus);
    }

    [Fact]
    public async Task CompleteAsync_传入其他租户_不应完成工单或发布事件()
    {
        var (db, eventBus, service, contextTenantId) = CreateSut();
        var workOrder = SeedWorkOrder(db, contextTenantId, WorkOrderStatus.InProgress);

        var act = () => service.CompleteAsync(
            DifferentTenant(contextTenantId),
            workOrder.Id,
            new CompleteWorkOrderRequest { Resolution = "越权完成" },
            Guid.NewGuid(),
            CancellationToken.None);

        await act.Should().ThrowAsync<KeyNotFoundException>();
        await AssertStatusAsync(db, workOrder.Id, WorkOrderStatus.InProgress);
        VerifyNoStatusChangedEvent(eventBus);
    }

    [Fact]
    public async Task AcceptAsync_传入其他租户_不应验收工单或发布事件()
    {
        var (db, eventBus, service, contextTenantId) = CreateSut();
        var workOrder = SeedWorkOrder(db, contextTenantId, WorkOrderStatus.Completed);

        var act = () => service.AcceptAsync(
            DifferentTenant(contextTenantId), workOrder.Id, Guid.NewGuid(), ct: CancellationToken.None);

        await act.Should().ThrowAsync<KeyNotFoundException>();
        await AssertStatusAsync(db, workOrder.Id, WorkOrderStatus.Completed);
        VerifyNoStatusChangedEvent(eventBus);
    }

    [Fact]
    public async Task RejectAsync_传入其他租户_不应驳回工单或发布事件()
    {
        var (db, eventBus, service, contextTenantId) = CreateSut();
        var workOrder = SeedWorkOrder(db, contextTenantId, WorkOrderStatus.Completed);

        var act = () => service.RejectAsync(
            DifferentTenant(contextTenantId), workOrder.Id, Guid.NewGuid(), ct: CancellationToken.None);

        await act.Should().ThrowAsync<KeyNotFoundException>();
        await AssertStatusAsync(db, workOrder.Id, WorkOrderStatus.Completed);
        VerifyNoStatusChangedEvent(eventBus);
    }

    [Fact]
    public async Task CloseAsync_传入其他租户_不应关闭工单或发布事件()
    {
        var (db, eventBus, service, contextTenantId) = CreateSut();
        var workOrder = SeedWorkOrder(db, contextTenantId, WorkOrderStatus.Accepted);

        var act = () => service.CloseAsync(
            DifferentTenant(contextTenantId), workOrder.Id, Guid.NewGuid(), ct: CancellationToken.None);

        await act.Should().ThrowAsync<KeyNotFoundException>();
        await AssertStatusAsync(db, workOrder.Id, WorkOrderStatus.Accepted);
        VerifyNoStatusChangedEvent(eventBus);
    }

    [Fact]
    public async Task CancelAsync_传入其他租户_不应取消工单或发布事件()
    {
        var (db, eventBus, service, contextTenantId) = CreateSut();
        var workOrder = SeedWorkOrder(db, contextTenantId, WorkOrderStatus.PendingDispatch);

        var act = () => service.CancelAsync(
            DifferentTenant(contextTenantId), workOrder.Id, Guid.NewGuid(), ct: CancellationToken.None);

        await act.Should().ThrowAsync<KeyNotFoundException>();
        await AssertStatusAsync(db, workOrder.Id, WorkOrderStatus.PendingDispatch);
        VerifyNoStatusChangedEvent(eventBus);
    }

    [Fact]
    public async Task SubmitAsync_传入其他租户_不应提交验收或发布事件()
    {
        var (db, eventBus, service, contextTenantId) = CreateSut();
        var workOrder = SeedWorkOrder(db, contextTenantId, WorkOrderStatus.InProgress);

        var act = () => service.SubmitAsync(
            DifferentTenant(contextTenantId),
            workOrder.Id,
            new CompleteWorkOrderRequest { Resolution = "越权提交" },
            Guid.NewGuid(),
            CancellationToken.None);

        await act.Should().ThrowAsync<KeyNotFoundException>();
        await AssertStatusAsync(db, workOrder.Id, WorkOrderStatus.InProgress);
        VerifyNoStatusChangedEvent(eventBus);
    }

    private static (AppDbContext Db, Mock<IEventBus> EventBus, WorkOrderService Service, Guid ContextTenantId)
        CreateSut()
    {
        var contextTenantId = Guid.NewGuid();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"WorkOrderTenantIsolation_{Guid.NewGuid()}")
            .Options;
        var db = new AppDbContext(options, new FixedTenantContext(contextTenantId));

        var eventBus = new Mock<IEventBus>();
        eventBus
            .Setup(e => e.PublishAsync(It.IsAny<IIntegrationEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var serviceProvider = new Mock<IServiceProvider>();
        serviceProvider
            .Setup(sp => sp.GetService(typeof(AppDbContext)))
            .Returns(db);
        var scope = new Mock<IServiceScope>();
        scope.SetupGet(s => s.ServiceProvider).Returns(serviceProvider.Object);
        var scopeFactory = new Mock<IServiceScopeFactory>();
        scopeFactory.Setup(factory => factory.CreateScope()).Returns(scope.Object);

        var service = new WorkOrderService(
            scopeFactory.Object,
            eventBus.Object,
            LoggerFactory.Create(_ => { }).CreateLogger<WorkOrderService>(),
            new Mock<IApprovalChainService>().Object);

        return (db, eventBus, service, contextTenantId);
    }

    private static WorkOrder SeedWorkOrder(
        AppDbContext db,
        Guid tenantId,
        WorkOrderStatus status)
    {
        var workOrder = new WorkOrder
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            WorkOrderCode = $"WO-{Guid.NewGuid():N}",
            Title = "租户隔离测试工单",
            Type = WorkOrderType.Corrective,
            Priority = WorkOrderPriority.Medium,
            Status = status,
            DeviceId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
        };
        db.WorkOrders.Add(workOrder);
        db.SaveChanges();
        return workOrder;
    }

    private static async Task AssertStatusAsync(
        AppDbContext db,
        Guid workOrderId,
        WorkOrderStatus expectedStatus)
    {
        var persisted = await db.WorkOrders
            .IgnoreQueryFilters()
            .AsNoTracking()
            .SingleAsync(workOrder => workOrder.Id == workOrderId);
        persisted.Status.Should().Be(expectedStatus);
    }

    private static void VerifyNoStatusChangedEvent(Mock<IEventBus> eventBus)
        => eventBus.Verify(
            e => e.PublishAsync(
                It.IsAny<WorkOrderStatusChangedEvent>(),
                It.IsAny<CancellationToken>()),
            Times.Never);

    private static Guid DifferentTenant(Guid tenantId)
    {
        var otherTenantId = Guid.NewGuid();
        return otherTenantId == tenantId ? DifferentTenant(tenantId) : otherTenantId;
    }

    /// <summary>
    /// 固定租户上下文，用于复现全局过滤器与业务参数租户不一致的边界。
    /// </summary>
    private sealed class FixedTenantContext(Guid tenantId) : ITenantContext
    {
        public Guid TenantId { get; } = tenantId;
        public string IsolationMode { get; } = "Shared";
        public bool IsSystemAdmin { get; } = false;
        public Guid UserId { get; } = Guid.NewGuid();
    }
}
