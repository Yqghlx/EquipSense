using EquipAI.EdgeGateway.Persistence;
using EquipAI.EdgeGateway.Pipeline;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Protocols;

public class LocalBufferTests : IAsyncDisposable
{
    private readonly LocalBuffer _buffer;

    public LocalBufferTests()
    {
        _buffer = new LocalBuffer(capacity: 3);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void 构造时容量必须为正数(int capacity)
    {
        var act = () => new LocalBuffer(capacity);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public async Task EnqueueAsync_未满时应保持在内存()
    {
        await _buffer.EnqueueAsync("topic/test", """{"temp":85.3}"""u8.ToArray());

        var batch = _buffer.DequeueBatch(10);
        batch.Should().HaveCount(1);
    }

    [Fact]
    public async Task EnqueueAsync_超出容量时最早的应被丢弃()
    {
        await _buffer.EnqueueAsync("t1", """{"seq":1}"""u8.ToArray());
        await _buffer.EnqueueAsync("t2", """{"seq":2}"""u8.ToArray());
        await _buffer.EnqueueAsync("t3", """{"seq":3}"""u8.ToArray());
        await _buffer.EnqueueAsync("t4", """{"seq":4}"""u8.ToArray());

        var batch = _buffer.DequeueBatch(10);
        batch.Should().HaveCount(3);
    }

    [Fact]
    public void DequeueBatch_空缓冲区应返回空列表()
    {
        var batch = _buffer.DequeueBatch(10);
        batch.Should().BeEmpty();
    }

    [Fact]
    public async Task FlushToOfflineStoreAsync_应将内存数据写入SQLite()
    {
        var sqliteStore = new SqliteBufferStore(":memory:");
        await sqliteStore.InitializeAsync();

        var buffer = new LocalBuffer(capacity: 10, sqliteStore);
        await buffer.EnqueueAsync("test/topic", """{"data":1}"""u8.ToArray());
        await buffer.FlushToOfflineStoreAsync();

        var pending = await sqliteStore.GetPendingAsync(10);
        pending.Should().HaveCount(1);

        await sqliteStore.DisposeAsync();
    }

    [Fact]
    public async Task DequeueBatch_指定数量应只取指定条数()
    {
        var buffer = new LocalBuffer(capacity: 10);
        for (int i = 0; i < 5; i++)
            await buffer.EnqueueAsync($"topic/{i}", System.Text.Encoding.UTF8.GetBytes($"{{\"seq\":{i}}}"));

        var batch = buffer.DequeueBatch(3);
        batch.Should().HaveCount(3);

        await buffer.DisposeAsync();
    }

    [Fact]
    public async Task DequeueBatch_取出后再次出队应为空()
    {
        var buffer = new LocalBuffer(capacity: 10);
        await buffer.EnqueueAsync("topic/1", """{"data":1}"""u8.ToArray());

        buffer.DequeueBatch(10);
        var second = buffer.DequeueBatch(10);

        second.Should().BeEmpty();
        await buffer.DisposeAsync();
    }

    [Fact]
    public async Task FlushToOfflineStoreAsync_刷新后内存应为空()
    {
        var store = new SqliteBufferStore(":memory:");
        await store.InitializeAsync();
        var buffer = new LocalBuffer(capacity: 10, store);

        await buffer.EnqueueAsync("test/topic", """{"data":1}"""u8.ToArray());
        await buffer.FlushToOfflineStoreAsync();

        buffer.Count.Should().Be(0);

        await store.DisposeAsync();
    }

    [Fact]
    public async Task FlushToOfflineStoreAsync_无offlineStore时不抛异常()
    {
        var buffer = new LocalBuffer(capacity: 10);
        await buffer.EnqueueAsync("test/topic", """{"data":1}"""u8.ToArray());

        var act = () => buffer.FlushToOfflineStoreAsync();
        await act.Should().NotThrowAsync();

        buffer.Count.Should().Be(1);
        await buffer.DisposeAsync();
    }

    [Fact]
    public async Task EnqueueAsync_capacity为1时只保留最新()
    {
        var buffer = new LocalBuffer(capacity: 1);
        await buffer.EnqueueAsync("old", """{"seq":1}"""u8.ToArray());
        await buffer.EnqueueAsync("new", """{"seq":2}"""u8.ToArray());

        var batch = buffer.DequeueBatch(10);
        batch.Should().HaveCount(1);
        batch[0].Topic.Should().Be("new");

        await buffer.DisposeAsync();
    }

    /// <summary>
    /// 关键修复验证：被驱逐的消息应先持久化到 SQLite，而非直接丢弃
    ///
    /// Why：原代码 TryDequeue(out _) 直接丢弃，断网场景下内存队列满后，
    /// 早期数据（可能是故障前的征兆）被永久丢失。这是工业数据采集中最严重的 bug。
    /// 修复后：被驱逐的消息先尝试存到 SQLite 7 天缓存，重连后可重新上传。
    /// </summary>
    [Fact]
    public async Task EnqueueAsync_超容量时应将被驱逐消息持久化到SQLite()
    {
        var store = new SqliteBufferStore(":memory:");
        await store.InitializeAsync();
        var buffer = new LocalBuffer(capacity: 2, store);

        // 入队 3 条（容量 2，第 1 条会被驱逐到 SQLite）
        await buffer.EnqueueAsync("t1", """{"seq":1}"""u8.ToArray());
        await buffer.EnqueueAsync("t2", """{"seq":2}"""u8.ToArray());
        await buffer.EnqueueAsync("t3", """{"seq":3}"""u8.ToArray());

        // 内存中应保留最新 2 条（t2, t3）
        buffer.Count.Should().Be(2, "内存应只保留最新 2 条");
        var inMem = buffer.DequeueBatch(10);
        inMem.Should().HaveCount(2);
        inMem[0].Topic.Should().Be("t2");
        inMem[1].Topic.Should().Be("t3");

        // SQLite 中应保留被驱逐的 t1（而非永久丢失）
        var pending = await store.GetPendingAsync(10);
        pending.Should().HaveCount(1, "被驱逐的消息应持久化到 SQLite，而非丢弃");
        pending[0].Topic.Should().Be("t1");

        await store.DisposeAsync();
    }

    /// <summary>
    /// 边界场景：未配置 offlineStore 时，超容量直接丢弃（无 SQLite 可存）
    /// 此场景必须可观测 — 通过 GatewayMetrics 的 BufferDroppedTotal 计数器。
    /// </summary>
    [Fact]
    public async Task EnqueueAsync_未配置SQLite时_丢弃并计入Metrics()
    {
        var metrics = new GatewayMetrics();
        var buffer = new LocalBuffer(capacity: 1, metrics: metrics);

        await buffer.EnqueueAsync("t1", """{"seq":1}"""u8.ToArray());
        await buffer.EnqueueAsync("t2", """{"seq":2}"""u8.ToArray());

        // t1 被丢弃（无 SQLite），metrics 应记录这次丢弃
        var dropped = metrics.GetCounter(GatewayMetrics.Names.BufferDroppedTotal);
        dropped.Should().BeGreaterThanOrEqualTo(1, "未配置 SQLite 时丢弃必须计入 BufferDroppedTotal，让运维感知");

        await buffer.DisposeAsync();
    }

    /// <summary>
    /// SQLite 持久化失败时（如磁盘满），消息被丢弃但必须计入 metrics
    /// </summary>
    [Fact]
    public async Task EnqueueAsync_SQLite失败时_丢弃并计入Metrics()
    {
        // 用一个会抛异常的 fake store 模拟 SQLite 故障
        var brokenStore = new BrokenSqliteStore();
        var metrics = new GatewayMetrics();
        var buffer = new LocalBuffer(capacity: 1, offlineStore: brokenStore, metrics: metrics);

        await buffer.EnqueueAsync("t1", """{"seq":1}"""u8.ToArray());
        await buffer.EnqueueAsync("t2", """{"seq":2}"""u8.ToArray());

        // SQLite 失败 → 消息丢弃 → metrics 计数
        var dropped = metrics.GetCounter(GatewayMetrics.Names.BufferDroppedTotal);
        dropped.Should().BeGreaterThanOrEqualTo(1, "SQLite 故障时丢弃必须计入 BufferDroppedTotal");

        await buffer.DisposeAsync();
    }

    [Fact]
    public async Task 并发入队时队列深度不得超过容量()
    {
        const int capacity = 1;
        var store = new BlockingSqliteStore();
        var buffer = new LocalBuffer(capacity, store);

        await buffer.EnqueueAsync("seed", [0]);

        var tasks = Enumerable.Range(1, 3)
            .Select(index => Task.Run(() => buffer.EnqueueAsync($"topic/{index}", [(byte)index])))
            .ToArray();

        await store.TwoWritesEntered.WaitAsync(TimeSpan.FromSeconds(5));
        store.ReleaseWrites();
        await Task.WhenAll(tasks);

        buffer.Count.Should().Be(capacity);

        await buffer.DisposeAsync();
    }

    [Fact]
    public async Task DequeueBatch_应同步更新队列深度指标()
    {
        var metrics = new GatewayMetrics();
        var buffer = new LocalBuffer(capacity: 2, metrics: metrics);

        await buffer.EnqueueAsync("topic/1", [1]);
        await buffer.EnqueueAsync("topic/2", [2]);
        metrics.GetGauge(GatewayMetrics.Names.BufferQueueDepth).Should().Be(2);

        buffer.DequeueBatch(1).Should().HaveCount(1);
        metrics.GetGauge(GatewayMetrics.Names.BufferQueueDepth).Should().Be(1);

        buffer.DequeueBatch(10).Should().HaveCount(1);
        metrics.GetGauge(GatewayMetrics.Names.BufferQueueDepth).Should().Be(0);

        await buffer.DisposeAsync();
    }

    public async ValueTask DisposeAsync()
    {
        await _buffer.DisposeAsync();
    }

    /// <summary>
    /// 模拟 SQLite 故障的 store（始终抛异常）
    /// </summary>
    private sealed class BrokenSqliteStore : SqliteBufferStore
    {
        public BrokenSqliteStore() : base(":memory:") { }

        public override Task StoreAsync(string topic, byte[] payload)
            => throw new InvalidOperationException("模拟 SQLite 故障");
    }

    /// <summary>
    /// 模拟多个采集线程同时等待离线写入，稳定暴露队列容量检查与入队之间的竞态。
    /// </summary>
    private sealed class BlockingSqliteStore : SqliteBufferStore
    {
        private readonly TaskCompletionSource<object?> _twoWritesEntered =
            new(TaskCreationOptions.RunContinuationsAsynchronously);
        private readonly TaskCompletionSource<object?> _releaseWrites =
            new(TaskCreationOptions.RunContinuationsAsynchronously);
        private int _writeCount;

        public BlockingSqliteStore() : base(":memory:")
        {
        }

        public Task TwoWritesEntered => _twoWritesEntered.Task;

        public override async Task StoreAsync(string topic, byte[] payload)
        {
            if (Interlocked.Increment(ref _writeCount) >= 2)
                _twoWritesEntered.TrySetResult(null);

            await _releaseWrites.Task;
        }

        public void ReleaseWrites() => _releaseWrites.TrySetResult(null);
    }
}
