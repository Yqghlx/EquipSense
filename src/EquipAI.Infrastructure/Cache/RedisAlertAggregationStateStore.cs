using EquipAI.Core.Interfaces;
using StackExchange.Redis;

namespace EquipAI.Infrastructure.Cache;

/// <summary>
/// 基于 Redis 的告警聚合状态存储。
/// 使用 Lua 把递增计数与首次设置过期时间合并为一个原子操作，避免多实例并发时窗口 TTL 不一致。
/// </summary>
public sealed class RedisAlertAggregationStateStore : IAlertAggregationStateStore
{
    /// <summary>
    /// 仅第一次递增时设置 TTL，后续告警不会把 30 分钟窗口不断向后延长。
    /// </summary>
    private const string IncrementScript = """
        local count = redis.call('INCR', KEYS[1])
        if count == 1 then
          redis.call('PEXPIRE', KEYS[1], ARGV[1])
        end
        return count
        """;

    private readonly IDatabase _database;

    /// <summary>
    /// 使用共享 Redis 多路复用器创建状态存储。
    /// </summary>
    public RedisAlertAggregationStateStore(IConnectionMultiplexer multiplexer)
        : this(multiplexer.GetDatabase())
    {
    }

    /// <summary>
    /// 测试用构造函数，直接注入数据库接口，避免单元测试建立真实 Redis 连接。
    /// </summary>
    internal RedisAlertAggregationStateStore(IDatabase database)
    {
        _database = database;
    }

    /// <inheritdoc />
    public async Task<long> IncrementAsync(
        string key,
        TimeSpan window,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(key);
        if (window <= TimeSpan.Zero)
        {
            throw new ArgumentOutOfRangeException(nameof(window), window, "告警聚合窗口必须大于零");
        }

        cancellationToken.ThrowIfCancellationRequested();

        var milliseconds = Math.Max(1L, checked((long)window.TotalMilliseconds));
        var result = await _database.ScriptEvaluateAsync(
            IncrementScript,
            new RedisKey[] { key },
            new RedisValue[] { milliseconds });

        cancellationToken.ThrowIfCancellationRequested();
        return (long)result;
    }
}
