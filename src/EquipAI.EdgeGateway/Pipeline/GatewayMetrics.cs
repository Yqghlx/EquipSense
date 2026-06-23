using System.Collections.Concurrent;

namespace EquipAI.EdgeGateway.Pipeline;

/// <summary>
/// 边缘网关 Prometheus 指标收集器
/// 提供采集、上传、缓冲队列等关键指标的计数/计量
/// </summary>
public class GatewayMetrics
{
    private readonly ConcurrentDictionary<string, long> _counters = new();
    private readonly ConcurrentDictionary<string, double> _gauges = new();
    private readonly DateTime _startTime = DateTime.UtcNow;

    /// <summary>指标标签名常量</summary>
    public static class Names
    {
        public const string CollectionsTotal = "edgegateway_collections_total";
        public const string CollectionErrorsTotal = "edgegateway_collection_errors_total";
        public const string BufferQueueDepth = "edgegateway_buffer_queue_depth";
        public const string UploadSuccessTotal = "edgegateway_upload_success_total";
        public const string UploadFailTotal = "edgegateway_upload_fail_total";
        public const string ReplayMessagesTotal = "edgegateway_replay_messages_total";
        /// <summary>缓冲队列满时被丢弃的消息数（关键风险指标，应尽可能接近 0）</summary>
        public const string BufferDroppedTotal = "edgegateway_buffer_dropped_total";
    }

    /// <summary>网关启动时间</summary>
    public DateTime StartTime => _startTime;

    /// <summary>递增计数器</summary>
    public void Increment(string name, long value = 1)
    {
        _counters.AddOrUpdate(name, value, (_, current) => current + value);
    }

    /// <summary>设置仪表值</summary>
    public void SetGauge(string name, double value)
    {
        _gauges[name] = value;
    }

    /// <summary>获取计数器值</summary>
    public long GetCounter(string name)
    {
        return _counters.GetValueOrDefault(name, 0);
    }

    /// <summary>获取仪表值</summary>
    public double GetGauge(string name)
    {
        return _gauges.GetValueOrDefault(name, 0);
    }

    /// <summary>
    /// 生成 Prometheus 文本格式的指标输出
    /// </summary>
    public string ToPrometheusText()
    {
        var sb = new System.Text.StringBuilder();

        // 输出所有计数器
        foreach (var (name, value) in _counters.OrderBy(x => x.Key))
        {
            sb.AppendLine($"# HELP {name} {GetHelpText(name)}");
            sb.AppendLine($"# TYPE {name} counter");
            sb.AppendLine($"{name} {value}");
        }

        // 输出所有仪表
        foreach (var (name, value) in _gauges.OrderBy(x => x.Key))
        {
            sb.AppendLine($"# HELP {name} {GetHelpText(name)}");
            sb.AppendLine($"# TYPE {name} gauge");
            sb.AppendLine($"{name} {value}");
        }

        return sb.ToString();
    }

    private static string GetHelpText(string metricName) => metricName switch
    {
        Names.CollectionsTotal => "Total number of data collections",
        Names.CollectionErrorsTotal => "Total number of collection errors",
        Names.BufferQueueDepth => "Current buffer queue depth",
        Names.UploadSuccessTotal => "Total number of successful uploads",
        Names.UploadFailTotal => "Total number of failed uploads",
        Names.ReplayMessagesTotal => "Total number of replayed messages",
        Names.BufferDroppedTotal => "Total number of messages dropped (queue overflow or SQLite failure)",
        _ => metricName
    };
}
