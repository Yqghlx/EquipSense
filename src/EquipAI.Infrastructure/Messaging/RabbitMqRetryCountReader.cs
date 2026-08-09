using System.Collections;
using System.Globalization;
using System.Text;

namespace EquipAI.Infrastructure.Messaging;

/// <summary>
/// 解析 RabbitMQ 压缩后的 x-death 头，精确读取指定队列的拒绝次数。
/// </summary>
internal static class RabbitMqRetryCountReader
{
    /// <summary>
    /// 获取指定主队列因 rejected 产生的累计死信次数。
    /// </summary>
    /// <param name="headers">消息头。</param>
    /// <param name="queueName">主队列名称。</param>
    /// <returns>累计拒绝次数；头非法或不存在时返回零。</returns>
    internal static int GetRejectedCount(
        IDictionary<string, object?>? headers,
        string queueName)
    {
        if (headers is null
            || string.IsNullOrWhiteSpace(queueName)
            || !headers.TryGetValue("x-death", out var rawDeaths)
            || rawDeaths is not IEnumerable deaths)
        {
            return 0;
        }

        foreach (var rawDeath in deaths)
        {
            if (rawDeath is not IDictionary<string, object?> death) continue;
            if (!string.Equals(DecodeText(GetValue(death, "queue")), queueName, StringComparison.Ordinal))
                continue;
            if (!string.Equals(DecodeText(GetValue(death, "reason")), "rejected", StringComparison.Ordinal))
                continue;

            return ToBoundedInt(GetValue(death, "count"));
        }

        return 0;
    }

    private static object? GetValue(IDictionary<string, object?> values, string key) =>
        values.TryGetValue(key, out var value) ? value : null;

    private static string? DecodeText(object? value) => value switch
    {
        byte[] bytes => Encoding.UTF8.GetString(bytes),
        ReadOnlyMemory<byte> memory => Encoding.UTF8.GetString(memory.Span),
        string text => text,
        _ => null,
    };

    private static int ToBoundedInt(object? value)
    {
        try
        {
            var count = value switch
            {
                byte number => number,
                sbyte number when number >= 0 => number,
                short number when number >= 0 => number,
                ushort number => number,
                int number when number >= 0 => number,
                uint number => number,
                long number when number >= 0 => number,
                ulong number => number > long.MaxValue ? long.MaxValue : (long)number,
                _ => -1L,
            };
            if (count < 0) return 0;
            return count >= int.MaxValue ? int.MaxValue : Convert.ToInt32(count, CultureInfo.InvariantCulture);
        }
        catch (OverflowException)
        {
            return int.MaxValue;
        }
    }
}
