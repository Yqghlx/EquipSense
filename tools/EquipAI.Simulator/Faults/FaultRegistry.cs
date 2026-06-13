namespace EquipAI.Simulator.Faults;

/// <summary>
/// 故障注册表 — 按类型标识查找故障实例，供剧本引擎和随机调度器使用
/// </summary>
public sealed class FaultRegistry
{
    private readonly Dictionary<string, IFaultPattern> _faults;
    private readonly Random _random = new();

    public FaultRegistry()
    {
        _faults = new Dictionary<string, IFaultPattern>(StringComparer.OrdinalIgnoreCase)
        {
            ["bearing_wear"] = new BearingWearFault(),
            ["lubrication_failure"] = new LubricationFailureFault(),
            ["valve_leak"] = new ValveLeakFault(),
            ["overload"] = new OverloadFault(),
            ["discharge_blockage"] = new DischargeBlockageFault(),
            ["sensor_drift"] = new SensorDriftFault(),
        };
    }

    /// <summary>按故障类型标识查找</summary>
    public IFaultPattern Get(string faultType)
    {
        if (!_faults.TryGetValue(faultType, out var fault))
            throw new KeyNotFoundException($"未知故障类型: {faultType}");
        return fault;
    }

    /// <summary>获取全部已注册故障类型</summary>
    public IReadOnlyList<string> GetAllFaultTypes() => _faults.Keys.ToList();

    /// <summary>随机返回一个故障实例（用于随机模式）</summary>
    public IFaultPattern GetRandom()
    {
        var values = _faults.Values.ToList();
        return values[_random.Next(values.Count)];
    }
}
