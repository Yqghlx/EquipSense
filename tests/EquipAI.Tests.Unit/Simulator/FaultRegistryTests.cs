using EquipAI.Simulator.Faults;
using FluentAssertions;
using Xunit;

namespace EquipAI.Tests.Unit.Simulator;

public class FaultRegistryTests
{
    [Fact]
    public void 注册表应包含全部6种故障()
    {
        var registry = new FaultRegistry();
        var allTypes = registry.GetAllFaultTypes();
        allTypes.Should().BeEquivalentTo(new[]
        {
            "bearing_wear", "lubrication_failure", "valve_leak",
            "overload", "discharge_blockage", "sensor_drift"
        });
    }

    [Fact]
    public void 按名查找应返回正确故障实例()
    {
        var registry = new FaultRegistry();
        var fault = registry.Get("bearing_wear");
        fault.FaultType.Should().Be("bearing_wear");
    }

    [Fact]
    public void 未知故障类型应抛出KeyNotFoundException()
    {
        var registry = new FaultRegistry();
        var act = () => registry.Get("nonexistent_fault");
        act.Should().Throw<KeyNotFoundException>();
    }

    [Fact]
    public void 随机选取应返回已注册故障之一()
    {
        var registry = new FaultRegistry();
        var fault = registry.GetRandom();
        registry.GetAllFaultTypes().Should().Contain(fault.FaultType);
    }
}
