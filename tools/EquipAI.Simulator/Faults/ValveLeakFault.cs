namespace EquipAI.Simulator.Faults;

/// <summary>
/// 阀片泄漏故障 — 排气压力 10 分钟内缓降 0.2（0.7→0.5），触发 LT 0.5 告警
/// </summary>
public sealed class ValveLeakFault : IFaultPattern
{
    private static readonly TimeSpan RampDuration = TimeSpan.FromMinutes(10);

    public string FaultType => "valve_leak";
    public IReadOnlyList<string> AffectedMetrics { get; } = new[] { "discharge_pressure", "air_flow", "oil_temperature" };
    public string ExpectedRootCause => "气阀泄漏，检查阀片密封";
    public string ExpectedSeverity => "High";

    public double Delta(string metric, TimeSpan elapsed)
    {
        var progress = Math.Min(elapsed.TotalSeconds / RampDuration.TotalSeconds, 1.0);
        return metric switch
        {
            "discharge_pressure" => -0.2 * progress,
            "air_flow" => -4.0 * progress,
            "oil_temperature" => 8.0 * progress,
            _ => 0
        };
    }
}
