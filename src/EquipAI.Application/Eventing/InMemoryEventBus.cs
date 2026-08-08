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
    /// 事件通道有界容量。扩容到 10000：原 1000 在告警风暴或批量遥测下极易打满，
    /// DropOldest 会静默丢弃最早的事件（包括告警触发、工单创建这类绝不能丢的业务事件），
    /// 导致下游 SignalR 推送、自动建单、知识沉淀丢失，且生产环境难以察觉。
    /// </summary>
    private const int ChannelCapacity = 10000;

    /// <summary>
    /// 发布端在通道满时的等待超时：超过则放弃写入并记录错误，避免高吞吐遥测发布者
    /// 长时间阻塞拖垮采集线程。正常负载下通道容量充裕，该超时几乎不会触发。
    /// </summary>
    private static readonly TimeSpan PublishFullTimeout = TimeSpan.FromSeconds(5);

    private readonly Channel<IIntegrationEvent> _channel = Channel.CreateBounded<IIntegrationEvent>(
        new BoundedChannelOptions(ChannelCapacity)
        {
            // Wait 而非 DropOldest：业务事件（告警、工单）丢失代价远高于发布端短暂背压。
            // 配合 PublishFullTimeout 兜底，避免无限阻塞。
            FullMode = BoundedChannelFullMode.Wait,
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

        // Wait 模式下通道满时 WriteAsync 会阻塞，直到消费者腾出空位。
        // 用复合 CTS 施加 PublishFullTimeout 兜底：超时说明消费严重滞后（处理器卡在 DB/外部调用），
        // 此时丢弃【这一个】事件并记错误日志，比无限阻塞发布线程（可能拖垮遥测采集）更可控。
        // 业务事件极少触发：容量 10000 + 超时 5s 意味着需要消费停滞且积压 10000 才会丢。
        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        linkedCts.CancelAfter(PublishFullTimeout);
        try
        {
            await _channel.Writer.WriteAsync(@event, linkedCts.Token);
            _logger.LogDebug("事件 {EventType} 已发布 (EventId: {EventId})", typeof(TEvent).Name, @event.EventId);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            // 超时（非调用方取消）：通道持续满 5s，消费者已严重滞后。记录而非吞掉，便于运维发现。
            _logger.LogError(
                "事件 {EventType} (EventId: {EventId}) 发布超时：事件通道已满 {Capacity} 且消费滞后超过 {Timeout}s，事件被丢弃",
                typeof(TEvent).Name, @event.EventId, ChannelCapacity, PublishFullTimeout.TotalSeconds);
        }
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
                    // 解析 HandleAsync 方法时需指定参数类型，避免多接口实现的处理器
                    // （如 WorkOrderNotificationHandler 同时实现两个 IEventHandler<> 接口）
                    // 触发 AmbiguousMatchException
                    var handleMethod = handlerType.GetMethod(
                        "HandleAsync",
                        new[] { eventType, typeof(CancellationToken) });
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
        try { _cts.Cancel(); } catch (ObjectDisposedException) { }

        _channel.Writer.TryComplete();

        // 等待消费任务完成，设置超时防止无限等待
        // 取消令牌后 ReadAllAsync 会抛出 OperationCanceledException，属于正常行为，忽略即可
        try
        {
            _consumeTask.Wait(TimeSpan.FromSeconds(5));
        }
        catch (AggregateException)
        {
            // 后台消费者因取消而退出，属于预期行为
        }

        _cts.Dispose();
        GC.SuppressFinalize(this);
    }
}
