namespace EquipAI.Simulator.Faults;

/// <summary>
/// 轴承磨损故障 — 振动按 base × 0.02 × hours 线性渐增
/// 空压机振动基线 2.5，约 90 小时达阈值 7.0
/// </summary>
public sealed class BearingWearFault : IFaultPattern
{
    private const double VibrationBaseline = 2.5;
    private const double VibrationRatePerHour = 0.02;
    private const double OilTempRatePerHour = 0.1;

    public string FaultType => "bearing_wear";
    public IReadOnlyList<string> AffectedMetrics { get; } = new[] { "vibration", "oil_temperature" };
    public string ExpectedRootCause => "轴承磨损，建议检查润滑和游隙";
    public string ExpectedSeverity => "High";

    public double Delta(string metric, TimeSpan elapsed)
    {
        var hours = elapsed.TotalHours;
        return metric switch
        {
            "vibration" => VibrationBaseline * VibrationRatePerHour * hours,
            "oil_temperature" => OilTempRatePerHour * hours,
            _ => 0
        };
    }
}
