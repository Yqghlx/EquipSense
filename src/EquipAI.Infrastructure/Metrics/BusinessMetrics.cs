using Prometheus;

namespace EquipAI.Infrastructure.Metrics;

/// <summary>
/// 业务指标定义 — 设备、告警、工单、遥测等核心业务指标
/// 使用 Prometheus.NET 的 Counter/Gauge/Histogram 类型，通过 /metrics 端点暴露
/// </summary>
public static class BusinessMetrics
{
    // ========================================================================
    // 遥测数据指标
    // ========================================================================

    /// <summary>遥测数据接收总数（按租户和设备维度）</summary>
    public static readonly Counter TelemetryReceived = Prometheus.Metrics
        .CreateCounter("equipai_telemetry_received_total", "遥测数据接收总数",
            new CounterConfiguration { LabelNames = new[] { "tenant_id", "device_id" } });

    /// <summary>
    /// 遥测数据写入失败丢弃总数（重试耗尽后）
    /// 用于监控后端落库失败导致的数据盲区。正常应为 0；持续 &gt; 0 表示 DB 持续不可用，
    /// 运维需告警排查。与边缘网关的 edgegateway_buffer_dropped_total 互补：
    /// 后者防"后端不可达"，本指标防"后端收到却没落库"。
    /// </summary>
    public static readonly Counter TelemetryDropped = Prometheus.Metrics
        .CreateCounter("equipai_telemetry_dropped_total", "遥测数据写入失败丢弃总数（重试耗尽后）");

    /// <summary>
    /// 遥测数据因设备/租户校验被拒绝的总数
    /// 多租户纵深防御：MQTT 主题中的 tenantId 不可信，入库前按设备实际归属租户校验。
    /// reason=unknown_device：设备不存在（误配置或攻击）；reason=tenant_mismatch：设备归属租户
    /// 与上报租户不符（跨租户注入企图）。正常应为 0；持续 &gt; 0 需排查网关配置或安全事件。
    /// </summary>
    public static readonly Counter TelemetryRejected = Prometheus.Metrics
        .CreateCounter("equipai_telemetry_rejected_total", "遥测数据因设备/租户校验被拒绝的总数",
            new CounterConfiguration { LabelNames = new[] { "reason" } });

    /// <summary>
    /// 遥测数据去重总数（批内重复 + DB 已存在的重复行）
    /// device_telemetry 无唯一约束、INSERT 无 ON CONFLICT。MQTT QoS1 至少一次投递的重传、边缘网关断线
    /// 恢复后本地缓冲重放、写入重试的"模糊成功"都会产生相同 (tenant, device, metric, time) 的重复行，
    /// 污染基线（AVG/STDDEV 翻倍）、扭曲分析、绕过聚合防风暴触发重复告警。入库前应用层去重兜底。
    /// 正常应有少量（偶发重传）；持续高位表示网关重放风暴或重试逻辑异常，需运维排查。
    /// </summary>
    public static readonly Counter TelemetryDeduped = Prometheus.Metrics
        .CreateCounter("equipai_telemetry_deduped_total", "遥测数据去重总数（批内 + DB 已存在的重复行）",
            new CounterConfiguration { LabelNames = new[] { "source" } });

    /// <summary>遥测数据处理耗时（毫秒）</summary>
    public static readonly Histogram TelemetryProcessingDuration = Prometheus.Metrics
        .CreateHistogram("equipai_telemetry_processing_duration_ms", "遥测数据处理耗时",
            new HistogramConfiguration
            {
                LabelNames = new[] { "step" },
                Buckets = Histogram.ExponentialBuckets(1, 2, 12)
            });

    // ========================================================================
    // 告警指标
    // ========================================================================

    /// <summary>告警评估总数（按结果维度：triggered/updated/suppressed）</summary>
    public static readonly Counter AlertsEvaluated = Prometheus.Metrics
        .CreateCounter("equipai_alerts_evaluated_total", "告警评估总数",
            new CounterConfiguration { LabelNames = new[] { "result", "severity" } });

    /// <summary>告警评估耗时（毫秒）</summary>
    public static readonly Histogram AlertEvaluationDuration = Prometheus.Metrics
        .CreateHistogram("equipai_alert_evaluation_duration_ms", "告警评估耗时",
            new HistogramConfiguration
            {
                Buckets = Histogram.ExponentialBuckets(1, 2, 10)
            });

