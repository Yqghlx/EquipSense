using System.Collections.Concurrent;
using System.Reflection;
using System.Text;
using System.Text.Json;
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using EquipAI.Infrastructure.Metrics;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace EquipAI.Infrastructure.Messaging;

/// <summary>
/// 基于 RabbitMQ 的持久化事件总线。
/// </summary>
/// <remarks>
/// 订阅阶段只登记元数据，托管服务启动时才统一连接并声明拓扑，确保所有处理器在消费开始前
/// 已完成注册。每个事件—处理器组合拥有独立主队列、重试队列和死信队列，避免一个处理器
/// 失败导致其他处理器重复执行。
/// </remarks>
public sealed class RabbitMqEventBus :
    IEventBusTransport,
    IHostedService,
    IRabbitMqConnectionState,
    IAsyncDisposable,
    IDisposable
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<RabbitMqEventBus> _logger;
    private readonly RabbitMqOptions _options;
    private readonly JsonSerializerOptions _jsonOptions;
    private readonly ConcurrentDictionary<SubscriptionKey, SubscriptionRegistration> _subscriptions = new();
    private readonly List<IChannel> _consumerChannels = [];
    private readonly object _consumerChannelsLock = new();
    private readonly SemaphoreSlim _publishLock = new(1, 1);
    private readonly CancellationTokenSource _lifetimeCancellation = new();
    private IConnection? _connection;
    private IChannel? _publishChannel;
    private int _lifecycleState;
    private int _ready;
    private int _disposed;

    /// <summary>
    /// 初始化事件总线；此阶段不会连接 RabbitMQ。
    /// </summary>
    public RabbitMqEventBus(
        IServiceProvider serviceProvider,
        ILogger<RabbitMqEventBus> logger,
        IOptions<RabbitMqOptions> options)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _options = options.Value;
        _jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = null };
    }

    /// <inheritdoc />
    public bool IsReady => Volatile.Read(ref _ready) == 1 && BrokerResourcesAreOpen();

    /// <inheritdoc />
    public string StatusDescription => IsReady
        ? "RabbitMQ 连接、发布通道和事件消费者已就绪"
        : "RabbitMQ 事件总线尚未就绪或连接已中断";

    /// <inheritdoc />
    public void Subscribe<TEvent, THandler>()
        where TEvent : IIntegrationEvent
        where THandler : IEventHandler<TEvent>
    {
        ThrowIfDisposed();
        if (Volatile.Read(ref _lifecycleState) != 0)
        {
            throw new InvalidOperationException("RabbitMQ 事件总线启动后禁止新增订阅");
        }

        var key = new SubscriptionKey(typeof(TEvent), typeof(THandler));
        if (_subscriptions.TryAdd(key, new SubscriptionRegistration(key.EventType, key.HandlerType)))
        {
            _logger.LogInformation(
                "已登记 RabbitMQ v2 事件订阅：{EventType} -> {HandlerType}",
                key.EventType.Name,
                key.HandlerType.Name);
        }
    }

    /// <inheritdoc />
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        ThrowIfDisposed();
        if (Interlocked.CompareExchange(ref _lifecycleState, 1, 0) != 0) return;

        try
        {
            var factory = CreateConnectionFactory();
            _connection = await factory.CreateConnectionAsync("EquipSense.EventBus", cancellationToken);
            RegisterConnectionStateEvents(_connection);
            _publishChannel = await _connection.CreateChannelAsync(
                new CreateChannelOptions(
                    publisherConfirmationsEnabled: true,
                    publisherConfirmationTrackingEnabled: true),
                cancellationToken);

            foreach (var registration in _subscriptions.Values
                         .OrderBy(item => item.EventType.FullName, StringComparer.Ordinal)
                         .ThenBy(item => item.HandlerType.FullName, StringComparer.Ordinal))
            {
                await DeclareTopologyAndConsumeAsync(registration, cancellationToken);
            }

            Volatile.Write(ref _ready, 1);
            _logger.LogInformation(
                "RabbitMQ 事件总线已就绪：{Host}:{Port}，拓扑 v2，订阅数 {SubscriptionCount}",
                _options.Host,
                _options.Port,
                _subscriptions.Count);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            Volatile.Write(ref _ready, 0);
            Interlocked.Exchange(ref _lifecycleState, 0);
            await DisposeBrokerResourcesAsync();
            // 宿主在启动阶段主动取消属于正常生命周期，不应污染故障告警或触发错误页。
            _logger.LogInformation("RabbitMQ 事件总线启动已被宿主取消");
            throw;
        }
        catch (Exception exception)
        {
            Volatile.Write(ref _ready, 0);
            Interlocked.Exchange(ref _lifecycleState, 0);
            await DisposeBrokerResourcesAsync();
            _logger.LogCritical(
                exception,
                "RabbitMQ 事件总线启动失败：{Host}:{Port}",
                _options.Host,
                _options.Port);
            throw;
        }
    }

    /// <inheritdoc />
    public async Task StopAsync(CancellationToken cancellationToken)
    {
        if (Interlocked.Exchange(ref _lifecycleState, 2) == 2) return;
        Volatile.Write(ref _ready, 0);
        _lifetimeCancellation.Cancel();
        await DisposeBrokerResourcesAsync(cancellationToken);
        _logger.LogInformation("RabbitMQ 事件总线已停止");
    }

    /// <inheritdoc />
    public Task PublishAsync<TEvent>(
        TEvent @event,
        CancellationToken cancellationToken = default)
        where TEvent : IIntegrationEvent =>
        PublishRuntimeAsync(@event, typeof(TEvent), cancellationToken);

    /// <inheritdoc />
    public Task PublishAsync(
        IIntegrationEvent @event,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(@event);
        return PublishRuntimeAsync(@event, @event.GetType(), cancellationToken);
    }

    private async Task PublishRuntimeAsync(
        IIntegrationEvent @event,
        Type eventType,
        CancellationToken cancellationToken)
    {
        ThrowIfDisposed();
        if (!IsReady)
        {
            throw new InvalidOperationException("RabbitMQ 事件总线尚未就绪，无法发布事件");
        }

        if (!_subscriptions.Keys.Any(key => key.EventType == eventType))
        {
            throw new InvalidOperationException(
                $"事件 {eventType.FullName} 没有订阅处理器，拒绝未路由发布");
        }

        var body = JsonSerializer.SerializeToUtf8Bytes(@event, eventType, _jsonOptions);
        var properties = new BasicProperties
        {
            DeliveryMode = DeliveryModes.Persistent,
            ContentType = "application/json",
            MessageId = @event.EventId.ToString(),
            Timestamp = new AmqpTimestamp(new DateTimeOffset(@event.OccurredAt).ToUnixTimeSeconds()),
        };

        await PublishCoreAsync(
            RabbitMqTopologyNames.GetExchangeName(eventType),
            string.Empty,
            properties,
            body,
            cancellationToken);
        _logger.LogDebug(
            "事件 {EventType} 已由 RabbitMQ 确认发布，EventId={EventId}",
            eventType.Name,
            @event.EventId);
    }

    /// <summary>
    /// 判断当前处理失败是否已经达到总尝试次数上限。
    /// </summary>
    internal static bool ShouldDeadLetter(int previousRejectedCount, int maxRetryCount) =>
        (long)previousRejectedCount + 1 >= maxRetryCount;

    /// <summary>
    /// 判断处理取消是否由应用正常停机触发；此时应让关闭通道交由 broker 重投未确认消息。
    /// </summary>
    internal static bool ShouldLeaveUnackedForShutdown(
        Exception exception,
        bool lifetimeCancellationRequested) =>
        lifetimeCancellationRequested && exception is OperationCanceledException;

    /// <summary>
    /// 判断是否应把 Inbox 处理记录为失败。正常停机取消会让 broker 重投未确认消息，
    /// 不应污染失败指标，也不应在数据库中留下误导性的业务失败状态。
    /// </summary>
    internal static bool ShouldRecordInboxFailure(
        Exception exception,
        bool lifetimeCancellationRequested) =>
        !ShouldLeaveUnackedForShutdown(Unwrap(exception), lifetimeCancellationRequested);

    /// <summary>
    /// 判断连接关闭是否属于应用正常停机。正常停机不应产生错误级别的连接告警。
    /// </summary>
    internal static bool ShouldLogConnectionShutdownAsError(bool stopping) => !stopping;

    private ConnectionFactory CreateConnectionFactory() => new()
    {
        HostName = _options.Host,
        Port = _options.Port,
        VirtualHost = _options.VirtualHost,
        UserName = _options.Username,
        Password = _options.Password,
        RequestedHeartbeat = TimeSpan.FromSeconds(_options.HeartbeatSeconds),
        RequestedConnectionTimeout = TimeSpan.FromSeconds(_options.ConnectionTimeoutSeconds),
        AutomaticRecoveryEnabled = _options.AutomaticRecoveryEnabled,
        TopologyRecoveryEnabled = _options.AutomaticRecoveryEnabled,
        NetworkRecoveryInterval = TimeSpan.FromSeconds(5),
    };

    private void RegisterConnectionStateEvents(IConnection connection)
    {
        connection.ConnectionShutdownAsync += (_, eventArgs) =>
        {
            Volatile.Write(ref _ready, 0);
            if (ShouldLogConnectionShutdownAsError(Volatile.Read(ref _lifecycleState) == 2))
            {
                _logger.LogError(
                    "RabbitMQ 连接已关闭：{ReplyCode} {ReplyText}",
                    eventArgs.ReplyCode,
                    eventArgs.ReplyText);
            }
            else
            {
                _logger.LogInformation(
                    "RabbitMQ 连接已关闭：{ReplyCode} {ReplyText}",
                    eventArgs.ReplyCode,
                    eventArgs.ReplyText);
            }
            return Task.CompletedTask;
        };
        connection.ConnectionRecoveryErrorAsync += (_, eventArgs) =>
        {
            Volatile.Write(ref _ready, 0);
            _logger.LogError(eventArgs.Exception, "RabbitMQ 自动恢复失败");
            return Task.CompletedTask;
        };
        connection.RecoverySucceededAsync += (_, _) =>
        {
            var recovered = BrokerResourcesAreOpen();
            Volatile.Write(ref _ready, recovered ? 1 : 0);
            if (recovered)
            {
                _logger.LogInformation("RabbitMQ 连接和 v2 消费拓扑已自动恢复");
            }
            else
            {
                _logger.LogError("RabbitMQ 连接恢复完成，但发布通道或消费者通道仍未全部就绪");
            }
            return Task.CompletedTask;
        };
    }

    private async Task DeclareTopologyAndConsumeAsync(
        SubscriptionRegistration registration,
        CancellationToken cancellationToken)
    {
        var connection = _connection
            ?? throw new InvalidOperationException("RabbitMQ 连接尚未建立");
        var exchange = RabbitMqTopologyNames.GetExchangeName(registration.EventType);
        var mainQueue = RabbitMqTopologyNames.GetMainQueueName(
            registration.EventType,
            registration.HandlerType);
        var retryQueue = RabbitMqTopologyNames.GetRetryQueueName(
            registration.EventType,
            registration.HandlerType);
        var deadQueue = RabbitMqTopologyNames.GetDeadQueueName(
            registration.EventType,
            registration.HandlerType);

        await using (var declarationChannel = await connection.CreateChannelAsync(cancellationToken: cancellationToken))
        {
            await declarationChannel.ExchangeDeclareAsync(
                exchange,
                ExchangeType.Fanout,
                durable: true,
                autoDelete: false,
                cancellationToken: cancellationToken);

            await declarationChannel.QueueDeclareAsync(
                deadQueue,
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: QuorumArguments(),
                cancellationToken: cancellationToken);
            await declarationChannel.QueueDeclareAsync(
                retryQueue,
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: new Dictionary<string, object?>
                {
                    ["x-queue-type"] = "quorum",
                    ["x-message-ttl"] = checked(_options.RetryIntervalSeconds * 1000),
                    ["x-dead-letter-exchange"] = string.Empty,
                    ["x-dead-letter-routing-key"] = mainQueue,
                },
                cancellationToken: cancellationToken);
            await declarationChannel.QueueDeclareAsync(
                mainQueue,
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: new Dictionary<string, object?>
                {
                    ["x-queue-type"] = "quorum",
                    ["x-dead-letter-exchange"] = string.Empty,
                    ["x-dead-letter-routing-key"] = retryQueue,
                },
                cancellationToken: cancellationToken);
            await declarationChannel.QueueBindAsync(
                mainQueue,
                exchange,
                string.Empty,
                cancellationToken: cancellationToken);
        }

        var consumerChannel = await connection.CreateChannelAsync(cancellationToken: cancellationToken);
        await consumerChannel.BasicQosAsync(
            prefetchSize: 0,
            prefetchCount: _options.PrefetchCount,
            global: false,
            cancellationToken);
        var consumer = new AsyncEventingBasicConsumer(consumerChannel);
        consumer.ReceivedAsync += (_, eventArgs) =>
            HandleMessageAsync(registration, eventArgs, consumerChannel);
        consumer.ShutdownAsync += (_, eventArgs) =>
        {
            MarkConsumerUnavailable(registration, eventArgs.ReplyText);
            return Task.CompletedTask;
        };
        consumer.UnregisteredAsync += (_, _) =>
        {
            MarkConsumerUnavailable(registration, "消费者已取消注册");
            return Task.CompletedTask;
        };
        consumerChannel.ChannelShutdownAsync += (_, eventArgs) =>
        {
            MarkConsumerUnavailable(registration, eventArgs.ReplyText);
            return Task.CompletedTask;
        };
        await consumerChannel.BasicConsumeAsync(
            mainQueue,
            autoAck: false,
            consumer,
            cancellationToken);
        lock (_consumerChannelsLock)
        {
            _consumerChannels.Add(consumerChannel);
        }
    }

    private async Task HandleMessageAsync(
        SubscriptionRegistration registration,
        BasicDeliverEventArgs eventArgs,
        IChannel consumeChannel)
    {
        var mainQueue = RabbitMqTopologyNames.GetMainQueueName(
            registration.EventType,
            registration.HandlerType);
        using var timeout = new CancellationTokenSource(
            TimeSpan.FromSeconds(_options.HandlerTimeoutSeconds));
        using var linkedCancellation = CancellationTokenSource.CreateLinkedTokenSource(
            timeout.Token,
            _lifetimeCancellation.Token);

        try
        {
            var integrationEvent = JsonSerializer.Deserialize(
                    eventArgs.Body.Span,
                    registration.EventType,
                    _jsonOptions)
                ?? throw new InvalidOperationException("事件反序列化返回 null");
            var handled = await InvokeHandlerAsync(registration, integrationEvent, linkedCancellation.Token);
            await consumeChannel.BasicAckAsync(
                eventArgs.DeliveryTag,
                multiple: false,
                CancellationToken.None);
            _logger.LogDebug(
                handled
                    ? "事件 {EventType} 已由处理器 {HandlerType} 成功处理，EventId={EventId}"
                    : "事件 {EventType} 已由处理器 {HandlerType} 幂等跳过，EventId={EventId}",
                registration.EventType.Name,
                registration.HandlerType.Name,
                ((IIntegrationEvent)integrationEvent).EventId);
            if (handled)
            {
                BusinessMetrics.InboxProcessed
                    .WithLabels(registration.HandlerType.FullName ?? registration.HandlerType.Name)
                    .Inc();
            }
            else
            {
                BusinessMetrics.InboxDuplicates
                    .WithLabels(registration.HandlerType.FullName ?? registration.HandlerType.Name)
                    .Inc();
            }
        }
        catch (Exception exception)
        {
            var rootException = Unwrap(exception);
            if (!ShouldRecordInboxFailure(rootException, _lifetimeCancellation.IsCancellationRequested))
            {
                // 不 ack/nack：StopAsync 随后关闭通道，broker 会把未确认消息原样重投，
                // 不增加 x-death 计数，也不会把正常部署停机误判为业务失败。
                _logger.LogInformation(
                    "应用停止期间取消事件 {EventType} 的处理器 {HandlerType}，未确认消息交由 RabbitMQ 重投",
                    registration.EventType.Name,
                    registration.HandlerType.Name);
                return;
            }
            BusinessMetrics.InboxFailures
                .WithLabels(registration.HandlerType.FullName ?? registration.HandlerType.Name)
                .Inc();
            var rejectedCount = RabbitMqRetryCountReader.GetRejectedCount(
                eventArgs.BasicProperties.Headers,
                mainQueue);
            var attempt = rejectedCount + 1;
            if (ShouldDeadLetter(rejectedCount, _options.MaxRetryCount))
            {
                var movedToDeadLetter = await MoveToDeadLetterAsync(
                    registration,
                    eventArgs,
                    rootException,
                    consumeChannel);
                if (movedToDeadLetter)
                {
                    _logger.LogWarning(
                        rootException,
                        "事件 {EventType} 的处理器 {HandlerType} 在第 {Attempt} 次失败后已进入独立死信队列",
                        registration.EventType.Name,
                        registration.HandlerType.Name,
                        attempt);
                }
                return;
            }

            _logger.LogError(
                rootException,
                "事件 {EventType} 的处理器 {HandlerType} 第 {Attempt} 次处理失败，将进入独立重试队列",
                registration.EventType.Name,
                registration.HandlerType.Name,
                attempt);
            await consumeChannel.BasicNackAsync(
                eventArgs.DeliveryTag,
                multiple: false,
                requeue: false,
                CancellationToken.None);
        }
    }

    private async Task<bool> InvokeHandlerAsync(
        SubscriptionRegistration registration,
        object integrationEvent,
        CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var typedEvent = (IIntegrationEvent)integrationEvent;
        var handlerKey = registration.HandlerType.FullName ?? registration.HandlerType.Name;
        var inboxStore = scope.ServiceProvider.GetService<InboxMessageStore>();
        InboxClaim? inboxClaim = null;
        if (inboxStore is not null)
        {
            inboxClaim = await inboxStore.TryClaimAsync(
                typedEvent,
                handlerKey,
                DateTime.UtcNow,
                TimeSpan.FromSeconds(Math.Max(1, _options.HandlerTimeoutSeconds) * 2),
                cancellationToken);
            if (inboxClaim.Status == InboxClaimStatus.AlreadyProcessed)
            {
                return false;
            }

            if (inboxClaim.Status == InboxClaimStatus.Locked)
            {
                throw new InvalidOperationException(
                    $"Inbox 消费租约仍由其他实例持有：{typedEvent.EventId}/{handlerKey}");
            }
        }

        var handler = scope.ServiceProvider.GetRequiredService(registration.HandlerType);
        var method = registration.HandlerType.GetMethod(
            "HandleAsync",
            [registration.EventType, typeof(CancellationToken)])
            ?? throw new InvalidOperationException(
                $"处理器缺少 HandleAsync：{registration.HandlerType.FullName}");
        try
        {
            var task = method.Invoke(handler, [integrationEvent, cancellationToken]) as Task
                ?? throw new InvalidOperationException("事件处理器返回了 null Task");
            await task.WaitAsync(cancellationToken);

            if (inboxStore is not null && inboxClaim is not null)
            {
                var marked = await inboxStore.MarkProcessedAsync(
                    typedEvent.EventId,
                    handlerKey,
                    inboxClaim.LockToken,
                    DateTime.UtcNow,
                    CancellationToken.None);
                if (!marked)
                {
                    throw new InvalidOperationException(
                        $"Inbox 处理租约已失效，拒绝确认事件：{typedEvent.EventId}/{handlerKey}");
                }
            }

            return true;
        }
        catch (Exception exception)
        {
            var rootException = Unwrap(exception);
            if (inboxStore is not null
                && inboxClaim is { Status: InboxClaimStatus.Claimed }
                && ShouldRecordInboxFailure(rootException, _lifetimeCancellation.IsCancellationRequested))
            {
                try
                {
                    await inboxStore.MarkFailedAsync(
                        typedEvent.EventId,
                        handlerKey,
                        inboxClaim.LockToken,
                        rootException.Message,
                        CancellationToken.None);
                }
                catch (Exception markFailedException)
                {
                    _logger.LogError(
                        markFailedException,
                        "Inbox 失败状态写入异常，将依赖租约过期恢复：EventId={EventId}, Handler={HandlerKey}",
                        typedEvent.EventId,
                        handlerKey);
                }
            }

            throw;
        }
    }

    private async Task<bool> MoveToDeadLetterAsync(
        SubscriptionRegistration registration,
        BasicDeliverEventArgs eventArgs,
        Exception exception,
        IChannel consumeChannel)
    {
        var deadQueue = RabbitMqTopologyNames.GetDeadQueueName(
            registration.EventType,
            registration.HandlerType);
        var message = exception.Message.Length <= 512
            ? exception.Message
            : exception.Message[..512];
        var properties = new BasicProperties
        {
            DeliveryMode = DeliveryModes.Persistent,
            ContentType = eventArgs.BasicProperties.ContentType ?? "application/json",
            MessageId = eventArgs.BasicProperties.MessageId,
            Timestamp = eventArgs.BasicProperties.Timestamp,
            Headers = new Dictionary<string, object?>
            {
                ["x-dead-exception-type"] = Encoding.UTF8.GetBytes(exception.GetType().FullName ?? exception.GetType().Name),
                ["x-dead-reason"] = Encoding.UTF8.GetBytes(message),
                ["x-dead-event-type"] = Encoding.UTF8.GetBytes(registration.EventType.FullName ?? registration.EventType.Name),
                ["x-dead-handler-type"] = Encoding.UTF8.GetBytes(registration.HandlerType.FullName ?? registration.HandlerType.Name),
            },
        };

        try
        {
            await PublishCoreAsync(
                string.Empty,
                deadQueue,
                properties,
                eventArgs.Body,
                CancellationToken.None);
            await consumeChannel.BasicAckAsync(
                eventArgs.DeliveryTag,
                multiple: false,
                CancellationToken.None);
            return true;
        }
        catch (Exception deadLetterException)
        {
            // 死信尚未获得 broker 确认时绝不能确认原消息。再次 nack 到独立重试队列，
            // 让后续投递重新尝试写死信，同时避免关闭单个消费者后 readiness 仍被误判为健康。
            _logger.LogCritical(
                deadLetterException,
                "事件 {EventType} 的处理器 {HandlerType} 写入死信队列失败，将在重试间隔后再次尝试",
                registration.EventType.Name,
                registration.HandlerType.Name);
            try
            {
                await consumeChannel.BasicNackAsync(
                    eventArgs.DeliveryTag,
                    multiple: false,
                    requeue: false,
                    CancellationToken.None);
            }
            catch (Exception nackException)
            {
                _logger.LogError(nackException, "死信写入失败后拒绝原消息时发生异常，等待连接恢复重新投递");
            }
            return false;
        }
    }

    private async Task PublishCoreAsync(
        string exchange,
        string routingKey,
        BasicProperties properties,
        ReadOnlyMemory<byte> body,
        CancellationToken cancellationToken)
    {
        await _publishLock.WaitAsync(cancellationToken);
        try
        {
            var channel = _publishChannel;
            if (!IsReady || channel is null || !channel.IsOpen)
            {
                throw new InvalidOperationException("RabbitMQ 事件总线尚未就绪，无法确认发布");
            }

            await channel.BasicPublishAsync(
                exchange,
                routingKey,
                mandatory: true,
                properties,
                body,
                cancellationToken);
        }
        finally
        {
            _publishLock.Release();
        }
    }

    private static Dictionary<string, object?> QuorumArguments() => new()
    {
        ["x-queue-type"] = "quorum",
    };

    private static Exception Unwrap(Exception exception) =>
        exception is TargetInvocationException { InnerException: not null } invocationException
            ? invocationException.InnerException!
            : exception;

    private bool BrokerResourcesAreOpen()
    {
        IChannel[] consumerChannels;
        lock (_consumerChannelsLock)
        {
            if (_consumerChannels.Count != _subscriptions.Count) return false;
            consumerChannels = [.. _consumerChannels];
        }

        return _connection?.IsOpen == true
            && _publishChannel?.IsOpen == true
            && consumerChannels.All(channel => channel.IsOpen);
    }

    private void MarkConsumerUnavailable(
        SubscriptionRegistration registration,
        string reason)
    {
        Volatile.Write(ref _ready, 0);
        if (Volatile.Read(ref _lifecycleState) == 2) return;
        _logger.LogError(
            "RabbitMQ 消费者不可用：{EventType} -> {HandlerType}，原因：{Reason}",
            registration.EventType.Name,
            registration.HandlerType.Name,
            reason);
    }

    private async Task DisposeBrokerResourcesAsync(CancellationToken cancellationToken = default)
    {
        IChannel[] consumerChannels;
        lock (_consumerChannelsLock)
        {
            consumerChannels = [.. _consumerChannels];
            _consumerChannels.Clear();
        }
        foreach (var channel in consumerChannels)
        {
            try
            {
                if (channel.IsOpen) await channel.CloseAsync(cancellationToken);
            }
            catch (Exception exception)
            {
                _logger.LogWarning(exception, "关闭 RabbitMQ 消费通道时发生异常");
            }
            await channel.DisposeAsync();
        }
        if (_publishChannel is not null)
        {
            try
            {
                if (_publishChannel.IsOpen) await _publishChannel.CloseAsync(cancellationToken);
            }
            catch (Exception exception)
            {
                _logger.LogWarning(exception, "关闭 RabbitMQ 发布通道时发生异常");
            }
            await _publishChannel.DisposeAsync();
            _publishChannel = null;
        }

        if (_connection is not null)
        {
            try
            {
                if (_connection.IsOpen) await _connection.CloseAsync(cancellationToken);
            }
            catch (Exception exception)
            {
                _logger.LogWarning(exception, "关闭 RabbitMQ 连接时发生异常");
            }
            await _connection.DisposeAsync();
            _connection = null;
        }
    }

    private void ThrowIfDisposed()
    {
        ObjectDisposedException.ThrowIf(Volatile.Read(ref _disposed) == 1, this);
    }

    /// <inheritdoc />
    public async ValueTask DisposeAsync()
    {
        if (Interlocked.Exchange(ref _disposed, 1) == 1) return;
        await StopAsync(CancellationToken.None);
        _lifetimeCancellation.Dispose();
        _publishLock.Dispose();
    }

    /// <inheritdoc />
    public void Dispose()
    {
        if (Interlocked.Exchange(ref _disposed, 1) == 1) return;
        Volatile.Write(ref _ready, 0);
        Interlocked.Exchange(ref _lifecycleState, 2);
        _lifetimeCancellation.Cancel();
        IChannel[] consumerChannels;
        lock (_consumerChannelsLock)
        {
            consumerChannels = [.. _consumerChannels];
            _consumerChannels.Clear();
        }
        foreach (var channel in consumerChannels) channel.Dispose();
        _publishChannel?.Dispose();
        _connection?.Dispose();
        _lifetimeCancellation.Dispose();
        _publishLock.Dispose();
    }

    private sealed record SubscriptionKey(Type EventType, Type HandlerType);
    private sealed record SubscriptionRegistration(Type EventType, Type HandlerType);
}
