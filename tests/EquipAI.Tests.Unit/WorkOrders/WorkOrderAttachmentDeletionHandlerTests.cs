using EquipAI.Application.WorkOrders.Handlers;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace EquipAI.Tests.Unit.WorkOrders;

/// <summary>
/// 工单附件物理删除事件处理器测试。
/// </summary>
public sealed class WorkOrderAttachmentDeletionHandlerTests
{
    [Fact]
    public async Task HandleAsync_应按事件中的存储路径删除物理文件()
    {
        var storage = new Mock<IFileStorageService>(MockBehavior.Strict);
        storage
            .Setup(item => item.DeleteAsync("tenant/work-order/report.pdf"))
            .Returns(Task.CompletedTask);
        var handler = new WorkOrderAttachmentDeletionHandler(
            storage.Object,
            NullLogger<WorkOrderAttachmentDeletionHandler>.Instance);
        var message = CreateEvent();

        await handler.HandleAsync(message);

        storage.Verify(item => item.DeleteAsync("tenant/work-order/report.pdf"), Times.Once);
    }

    [Fact]
    public async Task HandleAsync_物理存储失败时_应继续抛出异常以触发重试()
    {
        var storage = new Mock<IFileStorageService>(MockBehavior.Strict);
        storage
            .Setup(item => item.DeleteAsync(It.IsAny<string>()))
            .ThrowsAsync(new IOException("对象存储暂时不可用"));
        var handler = new WorkOrderAttachmentDeletionHandler(
            storage.Object,
            NullLogger<WorkOrderAttachmentDeletionHandler>.Instance);

        var act = () => handler.HandleAsync(CreateEvent());

        await act.Should().ThrowAsync<IOException>();
    }

    [Fact]
    public async Task HandleAsync_收到取消时_应传播取消且不调用物理存储()
    {
        var storage = new Mock<IFileStorageService>(MockBehavior.Strict);
        var handler = new WorkOrderAttachmentDeletionHandler(
            storage.Object,
            NullLogger<WorkOrderAttachmentDeletionHandler>.Instance);
        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();

        var act = () => handler.HandleAsync(CreateEvent(), cancellation.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
        storage.Verify(item => item.DeleteAsync(It.IsAny<string>()), Times.Never);
    }

    private static WorkOrderAttachmentDeletedEvent CreateEvent() => new(
        Guid.NewGuid(),
        DateTime.UtcNow,
        Guid.NewGuid(),
        Guid.NewGuid(),
        Guid.NewGuid(),
        "tenant/work-order/report.pdf");
}
