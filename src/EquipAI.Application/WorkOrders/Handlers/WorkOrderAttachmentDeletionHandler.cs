using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders.Handlers;

/// <summary>
/// 工单附件物理文件删除处理器。
/// </summary>
/// <remarks>
/// 元数据删除已经由调用方和事务 Outbox 原子提交；本处理器只处理物理对象。
/// 存储失败必须继续抛出，让 RabbitMQ 的重试和死信队列保留删除任务。
/// </remarks>
public sealed class WorkOrderAttachmentDeletionHandler : IEventHandler<WorkOrderAttachmentDeletedEvent>
{
    private readonly IFileStorageService _fileStorage;
    private readonly ILogger<WorkOrderAttachmentDeletionHandler> _logger;

    /// <summary>
    /// 初始化附件物理删除处理器。
    /// </summary>
    public WorkOrderAttachmentDeletionHandler(
        IFileStorageService fileStorage,
        ILogger<WorkOrderAttachmentDeletionHandler> logger)
    {
        _fileStorage = fileStorage;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task HandleAsync(
        WorkOrderAttachmentDeletedEvent @event,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        try
        {
            await _fileStorage.DeleteAsync(@event.StoragePath);
            _logger.LogInformation(
                "工单附件物理文件已删除：TenantId={TenantId}, WorkOrderId={WorkOrderId}, AttachmentId={AttachmentId}, StoragePath={StoragePath}",
                @event.TenantId,
                @event.WorkOrderId,
                @event.AttachmentId,
                @event.StoragePath);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            // 宿主停机取消不能确认消息，交由事件总线在下次启动时继续处理。
            throw;
        }
        catch (Exception exception)
        {
            // 不能把删除失败记录后当作成功返回，否则 RabbitMQ 会确认消息并丢失清理任务。
            _logger.LogError(
                exception,
                "工单附件物理文件删除失败，将由事件总线重试：TenantId={TenantId}, WorkOrderId={WorkOrderId}, AttachmentId={AttachmentId}, StoragePath={StoragePath}",
                @event.TenantId,
                @event.WorkOrderId,
                @event.AttachmentId,
                @event.StoragePath);
            throw;
        }
    }
}
