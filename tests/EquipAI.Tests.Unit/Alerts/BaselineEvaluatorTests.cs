using EquipAI.Application.Alerts.Evaluators;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using FluentAssertions;
using Xunit;

namespace EquipAI.Tests.Unit.Alerts;

public class BaselineEvaluatorTests
{
    private readonly BaselineEvaluator _evaluator = new();

    private static MetricBaseline CreateBaseline(
        double avgValue = 50.0, double stdDev = 5.0, int sampleCount = 200)
    {
        return new MetricBaseline
        {
            AvgValue = avgValue,
            StdDev = stdDev,
            SampleCount = sampleCount
        };
    }

    private static AlertRule CreateRule(double multiplier = 3.0)
    {
        return new AlertRule
        {
            RuleType = RuleType.Baseline,
            BaselineStddevMultiplier = (decimal)multiplier
        };
    }

    [Fact]
    public void Evaluate_DeviationExceedsMultiplier_ReturnsTrue()
    {
        var baseline = CreateBaseline(avgValue: 50.0, stdDev: 5.0, sampleCount: 200);
        var rule = CreateRule(multiplier: 3.0);
        var context = new DeviceContext { Baseline = baseline };

        var result = _evaluator.Evaluate(70.0, rule, context);

        result.Should().BeTrue();
    }

    [Fact]
    public void Evaluate_DeviationEqualsMultiplier_ReturnsFalse()
    {
        var baseline = CreateBaseline(avgValue: 50.0, stdDev: 5.0, sampleCount: 200);
        var rule = CreateRule(multiplier: 3.0);
        var context = new DeviceContext { Baseline = baseline };

        var result = _evaluator.Evaluate(65.0, rule, context);

        result.Should().BeFalse();
    }

    [Fact]
    public void Evaluate_DeviationBelowMultiplier_ReturnsFalse()
    {
        var baseline = CreateBaseline(avgValue: 50.0, stdDev: 5.0, sampleCount: 200);
        var rule = CreateRule(multiplier: 3.0);
        var context = new DeviceContext { Baseline = baseline };

        var result = _evaluator.Evaluate(60.0, rule, context);

        result.Should().BeFalse();
    }

    [Fact]
    public void Evaluate_BelowAverageDeviationExceedsMultiplier_ReturnsTrue()
    {
        var baseline = CreateBaseline(avgValue: 50.0, stdDev: 5.0, sampleCount: 200);
        var rule = CreateRule(multiplier: 3.0);
        var context = new DeviceContext { Baseline = baseline };

        var result = _evaluator.Evaluate(30.0, rule, context);

        result.Should().BeTrue();
    }

    [Fact]
    public void Evaluate_NoBaseline_ReturnsFalse()
    {
        var rule = CreateRule(multiplier: 3.0);
        var context = new DeviceContext { Baseline = null };

        var result = _evaluator.Evaluate(70.0, rule, context);

        result.Should().BeFalse();
    }

    [Fact]
    public void Evaluate_NullContext_ReturnsFalse()
    {
        var rule = CreateRule(multiplier: 3.0);

        var result = _evaluator.Evaluate(70.0, rule, null);

        result.Should().BeFalse();
    }

    [Fact]
    public void Evaluate_SampleCountBelow100_ReturnsFalse()
    {
        var baseline = CreateBaseline(avgValue: 50.0, stdDev: 5.0, sampleCount: 99);
        var rule = CreateRule(multiplier: 3.0);
        var context = new DeviceContext { Baseline = baseline };

        var result = _evaluator.Evaluate(70.0, rule, context);

        result.Should().BeFalse();
    }

    [Fact]
    public void Evaluate_StdDevZero_ReturnsFalse()
    {
        var baseline = CreateBaseline(avgValue: 50.0, stdDev: 0.0, sampleCount: 200);
        var rule = CreateRule(multiplier: 3.0);
        var context = new DeviceContext { Baseline = baseline };

        var result = _evaluator.Evaluate(70.0, rule, context);

        result.Should().BeFalse();
    }

    [Fact]
    public void Evaluate_NullMultiplier_ReturnsFalse()
    {
        var baseline = CreateBaseline(avgValue: 50.0, stdDev: 5.0, sampleCount: 200);
        var rule = new AlertRule
        {
            RuleType = RuleType.Baseline,
            BaselineStddevMultiplier = null
        };
        var context = new DeviceContext { Baseline = baseline };

        var result = _evaluator.Evaluate(70.0, rule, context);

        result.Should().BeFalse();
    }

    [Fact]
    public void RuleType_IsBaseline()
    {
        _evaluator.RuleType.Should().Be(RuleType.Baseline);
    }
}
