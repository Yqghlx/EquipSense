namespace EquipAI.Core.Interfaces;

/// <summary>
/// 遥测数据服务接口，提供遥测数据的接入和查询能力
/// 支持批量写入队列，定时或定量 flush 到数据库
/// </summary>
public interface ITelemetryService
{
    /// <summary>
    /// 将遥测数据加入批量写入队列
    /// 数据会在队列满 100 条或每 500ms 时自动 flush
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="deviceId">设备 ID</param>
    /// <param name="metric">指标名称</param>
    /// <param name="value">指标值</param>
    /// <param name="timestamp">数据时间戳</param>
    /// <param name="quality">数据质量</param>
    /// <param name="source">数据来源（mqtt/http）</param>
    Task EnqueueAsync(Guid tenantId, Guid deviceId, string metric, double value,
        DateTime timestamp, string quality = "good", string source = "mqtt");

    /// <summary>
    /// 将遥测加入批量写入队列，并等待该条数据所属批次完成持久化。
    /// MQTT 消费路径使用此方法，只有数据库事务成功后才允许消息处理器返回；
    /// 持久化失败会向上游报告，避免 Broker 在数据尚未落库时收到成功确认。
    /// </summary>
    Task EnqueueAndWaitForPersistenceAsync(Guid tenantId, Guid deviceId, string metric, double value,
        DateTime timestamp, string quality = "good", string source = "mqtt");

    /// <summary>
    /// 手动 flush 批量写入队列中的所有数据到数据库
    /// </summary>
    Task FlushAsync();
}
