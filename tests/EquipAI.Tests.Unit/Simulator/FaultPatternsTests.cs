using EquipAI.Simulator.Faults;
using FluentAssertions;
using Xunit;

namespace EquipAI.Tests.Unit.Simulator;

public class FaultPatternsTests
{
    // === 轴承磨损 ===

    [Fact]
    public void 轴承磨损_振动应按小时线性渐增()
    {
        var fault = new BearingWearFault();
        var delta10h = fault.Delta("vibration", TimeSpan.FromHours(10));
        delta10h.Should().BeApproximately(0.5, 0.01);
        var delta90h = fault.Delta("vibration", TimeSpan.FromHours(90));
        delta90h.Should().BeApproximately(4.5, 0.01);
    }

    [Fact]
    public void 轴承磨损_油温应缓慢线性上升()
    {
        var fault = new BearingWearFault();
        var delta = fault.Delta("oil_temperature", TimeSpan.FromHours(10));
        delta.Should().BeApproximately(1.0, 0.01);
    }

    [Fact]
    public void 轴承磨损_未受影响指标应返回零()
    {
        var fault = new BearingWearFault();
        fault.Delta("motor_current", TimeSpan.FromHours(10)).Should().Be(0);
    }

    [Fact]
    public void 轴承磨损_元数据应正确()
    {
        var fault = new BearingWearFault();
        fault.FaultType.Should().Be("bearing_wear");
        fault.AffectedMetrics.Should().BeEquivalentTo(new[] { "vibration", "oil_temperature" });
        fault.ExpectedSeverity.Should().Be("High");
        fault.ExpectedRootCause.Should().Contain("轴承磨损");
    }

    // === 润滑失效 ===

    [Fact]
    public void 润滑失效_油温应在2分钟内阶跃至25度增量()
    {
        var fault = new LubricationFailureFault();
        var delta1min = fault.Delta("oil_temperature", TimeSpan.FromMinutes(1));
        delta1min.Should().BeApproximately(12.5, 0.1);
        var delta2min = fault.Delta("oil_temperature", TimeSpan.FromMinutes(2));
        delta2min.Should().BeApproximately(25.0, 0.01);
        var delta10min = fault.Delta("oil_temperature", TimeSpan.FromMinutes(10));
        delta10min.Should().BeApproximately(25.0, 0.01);
    }

    [Fact]
    public void 润滑失效_振动应在30分钟内缓升()
    {
        var fault = new LubricationFailureFault();
        var delta30min = fault.Delta("vibration", TimeSpan.FromMinutes(30));
        delta30min.Should().BeApproximately(1.5, 0.01);
    }

    [Fact]
    public void 润滑失效_元数据应正确()
    {
        var fault = new LubricationFailureFault();
        fault.FaultType.Should().Be("lubrication_failure");
        fault.ExpectedSeverity.Should().Be("Critical");
        fault.ExpectedRootCause.Should().Contain("润滑");
    }

    // === 阀片泄漏 ===

    [Fact]
    public void 阀片泄漏_排气压力应在5分钟内降至负0点3()
    {
        var fault = new ValveLeakFault();
        var delta = fault.Delta("discharge_pressure", TimeSpan.FromMinutes(10));
        delta.Should().BeApproximately(-0.3, 0.001);
    }

    [Fact]
    public void 阀片泄漏_排气量应同步下降()
    {
        var fault = new ValveLeakFault();
        var delta = fault.Delta("air_flow", TimeSpan.FromMinutes(10));
        delta.Should().BeApproximately(-4.0, 0.1);
    }

    [Fact]
    public void 阀片泄漏_油温应因效率降而上升()
    {
        var fault = new ValveLeakFault();
        var delta = fault.Delta("oil_temperature", TimeSpan.FromMinutes(10));
        delta.Should().BeApproximately(8.0, 0.1);
    }

    [Fact]
    public void 阀片泄漏_元数据应正确()
    {
        var fault = new ValveLeakFault();
        fault.FaultType.Should().Be("valve_leak");
        fault.ExpectedSeverity.Should().Be("High");
    }

    // === 过载 ===

    [Fact]
    public void 过载_电流应在1分钟内阶跃至60增量()
    {
        var fault = new OverloadFault();
        var delta = fault.Delta("motor_current", TimeSpan.FromMinutes(1));
        delta.Should().BeApproximately(60.0, 0.1);
    }

    [Fact]
    public void 过载_油温应在10分钟内升10度()
    {
        var fault = new OverloadFault();
        var delta = fault.Delta("oil_temperature", TimeSpan.FromMinutes(10));
        delta.Should().BeApproximately(10.0, 0.1);
    }

    [Fact]
    public void 过载_振动应缓升()
    {
        var fault = new OverloadFault();
        var delta = fault.Delta("vibration", TimeSpan.FromMinutes(10));
        delta.Should().BeApproximately(0.8, 0.05);
    }

    [Fact]
    public void 过载_元数据应正确()
    {
        var fault = new OverloadFault();
        fault.FaultType.Should().Be("overload");
        fault.ExpectedRootCause.Should().Contain("过载");
    }

    // === 排气堵塞 ===

    [Fact]
    public void 排气堵塞_排气压力应在3分钟内急升至正0点5()
    {
        var fault = new DischargeBlockageFault();
        var delta = fault.Delta("discharge_pressure", TimeSpan.FromMinutes(3));
        delta.Should().BeApproximately(0.5, 0.001);
    }

    [Fact]
    public void 排气堵塞_排气量应骤降()
    {
        var fault = new DischargeBlockageFault();
        var delta = fault.Delta("air_flow", TimeSpan.FromMinutes(3));
        delta.Should().BeApproximately(-6.0, 0.1);
    }

    [Fact]
    public void 排气堵塞_油温应急升()
    {
        var fault = new DischargeBlockageFault();
        var delta = fault.Delta("oil_temperature", TimeSpan.FromMinutes(3));
        delta.Should().BeApproximately(20.0, 0.1);
    }

    [Fact]
    public void 排气堵塞_元数据应为Critical()
    {
        var fault = new DischargeBlockageFault();
        fault.FaultType.Should().Be("discharge_blockage");
        fault.ExpectedSeverity.Should().Be("Critical");
    }

    // === 传感器漂移 ===

    [Fact]
    public void 传感器漂移_排气压力应每分钟漂移0点005()
    {
        var fault = new SensorDriftFault();
        var delta80 = fault.Delta("discharge_pressure", TimeSpan.FromMinutes(80));
        delta80.Should().BeApproximately(0.4, 0.001);
    }

    [Fact]
    public void 传感器漂移_仅影响排气压力()
    {
        var fault = new SensorDriftFault();
        fault.Delta("oil_temperature", TimeSpan.FromMinutes(80)).Should().Be(0);
        fault.Delta("vibration", TimeSpan.FromMinutes(80)).Should().Be(0);
        fault.AffectedMetrics.Should().ContainSingle().Which.Should().Be("discharge_pressure");
    }

    [Fact]
    public void 传感器漂移_元数据应为Normal()
    {
        var fault = new SensorDriftFault();
        fault.FaultType.Should().Be("sensor_drift");
        fault.ExpectedSeverity.Should().Be("Normal");
        fault.ExpectedRootCause.Should().Contain("传感器");
    }
}
