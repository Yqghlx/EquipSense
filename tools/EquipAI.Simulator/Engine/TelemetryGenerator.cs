using EquipAI.Simulator.Models;

namespace EquipAI.Simulator.Engine;

/// <summary>
/// 遥测数据合成器 — 将设备画像的基线、趋势、周期、噪声与活跃故障叠加
/// 生成最终发送到 MQTT 的指标值
///
/// 数据模型：metric(t) = baseline + trend(t) + periodic(t) + noise(t) + Σ fault_delta(t)
/// </summary>
public sealed class TelemetryGenerator
{
    private readonly DeviceProfile _profile;
    private readonly Random _random;
    private readonly Dictionary<string, double> _trendState = new();

    public TelemetryGenerator(DeviceProfile profile, int? seed = null)
    {
        _profile = profile;
        _random = seed.HasValue ? new Random(seed.Value) : new Random();

        foreach (var metric in profile.Metrics.Keys)
            _trendState[metric] = 0;
    }

    /// <summary>
    /// 生成当前时刻所有指标的值
    /// </summary>
    /// <param name="currentTime">模拟时间（从启动起算的时长）</param>
    /// <param name="activeFaults">当前活跃的故障列表</param>
    public Dictionary<string, double> Generate(TimeSpan currentTime, IReadOnlyList<ActiveFault> activeFaults)
    {
        var result = new Dictionary<string, double>();
        var hourOfDay = currentTime.TotalHours % 24;

        foreach (var (metric, spec) in _profile.Metrics)
        {
            // 1. 基线
            var value = spec.Baseline;

            // 2. 趋势（布朗运动 — 小步长随机游走，保证时序相关性）
            var trendStep = (_random.NextDouble() - 0.5) * 2 * spec.TrendStep;
            _trendState[metric] += trendStep;
            value += _trendState[metric];

            // 3. 周期（24 小时昼夜正弦波）
            value += spec.PeriodicAmplitude * Math.Sin(2 * Math.PI * hourOfDay / 24);

            // 4. 噪声（高斯白噪声，Box-Muller）
            value += GenerateGaussian(0, spec.NoiseStdDev);

            // 5. 故障叠加
            foreach (var fault in activeFaults)
            {
                var elapsed = fault.ElapsedAt(currentTime);
                value += fault.Pattern.Delta(metric, elapsed);
            }

            // 物理约束：非负
            result[metric] = Math.Round(Math.Max(0, value), 2);
        }

        return result;
    }

    /// <summary>Box-Muller 变换生成高斯随机数</summary>
    private double GenerateGaussian(double mean, double stdDev)
    {
        var u1 = 1.0 - _random.NextDouble();
        var u2 = 1.0 - _random.NextDouble();
        var normal = Math.Sqrt(-2.0 * Math.Log(u1)) * Math.Cos(2.0 * Math.PI * u2);
        return mean + stdDev * normal;
    }
}
