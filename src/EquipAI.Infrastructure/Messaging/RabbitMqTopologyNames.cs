using System.Security.Cryptography;
using System.Text;

namespace EquipAI.Infrastructure.Messaging;

/// <summary>
/// 为 RabbitMQ v2 拓扑生成稳定、可读且不会因程序集版本变化而漂移的名称。
/// </summary>
internal static class RabbitMqTopologyNames
{
    private const string Prefix = "equipai.v2";
    private const int ReadableNameLength = 40;
    private const int HashLength = 12;

    /// <summary>
    /// 获取事件广播交换机名称。
    /// </summary>
    internal static string GetExchangeName(Type eventType) =>
        $"{Prefix}.events.{BuildTypeKey(eventType)}";

    /// <summary>
    /// 获取指定事件和处理器的独立主队列名称。
    /// </summary>
    internal static string GetMainQueueName(Type eventType, Type handlerType) =>
        $"{Prefix}.{BuildTypeKey(eventType)}.{BuildTypeKey(handlerType)}";

    /// <summary>
    /// 获取指定事件和处理器的独立重试队列名称。
    /// </summary>
    internal static string GetRetryQueueName(Type eventType, Type handlerType) =>
        $"{GetMainQueueName(eventType, handlerType)}.retry";

    /// <summary>
    /// 获取指定事件和处理器的独立死信队列名称。
    /// </summary>
    internal static string GetDeadQueueName(Type eventType, Type handlerType) =>
        $"{GetMainQueueName(eventType, handlerType)}.dead";

    private static string BuildTypeKey(Type type)
    {
        ArgumentNullException.ThrowIfNull(type);
        var readableCharacters = type.Name
            .Where(character => character is >= 'a' and <= 'z'
                or >= 'A' and <= 'Z'
                or >= '0' and <= '9')
            .Take(ReadableNameLength)
            .ToArray();
        var readable = readableCharacters.Length == 0
            ? "type"
            : new string(readableCharacters).ToLowerInvariant();
        var identity = type.FullName ?? type.Name;
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(identity)))
            .ToLowerInvariant()[..HashLength];
        return $"{readable}.{hash}";
    }
}
