using EquipAI.EdgeGateway;
using EquipAI.EdgeGateway.Persistence;
using EquipAI.EdgeGateway.Pipeline;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace EquipAI.Tests.Unit.Pipeline;

public class CloudUploaderTests
{
    private static CloudUploader CreateUploader(
        SqliteBufferStore? offlineStore = null,
        LocalBuffer? localBuffer = null)
    {
        var logger = LoggerFactory.Create(_ => { }).CreateLogger<CloudUploader>();
        var options = new GatewayOptions
        {
            TenantId = "test-tenant",
            MqttBroker = "localhost:1883"
        };
        return new CloudUploader(logger, options, offlineStore, localBuffer);
    }

    [Fact]
    public void BuildMqttTopic_应生成正确的主题()
    {
        var topic = CloudUploader.BuildMqttTopic("tenant-123", "cnc-001");
        topic.Should().Be("factory/tenant-123/telemetry/cnc-001");
    }

    [Fact]
    public void BuildPayload_应生成有效的JSON()
    {
        var msg = new NormalizedMessage(
            "cnc-001", new DateTime(2026, 6, 1, 12, 0, 0, DateTimeKind.Utc),
            new Dictionary<string, double> { ["temperature"] = 85.3, ["vibration"] = 2.1 });

        var json = CloudUploader.BuildPayload(msg, "CNC");
        var doc = JsonDocument.Parse(json);

        doc.RootElement.GetProperty("device_id").GetString().Should().Be("cnc-001");
        doc.RootElement.GetProperty("device_type").GetString().Should().Be("CNC");
        doc.RootElement.GetProperty("metrics").GetProperty("temperature").GetDouble().Should().Be(85.3);
        doc.RootElement.GetProperty("quality").GetString().Should().Be("good");
    }

    [Fact]
    public void BuildPayload_应包含时间戳()
    {
        var msg = new NormalizedMessage(
            "dev-001", new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            new Dictionary<string, double>());

        var json = CloudUploader.BuildPayload(msg, "Test");
        var doc = JsonDocument.Parse(json);

        doc.RootElement.TryGetProperty("timestamp", out _).Should().BeTrue();
    }

    [Fact]
    public void BuildPayload_status默认为running()
    {
        var msg = new NormalizedMessage(
            "dev-001", DateTime.UtcNow,
            new Dictionary<string, double>());

        var json = CloudUploader.BuildPayload(msg, "Test");
        var doc = JsonDocument.Parse(json);

        doc.RootElement.GetProperty("status").GetString().Should().Be("running");
    }

    [Fact]
    public async Task UploadAsync_MQTT未连接时应安全返回不抛异常()
    {
        var uploader = CreateUploader();
        var msg = new NormalizedMessage("dev-001", DateTime.UtcNow,
            new Dictionary<string, double> { ["temp"] = 25.0 });

        var act = () => uploader.UploadAsync(msg, "CNC", CancellationToken.None);
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task UploadWithFallbackAsync_离线时应缓冲到LocalBuffer()
    {
        var buffer = new LocalBuffer(capacity: 100);
        var uploader = CreateUploader(localBuffer: buffer);

        await uploader.UploadWithFallbackAsync("test/topic", """{"data":1}"""u8.ToArray(), CancellationToken.None);

        buffer.Count.Should().Be(1);
        await buffer.DisposeAsync();
    }

    [Fact]
    public async Task UploadWithFallbackAsync_离线且无LocalBuffer时应缓冲到SqliteStore()
    {
        var store = new SqliteBufferStore(":memory:");
        await store.InitializeAsync();
        var uploader = CreateUploader(offlineStore: store);

        await uploader.UploadWithFallbackAsync("test/topic", """{"data":1}"""u8.ToArray(), CancellationToken.None);

        var pending = await store.GetPendingAsync(10);
        pending.Should().HaveCount(1);
        await store.DisposeAsync();
    }

    [Fact]
    public async Task UploadWithFallbackAsync_收到取消时应传播取消且不得写入离线缓冲()
    {
        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();
        var buffer = new LocalBuffer(capacity: 100);
        var uploader = CreateUploader(localBuffer: buffer);

        var act = () => uploader.UploadWithFallbackAsync(
            "test/topic",
            """{"data":1}"""u8.ToArray(),
            cancellation.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
        buffer.Count.Should().Be(0);
        await buffer.DisposeAsync();
    }

    [Fact]
    public async Task ReplayOfflineDataAsync_未连接时应安全返回不回放()
    {
        var store = new SqliteBufferStore(":memory:");
        await store.InitializeAsync();
        await store.StoreAsync("test/topic", """{"data":1}"""u8.ToArray());

        var uploader = CreateUploader(offlineStore: store);
        await uploader.ReplayOfflineDataAsync(CancellationToken.None);

        // 未连接 MQTT，数据应保留在 store 中
        var pending = await store.GetPendingAsync(10);
        pending.Should().HaveCount(1);
        await store.DisposeAsync();
    }

    [Fact]
    public async Task DisposeAsync_重复调用不应抛异常()
    {
        var uploader = CreateUploader();
        await uploader.DisposeAsync();
        await uploader.DisposeAsync();
    }
}