    /// <summary>当前活跃告警数（按严重级别）</summary>
    public static readonly Gauge ActiveAlerts = Prometheus.Metrics
        .CreateGauge("equipai_active_alerts", "当前活跃告警数",
            new GaugeConfiguration { LabelNames = new[] { "severity" } });

    // ========================================================================
    // 工单指标
    // ========================================================================

    /// <summary>工单创建总数（按类型维度）</summary>
    public static readonly Counter WorkOrdersCreated = Prometheus.Metrics
        .CreateCounter("equipai_workorders_created_total", "工单创建总数",
            new CounterConfiguration { LabelNames = new[] { "type", "priority" } });

    /// <summary>工单状态变更总数</summary>
    public static readonly Counter WorkOrderStatusChanges = Prometheus.Metrics
        .CreateCounter("equipai_workorder_status_changes_total", "工单状态变更总数",
            new CounterConfiguration { LabelNames = new[] { "from_status", "to_status" } });

    /// <summary>当前各状态工单数</summary>
    public static readonly Gauge WorkOrdersByStatus = Prometheus.Metrics
        .CreateGauge("equipai_workorders_by_status", "当前各状态工单数",
            new GaugeConfiguration { LabelNames = new[] { "status" } });

    /// <summary>工单完成耗时（从创建到关闭，小时）</summary>
    public static readonly Histogram WorkOrderCompletionHours = Prometheus.Metrics
        .CreateHistogram("equipai_workorder_completion_hours", "工单完成耗时（小时）",
            new HistogramConfiguration
            {
                Buckets = new[] { 0.5, 1, 2, 4, 8, 24, 48, 72, 168 }
            });

    // ========================================================================
    // AI 分析指标
    // ========================================================================

    /// <summary>AI 分析请求总数（按级别维度）</summary>
    public static readonly Counter AnalysisRequests = Prometheus.Metrics
        .CreateCounter("equipai_analysis_requests_total", "AI 分析请求总数",
            new CounterConfiguration { LabelNames = new[] { "level" } });

    /// <summary>AI 分析耗时（毫秒）</summary>
    public static readonly Histogram AnalysisDuration = Prometheus.Metrics
        .CreateHistogram("equipai_analysis_duration_ms", "AI 分析耗时",
            new HistogramConfiguration
            {
                LabelNames = new[] { "level" },
                Buckets = Histogram.ExponentialBuckets(10, 2, 12)
            });

    /// <summary>AI 分析置信度分布</summary>
    public static readonly Histogram AnalysisConfidence = Prometheus.Metrics
        .CreateHistogram("equipai_analysis_confidence", "AI 分析置信度分布",
            new HistogramConfiguration
            {
                Buckets = new[] { 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0 }
            });

    // ========================================================================
    // MQTT 连接指标
    // ========================================================================

    /// <summary>MQTT 消息接收总数</summary>
    public static readonly Counter MqttMessagesReceived = Prometheus.Metrics
        .CreateCounter("equipai_mqtt_messages_received_total", "MQTT 消息接收总数");

    /// <summary>MQTT 连接状态（1=已连接, 0=断开）</summary>
    public static readonly Gauge MqttConnected = Prometheus.Metrics
        .CreateGauge("equipai_mqtt_connected", "MQTT 连接状态（1=已连接, 0=断开）");

    // ========================================================================
    // SignalR 连接指标
    // ========================================================================

    /// <summary>SignalR 活跃连接数（按租户维度）</summary>
    public static readonly Gauge SignalRConnections = Prometheus.Metrics
        .CreateGauge("equipai_signalr_connections", "SignalR 活跃连接数",
            new GaugeConfiguration { LabelNames = new[] { "tenant_id" } });

    // ========================================================================
    // 知识库指标
    // ========================================================================

    /// <summary>知识规则总数（按状态维度）</summary>
    public static readonly Gauge KnowledgeRules = Prometheus.Metrics
        .CreateGauge("equipai_knowledge_rules_total", "知识规则总数",
            new GaugeConfiguration { LabelNames = new[] { "status" } });

    /// <summary>候选规则审批总数（按结果维度）</summary>
    public static readonly Counter PendingRuleReviews = Prometheus.Metrics
        .CreateCounter("equipai_pending_rule_reviews_total", "候选规则审批总数",
            new CounterConfiguration { LabelNames = new[] { "result" } });
}
