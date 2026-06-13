namespace EquipAI.Simulator.Faults;

/// <summary>
/// 润滑失效故障 — 油温在 2 分钟内阶跃 +25°C（65→90），振动随之缓升
/// </summary>
public sealed class LubricationFailureFault : IFaultPattern
{
    private const double OilTempStep = 25.0;
    private static readonly TimeSpan OilTempStepDuration = TimeSpan.FromMinutes(2);
    private const double VibrationStep = 1.5;
    private static readonly TimeSpan VibrationRampDuration = TimeSpan.FromMinutes(30);

    public string FaultType => "lubrication_failure";
    public IReadOnlyList<string> AffectedMetrics { get; } = new[] { "oil_temperature", "vibration" };
    public string ExpectedRootCause => "润滑系统故障，检查油位和油泵";
    public string ExpectedSeverity => "Critical";

    public double Delta(string metric, TimeSpan elapsed)
    {
        return metric switch
        {
            "oil_temperature" => RampValue(elapsed, OilTempStepDuration, OilTempStep),
            "vibration" => RampValue(elapsed, VibrationRampDuration, VibrationStep),
            _ => 0
        };
    }

    private static double RampValue(TimeSpan elapsed, TimeSpan rampDuration, double target)
    {
        if (elapsed >= rampDuration) return target;
        return target * (elapsed.TotalSeconds / rampDuration.TotalSeconds);
    }
}
