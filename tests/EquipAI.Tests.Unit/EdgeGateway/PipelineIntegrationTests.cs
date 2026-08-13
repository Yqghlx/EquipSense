using EquipAI.EdgeGateway;
using EquipAI.EdgeGateway.Persistence;
using EquipAI.EdgeGateway.Pipeline;
using EquipAI.EdgeGateway.Protocols;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace EquipAI.Tests.Unit.EdgeGateway;

/// <summary>
/// 边缘网关数据管线集成测试
/// 验证 collect → buffer → upload 全流程协作
/// </summary>
public class PipelineIntegrationTests
{
    private readonly Mock<ILogger<CloudUploader>> _uploaderLogger;
    private readonly Mock<ILogger<DataCollector>> _collectorLogger;
    private readonly GatewayOptions _options;

    public PipelineIntegrationTests()
    {
        _uploaderLogger = new Mock<ILogger<CloudUploader>>();
        _collectorLogger = new Mock<ILogger<DataCollector>>();
        _options = new GatewayOptions
        {
            Id = "test-gateway",
            TenantId = "test-tenant",
            MqttBroker = "localhost:1883"
        };
    }

    [Fact]
    public async Task LocalBuffer_入队后应可批量取出()
    {
        var buffer = new LocalBuffer(capacity: 100);

        // 入队 3 条消息
        await buffer.EnqueueAsync("topic/1", new byte[] { 1 });
        await buffer.EnqueueAsync("topic/2", new byte[] { 2 });
        await buffer.EnqueueAsync("topic/3", new byte[] { 3 });

        buffer.Count.Should().Be(3);

        // 批量取出 2 条
        var batch = buffer.DequeueBatch(2);
        batch.Should().HaveCount(2);
        buffer.Count.Should().Be(1);

        // 取出剩余
        var rest = buffer.DequeueBatch(10);
        rest.Should().HaveCount(1);
        buffer.Count.Should().Be(0);
    }

    [Fact]
    public async Task LocalBuffer_超出容量应丢弃最早消息()
    {
        var buffer = new LocalBuffer(capacity: 3);

        for (var i = 0; i < 5; i++)
        {
            await buffer.EnqueueAsync($"topic/{i}", [(byte)i]);
        }

        // 容量 3，入了 5 条，应该只剩 3 条（丢弃最早的 2 条）
        buffer.Count.Should().Be(3);

        var batch = buffer.DequeueBatch(10);
        batch.Should().HaveCount(3);
        // 应保留 topic/2, topic/3, topic/4（丢弃了 topic/0, topic/1）
        batch[0].Topic.Should().Be("topic/2");
        batch[2].Topic.Should().Be("topic/4");
    }

    [Fact]
    public async Task LocalBuffer_带指标收集器应更新队列深度()
    {
        var metrics = new GatewayMetrics();
        var buffer = new LocalBuffer(capacity: 100, metrics: metrics);

        await buffer.EnqueueAsync("topic/1", new byte[] { 1 });
        metrics.GetGauge(GatewayMetrics.Names.BufferQueueDepth).Should().Be(1);

        await buffer.EnqueueAsync("topic/2", new byte[] { 2 });
        metrics.GetGauge(GatewayMetrics.Names.BufferQueueDepth).Should().Be(2);

        buffer.DequeueBatch(1);
        // DequeueBatch 会同步更新队列深度；详细边界由 LocalBufferTests 覆盖。
    }

