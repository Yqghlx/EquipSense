namespace EquipAI.Application.Alerts;

/// <summary>
/// 告警评估并发门闩。
/// 同一租户、设备、规则和指标的状态变更必须串行执行，避免并发遥测同时判断为“更新”，
/// 但在第一个告警提交前查不到可更新记录，最终错误地创建多条 Active 告警。
/// 不同告警键仍可并行处理，避免单个热点设备拖慢整个告警管线。
/// </summary>
public sealed class AlertEvaluationConcurrencyGate
{
    private readonly object _entriesLock = new();
    private readonly Dictionary<string, GateEntry> _entries = new(StringComparer.Ordinal);

    /// <summary>
    /// 生成告警状态门闩键。
    /// </summary>
    public static string BuildKey(Guid tenantId, Guid deviceId, Guid ruleId, string metric)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(metric);
        return $"{tenantId:N}:{deviceId:N}:{ruleId:N}:{metric.Trim().ToUpperInvariant()}";
    }

    /// <summary>
    /// 异步获取指定告警键的独占执行权。
    /// </summary>
    /// <param name="key">告警状态门闩键。</param>
    /// <param name="cancellationToken">取消令牌。</param>
    /// <returns>释放执行权的异步句柄。</returns>
    public async ValueTask<IAsyncDisposable> EnterAsync(
        string key,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(key);

        var entry = AddReference(key);
        var acquired = false;

        try
        {
            await entry.Semaphore.WaitAsync(cancellationToken).ConfigureAwait(false);
            acquired = true;
            return new Lease(this, key, entry);
        }
        catch
        {
            if (acquired)
            {
                entry.Semaphore.Release();
            }

            RemoveReference(key, entry);
            throw;
        }
    }

    /// <summary>
    /// 在条目尚未被回收时增加引用，避免新请求拿到即将释放的信号量。
    /// </summary>
    private GateEntry AddReference(string key)
    {
        lock (_entriesLock)
        {
            if (!_entries.TryGetValue(key, out var entry))
            {
                entry = new GateEntry();
                _entries.Add(key, entry);
            }

            entry.AddReference();
            return entry;
        }
    }

    /// <summary>
    /// 释放一个等待者或持有者对门闩条目的引用；无等待者时及时回收，避免设备维度增长造成内存泄漏。
    /// </summary>
    private void Release(string key, GateEntry entry)
    {
        entry.Semaphore.Release();
        RemoveReference(key, entry);
    }

    /// <summary>
    /// 移除条目引用，并仅在确认仍是当前条目时从字典删除。
    /// </summary>
    private void RemoveReference(string key, GateEntry entry)
    {
        var shouldDispose = false;
        lock (_entriesLock)
        {
            if (entry.ReleaseReference() == 0
                && _entries.TryGetValue(key, out var current)
                && ReferenceEquals(current, entry))
            {
                _entries.Remove(key);
                shouldDispose = true;
            }
        }

        if (shouldDispose)
        {
            entry.Semaphore.Dispose();
        }
    }

    /// <summary>
    /// 某个告警键的信号量及其引用计数。
    /// </summary>
    private sealed class GateEntry
    {
        private int _references;

        /// <summary>
        /// 同一告警键的执行信号量。
        /// </summary>
        public SemaphoreSlim Semaphore { get; } = new(1, 1);

        /// <summary>
        /// 新增一个等待者/持有者引用。
        /// </summary>
        public void AddReference() => Interlocked.Increment(ref _references);

        /// <summary>
        /// 释放一个等待者/持有者引用。
        /// </summary>
        public int ReleaseReference() => Interlocked.Decrement(ref _references);
    }

    /// <summary>
    /// 只允许释放一次的异步门闩句柄。
    /// </summary>
    private sealed class Lease : IAsyncDisposable
    {
        private readonly AlertEvaluationConcurrencyGate _owner;
        private readonly string _key;
        private readonly GateEntry _entry;
        private int _disposed;

        /// <summary>
        /// 创建门闩句柄。
        /// </summary>
        public Lease(AlertEvaluationConcurrencyGate owner, string key, GateEntry entry)
        {
            _owner = owner;
            _key = key;
            _entry = entry;
        }

        /// <inheritdoc />
        public ValueTask DisposeAsync()
        {
            if (Interlocked.Exchange(ref _disposed, 1) == 0)
            {
                _owner.Release(_key, _entry);
            }

            return ValueTask.CompletedTask;
        }
    }
}
