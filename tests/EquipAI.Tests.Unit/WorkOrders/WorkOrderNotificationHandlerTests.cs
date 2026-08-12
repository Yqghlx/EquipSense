using EquipAI.Application.WorkOrders.Handlers;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace EquipAI.Tests.Unit.WorkOrders;

/// <summary>
/// 工单 SignalR 事件处理器测试，覆盖普通故障隔离与宿主停机取消传播边界。
/// </summary>
public class WorkOrderNotificationHandlerTests
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly Guid _workOrderId = Guid.NewGuid();

    private static WorkOrderNotificationHandler CreateSut(
        Mock<ISignalRNotificationService> signalRMock)
        => new(
            signalRMock.Object,
            LoggerFactory.Create(_ => { }).CreateLogger<WorkOrderNotificationHandler>());

    [Fact]
    public async Task HandleAsync_普通SignalR异常应被隔离()
    {
        var signalRMock = new Mock<ISignalRNotificationService>();
        signalRMock
            .Setup(s => s.SendWorkOrderCreatedAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("SignalR 连接异常"));
        var handler = CreateSut(signalRMock);
        var evt = new WorkOrderCreatedEvent(
            Guid.NewGuid(), DateTime.UtcNow, _tenantId, _workOrderId, Guid.NewGuid(), "设备维修", "High");

        var act = () => handler.HandleAsync(evt, CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task HandleAsync_宿主取消时不应吞掉SignalR取消信号()
    {
        var signalRMock = new Mock<ISignalRNotificationService>();
        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();
        signalRMock
            .Setup(s => s.SendWorkOrderCreatedAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException(cancellation.Token));
        var handler = CreateSut(signalRMock);
        var evt = new WorkOrderCreatedEvent(
            Guid.NewGuid(), DateTime.UtcNow, _tenantId, _workOrderId, Guid.NewGuid(), "设备维修", "High");

        var act = () => handler.HandleAsync(evt, cancellation.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }
}
