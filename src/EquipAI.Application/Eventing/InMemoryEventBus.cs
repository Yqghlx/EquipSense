using System.Threading.Channels;
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Eventing;

/// <summary>
/// 进程内事件总线实现，基于 Channel 实现生产者-消费者模式
/// Phase 1 使用此进程内实现，后续可替换为 RabbitMQ 等消息队列
/// </summary>
public class InMemoryEventBus : IEventBus, IDisposable
{
    /// <summary>
    /// 事件通道，有界容量 1000，满时丢弃最旧的事件以防止内存溢出
    /// </summary>
    private readonly Channel<IIntegrationEvent> _channel = Channel.CreateBounded<IIntegrationEvent>(
        new BoundedChannelOptions(1000)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
            SingleReader = true,
            SingleWriter = false
        });

    /// <summary>
    /// 处理器注册表：事件类型 -> 处理器类型列表
    /// </summary>
    private readonly Dictionary<Type, List<Type>> _handlerRegistry = new();

    /// <summary>
    /// 后台消费任务的取消令牌源
    /// </summary>
    private readonly CancellationTokenSource _cts = new();

    /// <summary>
    /// 后台消费任务
    /// </summary>
    private readonly Task _consumeTask;

    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<InMemoryEventBus> _logger;

    /// <summary>
    /// 初始化事件总线并启动后台消费者
    /// </summary>
    /// <param name="serviceProvider">DI 服务提供者，用于创建作用域解析处理器</param>
    /// <param name="logger">日志记录器</param>
    public InMemoryEventBus(IServiceProvider serviceProvider, ILogger<InMemoryEventBus> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _consumeTask = Task.Run(ConsumeAsync);
    }

    /// <summary>
    /// 发布集成事件到通道
    /// 事件将被后台消费者异步分发给所有注册的处理器
    /// </summary>
    /// <typeparam name="TEvent">事件类型</typeparam>
    /// <param name="event">待发布的事件</param>
    /// <param name="cancellationToken">取消令牌</param>
    public async Task PublishAsync<TEvent>(TEvent @event, CancellationToken cancellationToken = default)
        where TEvent : IIntegrationEvent
    {
        if (!_handlerRegistry.TryGetValue(typeof(TEvent), out var handlers) || handlers.Count == 0)
        {
            _logger.LogDebug("事件 {EventType} 没有注册的处理器，跳过发布", typeof(TEvent).Name);
            return;
        }

        await _channel.Writer.WriteAsync(@event, cancellationToken);
        _logger.LogDebug("事件 {EventType} 已发布 (EventId: {EventId})", typeof(TEvent).Name, @event.EventId);
    }

    /// <summary>
    /// 订阅事件，注册处理器类型
    /// 应在应用启动时调用，完成所有事件订阅的注册
    /// </summary>
    /// <typeparam name="TEvent">事件类型</typeparam>
    /// <typeparam name="THandler">处理器类型</typeparam>
    public void Subscribe<TEvent, THandler>()
        where TEvent : IIntegrationEvent
        where THandler : IEventHandler<TEvent>
    {
        var eventType = typeof(TEvent);
        var handlerType = typeof(THandler);

        if (!_handlerRegistry.TryGetValue(eventType, out var handlers))
        {
            handlers = new List<Type>();
            _handlerRegistry[eventType] = handlers;
        }

        if (!handlers.Contains(handlerType))
        {
            handlers.Add(handlerType);
            _logger.LogInformation("已注册事件订阅: {EventType} -> {HandlerType}", eventType.Name, handlerType.Name);
        }
    }

    /// <summary>
    /// 后台消费者，持续从通道读取事件并通过 DI 作用域分发给处理器
    /// </summary>
    private async Task ConsumeAsync()
    {
        _logger.LogInformation("事件总线后台消费者已启动");

        await foreach (var integrationEvent in _channel.Reader.ReadAllAsync(_cts.Token))
        {
            var eventType = integrationEvent.GetType();

            if (!_handlerRegistry.TryGetValue(eventType, out var handlerTypes))
            {
                continue;
            }

            // 为每个事件创建独立的 DI 作用域，确保处理器的生命周期正确
            using var scope = _serviceProvider.CreateScope();

            foreach (var handlerType in handlerTypes)
            {
                try
                {
                    var handler = scope.ServiceProvider.GetRequiredService(handlerType);
                    var handleMethod = handlerType.GetMethod("HandleAsync");
                    if (handleMethod != null)
                    {
                        var task = (Task?)handleMethod.Invoke(handler, new object[] { integrationEvent, _cts.Token });
                        if (task != null)
                        {
                            await task;
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "处理事件 {EventType} 时处理器 {HandlerType} 发生异常 (EventId: {EventId})",
                        eventType.Name, handlerType.Name, integrationEvent.EventId);
                }
            }
        }

        _logger.LogInformation("事件总线后台消费者已停止");
    }

    /// <summary>
    /// 释放资源，取消后台消费者并等待其完成
    /// </summary>
    public void Dispose()
    {
        _cts.Cancel();
        _channel.Writer.TryComplete();

        // 等待消费任务完成，设置超时防止无限等待
        _consumeTask.Wait(TimeSpan.FromSeconds(5));

        _cts.Dispose();
        GC.SuppressFinalize(this);
    }
}
