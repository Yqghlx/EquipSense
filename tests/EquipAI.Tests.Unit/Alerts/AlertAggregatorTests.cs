using EquipAI.Application.Alerts;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Alerts;

public class AlertAggregatorTests
{
    private readonly AlertAggregator _aggregator = new();
    // 固定规则 ID（多数测试关注 设备/指标 维度，规则维度单独由最后一个测试覆盖）
    private readonly Guid _ruleId = Guid.NewGuid();

    [Fact]
    public void Evaluate_FirstOccurrence_ShouldCreate()
    {
        var result = _aggregator.Evaluate(Guid.NewGuid(), _ruleId, "temperature");
        result.Should().Be((true, false, false));
    }

    [Fact]
    public void Evaluate_SecondOccurrence_ShouldUpdate()
    {
        var deviceId = Guid.NewGuid();
        _aggregator.Evaluate(deviceId, _ruleId, "temperature");
        var result = _aggregator.Evaluate(deviceId, _ruleId, "temperature");
        result.Should().Be((false, true, false));
    }

    [Fact]
    public void Evaluate_ThirdOccurrence_ShouldUpdate()
    {
        var deviceId = Guid.NewGuid();
        _aggregator.Evaluate(deviceId, _ruleId, "temperature");
        _aggregator.Evaluate(deviceId, _ruleId, "temperature");
        var result = _aggregator.Evaluate(deviceId, _ruleId, "temperature");
        result.Should().Be((false, true, false));
    }

    [Fact]
    public void Evaluate_FourthOccurrence_ShouldSilence()
    {
        var deviceId = Guid.NewGuid();
        _aggregator.Evaluate(deviceId, _ruleId, "temperature");
        _aggregator.Evaluate(deviceId, _ruleId, "temperature");
        _aggregator.Evaluate(deviceId, _ruleId, "temperature");
        var result = _aggregator.Evaluate(deviceId, _ruleId, "temperature");
        result.Should().Be((false, false, true));
    }

    [Fact]
    public void Evaluate_DifferentMetrics_ShouldBeIndependent()
    {
        var deviceId = Guid.NewGuid();
        _aggregator.Evaluate(deviceId, _ruleId, "temperature");
        var result = _aggregator.Evaluate(deviceId, _ruleId, "vibration");
        result.Should().Be((true, false, false));
    }

    [Fact]
    public void Evaluate_DifferentDevices_SameMetric_ShouldBeIndependent()
    {
        _aggregator.Evaluate(Guid.NewGuid(), _ruleId, "temperature");
        var result = _aggregator.Evaluate(Guid.NewGuid(), _ruleId, "temperature");
        result.Should().Be((true, false, false));
    }

    /// <summary>
    /// 同设备同指标但不同规则应各自独立计数。
    /// 回归：窗口键曾只按 设备+指标，导致分层阈值规则（温度>80 告警 + 温度>90 严重）共享窗口，
    /// 第二条规则的首发被误判为 shouldUpdate，严重告警被吞并进告警级告警。
    /// </summary>
    [Fact]
    public void Evaluate_DifferentRules_SameDeviceMetric_ShouldBeIndependent()
    {
        var deviceId = Guid.NewGuid();
        var ruleWarn = Guid.NewGuid();
        var ruleCrit = Guid.NewGuid();

        _aggregator.Evaluate(deviceId, ruleWarn, "temperature");
        var result = _aggregator.Evaluate(deviceId, ruleCrit, "temperature");

        result.Should().Be((true, false, false),
            "同设备同指标的不同规则应各自独立首发创建，不得共享窗口互相吞并");
    }
}
