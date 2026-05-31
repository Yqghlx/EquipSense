namespace EquipAI.Application.Alerts.DTOs;

/// <summary>
/// 更新告警规则请求（仅更新非 null 字段）
/// </summary>
public class UpdateAlertRuleRequest
{
    public string? Name { get; set; }
    public string? DeviceType { get; set; }
    public Guid? DeviceId { get; set; }
    public string? Metric { get; set; }
    public string? RuleType { get; set; }
    public string? Operator { get; set; }
    public decimal? Threshold { get; set; }
    public string? Conditions { get; set; }
    public string? Severity { get; set; }
    public int? CooldownSeconds { get; set; }
    public bool? AutoCreateWorkorder { get; set; }
    public bool? Enabled { get; set; }
}
