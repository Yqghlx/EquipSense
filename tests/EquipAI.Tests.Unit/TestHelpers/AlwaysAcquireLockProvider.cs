using EquipAI.Core.Interfaces;

namespace EquipAI.Tests.Unit.TestHelpers;

/// <summary>
/// 测试用分布式锁提供者：始终成功获取锁（无实际互斥）。
/// 供后台服务单元测试注入——测试目标是验证业务逻辑（清理、SLA 升级等），而非锁互斥语义。
/// 生产环境的 Redis 锁互斥由 RedisDistributedLockProvider 保证，其行为在集成测试中验证。
/// </summary>
public sealed class AlwaysAcquireLockProvider : IDistributedLockProvider
{
    public Task<IDistributedLockHandle> AcquireAsync(
        string resource, TimeSpan expiry, TimeSpan waitTime, CancellationToken ct = default)
        => Task.FromResult<IDistributedLockHandle>(AlwaysAcquiredHandle.Instance);
}

/// <summary>始终标记为已获取、释放为空操作的锁句柄。</summary>
internal sealed class AlwaysAcquiredHandle : IDistributedLockHandle
{
    public static readonly AlwaysAcquiredHandle Instance = new();
    public bool IsAcquired => true;
    public ValueTask DisposeAsync() => ValueTask.CompletedTask;
}
