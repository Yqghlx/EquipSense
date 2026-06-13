using System.Text.Json.Serialization;

namespace EquipAI.Simulator.Models;

/// <summary>
/// 故障剧本 JSON 模型 — 定义按时间线注入/移除故障的序列
/// </summary>
public sealed class FaultScenario
{
    /// <summary>剧本名称</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>目标设备编码</summary>
    public string DeviceCode { get; set; } = string.Empty;

    /// <summary>剧本描述</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>时间加速倍率（1 秒真实 = N 秒模拟）</summary>
    public int TimeScale { get; set; } = 1;

    /// <summary>时间线条目列表</summary>
    public List<ScenarioTimelineEntry> Timeline { get; set; } = [];
}

/// <summary>剧本时间线单条目</summary>
public sealed class ScenarioTimelineEntry
{
    /// <summary>触发时刻（格式 HH:MM:SS）</summary>
    public string At { get; set; } = "00:00:00";

    /// <summary>动作：start 或 stop</summary>
    [JsonPropertyName("action")]
    public string Action { get; set; } = "start";

    /// <summary>故障类型标识</summary>
    [JsonPropertyName("faultType")]
    public string FaultType { get; set; } = string.Empty;

    /// <summary>将 At 字符串解析为 TimeSpan</summary>
    public TimeSpan ParseAt() =>
        TimeSpan.TryParseExact(At, @"hh\:mm\:ss", null, out var ts) ? ts : TimeSpan.Zero;
}
