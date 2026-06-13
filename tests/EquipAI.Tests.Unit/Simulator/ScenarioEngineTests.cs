using EquipAI.Simulator.Engine;
using EquipAI.Simulator.Models;
using FluentAssertions;
using Xunit;

namespace EquipAI.Tests.Unit.Simulator;

public class ScenarioEngineTests
{
    private static FaultScenario MakeScenario(params (string at, string action, string fault)[] entries) =>
        new()
        {
            Name = "test",
            DeviceCode = "AC-001",
            TimeScale = 1,
            Timeline = entries.Select(e => new ScenarioTimelineEntry
            {
                At = e.at,
                Action = e.action,
                FaultType = e.fault,
            }).ToList(),
        };

    [Fact]
    public void 时间线到达_应注入对应故障()
    {
        var scenario = MakeScenario(("00:01:00", "start", "overload"));
        var engine = new ScenarioEngine(scenario);

        engine.Tick(TimeSpan.FromSeconds(30));
        engine.ActiveFaults.Should().BeEmpty("30 秒时还未到 1 分钟触发点");

        engine.Tick(TimeSpan.FromMinutes(1));
        engine.ActiveFaults.Should().ContainSingle();
        engine.ActiveFaults[0].Pattern.FaultType.Should().Be("overload");
    }

    [Fact]
    public void Stop动作_应移除已注入故障()
    {
        var scenario = MakeScenario(
            ("00:00:30", "start", "overload"),
            ("00:05:00", "stop", "overload"));
        var engine = new ScenarioEngine(scenario);

        engine.Tick(TimeSpan.FromSeconds(30));
        engine.ActiveFaults.Should().HaveCount(1);

        engine.Tick(TimeSpan.FromMinutes(5));
        engine.ActiveFaults.Should().BeEmpty("stop 动作后故障应被移除");
    }

    [Fact]
    public void Tick_应更新已注入故障的持续时间()
    {
        var scenario = MakeScenario(("00:00:00", "start", "overload"));
        var engine = new ScenarioEngine(scenario);

        engine.Tick(TimeSpan.FromMinutes(10));
        engine.ActiveFaults.Should().ContainSingle();
        var elapsed = engine.ActiveFaults[0].ElapsedAt(TimeSpan.FromMinutes(10));
        elapsed.TotalMinutes.Should().BeApproximately(10, 0.1);
    }
}
