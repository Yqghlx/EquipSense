namespace EquipAI.Simulator.Models;

/// <summary>
/// 单个遥测指标的规格定义
/// </summary>
/// <param name="Baseline">正常工况下的基线值</param>
/// <param name="NoiseStdDev">高斯噪声标准差</param>
/// <param name="PeriodicAmplitude">昼夜周期振幅</param>
/// <param name="TrendStep">布朗运动步长（每采样点的随机游走幅度）</param>
public sealed record MetricSpec(double Baseline, double NoiseStdDev, double PeriodicAmplitude, double TrendStep);
