namespace EquipAI.Simulator.Faults;

/// <summary>
/// 过载故障 — 电流 1 分钟内阶跃 +60A（120→180），触发 GT 180 告警
/// </summary>
public sealed class OverloadFault : IFaultPattern
{
    public string FaultType => "overload";
    public IReadOnlyList<string> AffectedMetrics { get; } = new[] { "motor_current", "oil_temperature", "vibration" };
    public string ExpectedRootCause => "电机过载，检查负载和电压";
    public string ExpectedSeverity => "High";

    public double Delta(string metric, TimeSpan elapsed)
    {
        return metric switch
        {
            "motor_current" => RampValue(elapsed, TimeSpan.FromMinutes(1), 60.0),
            "oil_temperature" => RampValue(elapsed, TimeSpan.FromMinutes(10), 10.0),
            "vibration" => RampValue(elapsed, TimeSpan.FromMinutes(10), 0.8),
            _ => 0
        };
    }

    private static double RampValue(TimeSpan elapsed, TimeSpan rampDuration, double target)
    {
        if (elapsed >= rampDuration) return target;
        return target * (elapsed.TotalSeconds / rampDuration.TotalSeconds);
    }
}
