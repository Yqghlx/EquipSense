using EquipAI.Core.Enums;

namespace EquipAI.Core.Entities;

/// <summary>
/// 告警实例实体，记录每次告警触发详情
/// 告警生命周期：Active → Acknowledged → Resolved
/// </summary>
public class Alert : BaseEntity
{
    /// <summary>
    /// 所属租户 ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 告警编码，格式：ALT-{device_code}-{metric}-{yyyyMMddHHmmss}
    /// </summary>
    public string AlertCode { get; set; } = string.Empty;

    /// <summary>
    /// 关联的告警规则 ID（可为空，表示手动创建的告警）
    /// </summary>
    public Guid? RuleId { get; set; }

    /// <summary>
    /// 触发告警的设备 ID
    /// </summary>
    public Guid DeviceId { get; set; }

    /// <summary>
    /// 告警严重级别
    /// </summary>
    public AlertSeverity Severity { get; set; }

    /// <summary>
    /// 告警当前状态
    /// </summary>
    public AlertStatus Status { get; set; } = AlertStatus.Active;

    /// <summary>
    /// 触发告警的指标名称
    /// </summary>
    public string Metric { get; set; } = string.Empty;

    /// <summary>
    /// 触发时的指标值
    /// </summary>
    public decimal Value { get; set; }

    /// <summary>
    /// 触发阈值
    /// </summary>
    public decimal? Threshold { get; set; }

    /// <summary>
    /// 告警消息（如"温度超过阈值 90°C"）
    /// </summary>
    public string? Message { get; set; }

    /// <summary>
    /// 数据快照 JSONB，记录告警触发时的设备全量指标数据
    /// </summary>
    public string? DataSnapshot { get; set; }

    /// <summary>
    /// 聚合来源告警 ID 列表（防风暴聚合时使用）
    /// </summary>
    public Guid[]? AggregatedFrom { get; set; }

    /// <summary>
    /// 聚合窗口内触发次数（防风暴机制计数）
    /// </summary>
    public int TriggerCount { get; set; } = 1;

    /// <summary>
    /// 聚合窗口开始时间（首次触发时间）
    /// </summary>
    public DateTime? WindowStartAt { get; set; }

    /// <summary>
    /// 告警发生时间
    /// </summary>
    public DateTime OccurredAt { get; set; }

    /// <summary>
    /// 确认人 ID
    /// </summary>
    public Guid? AcknowledgedBy { get; set; }

    /// <summary>
    /// 确认时间
    /// </summary>
    public DateTime? AcknowledgedAt { get; set; }

    /// <summary>
    /// 确认备注
    /// </summary>
    public string? AcknowledgementNote { get; set; }

    /// <summary>
    /// 解决人 ID
    /// </summary>
    public Guid? ResolvedBy { get; set; }

    /// <summary>
    /// 解决时间
    /// </summary>
    public DateTime? ResolvedAt { get; set; }

    /// <summary>
    /// 解决说明
    /// </summary>
    public string? Resolution { get; set; }
}