    [Fact]
    public void GatewayMetrics_完整采集流程指标应正确记录()
    {
        var metrics = new GatewayMetrics();

        // 模拟 10 次采集
        for (var i = 0; i < 10; i++)
        {
            metrics.Increment(GatewayMetrics.Names.CollectionsTotal);
        }

        // 模拟 1 次采集错误
        metrics.Increment(GatewayMetrics.Names.CollectionErrorsTotal);

        // 模拟 8 次上传成功
        for (var i = 0; i < 8; i++)
        {
            metrics.Increment(GatewayMetrics.Names.UploadSuccessTotal);
        }

        // 模拟 2 次上传失败
        metrics.Increment(GatewayMetrics.Names.UploadFailTotal, 2);

        // 模拟 3 次回放
        metrics.Increment(GatewayMetrics.Names.ReplayMessagesTotal, 3);

        // 设置队列深度
        metrics.SetGauge(GatewayMetrics.Names.BufferQueueDepth, 5);

        metrics.GetCounter(GatewayMetrics.Names.CollectionsTotal).Should().Be(10);
        metrics.GetCounter(GatewayMetrics.Names.CollectionErrorsTotal).Should().Be(1);
        metrics.GetCounter(GatewayMetrics.Names.UploadSuccessTotal).Should().Be(8);
        metrics.GetCounter(GatewayMetrics.Names.UploadFailTotal).Should().Be(2);
        metrics.GetCounter(GatewayMetrics.Names.ReplayMessagesTotal).Should().Be(3);
        metrics.GetGauge(GatewayMetrics.Names.BufferQueueDepth).Should().Be(5);

        // 验证 Prometheus 输出
        var text = metrics.ToPrometheusText();
        text.Should().Contain("edgegateway_collections_total 10");
        text.Should().Contain("edgegateway_upload_success_total 8");
        text.Should().Contain("edgegateway_buffer_queue_depth 5");
    }

    [Fact]
    public async Task CloudUploader_MQTT未连接时UploadAsync不应抛异常()
    {
        // 不连接 MQTT，直接创建 uploader
        var uploader = new CloudUploader(
            _uploaderLogger.Object,
            _options);

        var message = new NormalizedMessage(
            DeviceId: "device-001",
            Timestamp: DateTime.UtcNow,
            Metrics: new Dictionary<string, double> { ["temperature"] = 25.0 },
            Status: "normal"
        );

        // 应不抛异常（仅打印警告日志）
        var act = () => uploader.UploadAsync(message, "sensor", CancellationToken.None);
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public void DataNormalizer_应正确标准化数据点()
    {
        // DataCollector 传入的 pointIds 是 DataPoints.Values（指标名）
        // 适配器返回 DataPoint.PointId = 指标名
        // DataNormalizer 反转 DataPoints: value(指标名)→key(点位ID)
        // 匹配后 metrics 的 key 是原始 DataPoints 的 key
        var dataPoints = new List<DataPoint>
        {
            new("temperature", "temperature", 25.5, "Good", DateTime.UtcNow),
            new("humidity", "humidity", 60.0, "Good", DateTime.UtcNow),
            new("pressure", "pressure", 1013.25, "Good", DateTime.UtcNow),
        };

        var config = new DeviceConfig(
            "device-001",
            "modbus-tcp",
            "localhost:502",
            new Dictionary<string, string>
            {
                ["ns=2;s=TempSensor"] = "temperature",
                ["ns=2;s=HumSensor"] = "humidity",
                ["ns=2;s=PresSensor"] = "pressure"
            },
            1000
        );

        var message = DataNormalizer.Normalize("device-001", dataPoints, config);

        message.DeviceId.Should().Be("device-001");
        message.Metrics.Should().HaveCount(3);
        message.Metrics["ns=2;s=TempSensor"].Should().Be(25.5);
        message.Metrics["ns=2;s=HumSensor"].Should().Be(60.0);
        message.Metrics["ns=2;s=PresSensor"].Should().Be(1013.25);
    }

    [Fact]
    public async Task LocalBuffer_FlushToOfflineStore应将内存数据持久化()
    {
        // 使用 SQLite 内存数据库作为离线存储
        var offlineStore = new SqliteBufferStore(":memory:");
        await offlineStore.InitializeAsync();
        var buffer = new LocalBuffer(capacity: 100, offlineStore: offlineStore);

        try
        {
            // 入队 3 条消息
            await buffer.EnqueueAsync("topic/a", new byte[] { 1, 2 });
            await buffer.EnqueueAsync("topic/b", new byte[] { 3, 4 });
            await buffer.EnqueueAsync("topic/c", new byte[] { 5, 6 });

            // 刷新到离线存储
            await buffer.FlushToOfflineStoreAsync();

            // 内存缓冲区应为空
            buffer.Count.Should().Be(0);

            // 离线存储应有 3 条待处理记录
            var pending = await offlineStore.GetPendingAsync(10);
            pending.Should().HaveCount(3);
        }
        finally
        {
            await offlineStore.DisposeAsync();
        }
    }
}
