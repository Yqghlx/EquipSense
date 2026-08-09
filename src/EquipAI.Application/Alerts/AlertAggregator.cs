using System.Collections.Concurrent;
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace EquipAI.Application.Alerts;

/// <summary>
/// 告警聚合器，实现 30 分钟窗口防风暴机制。
/// 30 分钟窗口内，同设备同指标同规则：
/// - 第 1 次：立即创建新告警
/// - 第 2-3 次：更新已有告警（追加 AggregatedFrom）
/// - 超过 3 次：静默，不处理
///
/// 正常运行时窗口计数写入共享状态存储，保证多个后端实例使用同一计数；
/// 共享存储不可用时回退到本地窗口，避免基础设施短暂故障导致当前告警被丢弃。
/// </summary>
public class AlertAggregator : IAlertAggregator
{
    private static readonly TimeSpan AggregationWindow = TimeSpan.FromMinutes(30);
    private readonly IAlertAggregationStateStore? _stateStore;
    private readonly ILogger<AlertAggregator> _logger;
    private readonly ConcurrentDictionary<string, AlertWindow> _fallbackWindows = new();
    private DateTime _lastCleanup = DateTime.UtcNow;
    private long _lastStateStoreFailureLogTicks;

    /// <summary>
    /// 创建告警聚合器。
    /// </summary>
    /// <param name="stateStore">共享窗口状态存储；未注册时使用本地窗口。</param>
    /// <param name="logger">日志记录器。</param>
    public AlertAggregator(
        IAlertAggregationStateStore? stateStore = null,
        ILogger<AlertAggregator>? logger = null)
    {
        _stateStore = stateStore;
        _logger = logger ?? NullLogger<AlertAggregator>.Instance;
    }

    /// <inheritdoc />
    public async Task<AlertAggregationDecision> EvaluateAsync(
        Guid deviceId,
        Guid ruleId,
        string metric,
        CancellationToken cancellationToken = default)
    {
        var key = BuildWindowKey(deviceId, ruleId, metric);
        long count;

        if (_stateStore is null)
        {
            count = IncrementFallbackWindow(key);
        }
        else
        {
            try
            {
                count = await _stateStore.IncrementAsync(
                    key, AggregationWindow, cancellationToken);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                // 聚合状态存储是防风暴能力，不应成为告警主链路的单点故障。
                // 降级期间可能出现跨实例重复告警，但比静默丢失现场告警更安全。
                LogStateStoreFailure(ex);
                count = IncrementFallbackWindow(key);
            }
        }

        return count switch
        {
            1 => new AlertAggregationDecision(true, false, false),
            <= 3 => new AlertAggregationDecision(false, true, false),
            _ => new AlertAggregationDecision(false, false, true)
        };
    }

    /// <summary>
    /// 生成共享窗口键。
    /// 窗口键必须包含规则 ID：同指标的分层阈值规则不能互相吞并；指标经过 URL 编码以避免特殊字符破坏键的可读结构。
    /// </summary>
    private static string BuildWindowKey(Guid deviceId, Guid ruleId, string metric)
    {
        var normalizedMetric = Uri.EscapeDataString(metric?.Trim() ?? string.Empty);
        return $"alert:aggregate:{deviceId:N}:{ruleId:N}:{normalizedMetric}";
    }

    /// <summary>
    /// 使用进程内窗口作为共享状态存储不可用时的降级路径。
    /// </summary>
    private long IncrementFallbackWindow(string key)
    {
        CleanupStaleWindows();
        var window = _fallbackWindows.GetOrAdd(key, _ => new AlertWindow());
        return window.Increment();
    }

    /// <summary>
    /// 限制状态存储异常日志的频率，防止 Redis 故障时告警风暴进一步淹没日志系统。
    /// </summary>
    private void LogStateStoreFailure(Exception exception)
    {
        var nowTicks = DateTime.UtcNow.Ticks;
        var previousTicks = Interlocked.Read(ref _lastStateStoreFailureLogTicks);
        if (previousTicks != 0
            && nowTicks - previousTicks < TimeSpan.FromMinutes(1).Ticks)
        {
            return;
        }

        if (Interlocked.CompareExchange(
                ref _lastStateStoreFailureLogTicks, nowTicks, previousTicks) != previousTicks)
        {
            return;
        }

        _logger.LogWarning(
            exception,
            "告警聚合共享状态存储不可用，已回退到本地窗口；恢复前可能出现跨实例重复告警");
    }

    /// <summary>
    /// 清理超过 30 分钟未访问的过期窗口，防止内存泄漏
    /// 每 10 分钟执行一次清理
    /// </summary>
    private void CleanupStaleWindows()
    {
        if ((DateTime.UtcNow - _lastCleanup).TotalMinutes < 10)
            return;

        _lastCleanup = DateTime.UtcNow;

        foreach (var kvp in _fallbackWindows.ToList())
        {
            if ((DateTime.UtcNow - kvp.Value.LastAccess).TotalMinutes > 30)
                _fallbackWindows.TryRemove(kvp.Key, out _);
        }
    }
}

/// <summary>
/// 告警窗口，跟踪单个 设备+指标 组合在 30 分钟内的告警次数
/// </summary>
public class AlertWindow
{
    private readonly object _lock = new();
    private int _count;
    private DateTime _windowStart = DateTime.UtcNow;

    public DateTime LastAccess { get; private set; } = DateTime.UtcNow;

    /// <summary>
    /// 递增告警计数，如果窗口超过 30 分钟则自动重置
    /// </summary>
    /// <returns>当前窗口内的告警次数</returns>
    internal int Increment()
    {
        lock (_lock)
        {
            var now = DateTime.UtcNow;
            LastAccess = now;

            // 超过 30 分钟窗口，重置计数
            if ((now - _windowStart).TotalMinutes > 30)
            {
                _windowStart = now;
                _count = 0;
            }

            return ++_count;
        }
    }
}
