using System.Collections.Concurrent;
using EquipAI.Core.Interfaces;

namespace EquipAI.Application.Alerts;

/// <summary>
/// 告警聚合器，实现 30 分钟窗口防风暴机制
/// 30 分钟窗口内，同设备同指标同规则：
/// - 第 1 次：立即创建新告警
/// - 第 2-3 次：更新已有告警（追加 AggregatedFrom）
/// - 超过 3 次：静默，不处理
/// </summary>
public class AlertAggregator : IAlertAggregator
{
    private readonly ConcurrentDictionary<string, AlertWindow> _windows = new();
    private DateTime _lastCleanup = DateTime.UtcNow;

    public (bool ShouldCreate, bool ShouldUpdate, bool Silenced) Evaluate(
        Guid deviceId, Guid ruleId, string metric)
    {
        CleanupStaleWindows();
        // 窗口键含 ruleId：隔离同设备同指标的不同规则（分层阈值场景），避免互相吞并。
        var key = $"{deviceId}:{ruleId}:{metric}";
        var window = _windows.GetOrAdd(key, _ => new AlertWindow());
        var count = window.Increment();

        return count switch
        {
            1 => (true, false, false),
            <= 3 => (false, true, false),
            _ => (false, false, true)
        };
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

        foreach (var kvp in _windows.ToList())
        {
            if ((DateTime.UtcNow - kvp.Value.LastAccess).TotalMinutes > 30)
                _windows.TryRemove(kvp.Key, out _);
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
