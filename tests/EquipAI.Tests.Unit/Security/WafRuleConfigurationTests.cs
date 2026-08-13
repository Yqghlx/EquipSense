using EquipAI.Infrastructure.Middleware;
using FluentAssertions;
using Microsoft.Extensions.Configuration;

namespace EquipAI.Tests.Unit.Security;

/// <summary>
/// WAF 生产配置启动门禁测试。
/// </summary>
public sealed class WafRuleConfigurationTests
{
    [Fact]
    public void 生产环境缺少外部规则路径_必须拒绝启动()
    {
        var configuration = BuildConfiguration(
            enabled: true,
            rulesPath: null,
            requireExternalRules: true);

        var act = () => WafRuleConfiguration.ValidateForEnvironment(configuration, "Production");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*RulesPath*");
    }

    [Fact]
    public void 生产环境相对路径_必须拒绝启动()
    {
        var configuration = BuildConfiguration(
            enabled: true,
            rulesPath: "waf-rules/rules.json",
            requireExternalRules: true);

        var act = () => WafRuleConfiguration.ValidateForEnvironment(configuration, "Production");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*绝对路径*");
    }

    [Fact]
    public void 生产环境关闭外部规则强制开关_必须拒绝启动()
    {
        var configuration = BuildConfiguration(
            enabled: true,
            rulesPath: "/etc/equipai/waf/rules.json",
            requireExternalRules: false);

        var act = () => WafRuleConfiguration.ValidateForEnvironment(configuration, "Production");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*RequireExternalRules*");
    }

    [Fact]
    public void 生产环境关闭WAF_必须拒绝启动()
    {
        var configuration = BuildConfiguration(
            enabled: false,
            rulesPath: "/etc/equipai/waf/rules.json",
            requireExternalRules: true);

        var act = () => WafRuleConfiguration.ValidateForEnvironment(configuration, "Production");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*WAF*");
    }

    [Fact]
    public void 生产环境完整配置_通过校验()
    {
        var configuration = BuildConfiguration(
            enabled: true,
            rulesPath: "/etc/equipai/waf/rules.json",
            requireExternalRules: true);

        var act = () => WafRuleConfiguration.ValidateForEnvironment(configuration, "Production");

        act.Should().NotThrow();
    }

    [Fact]
    public void 开发环境可以缺少外部规则路径()
    {
        var configuration = BuildConfiguration(
            enabled: true,
            rulesPath: null,
            requireExternalRules: false);

        var act = () => WafRuleConfiguration.ValidateForEnvironment(configuration, "Development");

        act.Should().NotThrow();
    }

    private static IConfiguration BuildConfiguration(bool enabled, string? rulesPath, bool requireExternalRules)
        => new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Security:Waf:Enabled"] = enabled.ToString(),
                ["Security:Waf:RulesPath"] = rulesPath,
                ["Security:Waf:RequireExternalRules"] = requireExternalRules.ToString(),
                ["Security:Waf:ReloadDebounceMilliseconds"] = "250"
            })
            .Build();
}
