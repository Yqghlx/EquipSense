using EquipAI.Core.Interfaces;

namespace EquipAI.Core.Events;

/// <summary>
/// 工单附件元数据删除事件，由可靠事件处理器异步删除物理文件。
/// </summary>
/// <param name="EventId">事件唯一标识，使用附件 ID 保证同一附件删除任务幂等。</param>
/// <param name="OccurredAt">事件发生时间（UTC）。</param>
/// <param name="TenantId">所属租户 ID。</param>
/// <param name="WorkOrderId">所属工单 ID。</param>
/// <param name="AttachmentId">附件元数据 ID。</param>
/// <param name="StoragePath">物理存储中的相对路径或对象键路径。</param>
public record WorkOrderAttachmentDeletedEvent(
    Guid EventId,
    DateTime OccurredAt,
    Guid TenantId,
    Guid WorkOrderId,
    Guid AttachmentId,
    string StoragePath
) : IIntegrationEvent;
