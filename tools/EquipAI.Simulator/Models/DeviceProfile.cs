namespace EquipAI.Simulator.Models;

/// <summary>
/// 设备画像基类 — 定义某类设备的指标规格和设备类型标识
/// 子类（如 AirCompressorProfile）填充具体指标参数
/// </summary>
public abstract class DeviceProfile
{
    /// <summary>设备类型标识（与种子模板的 Name 对应）</summary>
    public abstract string DeviceType { get; }

    /// <summary>该设备类型的所有遥测指标规格</summary>
    public abstract IReadOnlyDictionary<string, MetricSpec> Metrics { get; }
}
