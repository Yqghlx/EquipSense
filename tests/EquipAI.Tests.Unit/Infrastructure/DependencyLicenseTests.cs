using EquipAI.Infrastructure.Security;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Infrastructure;

/// <summary>
/// 生产依赖许可证门禁，防止在未完成商业授权评审时误升级到受限版本。
/// </summary>
public sealed class DependencyLicenseTests
{
    /// <summary>
    /// 生产环境缺少 AutoMapper 许可证密钥时必须拒绝启动。
    /// </summary>
    [Fact]
    public void AutoMapper_生产环境缺少许可证密钥时必须拒绝启动()
    {
        var act = () => AutoMapperLicenseConfigurationValidator.Validate("Production", null);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*AutoMapper*许可证*");
    }

    /// <summary>
    /// 生产环境不能用部署模板中的占位值绕过许可证门禁。
    /// </summary>
    [Theory]
    [InlineData("SET_VIA_ENVIRONMENT")]
    [InlineData("PLEASE_CHANGE_AUTOMAPPER_LICENSE_KEY")]
    [InlineData("CHANGE_ME_AUTOMAPPER_LICENSE_KEY_1234567890")]
    public void AutoMapper_生产环境占位许可证密钥必须拒绝启动(string licenseKey)
    {
        var act = () => AutoMapperLicenseConfigurationValidator.Validate("Production", licenseKey);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*AutoMapper*许可证*");
    }

    /// <summary>
    /// 生产环境不能用任意短字符串伪装成真实许可证密钥。
    /// </summary>
    [Fact]
    public void AutoMapper_生产环境过短许可证密钥必须拒绝启动()
    {
        var act = () => AutoMapperLicenseConfigurationValidator.Validate("Production", "not-a-license");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*AutoMapper*许可证*");
    }

    /// <summary>
    /// 开发和测试环境允许不配置许可证，保持本地开发体验。
    /// </summary>
    [Theory]
    [InlineData("Development")]
    [InlineData("Testing")]
    public void AutoMapper_非生产环境允许缺少许可证密钥(string environmentName)
    {
        var act = () => AutoMapperLicenseConfigurationValidator.Validate(environmentName, null);

        act.Should().NotThrow();
    }

    /// <summary>
    /// 生产环境提供真实许可证密钥后应通过门禁。
    /// </summary>
    [Fact]
    public void AutoMapper_生产环境提供许可证密钥时应通过门禁()
    {
        var act = () => AutoMapperLicenseConfigurationValidator.Validate(
            "Production",
            "eyJ-license-key-issued-by-lucky-penny-for-test-only");

        act.Should().NotThrow();
    }
}
