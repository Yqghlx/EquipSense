namespace EquipAI.Core.Interfaces;

/// <summary>
/// 事件处理器接口，用于处理特定类型的集成事件
/// 实现此接口的类会自动注册到事件总线
/// </summary>
/// <typeparam name="TEvent">处理的事件类型</typeparam>
public interface IEventHandler<in TEvent> where TEvent : IIntegrationEvent
{
    /// <summary>
    /// 处理事件
    /// </summary>
    /// <param name="event">待处理的事件</param>
    /// <param name="cancellationToken">取消令牌</param>
    Task HandleAsync(TEvent @event, CancellationToken cancellationToken = default);
}
