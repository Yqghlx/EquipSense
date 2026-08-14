using System.Text.Json;

namespace EquipAI.Tests.Integration.Eventing;

/// <summary>
/// 从 RabbitMQ management API 的连接列表中选择指定测试连接。
/// </summary>
internal static class RabbitMqManagementConnectionSelector
{
    /// <summary>
    /// 只返回连接名和 vhost 均精确匹配的连接。
    /// </summary>
    /// <param name="connections">management API 返回的连接数组。</param>
    /// <param name="expectedConnectionName">事件总线创建连接时使用的连接名。</param>
    /// <param name="expectedVirtualHost">当前测试使用的隔离 vhost。</param>
    /// <returns>匹配连接的 broker connection name；无法证明归属时返回 null。</returns>
    internal static string? FindConnectionName(
        JsonElement connections,
        string expectedConnectionName,
        string expectedVirtualHost)
    {
        if (connections.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        foreach (var connection in connections.EnumerateArray())
        {
            if (!connection.TryGetProperty("vhost", out var vhost)
                || vhost.ValueKind != JsonValueKind.String
                || !string.Equals(vhost.GetString(), expectedVirtualHost, StringComparison.Ordinal))
            {
                continue;
            }

            if (!connection.TryGetProperty("client_properties", out var properties)
                || properties.ValueKind != JsonValueKind.Object
                || !properties.TryGetProperty("connection_name", out var connectionName)
                || connectionName.ValueKind != JsonValueKind.String
                || !string.Equals(connectionName.GetString(), expectedConnectionName, StringComparison.Ordinal))
            {
                continue;
            }

            if (connection.TryGetProperty("name", out var name)
                && name.ValueKind == JsonValueKind.String
                && !string.IsNullOrWhiteSpace(name.GetString()))
            {
                return name.GetString();
            }
        }

        return null;
    }
}
