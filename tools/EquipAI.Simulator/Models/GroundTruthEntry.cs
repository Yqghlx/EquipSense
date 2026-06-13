namespace EquipAI.Simulator.Models;

/// <summary>
/// 标准答案日志的顶层结构 — 一个运行批次对应一个文件
/// </summary>
public sealed class GroundTruthLog
{
    /// <summary>运行批次 ID（时间戳）</summary>
    public string RunId { get; set; } = string.Empty;

    /// <summary>设备编码</summary>
    public string DeviceCode { get; set; } = string.Empty;

    /// <summary>剧本名称（随机模式为 "random"）</summary>
    public string Scenario { get; set; } = string.Empty;

    /// <summary>运行开始时间（UTC ISO 8601）</summary>
    public string StartedAt { get; set; } = string.Empty;

    /// <summary>事件列表</summary>
    public List<GroundTruthEvent> Events { get; set; } = [];
}

/// <summary>单个故障注入/移除事件</summary>
public sealed class GroundTruthEvent
{
    /// <summary>事件发生的真实时间（UTC ISO 8601）</summary>
    public string InjectedAt { get; set; } = string.Empty;

    /// <summary>故障类型标识</summary>
    public string FaultType { get; set; } = string.Empty;

    /// <summary>受影响的指标列表</summary>
    public List<string> AffectedMetrics { get; set; } = [];

    /// <summary>预期根因诊断</summary>
    public string ExpectedRootCause { get; set; } = string.Empty;

    /// <summary>预期严重级别</summary>
    public string ExpectedSeverity { get; set; } = string.Empty;

    /// <summary>动作：started 或 stopped</summary>
    public string Action { get; set; } = "started";

    /// <summary>故障持续时间（仅 stop 事件填写）</summary>
    public string Duration { get; set; } = string.Empty;
}
