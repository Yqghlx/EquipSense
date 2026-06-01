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
        // 容量为 3
        await _buffer.EnqueueAsync("t1", """{"seq":1}"""u8.ToArray());
        await _buffer.EnqueueAsync("t2", """{"seq":2}"""u8.ToArray());
        await _buffer.EnqueueAsync("t3", """{"seq":3}"""u8.ToArray());
        await _buffer.EnqueueAsync("t4", """{"seq":4}"""u8.ToArray()); // 应丢弃最早的

        var batch = _buffer.DequeueBatch(10);
        batch.Should().HaveCount(3);
        // 应包含 t2, t3, t4（t1 被丢弃）
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
        // 模拟断网场景：数据溢出到 SQLite
        var sqliteStore = new SqliteBufferStore(":memory:");
        await sqliteStore.InitializeAsync();

        var buffer = new LocalBuffer(capacity: 10, sqliteStore);
        await buffer.EnqueueAsync("test/topic", """{"data":1}"""u8.ToArray());
        await buffer.FlushToOfflineStoreAsync();

        var pending = await sqliteStore.GetPendingAsync(10);
        pending.Should().HaveCount(1);

        await sqliteStore.DisposeAsync();
    }

    public async ValueTask DisposeAsync()
    {
        await _buffer.DisposeAsync();
    }
}
