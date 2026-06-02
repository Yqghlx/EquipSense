namespace EquipAI.Simulator;

/// <summary>
/// 模拟传感器配置 — 定义正弦波参数
/// </summary>
/// <param name="Name">指标名称（如 temperature）</param>
/// <param name="BaseValue">基线值</param>
/// <param name="Amplitude">振幅（值在 BaseValue±Amplitude 范围波动）</param>
/// <param name="Frequency">频率 Hz（控制波动速度）</param>
/// <param name="NoiseStdDev">高斯噪声标准差（0 表示无噪声）</param>
public record SensorConfig(
    string Name,
    double BaseValue,
    double Amplitude,
    double Frequency = 0.01,
    double NoiseStdDev = 0.0);
