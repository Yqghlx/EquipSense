using EquipAI.Simulator.Faults;
using EquipAI.Simulator.Models;

namespace EquipAI.Simulator.Engine;

/// <summary>
/// 剧本引擎 — 按 JSON 剧本的时间线注入和移除故障
/// 每次 Tick 传入当前模拟时间，引擎检查时间线并更新活跃故障列表
/// </summary>
public sealed class ScenarioEngine
{
    private readonly FaultScenario _scenario;
    private readonly FaultRegistry _registry;
    private readonly List<ActiveFault> _activeFaults = new();
    private readonly HashSet<string> _processedEntries = new();

    public IReadOnlyList<ActiveFault> ActiveFaults => _activeFaults;

    public ScenarioEngine(FaultScenario scenario) : this(scenario, new FaultRegistry()) { }

    public ScenarioEngine(FaultScenario scenario, FaultRegistry registry)
    {
        _scenario = scenario;
        _registry = registry;
    }

    /// <summary>
    /// 推进到指定模拟时间，处理所有已到点的剧本条目
    /// </summary>
    public void Tick(TimeSpan currentSimulatedTime)
    {
        for (var i = 0; i < _scenario.Timeline.Count; i++)
        {
            var entry = _scenario.Timeline[i];
            var entryKey = $"{i}-{entry.At}-{entry.Action}-{entry.FaultType}";
            if (_processedEntries.Contains(entryKey)) continue;

            var triggerTime = entry.ParseAt();
            if (triggerTime > currentSimulatedTime) continue;

            if (entry.Action.Equals("start", StringComparison.OrdinalIgnoreCase))
            {
                if (!_activeFaults.Any(f => f.Pattern.FaultType.Equals(entry.FaultType, StringComparison.OrdinalIgnoreCase)))
                {
                    var pattern = _registry.Get(entry.FaultType);
                    // 注入时刻使用剧本条目的触发时刻，而非当前 Tick 时间
                    // 这样在 Tick 时间晚于触发时刻时（如补跑历史），故障持续时间从触发时刻起算
                    _activeFaults.Add(new ActiveFault(pattern, triggerTime));
                }
            }
            else if (entry.Action.Equals("stop", StringComparison.OrdinalIgnoreCase))
            {
                _activeFaults.RemoveAll(f => f.Pattern.FaultType.Equals(entry.FaultType, StringComparison.OrdinalIgnoreCase));
            }

            _processedEntries.Add(entryKey);
        }
    }
}
