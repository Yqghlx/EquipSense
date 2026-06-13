using EquipAI.Simulator.Faults;
using EquipAI.Simulator.Models;

namespace EquipAI.Simulator.Engine;

/// <summary>
/// 随机故障调度器 — 按 faultRate 概率在空闲时随机注入故障
/// 同一时刻只保留一个活跃故障，达 maxDuration 后自动移除
/// 用于长期运行测试告警引擎稳定性
/// </summary>
public sealed class RandomFaultScheduler
{
    private readonly FaultRegistry _registry;
    private readonly Random _random;
    private readonly double _faultRate;
    private readonly int _maxDurationMinutes;
    private readonly List<ActiveFault> _activeFaults = new();

    public IReadOnlyList<ActiveFault> ActiveFaults => _activeFaults;

    public RandomFaultScheduler(double faultRate, int maxDurationMinutes, int? seed = null)
        : this(new FaultRegistry(), faultRate, maxDurationMinutes, seed) { }

    public RandomFaultScheduler(FaultRegistry registry, double faultRate, int maxDurationMinutes, int? seed = null)
    {
        if (faultRate < 0 || faultRate > 1)
            throw new ArgumentOutOfRangeException(nameof(faultRate), "faultRate 必须在 [0, 1] 范围内");
        _registry = registry;
        _faultRate = faultRate;
        _maxDurationMinutes = maxDurationMinutes;
        _random = seed.HasValue ? new Random(seed.Value) : new Random();
        _registry.UseRandom(_random);
    }

    public void Tick(TimeSpan currentSimulatedTime)
    {
        // 1. 移除已达最大时长的故障
        var removedAny = false;
        for (var i = _activeFaults.Count - 1; i >= 0; i--)
        {
            var fault = _activeFaults[i];
            var elapsed = fault.ElapsedAt(currentSimulatedTime);
            if (elapsed.TotalMinutes >= _maxDurationMinutes)
            {
                _activeFaults.RemoveAt(i);
                removedAny = true;
            }
        }

        // 2. 空闲时按概率注入新故障
        // 注意：本 Tick 内若刚移除达最大时长的故障，则不再立即注入新故障
        // 避免故障叠加干扰诊断，保证移除语义对调用方可见
        if (!removedAny && _activeFaults.Count == 0 && _random.NextDouble() < _faultRate)
        {
            var pattern = _registry.GetRandom();
            _activeFaults.Add(new ActiveFault(pattern, currentSimulatedTime));
        }
    }
}
