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
    private readonly int _capacity;
    private readonly SqliteBufferStore? _offlineStore;
    private readonly GatewayMetrics? _metrics;

    public LocalBuffer(int capacity = 10000, SqliteBufferStore? offlineStore = null, GatewayMetrics? metrics = null)
    {
        _capacity = capacity;
        _offlineStore = offlineStore;
        _metrics = metrics;
    }

    /// <summary>
    /// 当前缓冲区中的消息数量
    /// </summary>
    public int Count => _queue.Count;

    /// <summary>
    /// 入队一条消息。超出容量时丢弃最早的消息。
    /// </summary>
    public Task EnqueueAsync(string topic, byte[] payload)
    {
        // 如果超出容量，丢弃最早的消息
        while (_queue.Count >= _capacity)
        {
            _queue.TryDequeue(out _);
        }

        _queue.Enqueue(new BufferEntry(topic, payload));
        _metrics?.SetGauge(GatewayMetrics.Names.BufferQueueDepth, _queue.Count);
        return Task.CompletedTask;
    }

    /// <summary>
    /// 批量取出消息（最多 maxCount 条）
    /// </summary>
    public List<BufferEntry> DequeueBatch(int maxCount)
    {
        var batch = new List<BufferEntry>();
        for (var i = 0; i < maxCount; i++)
        {
            if (!_queue.TryDequeue(out var entry))
                break;
            batch.Add(entry);
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
        _queue.Clear();
        return ValueTask.CompletedTask;
    }
}
