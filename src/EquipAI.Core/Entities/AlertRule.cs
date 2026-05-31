using EquipAI.Core.Enums;

namespace EquipAI.Core.Entities;

/// <summary>
/// 告警规则实体，定义告警触发条件
/// 支持静态阈值（Threshold）和组合条件（Combined）两种规则类型
/// </summary>
public class AlertRule : BaseEntity
{
    /// <summary>
    /// 所属租户 ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 规则名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 设备类型过滤（可选），为空时匹配所有设备类型
    /// </summary>
    public string? DeviceType { get; set; }

    /// <summary>
    /// 特定设备 ID（可选），为空时按 DeviceType 匹配
    /// </summary>
    public Guid? DeviceId { get; set; }

    /// <summary>
    /// 监控指标名称（如 temperature、vibration）
    /// </summary>
    public string Metric { get; set; } = string.Empty;

    /// <summary>
    /// 规则类型：Threshold（静态阈值）或 Combined（组合条件）
    /// </summary>
    public RuleType RuleType { get; set; }

    /// <summary>
    /// 比较操作符（>、>=、<、<=、==），仅 Threshold 类型使用
    /// </summary>
    public string? Operator { get; set; }

    /// <summary>
    /// 阈值，仅 Threshold 类型使用
    /// </summary>
    public decimal? Threshold { get; set; }

    /// <summary>
    /// 组合条件 JSONB，仅 Combined 类型使用
    /// 格式：[{"metric":"temperature","operator":">","threshold":80}, ...]
    /// </summary>
    public string? Conditions { get; set; }

    /// <summary>
    /// 告警严重级别
    /// </summary>
    public AlertSeverity Severity { get; set; } = AlertSeverity.Normal;

    /// <summary>
    /// 冷却时间（秒），同一规则在此时间内不重复触发
    /// </summary>
    public int CooldownSeconds { get; set; } = 300;

    /// <summary>
    /// 是否自动创建工单
    /// </summary>
    public bool AutoCreateWorkorder { get; set; }

    /// <summary>
    /// 规则启用状态
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// 规则创建者 ID
    /// </summary>
    public Guid? CreatedBy { get; set; }
}
