using System.Text.Json;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;

namespace EquipAI.Infrastructure.Messaging;

/// <summary>
/// 集成事件安全序列化器。
/// 只允许代码内置的事件类型进入 Outbox，避免从数据库类型名反射创建任意 CLR 类型。
/// </summary>
public static class IntegrationEventSerializer
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = null
    };

    private static readonly IReadOnlyDictionary<string, Type> EventTypes =
        new Dictionary<string, Type>(StringComparer.Ordinal)
        {
            [nameof(AlertAcknowledgedEvent)] = typeof(AlertAcknowledgedEvent),
            [nameof(AlertResolvedEvent)] = typeof(AlertResolvedEvent),
            [nameof(AlertTriggeredEvent)] = typeof(AlertTriggeredEvent),
            [nameof(AnalysisCompletedEvent)] = typeof(AnalysisCompletedEvent),
            [nameof(TelemetryReceivedEvent)] = typeof(TelemetryReceivedEvent),
            [nameof(WorkOrderCreatedEvent)] = typeof(WorkOrderCreatedEvent),
            [nameof(WorkOrderStatusChangedEvent)] = typeof(WorkOrderStatusChangedEvent),
        };

    /// <summary>
    /// 序列化一个已登记的集成事件。
    /// </summary>
    /// <param name="event">事件实例</param>
    /// <returns>稳定事件类型和 JSON 载荷</returns>
    public static SerializedIntegrationEvent Serialize(IIntegrationEvent @event)
    {
        ArgumentNullException.ThrowIfNull(@event);
        var runtimeType = @event.GetType();
        var eventType = EventTypes.FirstOrDefault(item => item.Value == runtimeType).Key;
        if (string.IsNullOrWhiteSpace(eventType))
        {
            throw new InvalidOperationException(
                $"集成事件类型未登记，拒绝写入 Outbox：{runtimeType.FullName}");
        }

        return new SerializedIntegrationEvent(
            eventType,
            JsonSerializer.Serialize(@event, runtimeType, JsonOptions));
    }

    /// <summary>
    /// 从 Outbox 载荷恢复一个已登记的集成事件。
    /// </summary>
    /// <param name="eventType">稳定事件类型</param>
    /// <param name="payload">JSON 载荷</param>
    /// <returns>事件实例</returns>
    public static IIntegrationEvent Deserialize(string eventType, string payload)
    {
        if (!EventTypes.TryGetValue(eventType, out var clrType))
        {
            throw new InvalidOperationException($"未知集成事件类型，拒绝反序列化：{eventType}");
        }

        try
        {
            return (JsonSerializer.Deserialize(payload, clrType, JsonOptions) as IIntegrationEvent)
                ?? throw new InvalidOperationException($"事件载荷反序列化结果为空：{eventType}");
        }
        catch (JsonException exception)
        {
            throw new InvalidOperationException($"事件载荷格式无效：{eventType}", exception);
        }
    }

    /// <summary>
    /// 返回事件类型白名单，供启动检查和测试使用。
    /// </summary>
    public static IReadOnlyCollection<string> KnownEventTypes => EventTypes.Keys.ToArray();
}

/// <summary>
/// 已序列化的集成事件。
/// </summary>
/// <param name="EventType">稳定事件类型</param>
/// <param name="Payload">JSON 载荷</param>
public sealed record SerializedIntegrationEvent(string EventType, string Payload);
