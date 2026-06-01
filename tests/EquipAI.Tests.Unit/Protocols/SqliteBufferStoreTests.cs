using EquipAI.EdgeGateway.Persistence;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Protocols;

/// <summary>
/// SqliteBufferStore 单元测试
/// 使用内存 SQLite 数据库进行测试，每次测试使用独立的 store 实例
/// </summary>
public class SqliteBufferStoreTests : IAsyncDisposable
{
    private readonly SqliteBufferStore _store;

    public SqliteBufferStoreTests()
    {
        _store = new SqliteBufferStore(":memory:");
        _store.InitializeAsync().GetAwaiter().GetResult();
    }

    [Fact]
    public async Task StoreAsync_And_GetPendingAsync_应正确存取()
    {
        // Arrange
        var payload = """{"device_id":"cnc-001","metrics":{"temperature":85.3}}"""u8.ToArray();
        var topic = "factory/test/telemetry/cnc-001";

        // Act
        await _store.StoreAsync(topic, payload);
        var pending = await _store.GetPendingAsync(10);

        // Assert
        pending.Should().HaveCount(1);
        pending[0].Topic.Should().Be(topic);
        pending[0].Payload.Should().Equal(payload);
    }

    [Fact]
    public async Task MarkAsSentAsync_应将记录标记为已发送()
    {
        // Arrange
        await _store.StoreAsync("test/topic", """{"device_id":"cnc-001"}"""u8.ToArray());
        var pending = await _store.GetPendingAsync(10);

        // Act
        await _store.MarkAsSentAsync(pending[0].Id);

        // Assert
        var afterMark = await _store.GetPendingAsync(10);
        afterMark.Should().BeEmpty();
    }

    [Fact]
    public async Task CleanupOldAsync_应清除超过7天的记录()
    {
        // Arrange
        await _store.StoreAsync("test/topic", """{"device_id":"cnc-001"}"""u8.ToArray());
        // 将记录的创建时间设置为 8 天前，超过 7 天保留期
        await _store.TestHelper_SetCreatedDaysAgo(1, 8);

        // Act
        await _store.CleanupOldAsync();

        // Assert
        var pending = await _store.GetPendingAsync(10);
        pending.Should().BeEmpty();
    }

    [Fact]
    public async Task GetPendingAsync_应按时间排序并限制数量()
    {
        // Arrange - 按顺序插入 3 条记录
        await _store.StoreAsync("topic/1", """{"seq":1}"""u8.ToArray());
        await _store.StoreAsync("topic/2", """{"seq":2}"""u8.ToArray());
        await _store.StoreAsync("topic/3", """{"seq":3}"""u8.ToArray());

        // Act - 限制返回 2 条
        var pending = await _store.GetPendingAsync(2);

        // Assert - 应返回最早的 2 条
        pending.Should().HaveCount(2);
        pending[0].Topic.Should().Be("topic/1");
        pending[1].Topic.Should().Be("topic/2");
    }

    [Fact]
    public async Task StoreAsync_多次存储应全部可查询()
    {
        // Arrange
        for (int i = 0; i < 5; i++)
        {
            await _store.StoreAsync($"topic/{i}", System.Text.Encoding.UTF8.GetBytes($"{{\"seq\":{i}}}"));
        }

        // Act
        var pending = await _store.GetPendingAsync(100);

        // Assert
        pending.Should().HaveCount(5);
    }

    [Fact]
    public async Task MarkAsSentAsync_仅标记指定记录()
    {
        // Arrange
        await _store.StoreAsync("topic/1", """{"seq":1}"""u8.ToArray());
        await _store.StoreAsync("topic/2", """{"seq":2}"""u8.ToArray());
        await _store.StoreAsync("topic/3", """{"seq":3}"""u8.ToArray());

        // Act - 仅标记第二条为已发送
        var pending = await _store.GetPendingAsync(100);
        await _store.MarkAsSentAsync(pending[1].Id);

        // Assert - 剩余 2 条未发送
        var remaining = await _store.GetPendingAsync(100);
        remaining.Should().HaveCount(2);
        remaining[0].Topic.Should().Be("topic/1");
        remaining[1].Topic.Should().Be("topic/3");
    }

    public async ValueTask DisposeAsync()
    {
        await _store.DisposeAsync();
    }
}
