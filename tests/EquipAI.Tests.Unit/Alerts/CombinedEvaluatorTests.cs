using EquipAI.Application.Alerts.Evaluators;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Alerts;

public class CombinedEvaluatorTests
{
    private readonly CombinedEvaluator _evaluator = new();

    private const string ConditionsJson = """
        [
            {"metric": "temperature", "operator": ">", "threshold": 80},
            {"metric": "vibration", "operator": ">", "threshold": 3}
        ]
        """;

    private static AlertRule CreateCombinedRule(string conditionsJson)
    {
        return new AlertRule
        {
            Name = "组合测试规则",
            Metric = "temperature",
            RuleType = RuleType.Combined,
            Conditions = conditionsJson,
            TenantId = Guid.NewGuid()
        };
    }

    private static DeviceContext CreateContext(params (string metric, double value)[] metrics)
    {
        var ctx = new DeviceContext();
        foreach (var (metric, value) in metrics)
        {
            ctx.Metrics[metric] = value;
        }
        return ctx;
    }

    [Fact]
    public void RuleType_ShouldBeCombined()
    {
        _evaluator.RuleType.Should().Be(RuleType.Combined);
    }

    [Fact]
    public void Evaluate_AllConditionsMet_ShouldReturnTrue()
    {
        var rule = CreateCombinedRule(ConditionsJson);
        var context = CreateContext(
            ("temperature", 85.0),
            ("vibration", 4.0)
        );
        _evaluator.Evaluate(85.0, rule, context).Should().BeTrue();
    }

    [Fact]
    public void Evaluate_OneConditionNotMet_ShouldReturnFalse()
    {
        var rule = CreateCombinedRule(ConditionsJson);
        var context = CreateContext(
            ("temperature", 85.0),
            ("vibration", 2.0)
        );
        _evaluator.Evaluate(85.0, rule, context).Should().BeFalse();
    }

    [Fact]
    public void Evaluate_NoConditionsMet_ShouldReturnFalse()
    {
        var rule = CreateCombinedRule(ConditionsJson);
        var context = CreateContext(
            ("temperature", 75.0),
            ("vibration", 1.0)
        );
        _evaluator.Evaluate(75.0, rule, context).Should().BeFalse();
    }

    [Fact]
    public void Evaluate_NullContext_ShouldReturnFalse()
    {
        var rule = CreateCombinedRule(ConditionsJson);
        _evaluator.Evaluate(85.0, rule, null).Should().BeFalse();
    }

    [Fact]
    public void Evaluate_NullConditions_ShouldReturnFalse()
    {
        var rule = CreateCombinedRule(ConditionsJson);
        rule.Conditions = null;
        var context = CreateContext(("temperature", 85.0));
        _evaluator.Evaluate(85.0, rule, context).Should().BeFalse();
    }

    [Fact]
    public void Evaluate_EmptyConditions_ShouldReturnFalse()
    {
        var rule = CreateCombinedRule("[]");
        var context = CreateContext(("temperature", 85.0));
        _evaluator.Evaluate(85.0, rule, context).Should().BeFalse();
    }

    [Fact]
    public void Evaluate_MissingMetricInContext_ShouldReturnFalse()
    {
        var rule = CreateCombinedRule(ConditionsJson);
        var context = CreateContext(("temperature", 85.0));
        _evaluator.Evaluate(85.0, rule, context).Should().BeFalse();
    }
}
