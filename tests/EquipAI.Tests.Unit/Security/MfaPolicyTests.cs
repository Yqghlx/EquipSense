using EquipAI.Application.Security;
using FluentAssertions;
using Microsoft.Extensions.Configuration;

namespace EquipAI.Tests.Unit.Security;

/// <summary>
/// 生产 MFA 强制策略解析和启动门禁测试。
/// </summary>
public class MfaPolicyTests
{
    [Fact]
    public void 非生产环境可以不配置强制角色()
    {
        var configuration = new ConfigurationBuilder().Build();

        var act = () => MfaPolicyValidator.ValidateForEnvironment(configuration, "Development");

        act.Should().NotThrow();
    }

    [Fact]
    public void 生产环境缺少系统管理员策略时必须拒绝启动()
    {
        var configuration = BuildConfiguration("MaintenanceLead");

        var act = () => MfaPolicyValidator.ValidateForEnvironment(configuration, "Production");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*SystemAdmin*");
    }

    [Fact]
    public void 生产环境缺少维保主管策略时必须拒绝启动()
    {
        var configuration = BuildConfiguration("SystemAdmin");

        var act = () => MfaPolicyValidator.ValidateForEnvironment(configuration, "Production");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*MaintenanceLead*");
    }

    [Fact]
    public void MFA策略包含未知角色时必须拒绝解析()
    {
        var configuration = BuildConfiguration("SystemAdmin", "UnknownRole");

        var act = () => MfaPolicyOptions.FromConfiguration(configuration);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*UnknownRole*");
    }

    private static IConfiguration BuildConfiguration(params string[] roles)
    {
        var values = roles
            .Select((role, index) => new KeyValuePair<string, string?>(
                $"Security:Mfa:RequiredRoles:{index}", role))
            .ToDictionary(pair => pair.Key, pair => pair.Value);

        return new ConfigurationBuilder()
            .AddInMemoryCollection(values)
            .Build();
    }
}
