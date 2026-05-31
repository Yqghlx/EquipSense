namespace EquipAI.Application.Alerts.DTOs;

/// <summary>
/// 告警规则 DTO，用于 API 响应
/// </summary>
public class AlertRuleDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? DeviceType { get; set; }
    public Guid? DeviceId { get; set; }
    public string Metric { get; set; } = string.Empty;
    public string RuleType { get; set; } = string.Empty;
    public string? Operator { get; set; }
    public decimal? Threshold { get; set; }
    public string? Conditions { get; set; }
    public decimal? BaselineStddevMultiplier { get; set; }
    public string Severity { get; set; } = string.Empty;
    public int CooldownSeconds { get; set; }
    public bool AutoCreateWorkorder { get; set; }
    public bool Enabled { get; set; }
    public DateTime CreatedAt { get; set; }
}
