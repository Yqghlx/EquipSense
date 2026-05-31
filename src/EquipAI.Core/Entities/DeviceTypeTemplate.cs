namespace EquipAI.Core.Entities;

/// <summary>
/// 设备类型模板实体，支持行业预置模板（归属系统租户）和租户自定义模板
/// </summary>
public class DeviceTypeTemplate : BaseEntity
{
    /// <summary>
    /// 所属租户 ID（系统预置模板使用 SystemTenantId）
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 模板名称（如 "三相异步电机"、"离心泵"）
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 所属行业（如 "制造业"、"化工"、"电力"）
    /// </summary>
    public string? Industry { get; set; }

    /// <summary>
    /// 设备参数定义（JSONB），描述该类型设备的监控指标、单位、范围等
    /// </summary>
    public string Parameters { get; set; } = "{}";

    /// <summary>
    /// 默认告警规则（JSONB 数组），创建设备时可一键套用
    /// </summary>
    public string DefaultAlarmRules { get; set; } = "[]";

    /// <summary>
    /// 默认诊断规则（JSONB 数组），用于 AI 根因分析的知识映射
    /// </summary>
    public string DefaultDiagnosisRules { get; set; } = "[]";

    // 导航属性

    /// <summary>
    /// 所属租户
    /// </summary>
    public Tenant Tenant { get; set; } = null!;
}
