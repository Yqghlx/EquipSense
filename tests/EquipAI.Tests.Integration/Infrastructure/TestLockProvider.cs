using EquipAI.Core.Interfaces;

namespace EquipAI.Tests.Integration.Infrastructure;

/// <summary>
/// 集成测试专用分布式锁存根：总是成功获取（单实例测试环境无并发竞争）。
/// 避免依赖真实 Redis，与单元测试的 AlwaysAcquireLockProvider 同语义但独立声明（测试项目间不互引）。
/// </summary>
internal sealed class AlwaysAcquireLockProvider : IDistributedLockProvider
{
    public Task<IDistributedLockHandle> AcquireAsync(
        string resource, TimeSpan expiry, TimeSpan waitTime, CancellationToken ct = default)
    {
        return Task.FromResult<IDistributedLockHandle>(AcquiredHandle.Instance);
    }

    private sealed class AcquiredHandle : IDistributedLockHandle
    {
        public static readonly AcquiredHandle Instance = new();
        public bool IsAcquired => true;
        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }
}
