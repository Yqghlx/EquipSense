using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace EquipAI.Infrastructure.Cache;

/// <summary>
/// 基于 Redis 的分布式锁实现，使用 SET key token NX PX 原子加锁 + Lua 脚本原子解锁（token 匹配才删）。
///
/// 设计要点：
/// 1. 加锁：SET NX PX 原子操作，value 为随机 token（Guid），用于解锁时识别持有者，避免误删他人持有的锁。
/// 2. 解锁：Lua 脚本比较 value 等于 token 后 DEL，保证"检查+删除"原子，防止 TTL 到期后被他人抢占的锁被误删。
/// 3. 等待：未获取到时按短间隔轮询，直到 waitTime 耗尽或获取成功。
/// 4. TTL：必须大于单次任务最长执行时间；若任务超时，锁自动释放允许其他实例接管（宁可重复执行也不死锁）。
///
/// 单实例/单 Redis 节点足够；无需 RedLock（多节点多数派），后者仅在多 Redis 集群容灾时才需要。
/// </summary>
public class RedisDistributedLockProvider : IDistributedLockProvider
{
    private readonly IDatabase _database;
    private readonly ILogger<RedisDistributedLockProvider> _logger;

    /// <summary>获取锁失败时的轮询间隔。</summary>
    private static readonly TimeSpan RetryInterval = TimeSpan.FromMilliseconds(200);

    /// <summary>
    /// 原子解锁 Lua 脚本：仅当 value 等于持有者 token 时才 DEL。
    /// 返回 1 表示成功释放，0 表示锁已不属于本持有者（已被 TTL 自动释放并被他人抢占，或已手动释放）。
    /// </summary>
    private const string ReleaseScript = @"
if redis.call('get', KEYS[1]) == ARGV[1] then
    return redis.call('del', KEYS[1])
else
    return 0
end";

    public RedisDistributedLockProvider(IConnectionMultiplexer multiplexer, ILogger<RedisDistributedLockProvider> logger)
        : this(multiplexer.GetDatabase(), logger)
    {
    }

    /// <summary>
    /// 测试/高级注入用构造函数：直接接收 IDatabase，绕过 ConnectionMultiplexer（便于单元测试 mock）。
    /// </summary>
    internal RedisDistributedLockProvider(IDatabase database, ILogger<RedisDistributedLockProvider> logger)
    {
        _database = database;
        _logger = logger;
    }

    public async Task<IDistributedLockHandle> AcquireAsync(
        string resource, TimeSpan expiry, TimeSpan waitTime, CancellationToken ct = default)
    {
        var token = Guid.NewGuid().ToString("N");
        var key = $"lock:{resource}";
        var deadline = DateTimeOffset.UtcNow + waitTime;

        while (!ct.IsCancellationRequested)
        {
            // SET key token NX PX ttl —— 原子加锁
            var acquired = await _database.StringSetAsync(key, token, expiry, When.NotExists);
            if (acquired)
            {
                return new RedisDistributedLockHandle(_database, key, token, _logger);
            }

            // 未获取到，判断是否仍在等待窗口内
            var remaining = deadline - DateTimeOffset.UtcNow;
            if (remaining <= TimeSpan.Zero)
            {
                // 等待超时：返回未获取的句柄，调用方据此跳过本次执行（其他实例正在处理）
                return new RedisDistributedLockHandle(_database, key, token, _logger, acquired: false);
            }

            // 短休眠后重试（取 remaining 与 RetryInterval 的较小值，避免超时后多等一轮）
            await Task.Delay(RetryInterval < remaining ? RetryInterval : remaining, ct);
        }

        ct.ThrowIfCancellationRequested();
        return new RedisDistributedLockHandle(_database, key, token, _logger, acquired: false);
    }

    /// <summary>
    /// Redis 锁句柄。释放时执行 Lua 脚本，仅当 token 匹配才删除。
    /// </summary>
    private sealed class RedisDistributedLockHandle : IDistributedLockHandle
    {
        private readonly IDatabase _database;
        private readonly string _key;
        private readonly string _token;
        private readonly ILogger _logger;
        private readonly bool _acquired;
        private int _disposed;

        public RedisDistributedLockHandle(IDatabase database, string key, string token, ILogger logger, bool acquired = true)
        {
            _database = database;
            _key = key;
            _token = token;
            _logger = logger;
            _acquired = acquired;
        }

        public bool IsAcquired => _acquired;

        public async ValueTask DisposeAsync()
        {
            if (Interlocked.Exchange(ref _disposed, 1) != 0 || !_acquired)
            {
                return;
            }

            try
            {
                var result = (int?)await _database.ScriptEvaluateAsync(ReleaseScript, new RedisKey[] { _key }, new RedisValue[] { _token });
                if (result == 0)
                {
                    // 锁已不属于本持有者：说明任务执行时间超过 TTL，锁已被自动释放（可能被其他实例接管）。
                    // 不视为错误，但记录以便运维察觉 TTL 设置过短。
                    _logger.LogWarning("分布式锁 {Key} 释放时发现已不属于本持有者（可能 TTL 过期被他人接管），建议增大锁 TTL", _key);
                }
            }
            catch (Exception ex)
            {
                // 释放失败不应影响业务流程；锁会随 TTL 自动过期，最坏情况是当前实例的锁稍晚释放。
                _logger.LogError(ex, "分布式锁 {Key} 释放失败，将依赖 TTL 自动过期", _key);
            }
        }
    }
}
