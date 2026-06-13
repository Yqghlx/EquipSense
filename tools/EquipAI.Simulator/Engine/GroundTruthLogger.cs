using System.Text.Json;
using EquipAI.Simulator.Faults;
using EquipAI.Simulator.Models;

namespace EquipAI.Simulator.Engine;

/// <summary>
/// 标准答案记录器 — 记录每次故障注入/移除事件到内存，运行结束时序列化为 JSON 文件
/// 供后续评估 AI 诊断准确率使用
/// </summary>
public sealed class GroundTruthLogger
{
    private readonly GroundTruthLog _log;
    private readonly Dictionary<string, DateTime> _injectedAt = new(StringComparer.OrdinalIgnoreCase);

    public GroundTruthLogger(string deviceCode, string scenarioName)
    {
        var now = DateTime.UtcNow;
        _log = new GroundTruthLog
        {
            RunId = now.ToString("yyyy-MM-ddTHH-mm-ss"),
            DeviceCode = deviceCode,
            Scenario = scenarioName,
            StartedAt = now.ToString("o"),
        };
    }

    /// <summary>记录故障注入事件</summary>
    public void LogFaultInjected(IFaultPattern fault, DateTime realTime)
    {
        _injectedAt[fault.FaultType] = realTime;
        _log.Events.Add(new GroundTruthEvent
        {
            InjectedAt = realTime.ToString("o"),
            FaultType = fault.FaultType,
            AffectedMetrics = fault.AffectedMetrics.ToList(),
            ExpectedRootCause = fault.ExpectedRootCause,
            ExpectedSeverity = fault.ExpectedSeverity,
            Action = "started",
        });
    }

    /// <summary>记录故障移除事件</summary>
    public void LogFaultStopped(IFaultPattern fault, DateTime realTime)
    {
        var duration = _injectedAt.TryGetValue(fault.FaultType, out var injected)
            ? (realTime - injected).ToString()
            : "unknown";

        _log.Events.Add(new GroundTruthEvent
        {
            InjectedAt = realTime.ToString("o"),
            FaultType = fault.FaultType,
            Action = "stopped",
            Duration = duration,
        });

        _injectedAt.Remove(fault.FaultType);
    }

    /// <summary>构建当前日志对象（不写文件）</summary>
    public GroundTruthLog BuildLog() => _log;

    /// <summary>将日志序列化写入文件</summary>
    public async Task SaveAsync(string directory, CancellationToken ct = default)
    {
        Directory.CreateDirectory(directory);
        var path = Path.Combine(directory, $"ground-truth-{_log.RunId}.json");
        var json = JsonSerializer.Serialize(_log, new JsonSerializerOptions
        {
            WriteIndented = true,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        });
        await File.WriteAllTextAsync(path, json, ct);
    }
}
