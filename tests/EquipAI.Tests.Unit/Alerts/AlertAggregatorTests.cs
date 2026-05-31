using EquipAI.Application.Alerts;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Alerts;

public class AlertAggregatorTests
{
    private readonly AlertAggregator _aggregator = new();

    [Fact]
    public void Evaluate_FirstOccurrence_ShouldCreate()
    {
        var result = _aggregator.Evaluate(Guid.NewGuid(), "temperature");
        result.Should().Be((true, false, false));
    }

    [Fact]
    public void Evaluate_SecondOccurrence_ShouldUpdate()
    {
        var deviceId = Guid.NewGuid();
        _aggregator.Evaluate(deviceId, "temperature");
        var result = _aggregator.Evaluate(deviceId, "temperature");
        result.Should().Be((false, true, false));
    }

    [Fact]
    public void Evaluate_ThirdOccurrence_ShouldUpdate()
    {
        var deviceId = Guid.NewGuid();
        _aggregator.Evaluate(deviceId, "temperature");
        _aggregator.Evaluate(deviceId, "temperature");
        var result = _aggregator.Evaluate(deviceId, "temperature");
        result.Should().Be((false, true, false));
    }

    [Fact]
    public void Evaluate_FourthOccurrence_ShouldSilence()
    {
        var deviceId = Guid.NewGuid();
        _aggregator.Evaluate(deviceId, "temperature");
        _aggregator.Evaluate(deviceId, "temperature");
        _aggregator.Evaluate(deviceId, "temperature");
        var result = _aggregator.Evaluate(deviceId, "temperature");
        result.Should().Be((false, false, true));
    }

    [Fact]
    public void Evaluate_DifferentMetrics_ShouldBeIndependent()
    {
        var deviceId = Guid.NewGuid();
        _aggregator.Evaluate(deviceId, "temperature");
        var result = _aggregator.Evaluate(deviceId, "vibration");
        result.Should().Be((true, false, false));
    }

    [Fact]
    public void Evaluate_DifferentDevices_SameMetric_ShouldBeIndependent()
    {
        _aggregator.Evaluate(Guid.NewGuid(), "temperature");
        var result = _aggregator.Evaluate(Guid.NewGuid(), "temperature");
        result.Should().Be((true, false, false));
    }
}
