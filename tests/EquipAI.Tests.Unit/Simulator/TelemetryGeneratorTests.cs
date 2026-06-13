using EquipAI.Simulator.Engine;
using EquipAI.Simulator.Faults;
using EquipAI.Simulator.Models;
using EquipAI.Simulator.Profiles;
using FluentAssertions;
using Xunit;

namespace EquipAI.Tests.Unit.Simulator;

public class TelemetryGeneratorTests
{
    private static TelemetryGenerator CreateGenerator() => new(new AirCompressorProfile(), seed: 42);

    [Fact]
    public void 正常工况_所有指标应在基线附近波动()
    {
        var gen = CreateGenerator();
        var data = gen.Generate(TimeSpan.FromHours(12), Array.Empty<ActiveFault>());

        data["oil_temperature"].Should().BeInRange(58, 72);
        data["discharge_pressure"].Should().BeInRange(0.65, 0.75);
    }

    [Fact]
    public void 注入过载故障_电流应超过阈值180()
    {
        var gen = CreateGenerator();
        var fault = new ActiveFault(new OverloadFault(), TimeSpan.Zero);

        var data = gen.Generate(TimeSpan.FromMinutes(1), new[] { fault });
        data["motor_current"].Should().BeGreaterThan(178, "过载 1 分钟后电流应接近 180");
    }

    [Fact]
    public void 注入润滑失效_油温应超过阈值90()
    {
        var gen = CreateGenerator();
        var fault = new ActiveFault(new LubricationFailureFault(), TimeSpan.Zero);

        var data = gen.Generate(TimeSpan.FromMinutes(2), new[] { fault });
        data["oil_temperature"].Should().BeGreaterThan(88, "润滑失效 2 分钟后油温应接近 90");
    }

    [Fact]
    public void 注入阀片泄漏_排气压力应低于阈值0点5()
    {
        var gen = CreateGenerator();
        var fault = new ActiveFault(new ValveLeakFault(), TimeSpan.Zero);

        var data = gen.Generate(TimeSpan.FromMinutes(10), new[] { fault });
        data["discharge_pressure"].Should().BeLessThan(0.52, "阀片泄漏 10 分钟后压力应接近 0.5");
    }

    [Fact]
    public void 无故障时连续两次生成结果应不同_证明有噪声()
    {
        var gen = CreateGenerator();
        var d1 = gen.Generate(TimeSpan.FromHours(12), Array.Empty<ActiveFault>());
        var d2 = gen.Generate(TimeSpan.FromHours(12), Array.Empty<ActiveFault>());
        d1["oil_temperature"].Should().NotBe(d2["oil_temperature"]);
    }
}
