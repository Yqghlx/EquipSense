using System.Text.Json.Serialization;

namespace EquipAI.Application.Evaluation;

/// <summary>
/// 模拟器上报的标准答案载荷
/// </summary>
public class GroundTruthReport
{
    [JsonPropertyName("runId")]
    public string RunId { get; set; } = string.Empty;

    [JsonPropertyName("deviceId")]
    public Guid DeviceId { get; set; }

    [JsonPropertyName("deviceCode")]
    public string DeviceCode { get; set; } = string.Empty;

    [JsonPropertyName("scenarioName")]
    public string ScenarioName { get; set; } = string.Empty;

    [JsonPropertyName("events")]
    public List<GroundTruthEventReport> Events { get; set; } = [];
}

/// <summary>单条故障注入事件</summary>
public class GroundTruthEventReport
{
    [JsonPropertyName("faultType")]
    public string FaultType { get; set; } = string.Empty;

    [JsonPropertyName("expectedRootCause")]
    public string ExpectedRootCause { get; set; } = string.Empty;

    [JsonPropertyName("expectedSeverity")]
    public string ExpectedSeverity { get; set; } = string.Empty;

    [JsonPropertyName("affectedMetrics")]
    public List<string> AffectedMetrics { get; set; } = [];

    [JsonPropertyName("injectedAt")]
    public DateTime InjectedAt { get; set; }
}

/// <summary>
/// 评估结果 — 对比 ground truth 与 analyses 表
/// </summary>
public class EvaluationResult
{
    /// <summary>总注入故障数</summary>
    public int TotalFaults { get; set; }

    /// <summary>AI 有响应且诊断匹配的数量</summary>
    public int MatchedCount { get; set; }

    /// <summary>AI 有响应但诊断不匹配的数量</summary>
    public int MismatchedCount { get; set; }

    /// <summary>AI 无响应（漏报）的数量</summary>
    public int MissedCount { get; set; }

    /// <summary>命中率（0-1）</summary>
    public double HitRate => TotalFaults == 0 ? 0 : (double)MatchedCount / TotalFaults;

    /// <summary>按故障类型分类的统计</summary>
    public List<FaultTypeStat> ByFaultType { get; set; } = [];

    /// <summary>每条故障的评估详情</summary>
    public List<EvaluationDetail> Details { get; set; } = [];
}

/// <summary>按故障类型分类的统计</summary>
public class FaultTypeStat
{
    public string FaultType { get; set; } = string.Empty;
    public int Total { get; set; }
    public int Hit { get; set; }
    public int Missed { get; set; }
}

/// <summary>单条故障的评估详情</summary>
public class EvaluationDetail
{
    public string FaultType { get; set; } = string.Empty;
    public string ExpectedRootCause { get; set; } = string.Empty;
    public string? AiRootCause { get; set; }
    /// <summary>AI 分析级别（1=L2规则匹配, 0=L1 LLM 等），null 表示无分析记录</summary>
    public int? AnalysisLevel { get; set; }
    public double? Confidence { get; set; }
    /// <summary>true=命中, false=有分析但诊断不匹配, null=无分析（漏报）</summary>
    public bool? Matched { get; set; }
    public DateTime InjectedAt { get; set; }
}
