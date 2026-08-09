using EquipAI.Application.Alerts;
using EquipAI.Core.Interfaces;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Alerts;

public class AlertAggregatorTests
{
    private readonly AlertAggregator _aggregator = new();
    // 固定规则 ID（多数测试关注 设备/指标 维度，规则维度单独由最后一个测试覆盖）
    private readonly Guid _ruleId = Guid.NewGuid();

    [Fact]
    public async Task Evaluate_FirstOccurrence_ShouldCreate()
    {
        var result = await _aggregator.EvaluateAsync(Guid.NewGuid(), _ruleId, "temperature");
        result.Should().Be(new AlertAggregationDecision(true, false, false));
    }

    [Fact]
    public async Task Evaluate_SecondOccurrence_ShouldUpdate()
    {
        var deviceId = Guid.NewGuid();
        await _aggregator.EvaluateAsync(deviceId, _ruleId, "temperature");
        var result = await _aggregator.EvaluateAsync(deviceId, _ruleId, "temperature");
        result.Should().Be(new AlertAggregationDecision(false, true, false));
    }

    [Fact]
    public async Task Evaluate_ThirdOccurrence_ShouldUpdate()
    {
        var deviceId = Guid.NewGuid();
        await _aggregator.EvaluateAsync(deviceId, _ruleId, "temperature");
        await _aggregator.EvaluateAsync(deviceId, _ruleId, "temperature");
        var result = await _aggregator.EvaluateAsync(deviceId, _ruleId, "temperature");
        result.Should().Be(new AlertAggregationDecision(false, true, false));
    }

    [Fact]
    public async Task Evaluate_FourthOccurrence_ShouldSilence()
    {
        var deviceId = Guid.NewGuid();
        await _aggregator.EvaluateAsync(deviceId, _ruleId, "temperature");
        await _aggregator.EvaluateAsync(deviceId, _ruleId, "temperature");
        await _aggregator.EvaluateAsync(deviceId, _ruleId, "temperature");
        var result = await _aggregator.EvaluateAsync(deviceId, _ruleId, "temperature");
        result.Should().Be(new AlertAggregationDecision(false, false, true));
    }

    [Fact]
    public async Task Evaluate_DifferentMetrics_ShouldBeIndependent()
    {
        var deviceId = Guid.NewGuid();
        await _aggregator.EvaluateAsync(deviceId, _ruleId, "temperature");
        var result = await _aggregator.EvaluateAsync(deviceId, _ruleId, "vibration");
        result.Should().Be(new AlertAggregationDecision(true, false, false));
    }

    [Fact]
    public async Task Evaluate_DifferentDevices_SameMetric_ShouldBeIndependent()
    {
        await _aggregator.EvaluateAsync(Guid.NewGuid(), _ruleId, "temperature");
        var result = await _aggregator.EvaluateAsync(Guid.NewGuid(), _ruleId, "temperature");
        result.Should().Be(new AlertAggregationDecision(true, false, false));
    }

    /// <summary>
    /// 同设备同指标但不同规则应各自独立计数。
    /// 回归：窗口键曾只按 设备+指标，导致分层阈值规则（温度>80 告警 + 温度>90 严重）共享窗口，
    /// 第二条规则的首发被误判为 shouldUpdate，严重告警被吞并进告警级告警。
    /// </summary>
    [Fact]
    public async Task Evaluate_DifferentRules_SameDeviceMetric_ShouldBeIndependent()
    {
        var deviceId = Guid.NewGuid();
        var ruleWarn = Guid.NewGuid();
        var ruleCrit = Guid.NewGuid();

        await _aggregator.EvaluateAsync(deviceId, ruleWarn, "temperature");
        var result = await _aggregator.EvaluateAsync(deviceId, ruleCrit, "temperature");

        result.Should().Be(new AlertAggregationDecision(true, false, false),
            "同设备同指标的不同规则应各自独立首发创建，不得共享窗口互相吞并");
    }
}
