using EquipAI.EdgeGateway;
using EquipAI.EdgeGateway.Persistence;
using EquipAI.EdgeGateway.Pipeline;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using MQTTnet;
using MQTTnet.Client;
using System.Text.Json;

namespace EquipAI.Tests.Unit.Pipeline;

public class CloudUploaderTests
{
    private static CloudUploader CreateUploader(
        SqliteBufferStore? offlineStore = null,
        LocalBuffer? localBuffer = null,
        IMqttClient? mqttClient = null)
    {
        var logger = LoggerFactory.Create(_ => { }).CreateLogger<CloudUploader>();
        var options = new GatewayOptions
        {
            TenantId = "test-tenant",
            MqttBroker = "localhost:1883"
        };
        return new CloudUploader(
            logger,
            options,
            offlineStore,
            localBuffer,
            mqttClientFactory: mqttClient is null ? null : () => mqttClient);
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
    public async Task 并发回放同一批积压消息不得重复发布()
    {
        var store = new SqliteBufferStore(":memory:");
        await store.InitializeAsync();
        await store.StoreAsync("test/topic", """{"data":1}"""u8.ToArray());

        var firstPublishStarted = new TaskCompletionSource<object?>
            (TaskCreationOptions.RunContinuationsAsynchronously);
        var secondPublishStarted = new TaskCompletionSource<object?>
            (TaskCreationOptions.RunContinuationsAsynchronously);
        var releaseFirstPublish = new TaskCompletionSource<object?>
            (TaskCreationOptions.RunContinuationsAsynchronously);
        var publishCount = 0;
        var mqttClient = new Mock<IMqttClient>();
        mqttClient.SetupGet(client => client.IsConnected).Returns(true);
        mqttClient
            .Setup(client => client.ConnectAsync(
                It.IsAny<MqttClientOptions>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((MqttClientConnectResult)null!);
        mqttClient
            .Setup(client => client.PublishAsync(
                It.IsAny<MqttApplicationMessage>(),
                It.IsAny<CancellationToken>()))
            .Returns(async () =>
            {
                var call = Interlocked.Increment(ref publishCount);
                if (call == 1)
                {
                    firstPublishStarted.TrySetResult(null);
                    await releaseFirstPublish.Task;
                }
                else
                {
                    secondPublishStarted.TrySetResult(null);
                }

                return null!;
            });

        var uploader = CreateUploader(store, mqttClient: mqttClient.Object);
        await uploader.ConnectAsync(CancellationToken.None);
        var firstReplay = uploader.ReplayOfflineDataAsync(CancellationToken.None);
        await firstPublishStarted.Task.WaitAsync(TimeSpan.FromSeconds(5));

        var secondReplay = uploader.ReplayOfflineDataAsync(CancellationToken.None);
        var secondPublishBeforeFirstCompleted =
            await Task.WhenAny(secondPublishStarted.Task, Task.Delay(TimeSpan.FromMilliseconds(500)));

        secondPublishBeforeFirstCompleted.Should().NotBe(
            secondPublishStarted.Task,
            "第二次回放必须等待第一批完成，不能发布同一条积压消息");
        secondReplay.IsCompleted.Should().BeFalse(
            "第二次回放应在第一批释放前等待回放闸门");

        releaseFirstPublish.TrySetResult(null);
        await Task.WhenAll(firstReplay, secondReplay);

        publishCount.Should().Be(1);
        (await store.GetPendingAsync(10)).Should().BeEmpty();

        await uploader.DisposeAsync();
        await store.DisposeAsync();
    }

    [Fact]
    public async Task 等待回放闸门时取消应立即退出且不得额外发布()
    {
        var store = new SqliteBufferStore(":memory:");
        await store.InitializeAsync();
        await store.StoreAsync("test/topic", """{"data":1}"""u8.ToArray());

        var firstPublishStarted = new TaskCompletionSource<object?>
            (TaskCreationOptions.RunContinuationsAsynchronously);
        var releaseFirstPublish = new TaskCompletionSource<object?>
            (TaskCreationOptions.RunContinuationsAsynchronously);
        var publishCount = 0;
        var mqttClient = new Mock<IMqttClient>();
        mqttClient.SetupGet(client => client.IsConnected).Returns(true);
        mqttClient
            .Setup(client => client.ConnectAsync(
                It.IsAny<MqttClientOptions>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((MqttClientConnectResult)null!);
        mqttClient
            .Setup(client => client.PublishAsync(
                It.IsAny<MqttApplicationMessage>(),
                It.IsAny<CancellationToken>()))
            .Returns(async () =>
            {
                Interlocked.Increment(ref publishCount);
                firstPublishStarted.TrySetResult(null);
                await releaseFirstPublish.Task;
                return null!;
            });

        var uploader = CreateUploader(store, mqttClient: mqttClient.Object);
        await uploader.ConnectAsync(CancellationToken.None);
        var firstReplay = uploader.ReplayOfflineDataAsync(CancellationToken.None);
        await firstPublishStarted.Task.WaitAsync(TimeSpan.FromSeconds(5));

        using var cancellation = new CancellationTokenSource();
        var secondReplay = uploader.ReplayOfflineDataAsync(cancellation.Token);
        cancellation.Cancel();

        var secondReplayAction = async () => await secondReplay;
        await secondReplayAction.Should().ThrowAsync<OperationCanceledException>();

        releaseFirstPublish.TrySetResult(null);
        await firstReplay;

        publishCount.Should().Be(1);
        (await store.GetPendingAsync(10)).Should().BeEmpty();

        await uploader.DisposeAsync();
        await store.DisposeAsync();
    }

    [Fact]
    public async Task 回放发布失败时应保留积压记录()
    {
        var store = new SqliteBufferStore(":memory:");
        await store.InitializeAsync();
        await store.StoreAsync("test/topic", """{"data":1}"""u8.ToArray());

        var mqttClient = new Mock<IMqttClient>();
        mqttClient.SetupGet(client => client.IsConnected).Returns(true);
        mqttClient
            .Setup(client => client.ConnectAsync(
                It.IsAny<MqttClientOptions>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((MqttClientConnectResult)null!);
        mqttClient
            .SetupSequence(client => client.PublishAsync(
                It.IsAny<MqttApplicationMessage>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("模拟 MQTT 发布失败"))
            .ReturnsAsync((MqttClientPublishResult)null!);

        var uploader = CreateUploader(store, mqttClient: mqttClient.Object);
        await uploader.ConnectAsync(CancellationToken.None);

        var act = () => uploader.ReplayOfflineDataAsync(CancellationToken.None);
        await act.Should().NotThrowAsync();

        var pending = await store.GetPendingAsync(10);
        pending.Should().ContainSingle();

        var retry = () => uploader.ReplayOfflineDataAsync(CancellationToken.None);
        await retry.Should().NotThrowAsync();
        (await store.GetPendingAsync(10)).Should().BeEmpty();

        await uploader.DisposeAsync();
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
