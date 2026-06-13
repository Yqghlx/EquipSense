using EquipAI.Simulator.Engine;
using FluentAssertions;
using Xunit;

namespace EquipAI.Tests.Unit.Simulator;

public class RandomFaultSchedulerTests
{
    [Fact]
    public void 高概率_应在首次Tick注入故障()
    {
        var scheduler = new RandomFaultScheduler(faultRate: 1.0, maxDurationMinutes: 1, seed: 42);

        scheduler.Tick(TimeSpan.Zero);
        scheduler.ActiveFaults.Should().NotBeEmpty("概率 100% 时应立即注入");
    }

    [Fact]
    public void 零概率_应永不注入故障()
    {
        var scheduler = new RandomFaultScheduler(faultRate: 0.0, maxDurationMinutes: 1, seed: 42);

        for (var i = 0; i < 100; i++)
            scheduler.Tick(TimeSpan.FromMinutes(i));

        scheduler.ActiveFaults.Should().BeEmpty("概率 0% 时应永不注入");
    }

    [Fact]
    public void 故障达最大时长_应自动移除()
    {
        var scheduler = new RandomFaultScheduler(faultRate: 1.0, maxDurationMinutes: 5, seed: 42);

        scheduler.Tick(TimeSpan.Zero);
        scheduler.ActiveFaults.Should().HaveCount(1);

        scheduler.Tick(TimeSpan.FromMinutes(5));
        scheduler.ActiveFaults.Should().BeEmpty("达最大时长后应自动移除");
    }

    [Fact]
    public void 同时只保留一个活跃故障()
    {
        var scheduler = new RandomFaultScheduler(faultRate: 1.0, maxDurationMinutes: 10, seed: 42);

        for (var i = 0; i < 5; i++)
            scheduler.Tick(TimeSpan.FromMinutes(i));

        scheduler.ActiveFaults.Should().HaveCount(1, "同一时刻只允许一个故障，避免叠加干扰诊断");
    }
}
