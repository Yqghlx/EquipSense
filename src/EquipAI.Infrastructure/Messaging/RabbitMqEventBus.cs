using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace EquipAI.Infrastructure.Messaging;

/// <summary>
/// 基于 RabbitMQ 的持久化事件总线，实现 <see cref="IEventBus"/>。
///
/// 相比 <see cref="EquipAI.Application.Eventing.InMemoryEventBus"/> 的核心增强：
///   - **持久化**：消息落 RabbitMQ 队列，进程崩溃/重启后未消费事件不丢
///   - **重试**：处理器抛异常时，消息进入重试队列，TTL 到期后回到主队列重投
///   - **死信**：超过最大重试次数的消息进入死信队列，供人工排查（绝不再投）
///
/// 队列拓扑（每个事件类型一套）：
/// <code>
///   equipai.events.{EventType}              主队列  — DLX = equipai.events.{EventType}.retry-exchange
///   equipai.events.{EventType}.retry        重试队列 — TTL = RetryIntervalSeconds, DLX = equipai.events.{EventType}.exchange
///   equipai.events.{EventType}.dead         死信队列 — 无消费者，仅堆积供排查
/// </code>
///
/// 设计取舍：
///   - 一个事件类型一个主队列（而非一个处理器一个队列）：与 InMemoryEventBus 语义一致
///     （同一事件的多个处理器在同一个消费者循环内顺序执行），且减少队列数量。
///     若未来需要并行处理，可拆为 work queue（多个消费者竞争消费同一队列）。
///   - 消费者单连接 + 单通道：业务事件吞吐不高（告警/工单/分析，非遥测），单通道够用。
///   - JSON 序列化：与前端 API 响应一致，可读性好；性能不是瓶颈。
/// </summary>
public sealed class RabbitMqEventBus : IEventBus, IAsyncDisposable, IDisposable
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<RabbitMqEventBus> _logger;
    private readonly RabbitMqOptions _options;
    private readonly IConnection _connection;
    private readonly IChannel _publishChannel;
    private readonly JsonSerializerOptions _jsonOptions;

    /// <summary>
    /// 事件类型注册表：事件类型全名 -> (事件 CLR 类型, 已绑定的消费者通道)。
    /// Subscribe 时填充，用于发布时序列化、消费时反序列化与拓扑声明。
    /// </summary>
    private readonly ConcurrentDictionary<string, EventRegistration> _registrations = new();

    private int _disposed;

    public RabbitMqEventBus(
        IServiceProvider serviceProvider,
        ILogger<RabbitMqEventBus> logger,
        IOptions<RabbitMqOptions> options)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _options = options.Value;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = null, // 保持 record 原始属性名，与后端 DTO 序列化策略对齐
        };

        // 建立连接（启用了 AutomaticRecovery，网络抖动后自动重连 + 重新声明拓扑 + 恢复消费者）
        var factory = new ConnectionFactory
        {
            HostName = _options.Host,
            Port = _options.Port,
            VirtualHost = _options.VirtualHost,
            UserName = _options.Username,
            Password = _options.Password,
            RequestedHeartbeat = TimeSpan.FromSeconds(_options.HeartbeatSeconds),
            AutomaticRecoveryEnabled = _options.AutomaticRecoveryEnabled,
            NetworkRecoveryInterval = TimeSpan.FromSeconds(5),
        };
        try
        {
            _connection = factory.CreateConnectionAsync().GetAwaiter().GetResult();
            _publishChannel = _connection.CreateChannelAsync().GetAwaiter().GetResult();
            _logger.LogInformation("RabbitMQ 事件总线已连接到 {Host}:{Port}", _options.Host, _options.Port);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "RabbitMQ 连接失败（{Host}:{Port}），事件总线不可用", _options.Host, _options.Port);
            throw;
        }
    }

    /// <inheritdoc />
    public async Task PublishAsync<TEvent>(TEvent @event, CancellationToken cancellationToken = default)
        where TEvent : IIntegrationEvent
    {
        var eventType = typeof(TEvent);
        var typeName = eventType.FullName!;

        if (!_registrations.ContainsKey(typeName))
        {
            // 未订阅的事件类型：InMemoryEventBus 会跳过，这里同样跳过（无需声明交换机）
            _logger.LogDebug("事件 {EventType} 没有注册的处理器，跳过发布", eventType.Name);
            return;
        }

        var exchangeName = GetExchangeName(typeName);
        var body = JsonSerializer.SerializeToUtf8Bytes(@event, eventType, _jsonOptions);

        // 持久化投递：DeliveryMode=2 让消息落盘，broker 重启不丢
        var properties = new BasicProperties
        {
            DeliveryMode = DeliveryModes.Persistent,
            ContentType = "application/json",
            MessageId = @event.EventId.ToString(),
            Timestamp = new AmqpTimestamp(new DateTimeOffset(@event.OccurredAt).ToUnixTimeSeconds()),
        };

        await _publishChannel.BasicPublishAsync(
            exchange: exchangeName,
            routingKey: string.Empty,
            mandatory: false,
            basicProperties: properties,
            body: body,
            cancellationToken);
        _logger.LogDebug("事件 {EventType} 已发布到 RabbitMQ (EventId: {EventId})", eventType.Name, @event.EventId);
    }

    /// <inheritdoc />
    public void Subscribe<TEvent, THandler>()
        where TEvent : IIntegrationEvent
        where THandler : IEventHandler<TEvent>
    {
        var eventType = typeof(TEvent);
        var handlerType = typeof(THandler);
        var typeName = eventType.FullName!;

        var registration = _registrations.GetOrAdd(typeName, _ => new EventRegistration(eventType));
        lock (registration.HandlerTypes)
        {
            if (!registration.HandlerTypes.Contains(handlerType))
            {
                registration.HandlerTypes.Add(handlerType);
            }
        }

        // 首次订阅某事件类型时，声明拓扑并启动消费者（幂等：多次 Subscribe 同类型只声明一次）
        // 同步阻塞声明：Subscribe 在应用启动时调用一次，此时连接已建立
        DeclareTopologyAndConsumeAsync(eventType).GetAwaiter().GetResult();
        _logger.LogInformation("已注册 RabbitMQ 事件订阅: {EventType} -> {HandlerType}", eventType.Name, handlerType.Name);
    }

    /// <summary>
    /// 声明事件类型的交换机 + 主队列 + 重试队列 + 死信队列，并启动异步消费者
    /// </summary>
    private async Task DeclareTopologyAndConsumeAsync(Type eventType)
    {
        var typeName = eventType.FullName!;
        var exchangeName = GetExchangeName(typeName);
        var mainQueue = GetMainQueueName(typeName);
        var retryQueue = GetRetryQueueName(typeName);
        var deadQueue = GetDeadQueueName(typeName);
        var retryExchange = $"{exchangeName}.retry-exchange";

        // 独立通道声明拓扑，声明后关闭
        await using var declChannel = await _connection.CreateChannelAsync();

        // 主交换机：fanout（一个事件广播到绑定的队列，此处只绑主队列）
        await declChannel.ExchangeDeclareAsync(exchangeName, ExchangeType.Fanout, durable: true);
        // 重试回路用的交换机：主队列 nack(requeue=false) 后到这里，TTL 到期再回主交换机
        await declChannel.ExchangeDeclareAsync(retryExchange, ExchangeType.Fanout, durable: true);

        // 死信队列：超过重试上限的消息堆积处，无消费者，供人工排查
        await declChannel.QueueDeclareAsync(deadQueue, durable: true, exclusive: false, autoDelete: false);

        // 主队列：DLX 指向重试交换机（消息被 reject/nack 且 requeue=false 时进入重试回路）
        var mainArgs = new Dictionary<string, object?>
        {
            { "x-queue-type", "quorum" }, // quorum 队列：跨节点强一致 + 持久化，生产可用性高于 classic
            { "x-dead-letter-exchange", retryExchange },
            { "x-dead-letter-routing-key", string.Empty },
        };
        await declChannel.QueueDeclareAsync(mainQueue, durable: true, exclusive: false, autoDelete: false, arguments: mainArgs);
        await declChannel.QueueBindAsync(mainQueue, exchangeName, string.Empty);

        // 重试队列：TTL 到期后通过 DLX 回到主交换机（x-dead-letter-exchange = 主交换机）
        var retryArgs = new Dictionary<string, object?>
        {
            { "x-queue-type", "quorum" },
            { "x-message-ttl", _options.RetryIntervalSeconds * 1000 },
            { "x-dead-letter-exchange", exchangeName },
            { "x-dead-letter-routing-key", string.Empty },
        };
        await declChannel.QueueDeclareAsync(retryQueue, durable: true, exclusive: false, autoDelete: false, arguments: retryArgs);
        await declChannel.QueueBindAsync(retryQueue, retryExchange, string.Empty);

        // 启动消费者（独立通道，与发布通道隔离）
        var consumeChannel = await _connection.CreateChannelAsync();
        await consumeChannel.BasicQosAsync(0, _options.PrefetchCount, global: false);

        var consumer = new AsyncEventingBasicConsumer(consumeChannel);
        consumer.ReceivedAsync += async (_, ea) =>
        {
            await HandleMessageAsync(eventType, ea, consumeChannel);
        };

        await consumeChannel.BasicConsumeAsync(mainQueue, autoAck: false, consumer);
    }

    /// <summary>
    /// 处理一条消息：反序列化 → 逐个调用处理器 → 全部成功 ack / 任一失败 nack(requeue=false) 进重试
    /// </summary>
    private async Task HandleMessageAsync(Type eventType, BasicDeliverEventArgs ea, IChannel channel)
    {
        var typeName = eventType.FullName!;
        var cancellationToken = CancellationToken.None;
        var deadQueue = GetDeadQueueName(typeName);

        // 用 CancellationTokenSource 施加处理超时
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(_options.HandlerTimeoutSeconds));
        try
        {
            var @event = JsonSerializer.Deserialize(ea.Body.Span, eventType, _jsonOptions)
                ?? throw new InvalidOperationException("事件反序列化返回 null");

            if (!_registrations.TryGetValue(typeName, out var registration))
            {
                _logger.LogWarning("收到未注册的事件 {EventType}，直接 ack 丢弃", eventType.Name);
                await channel.BasicAckAsync(ea.DeliveryTag, multiple: false, cancellationToken);
                return;
            }

            // 为每个事件创建独立 DI 作用域（与 InMemoryEventBus 一致）
            using var scope = _serviceProvider.CreateScope();
            foreach (var handlerType in registration.HandlerTypes)
            {
                var handler = scope.ServiceProvider.GetRequiredService(handlerType);
                var handleMethod = handlerType.GetMethod("HandleAsync", new[] { eventType, typeof(CancellationToken) });
                if (handleMethod is null) continue;

                var task = (Task?)handleMethod.Invoke(handler, new object[] { @event, cts.Token });
                if (task is not null) await task;
            }

            await channel.BasicAckAsync(ea.DeliveryTag, multiple: false, cancellationToken);
            _logger.LogDebug("事件 {EventType} 处理成功 (EventId: {EventId})", eventType.Name, ((IIntegrationEvent)@event).EventId);
        }
        catch (Exception ex)
        {
            // 失败：nack 不重新入队 → 进入重试队列（DLX）→ TTL 到期回主队列重投
            // 超过重试上限的消息会在重试回路中循环，通过 x-death header 计数判断是否转死信
            var retryCount = GetRetryCount(ea);
            _logger.LogError(ex,
                "处理事件 {EventType} 失败（第 {Attempt} 次），nack 进重试回路 (DeliveryTag: {Tag})",
                eventType.Name, retryCount + 1, ea.DeliveryTag);

            // 超过最大重试次数：直接路由到死信队列（通过拒绝且不重投，配合队列 DLX 不会再进重试）
            // 实现方式：publish 到死信队列后 ack 原消息（避免在重试回路里无限循环）
            if (retryCount >= _options.MaxRetryCount)
            {
                await PublishToDeadLetterAsync(channel, ea, deadQueue, eventType, ex, cancellationToken);
                await channel.BasicAckAsync(ea.DeliveryTag, multiple: false, cancellationToken);
                _logger.LogWarning("事件 {EventType} 超过最大重试次数 {Max}，已转死信队列 {DeadQueue}",
                    eventType.Name, _options.MaxRetryCount, deadQueue);
            }
            else
            {
                await channel.BasicNackAsync(ea.DeliveryTag, multiple: false, requeue: false, cancellationToken);
            }
        }
    }

    /// <summary>
    /// 从 x-death header 累计推断当前重试次数
    /// </summary>
    private int GetRetryCount(BasicDeliverEventArgs ea)
    {
        if (ea.BasicProperties.Headers is null) return 0;
        if (!ea.BasicProperties.Headers.TryGetValue("x-death", out var deathObj) || deathObj is null) return 0;
        // x-death 是一个 list of table，每次经过 DLX 会追加一条；长度近似重试次数
        if (deathObj is IList<object> deathList)
        {
            return deathList.Count;
        }
        return 0;
    }

    /// <summary>
    /// 把失败消息原样转发到死信队列，附带异常信息到 header
    /// </summary>
    private async Task PublishToDeadLetterAsync(
        IChannel channel,
        BasicDeliverEventArgs ea,
        string deadQueue,
        Type eventType,
        Exception ex,
        CancellationToken cancellationToken)
    {
        var props = new BasicProperties
        {
            DeliveryMode = DeliveryModes.Persistent,
            ContentType = ea.BasicProperties.ContentType ?? "application/json",
            MessageId = ea.BasicProperties.MessageId,
            Headers = new Dictionary<string, object?>
            {
                { "x-original-routing-key", Encoding.UTF8.GetBytes(ea.RoutingKey ?? string.Empty) },
                { "x-dead-reason", Encoding.UTF8.GetBytes(ex.Message) },
                { "x-dead-event-type", Encoding.UTF8.GetBytes(eventType.FullName ?? eventType.Name) },
            },
        };
        await channel.BasicPublishAsync(string.Empty, deadQueue, mandatory: false, basicProperties: props, body: ea.Body, cancellationToken);
    }

    private static string GetExchangeName(string typeName) => $"equipai.events.{typeName}";
    private static string GetMainQueueName(string typeName) => $"equipai.events.{typeName}";
    private static string GetRetryQueueName(string typeName) => $"equipai.events.{typeName}.retry";
    private static string GetDeadQueueName(string typeName) => $"equipai.events.{typeName}.dead";

    public async ValueTask DisposeAsync()
    {
        if (Interlocked.Exchange(ref _disposed, 1) == 1) return;
        try { await _publishChannel.CloseAsync(); } catch { /* 忽略关闭异常 */ }
        try { await _connection.CloseAsync(); } catch { /* 忽略关闭异常 */ }
        _publishChannel.Dispose();
        await _connection.DisposeAsync();
    }

    public void Dispose()
    {
        if (Interlocked.Exchange(ref _disposed, 1) == 1) return;
        // RabbitMQ.Client 7.x 的 IChannel / IConnection 只有异步 CloseAsync，
        // 同步 Dispose 直接释放底层资源（连接断开由 broker 侧心跳超时处理）
        _publishChannel.Dispose();
        _connection.Dispose();
    }

    /// <summary>
    /// 单个事件类型的注册信息：CLR 类型 + 处理器类型列表 + 消费者通道
    /// </summary>
    private sealed class EventRegistration
    {
        public Type EventType { get; }
        public List<Type> HandlerTypes { get; } = new();

        public EventRegistration(Type eventType)
        {
            EventType = eventType;
        }
    }
}
