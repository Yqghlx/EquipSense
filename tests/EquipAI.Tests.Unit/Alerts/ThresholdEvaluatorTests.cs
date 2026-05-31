using EquipAI.Application.Alerts.Evaluators;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Alerts;

public class ThresholdEvaluatorTests
{
    private readonly ThresholdEvaluator _evaluator = new();

    /// <summary>
    /// 辅助方法：创建阈值类型的告警规则
    /// </summary>
    private static AlertRule CreateRule(string op, decimal threshold, bool enabled = true)
    {
        return new AlertRule
        {
            Name = "测试规则",
            Metric = "temperature",
            RuleType = RuleType.Threshold,
            Operator = op,
            Threshold = threshold,
            Enabled = enabled,
            TenantId = Guid.NewGuid()
        };
    }

    [Fact]
    public void RuleType_ShouldBeThreshold()
    {
        _evaluator.RuleType.Should().Be(RuleType.Threshold);
    }

    [Theory]
    [InlineData(">", 90.0, 91.0, true)]
    [InlineData(">", 90.0, 90.0, false)]
    [InlineData(">", 90.0, 89.0, false)]
    [InlineData(">=", 90.0, 90.0, true)]
    [InlineData(">=", 90.0, 91.0, true)]
    [InlineData(">=", 90.0, 89.0, false)]
    [InlineData("<", 10.0, 9.0, true)]
    [InlineData("<", 10.0, 10.0, false)]
    [InlineData("<", 10.0, 11.0, false)]
    [InlineData("<=", 10.0, 10.0, true)]
    [InlineData("<=", 10.0, 9.0, true)]
    [InlineData("<=", 10.0, 11.0, false)]
    [InlineData("==", 50.0, 50.0, true)]
    [InlineData("==", 50.0, 50.001, false)]
    public void Evaluate_ShouldReturnExpected(string op, decimal threshold, double value, bool expected)
    {
        var rule = CreateRule(op, threshold);
        _evaluator.Evaluate(value, rule).Should().Be(expected);
    }

    [Fact]
    public void Evaluate_WithNullThreshold_ShouldReturnFalse()
    {
        var rule = CreateRule(">", 0);
        rule.Threshold = null;
        _evaluator.Evaluate(100.0, rule).Should().BeFalse();
    }

    [Fact]
    public void Evaluate_WithNullOperator_ShouldReturnFalse()
    {
        var rule = CreateRule(">", 90);
        rule.Operator = null;
        _evaluator.Evaluate(100.0, rule).Should().BeFalse();
    }

    [Fact]
    public void Evaluate_WithUnknownOperator_ShouldReturnFalse()
    {
        var rule = CreateRule("!*", 90);
        _evaluator.Evaluate(100.0, rule).Should().BeFalse();
    }
}
