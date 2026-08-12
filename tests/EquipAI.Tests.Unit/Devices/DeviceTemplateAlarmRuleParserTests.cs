using EquipAI.Application.Devices;
using EquipAI.Core.Enums;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Devices;

/// <summary>
/// 模板默认告警规则解析器测试，锁定模板配置不能悄悄丢失告警语义。
/// </summary>
public class DeviceTemplateAlarmRuleParserTests
{
    [Fact]
    public void Parse_模板规则_应保留低于阈值与自动建单字段()
    {
        const string json = """
            [
              {"name":"压力过低","metric":"pressure","ruleType":"threshold","operator":"lt","threshold":0.5,"severity":"High","cooldownSeconds":600,"enabled":true,"autoCreateWorkorder":false},
              {"name":"振动超标","metric":"vibration","ruleType":"threshold","operator":"gt","threshold":7,"severity":"Critical","cooldownSeconds":300,"enabled":true,"autoCreateWorkorder":true}
            ]
            """;

        var result = DeviceTemplateAlarmRuleParser.Parse(json);

        result.Should().HaveCount(2);
        result[0].Name.Should().Be("压力过低");
        result[0].Operator.Should().Be("lt");
        result[0].Threshold.Should().Be(0.5m);
        result[0].Severity.Should().Be(AlertSeverity.High);
        result[0].CooldownSeconds.Should().Be(600);
        result[0].AutoCreateWorkorder.Should().BeFalse();
        result[1].Operator.Should().Be("gt");
        result[1].AutoCreateWorkorder.Should().BeTrue();
    }

    [Fact]
    public void Parse_省略可选字段_应使用安全默认值()
    {
        const string json = """
            [
              {"name":"温度告警","metric":"temperature","ruleType":"threshold","operator":">","threshold":80}
            ]
            """;

        var result = DeviceTemplateAlarmRuleParser.Parse(json);

        result.Should().ContainSingle();
        result[0].Severity.Should().Be(AlertSeverity.Normal);
        result[0].CooldownSeconds.Should().Be(300);
        result[0].Enabled.Should().BeTrue();
        result[0].AutoCreateWorkorder.Should().BeFalse();
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-json")]
    [InlineData("{}")]
    [InlineData("null")]
    public void Parse_非法JSON或根节点_应抛出模板规则异常(string json)
    {
        var act = () => DeviceTemplateAlarmRuleParser.Parse(json);

        act.Should().Throw<DeviceTemplateRulesException>()
            .Which.Code.Should().Be("TEMPLATE_RULES_INVALID");
    }

    [Theory]
    [InlineData("name")]
    [InlineData("metric")]
    [InlineData("operator")]
    [InlineData("threshold")]
    public void Parse_缺少关键字段_应拒绝规则(string missingField)
    {
        var fields = new Dictionary<string, string>
        {
            ["name"] = "\"温度告警\"",
            ["metric"] = "\"temperature\"",
            ["ruleType"] = "\"threshold\"",
            ["operator"] = "\">\"",
            ["threshold"] = "80",
            ["severity"] = "\"High\""
        };
        fields.Remove(missingField);
        var json = "[{" + string.Join(",", fields.Select(pair => $"\"{pair.Key}\":{pair.Value}")) + "}]";

        var act = () => DeviceTemplateAlarmRuleParser.Parse(json);

        act.Should().Throw<DeviceTemplateRulesException>();
    }

    [Theory]
    [InlineData("Medium")]
    [InlineData("Unknown")]
    public void Parse_未知严重级别_应拒绝规则(string severity)
    {
        var json = $"[{{\"name\":\"告警\",\"metric\":\"temperature\",\"ruleType\":\"threshold\",\"operator\":\">\",\"threshold\":80,\"severity\":\"{severity}\"}}]";

        var act = () => DeviceTemplateAlarmRuleParser.Parse(json);

        act.Should().Throw<DeviceTemplateRulesException>();
    }

    [Fact]
    public void Parse_非阈值规则类型_应拒绝规则()
    {
        const string json = "[{\"name\":\"组合告警\",\"metric\":\"temperature\",\"ruleType\":\"combined\",\"operator\":\">\",\"threshold\":80}]";

        var act = () => DeviceTemplateAlarmRuleParser.Parse(json);

        act.Should().Throw<DeviceTemplateRulesException>();
    }

    [Theory]
    [InlineData("ne")]
    [InlineData("between")]
    public void Parse_评估器不支持的操作符_应拒绝规则(string op)
    {
        var json = $"[{{\"name\":\"告警\",\"metric\":\"temperature\",\"ruleType\":\"threshold\",\"operator\":\"{op}\",\"threshold\":80}}]";

        var act = () => DeviceTemplateAlarmRuleParser.Parse(json);

        act.Should().Throw<DeviceTemplateRulesException>();
    }

    [Fact]
    public void Parse_负冷却时间_应拒绝规则()
    {
        const string json = """
            [
              {"name":"温度告警","metric":"temperature","ruleType":"threshold","operator":">","threshold":80,"cooldownSeconds":-1}
            ]
            """;

        var act = () => DeviceTemplateAlarmRuleParser.Parse(json);

        act.Should().Throw<DeviceTemplateRulesException>();
    }
}
