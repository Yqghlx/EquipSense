namespace EquipAI.Simulator;

/// <summary>
/// 模拟传感器 — 生成正弦波 + 高斯噪声的物理量
/// 值 = BaseValue + Amplitude * sin(2π * Frequency * t) + N(0, NoiseStdDev)
/// </summary>
public class SimulatedSensor
{
    private readonly SensorConfig _config;
    private readonly Random _random;

    public string Name => _config.Name;

    public SimulatedSensor(SensorConfig config, int? seed = null)
    {
        _config = config;
        _random = seed.HasValue ? new Random(seed.Value) : new Random();
    }

    /// <summary>
    /// 获取指定时刻的模拟值
    /// </summary>
    public double GetValue(DateTime timestamp)
    {
        var t = timestamp.Ticks / (double)TimeSpan.TicksPerSecond;
        var sine = _config.Amplitude * Math.Sin(2.0 * Math.PI * _config.Frequency * t);
        var noise = _config.NoiseStdDev > 0 ? SampleGaussian() * _config.NoiseStdDev : 0.0;
        return _config.BaseValue + sine + noise;
    }

    /// <summary>
    /// Box-Muller 变换生成标准正态分布随机数
    /// </summary>
    private double SampleGaussian()
    {
        double u1, u2;
        do { u1 = _random.NextDouble(); } while (u1 == 0);
        u2 = _random.NextDouble();
        return Math.Sqrt(-2.0 * Math.Log(u1)) * Math.Cos(2.0 * Math.PI * u2);
    }
}
