namespace EquipAI.Simulator.Faults;

/// <summary>
/// 排气堵塞故障 — 排气压力 3 分钟内急升 +0.4（0.7→1.1），触发 GT 1.1 告警
/// </summary>
public sealed class DischargeBlockageFault : IFaultPattern
{
    private static readonly TimeSpan RampDuration = TimeSpan.FromMinutes(3);

    public string FaultType => "discharge_blockage";
    public IReadOnlyList<string> AffectedMetrics { get; } = new[] { "discharge_pressure", "air_flow", "oil_temperature" };
    public string ExpectedRootCause => "排气系统堵塞，检查过滤器";
    public string ExpectedSeverity => "Critical";

    public double Delta(string metric, TimeSpan elapsed)
    {
        var progress = Math.Min(elapsed.TotalSeconds / RampDuration.TotalSeconds, 1.0);
        return metric switch
        {
            "discharge_pressure" => 0.4 * progress,
            "air_flow" => -6.0 * progress,
            "oil_temperature" => 20.0 * progress,
            _ => 0
        };
    }
}
