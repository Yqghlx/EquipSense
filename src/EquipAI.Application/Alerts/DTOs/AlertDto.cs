namespace EquipAI.Application.Alerts.DTOs;

/// <summary>
/// 告警实例 DTO，用于 API 响应
/// </summary>
public class AlertDto
{
    public Guid Id { get; set; }
    public string AlertCode { get; set; } = string.Empty;
    public Guid? RuleId { get; set; }
    public Guid DeviceId { get; set; }
    public string Severity { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Metric { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public decimal? Threshold { get; set; }
    public string? Message { get; set; }
    public DateTime OccurredAt { get; set; }
    public bool Acknowledged { get; set; }
    public bool Resolved { get; set; }
    public int TriggerCount { get; set; }
    public DateTime? WindowStartAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// 确认告警请求
/// </summary>
public class AcknowledgeAlertRequest
{
    public string? Note { get; set; }
}

/// <summary>
/// 解决告警请求
/// </summary>
public class ResolveAlertRequest
{
    public string Resolution { get; set; } = string.Empty;
}
