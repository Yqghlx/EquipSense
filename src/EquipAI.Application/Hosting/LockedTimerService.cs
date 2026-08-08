using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Hosting;

/// <summary>
/// 带分布式锁的周期性后台服务基类。
///
/// 设计动机：模块化单体在多实例部署下，10 个后台定时服务（SLA 升级、基线计算、清理任务等）会
/// 在每个实例上重复执行，产生重复升级、重复建单、重复清理等副作用。本基类在每次执行 tick 时
/// 先获取分布式锁，仅持锁实例执行实际工作；其余实例跳过本轮。单实例部署下锁恒可获取，行为不变。
///
/// 子类职责：只实现 <see cref="ExecuteWorkAsync"/>（实际的周期任务逻辑），可选覆盖
/// <see cref="ComputeNextDelayAsync"/>（自定义调度间隔，如"每天凌晨 4 点"）。无需关心锁、循环、异常兜底。
/// </summary>
public abstract class LockedTimerService : BackgroundService
{
    private readonly IDistributedLockProvider _lockProvider;
    protected readonly ILogger Logger;

    /// <summary>分布式锁名（自动加 "bg:" 命名空间前缀）。</summary>
    protected string LockResource { get; }

    /// <summary>
    /// 锁的自动过期时间（TTL）。必须大于 <see cref="ExecuteWorkAsync"/> 的最长执行时间，
    /// 否则任务未完成锁就释放，可能被另一实例重复获取导致重复执行。
    /// </summary>
    protected TimeSpan LockExpiry { get; }

    /// <summary>
    /// 获取锁的等待时间。后台服务通常设为 0：未立即获取说明另一实例已在执行，直接跳过本轮即可，
    /// 无需长时间等待（等待会让多个实例同时阻塞在锁上）。
    /// </summary>
    protected virtual TimeSpan LockWaitTime => TimeSpan.Zero;

    protected LockedTimerService(
        IDistributedLockProvider lockProvider,
        ILogger logger,
        string lockResource,
        TimeSpan? lockExpiry = null)
    {
        _lockProvider = lockProvider;
        Logger = logger;
        LockResource = lockResource;
        LockExpiry = lockExpiry ?? TimeSpan.FromMinutes(10);
    }

    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        Logger.LogInformation("{Service} 已启动", GetType().Name);

        // 首次延迟，避免启动期 DB 压力叠加
        var firstDelay = await ComputeNextDelayAsync(isFirst: true, stoppingToken);
        if (firstDelay > TimeSpan.Zero)
        {
            await Task.Delay(firstDelay, stoppingToken);
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ExecuteWithLockAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // 正常关闭，忽略
            }
            catch (Exception ex)
            {
                // 单次执行失败不应终止后台循环，记录后等待下次执行
                Logger.LogError(ex, "{Service} 执行失败", GetType().Name);
            }

            try
            {
                var delay = await ComputeNextDelayAsync(isFirst: false, stoppingToken);
                if (delay > TimeSpan.Zero)
                {
                    await Task.Delay(delay, stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }

        Logger.LogInformation("{Service} 已停止", GetType().Name);
    }

    private async Task ExecuteWithLockAsync(CancellationToken ct)
    {
        // 获取分布式锁：未获取（另一实例正在执行）则跳过本轮，避免重复执行。
        await using var handle = await _lockProvider.AcquireAsync(LockResource, LockExpiry, LockWaitTime, ct);
        if (!handle.IsAcquired)
        {
            Logger.LogDebug("{Service} 未获取到锁（{Resource}），跳过本轮（另一实例正在执行）",
                GetType().Name, LockResource);
            return;
        }

        await ExecuteWorkAsync(ct);
    }

    /// <summary>
    /// 计算下一次执行前的等待时间。
    /// 默认实现：首次等待 <see cref="DefaultStartupDelay"/>，之后等待 <see cref="DefaultInterval"/>。
    /// 子类可覆盖以实现"每天凌晨 4 点"等自定义调度（基于当前 UTC 时间计算到下一个触发点的差值）。
    /// </summary>
    /// <param name="isFirst">是否为启动后的首次等待。</param>
    protected virtual Task<TimeSpan> ComputeNextDelayAsync(bool isFirst, CancellationToken ct)
        => Task.FromResult(isFirst ? DefaultStartupDelay : DefaultInterval);

    /// <summary>默认启动延迟。子类可覆盖。</summary>
    protected virtual TimeSpan DefaultStartupDelay => TimeSpan.FromSeconds(30);

    /// <summary>默认执行间隔。子类可覆盖。</summary>
    protected virtual TimeSpan DefaultInterval => TimeSpan.FromMinutes(5);

    /// <summary>
    /// 子类实现的周期任务逻辑。基类保证：同一时刻仅持锁实例调用此方法。
    /// 实现内部的异常由基类捕获兜底（记录后继续下一轮），无需子类自行 try-catch 循环。
    /// </summary>
    protected abstract Task ExecuteWorkAsync(CancellationToken ct);
}
