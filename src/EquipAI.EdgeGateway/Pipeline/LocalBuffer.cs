using System.Collections.Concurrent;
using EquipAI.EdgeGateway.Persistence;

namespace EquipAI.EdgeGateway.Pipeline;

/// <summary>
/// 缓冲消息条目
/// </summary>
public record BufferEntry(string Topic, byte[] Payload);

/// <summary>
/// 本地缓冲区：内存环形队列 + SQLite 溢出
/// 正常时数据在内存中排队等待上传；断网时溢出到 SQLite 持久化
/// </summary>
public class LocalBuffer : IAsyncDisposable
{
    private readonly ConcurrentQueue<BufferEntry> _queue = new();
    /// <summary>
    /// 保护容量检查、驱逐、入队和出队之间的复合操作，避免并发采集突破有界队列。
    /// </summary>
    private readonly object _queueLock = new();
    private readonly int _capacity;
    private readonly SqliteBufferStore? _offlineStore;
    private readonly GatewayMetrics? _metrics;

    public LocalBuffer(int capacity = 10000, SqliteBufferStore? offlineStore = null, GatewayMetrics? metrics = null)
    {
        if (capacity <= 0)
            throw new ArgumentOutOfRangeException(nameof(capacity), capacity, "内存缓冲容量必须大于 0");

        _capacity = capacity;
        _offlineStore = offlineStore;
        _metrics = metrics;
    }

    /// <summary>
    /// 当前缓冲区中的消息数量
    /// </summary>
    public int Count
    {
        get
        {
            lock (_queueLock)
            {
                return _queue.Count;
            }
        }
    }

    /// <summary>
    /// 入队一条消息。
    ///
    /// 容量超限处理（关键修复）：
    /// 原代码直接 TryDequeue(out _) 丢弃最早的消息，但是被丢弃的消息**没有先持久化到 SQLite**，
    /// 导致长时间断网时内存队列溢出后，最早的数据（可能是关键故障前的征兆）被永久丢失。
    ///
    /// 修复策略：被驱逐的消息先尝试存到 SQLite（如果配置了 offlineStore），
    /// 只有 SQLite 不可用或未配置时才真正丢弃。这样在断网场景下数据进入 SQLite
    /// 7 天缓存窗口，重连后 CloudUploader 可以重新上传。
    /// </summary>
    public async Task EnqueueAsync(string topic, byte[] payload)
    {
        List<BufferEntry>? evictedEntries = null;

        // Count、驱逐和入队必须在同一临界区完成；否则多个采集器可能同时看到空位，
        // 在各自入队后突破容量上限。临界区只操作内存，避免磁盘 I/O 阻塞其它采集器。
        lock (_queueLock)
        {
            while (_queue.Count >= _capacity)
            {
                if (!_queue.TryDequeue(out var evicted))
                    break;

                evictedEntries ??= [];
                evictedEntries.Add(evicted);
            }

            _queue.Enqueue(new BufferEntry(topic, payload));
            _metrics?.SetGauge(GatewayMetrics.Names.BufferQueueDepth, _queue.Count);
        }

        if (evictedEntries is null)
            return;

        foreach (var evicted in evictedEntries)
        {
            if (_offlineStore is not null)
            {
                try
                {
                    await _offlineStore.StoreAsync(evicted.Topic, evicted.Payload);
                }
                catch (Exception)
                {
                    // SQLite 持久化失败（如磁盘满），只能放弃这条消息。
                    // 记录到 metrics 让运维感知到数据丢失风险。
                    _metrics?.Increment(GatewayMetrics.Names.BufferDroppedTotal);
                }
            }
            else
            {
                // 未配置 offlineStore，内存缓冲是唯一存储，丢弃即永久丢失。
                _metrics?.Increment(GatewayMetrics.Names.BufferDroppedTotal);
            }
        }
    }

    /// <summary>
    /// 批量取出消息（最多 maxCount 条）
    /// </summary>
    public List<BufferEntry> DequeueBatch(int maxCount)
    {
        var batch = new List<BufferEntry>();
        lock (_queueLock)
        {
            for (var i = 0; i < maxCount; i++)
            {
                if (!_queue.TryDequeue(out var entry))
                    break;
                batch.Add(entry);
            }

            _metrics?.SetGauge(GatewayMetrics.Names.BufferQueueDepth, _queue.Count);
        }

        return batch;
    }

    /// <summary>
    /// 将内存中所有消息持久化到 SQLite（断网保护）
    /// </summary>
    public async Task FlushToOfflineStoreAsync()
    {
        if (_offlineStore is null) return;

        var batch = DequeueBatch(int.MaxValue);
        foreach (var entry in batch)
        {
            await _offlineStore.StoreAsync(entry.Topic, entry.Payload);
        }
    }

    public ValueTask DisposeAsync()
    {
        lock (_queueLock)
        {
            _queue.Clear();
            _metrics?.SetGauge(GatewayMetrics.Names.BufferQueueDepth, 0);
        }

        return ValueTask.CompletedTask;
    }
}
