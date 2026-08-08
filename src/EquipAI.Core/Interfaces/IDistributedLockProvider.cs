namespace EquipAI.Core.Interfaces;

/// <summary>
/// 分布式锁句柄，持有锁期间由调用方负责释放。
/// 实现需保证幂等释放：仅当锁仍由当前持有者（按 token 匹配）持有时才删除，避免误删他人续约/抢占的锁。
/// </summary>
public interface IDistributedLockHandle : IAsyncDisposable
{
    /// <summary>是否成功获取到锁。</summary>
    bool IsAcquired { get; }
}

/// <summary>
/// 分布式锁提供者，基于共享存储（如 Redis）实现跨实例互斥。
///
/// 用途：后台定时服务（SLA 升级、基线计算、清理任务等）在多实例部署下需保证同一时刻只有一个实例执行，
/// 否则会产生重复升级、重复建单、重复清理等副作用。单实例部署下锁恒可获取，行为不变。
/// </summary>
public interface IDistributedLockProvider
{
    /// <summary>
    /// 尝试获取名为 <paramref name="resource"/> 的锁，最多等待 <paramref name="waitTime"/>。
    /// </summary>
    /// <param name="resource">锁名（建议带业务命名空间，如 "bg:sla-escalation"）。</param>
    /// <param name="expiry">锁的自动过期时间（TTL），防止持有者宕机后死锁；应大于单次任务最长执行时间。</param>
    /// <param name="waitTime">最多等待获取的时间；超时返回 <see cref="IDistributedLockHandle.IsAcquired"/> = false。</param>
    /// <param name="ct">取消令牌。</param>
    /// <returns>锁句柄；调用方用完应在 using/await using 中释放。</returns>
    Task<IDistributedLockHandle> AcquireAsync(
        string resource, TimeSpan expiry, TimeSpan waitTime, CancellationToken ct = default);
}
