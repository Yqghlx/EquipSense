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

    public async ValueTask DisposeAsync()
    {
        await _buffer.DisposeAsync();
    }
}
