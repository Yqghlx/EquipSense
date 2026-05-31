namespace EquipAI.Application.Alerts.DTOs;

/// <summary>
/// 创建告警规则请求
/// </summary>
public class CreateAlertRuleRequest
{
    public string Name { get; set; } = string.Empty;
    public string? DeviceType { get; set; }
    public Guid? DeviceId { get; set; }
    public string Metric { get; set; } = string.Empty;
    public string RuleType { get; set; } = "threshold";
    public string? Operator { get; set; }
    public decimal? Threshold { get; set; }
    public string? Conditions { get; set; }
    public string Severity { get; set; } = "normal";
    public int CooldownSeconds { get; set; } = 300;
    public bool AutoCreateWorkorder { get; set; }
}
