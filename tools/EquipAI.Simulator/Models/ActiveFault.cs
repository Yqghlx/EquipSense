using EquipAI.Simulator.Faults;

namespace EquipAI.Simulator.Models;

/// <summary>
/// 运行时活跃故障 — 记录某个故障模式及其注入时刻
/// </summary>
public sealed class ActiveFault
{
    /// <summary>故障模式实例</summary>
    public IFaultPattern Pattern { get; }

    /// <summary>故障注入时刻（模拟时间）</summary>
    public TimeSpan InjectedAt { get; }

    public ActiveFault(IFaultPattern pattern, TimeSpan injectedAt)
    {
        Pattern = pattern;
        InjectedAt = injectedAt;
    }

    /// <summary>故障已持续时间（给定当前模拟时间）</summary>
    public TimeSpan ElapsedAt(TimeSpan currentSimulatedTime) =>
        currentSimulatedTime >= InjectedAt ? currentSimulatedTime - InjectedAt : TimeSpan.Zero;
}
