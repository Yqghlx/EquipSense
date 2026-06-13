using EquipAI.Simulator.Profiles;
using FluentAssertions;
using Xunit;

namespace EquipAI.Tests.Unit.Simulator;

public class AirCompressorProfileTests
{
    [Fact]
    public void 指标名应与种子空压机模板完全一致()
    {
        var profile = new AirCompressorProfile();

        profile.Metrics.Keys.Should().BeEquivalentTo(new[]
        {
            "discharge_pressure",
            "oil_temperature",
            "vibration",
            "motor_current",
            "air_flow"
        });
    }

    [Fact]
    public void 设备类型应为空压机()
    {
        var profile = new AirCompressorProfile();
        profile.DeviceType.Should().Be("空压机");
    }

    [Fact]
    public void 油温基线应为65度()
    {
        var profile = new AirCompressorProfile();
        profile.Metrics["oil_temperature"].Baseline.Should().Be(65.0);
    }
}
