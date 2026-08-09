namespace EquipAI.Core.Interfaces;

/// <summary>
/// 事件总线接口，实现模块间的发布/订阅解耦
/// Phase 1 使用进程内实现，后续可替换为 RabbitMQ 等消息队列
/// </summary>
public interface IEventBus
{
    /// <summary>
    /// 发布集成事件，所有订阅了该事件类型的处理器将被调用
    /// </summary>
    /// <typeparam name="TEvent">事件类型</typeparam>
    /// <param name="event">待发布的事件</param>
    /// <param name="cancellationToken">取消令牌</param>
    Task PublishAsync<TEvent>(TEvent @event, CancellationToken cancellationToken = default) where TEvent : IIntegrationEvent;

    /// <summary>
    /// 订阅事件，注册处理器类型
    /// 应在应用启动时调用，完成所有事件订阅的注册
    /// </summary>
    /// <typeparam name="TEvent">事件类型</typeparam>
    /// <typeparam name="THandler">处理器类型</typeparam>
    void Subscribe<TEvent, THandler>()
        where TEvent : IIntegrationEvent
        where THandler : IEventHandler<TEvent>;
}

/// <summary>
/// 可靠事件传输接口。
/// 生产环境由 RabbitMQ 实现，Outbox 分发器只依赖此接口，避免把已经落库的事件再次写回 Outbox。
/// </summary>
public interface IEventBusTransport : IEventBus
{
    /// <summary>
    /// 按事件运行时类型发布已经从 Outbox 恢复的事件。
    /// </summary>
    /// <param name="event">待发布的集成事件</param>
    /// <param name="cancellationToken">取消令牌</param>
    Task PublishAsync(IIntegrationEvent @event, CancellationToken cancellationToken = default);
}
