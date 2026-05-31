namespace EquipAI.Core.Interfaces;

/// <summary>
/// 集成事件接口，定义跨模块事件的基本契约
/// 模块间通过实现此接口进行松耦合通信
/// </summary>
public interface IIntegrationEvent
{
    /// <summary>
    /// 事件唯一标识
    /// </summary>
    Guid EventId { get; }

    /// <summary>
    /// 事件发生时间（UTC）
    /// </summary>
    DateTime OccurredAt { get; }

    /// <summary>
    /// 事件所属租户 ID，确保事件处理时的租户上下文正确
    /// </summary>
    Guid TenantId { get; }
}
