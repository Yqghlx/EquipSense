using EquipAI.Simulator.Engine;
using EquipAI.Simulator.Faults;
using FluentAssertions;
using Xunit;

namespace EquipAI.Tests.Unit.Simulator;

public class GroundTruthLoggerTests
{
    [Fact]
    public void 记录故障注入_应包含预期根因和指标()
    {
        var logger = new GroundTruthLogger("AC-001", "bearing-wear");
        var fault = new BearingWearFault();

        logger.LogFaultInjected(fault, DateTime.UtcNow);

        var log = logger.BuildLog();
        log.Events.Should().ContainSingle();
        log.Events[0].FaultType.Should().Be("bearing_wear");
        log.Events[0].ExpectedRootCause.Should().Contain("轴承磨损");
        log.Events[0].AffectedMetrics.Should().Contain(new[] { "vibration", "oil_temperature" });
        log.Events[0].Action.Should().Be("started");
    }

    [Fact]
    public void 记录故障移除_应包含持续时间()
    {
        var logger = new GroundTruthLogger("AC-001", "test");
        var fault = new OverloadFault();
        var injectTime = DateTime.UtcNow;

        logger.LogFaultInjected(fault, injectTime);
        logger.LogFaultStopped(fault, injectTime.AddMinutes(30));

        var log = logger.BuildLog();
        log.Events.Should().HaveCount(2);
        log.Events[1].Action.Should().Be("stopped");
        log.Events[1].Duration.Should().Contain("30");
    }

    [Fact]
    public void 构建日志_应包含运行批次信息()
    {
        var logger = new GroundTruthLogger("AC-001", "bearing-wear");
        var log = logger.BuildLog();

        log.DeviceCode.Should().Be("AC-001");
        log.Scenario.Should().Be("bearing-wear");
        log.RunId.Should().NotBeNullOrEmpty();
        log.StartedAt.Should().NotBeNullOrEmpty();
    }
}
