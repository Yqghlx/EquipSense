using EquipAI.EdgeGateway.Pipeline;

namespace EquipAI.Tests.Unit.EdgeGateway;

public class GatewayMetricsTests
{
    [Fact]
    public void Increment_默认值应为0_递增后应为指定值()
    {
        var metrics = new GatewayMetrics();

        Assert.Equal(0, metrics.GetCounter(GatewayMetrics.Names.CollectionsTotal));

        metrics.Increment(GatewayMetrics.Names.CollectionsTotal);
        Assert.Equal(1, metrics.GetCounter(GatewayMetrics.Names.CollectionsTotal));

        metrics.Increment(GatewayMetrics.Names.CollectionsTotal, 5);
        Assert.Equal(6, metrics.GetCounter(GatewayMetrics.Names.CollectionsTotal));
    }

    [Fact]
    public void SetGauge_应更新为指定值()
    {
        var metrics = new GatewayMetrics();

        Assert.Equal(0, metrics.GetGauge(GatewayMetrics.Names.BufferQueueDepth));

        metrics.SetGauge(GatewayMetrics.Names.BufferQueueDepth, 42.5);
        Assert.Equal(42.5, metrics.GetGauge(GatewayMetrics.Names.BufferQueueDepth));

        metrics.SetGauge(GatewayMetrics.Names.BufferQueueDepth, 0);
        Assert.Equal(0, metrics.GetGauge(GatewayMetrics.Names.BufferQueueDepth));
    }

    [Fact]
    public void ToPrometheusText_应输出标准Prometheus格式()
    {
        var metrics = new GatewayMetrics();
        metrics.Increment(GatewayMetrics.Names.CollectionsTotal, 10);
        metrics.SetGauge(GatewayMetrics.Names.BufferQueueDepth, 5);

        var text = metrics.ToPrometheusText();

        Assert.Contains("# HELP edgegateway_collections_total", text);
        Assert.Contains("# TYPE edgegateway_collections_total counter", text);
        Assert.Contains("edgegateway_collections_total 10", text);
        Assert.Contains("# HELP edgegateway_buffer_queue_depth", text);
        Assert.Contains("# TYPE edgegateway_buffer_queue_depth gauge", text);
        Assert.Contains("edgegateway_buffer_queue_depth 5", text);
    }

    [Fact]
    public void StartTime_应为近期时间()
    {
        var metrics = new GatewayMetrics();
        var diff = DateTime.UtcNow - metrics.StartTime;

        Assert.True(diff >= TimeSpan.Zero);
        Assert.True(diff < TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void GetCounter_不存在指标_应返回0()
    {
        var metrics = new GatewayMetrics();
        Assert.Equal(0, metrics.GetCounter("nonexistent_metric"));
    }
}
