namespace EquipAI.Simulator.Faults;

/// <summary>
/// 传感器漂移故障 — 仅 discharge_pressure 每分钟偏移 +0.005，约 80 分钟达阈值 1.1
/// </summary>
public sealed class SensorDriftFault : IFaultPattern
{
    private const double DriftPerMinute = 0.005;

    public string FaultType => "sensor_drift";
    public IReadOnlyList<string> AffectedMetrics { get; } = new[] { "discharge_pressure" };
    public string ExpectedRootCause => "传感器漂移，建议校准或更换";
    public string ExpectedSeverity => "Normal";

    public double Delta(string metric, TimeSpan elapsed)
    {
        return metric == "discharge_pressure"
            ? DriftPerMinute * elapsed.TotalMinutes
            : 0;
    }
}
