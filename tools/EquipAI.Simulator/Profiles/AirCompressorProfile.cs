using System.Collections.ObjectModel;
using EquipAI.Simulator.Models;

namespace EquipAI.Simulator.Profiles;

/// <summary>
/// 空压机设备画像 — 指标定义对齐种子 DataSeeder 中的空压机模板
/// 参数依据：spec 第五章"指标对齐与告警规则联动"
/// </summary>
public sealed class AirCompressorProfile : DeviceProfile
{
    public override string DeviceType => "空压机";

    public override IReadOnlyDictionary<string, MetricSpec> Metrics { get; } =
        new ReadOnlyDictionary<string, MetricSpec>(new Dictionary<string, MetricSpec>
        {
            // 排气压力：基线 0.7 MPa，几乎不受昼夜影响
            ["discharge_pressure"] = new(0.7, 0.01, 0.02, 0.001),
            // 油温：基线 65°C，受环境温度影响大
            ["oil_temperature"] = new(65.0, 1.0, 3.0, 0.05),
            // 振动：基线 2.5 mm/s
            ["vibration"] = new(2.5, 0.2, 0.1, 0.01),
            // 电机电流：基线 120 A
            ["motor_current"] = new(120.0, 2.0, 5.0, 0.1),
            // 排气量：基线 20 m³/min
            ["air_flow"] = new(20.0, 0.3, 1.0, 0.02),
        });
}
