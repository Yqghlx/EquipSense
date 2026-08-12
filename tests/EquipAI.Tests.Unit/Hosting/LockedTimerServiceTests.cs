using EquipAI.Application.Hosting;
using EquipAI.Core.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;

namespace EquipAI.Tests.Unit.Hosting;

/// <summary>
/// 带锁后台任务的租约续期回归测试。
/// </summary>
public sealed class LockedTimerServiceTests
{
    [Fact]
    public async Task 持锁任务执行期间应周期续租()
    {
        var lockHandle = new RenewableLockHandle(renewResult: true);
        var service = new ProbeLockedTimerService(new FixedLockProvider(lockHandle));

        await service.StartAsync(CancellationToken.None);
        await service.WorkStarted.Task.WaitAsync(TimeSpan.FromSeconds(5));
        await lockHandle.FirstRenewal.Task.WaitAsync(TimeSpan.FromSeconds(5));

        using var stopTimeout = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        await service.StopAsync(stopTimeout.Token);

        lockHandle.RenewCount.Should().BeGreaterThan(0);
        service.WorkRuns.Should().Be(1);
    }

    [Fact]
    public async Task 租约续期失败应取消当前任务避免继续执行()
    {
        var lockHandle = new RenewableLockHandle(renewResult: false);
        var service = new ProbeLockedTimerService(new FixedLockProvider(lockHandle));

        await service.StartAsync(CancellationToken.None);
        await service.WorkCanceled.Task.WaitAsync(TimeSpan.FromSeconds(5));

        using var stopTimeout = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        await service.StopAsync(stopTimeout.Token);

        lockHandle.RenewCount.Should().BeGreaterThan(0);
        service.WorkRuns.Should().Be(1);
    }

    [Fact]
    public async Task 任务正常结束应立即释放锁而不等待下一次续租()
    {
        var lockHandle = new RenewableLockHandle(renewResult: true);
        var service = new ProbeLockedTimerService(
            new FixedLockProvider(lockHandle),
            completeWorkImmediately: true);

        await service.StartAsync(CancellationToken.None);
        await service.WorkStarted.Task.WaitAsync(TimeSpan.FromSeconds(5));

        try
        {
            await lockHandle.Disposed.Task.WaitAsync(TimeSpan.FromMilliseconds(500));
        }
        finally
        {
            using var stopTimeout = new CancellationTokenSource(TimeSpan.FromSeconds(5));
            await service.StopAsync(stopTimeout.Token);
        }

        lockHandle.Disposed.Task.IsCompletedSuccessfully.Should().BeTrue();
    }

    /// <summary>只执行一次长任务的探针服务，用于观察基类的租约生命周期。</summary>
    private sealed class ProbeLockedTimerService : LockedTimerService
    {
        private readonly bool _completeWorkImmediately;

        public ProbeLockedTimerService(
            IDistributedLockProvider lockProvider,
            bool completeWorkImmediately = false)
            : base(
                lockProvider,
                NullLogger<ProbeLockedTimerService>.Instance,
                lockResource: "test-locked-timer",
                lockExpiry: TimeSpan.FromSeconds(3))
        {
            _completeWorkImmediately = completeWorkImmediately;
        }

        public TaskCompletionSource<bool> WorkStarted { get; } =
            new(TaskCreationOptions.RunContinuationsAsynchronously);

        public TaskCompletionSource<bool> WorkCanceled { get; } =
            new(TaskCreationOptions.RunContinuationsAsynchronously);

        public int WorkRuns { get; private set; }

        protected override TimeSpan DefaultStartupDelay => TimeSpan.Zero;

        protected override TimeSpan DefaultInterval => TimeSpan.FromHours(1);

        protected override async Task ExecuteWorkAsync(CancellationToken ct)
        {
            WorkRuns++;
            WorkStarted.TrySetResult(true);

            if (_completeWorkImmediately)
            {
                return;
            }

            try
            {
                await Task.Delay(Timeout.InfiniteTimeSpan, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                WorkCanceled.TrySetResult(true);
            }
        }
    }

    /// <summary>固定返回同一个测试锁句柄的提供者。</summary>
    private sealed class FixedLockProvider : IDistributedLockProvider
    {
        private readonly IDistributedLockHandle _handle;

        public FixedLockProvider(IDistributedLockHandle handle) => _handle = handle;

        public Task<IDistributedLockHandle> AcquireAsync(
            string resource,
            TimeSpan expiry,
            TimeSpan waitTime,
            CancellationToken ct = default)
            => Task.FromResult(_handle);
    }

    /// <summary>可控制续租结果的测试锁句柄。</summary>
    private sealed class RenewableLockHandle : IRenewableDistributedLockHandle
    {
        private readonly bool _renewResult;

        public RenewableLockHandle(bool renewResult) => _renewResult = renewResult;

        public TaskCompletionSource<bool> FirstRenewal { get; } =
            new(TaskCreationOptions.RunContinuationsAsynchronously);

        public TaskCompletionSource<bool> Disposed { get; } =
            new(TaskCreationOptions.RunContinuationsAsynchronously);

        public bool IsAcquired => true;

        public int RenewCount { get; private set; }

        public Task<bool> RenewAsync(TimeSpan expiry, CancellationToken ct = default)
        {
            RenewCount++;
            FirstRenewal.TrySetResult(true);
            return Task.FromResult(_renewResult);
        }

        public ValueTask DisposeAsync()
        {
            Disposed.TrySetResult(true);
            return ValueTask.CompletedTask;
        }
    }
}
