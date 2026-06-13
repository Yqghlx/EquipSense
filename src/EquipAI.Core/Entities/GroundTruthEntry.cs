namespace EquipAI.Core.Entities;

/// <summary>
/// 标准答案记录 — 模拟器注入故障时上报，用于评估 AI 诊断准确率
/// </summary>
public class GroundTruthEntry : BaseEntity
{
    /// <summary>所属租户 ID</summary>
    public Guid TenantId { get; set; }

    /// <summary>运行批次 ID（一次模拟器运行唯一）</summary>
    public string RunId { get; set; } = string.Empty;

    /// <summary>设备 ID（模拟器发送遥测用的 Guid）</summary>
    public Guid DeviceId { get; set; }

    /// <summary>设备编码（人类可读，如 AC-001）</summary>
    public string DeviceCode { get; set; } = string.Empty;

    /// <summary>剧本名称</summary>
    public string ScenarioName { get; set; } = string.Empty;

    /// <summary>故障类型标识（如 bearing_wear / overload）</summary>
    public string FaultType { get; set; } = string.Empty;

    /// <summary>预期根因诊断（标准答案）</summary>
    public string ExpectedRootCause { get; set; } = string.Empty;

    /// <summary>预期严重级别</summary>
    public string ExpectedSeverity { get; set; } = string.Empty;

    /// <summary>受影响的指标列表（JSON 数组，如 ["motor_current","oil_temperature"]）</summary>
    public string AffectedMetrics { get; set; } = "[]";

    /// <summary>故障注入的真实时间（UTC）</summary>
    public DateTime InjectedAt { get; set; }
}
