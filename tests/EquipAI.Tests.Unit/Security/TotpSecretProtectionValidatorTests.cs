using EquipAI.Application.Security;
using FluentAssertions;
using Microsoft.Extensions.Configuration;

namespace EquipAI.Tests.Unit.Security;

/// <summary>
/// TOTP 密钥生产配置启动门禁测试。
/// </summary>
public class TotpSecretProtectionValidatorTests
{
    [Fact]
    public void 生产环境缺少密钥时必须拒绝启动()
    {
        var configuration = BuildConfiguration("Production", null);

        var act = () => TotpSecretProtectionValidator.ValidateForEnvironment(
            configuration,
            "Production");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*TotpEncryptionKey*");
    }

    [Fact]
    public void 生产环境密钥不是32字节时必须拒绝启动()
    {
        var configuration = BuildConfiguration(
            "Production",
            Convert.ToBase64String(new byte[16]));

        var act = () => TotpSecretProtectionValidator.ValidateForEnvironment(
            configuration,
            "Production");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*32*字节*");
    }

    [Fact]
    public void 非生产环境可以不配置外部密钥()
    {
        var configuration = BuildConfiguration("Development", null);

        var act = () => TotpSecretProtectionValidator.ValidateForEnvironment(
            configuration,
            "Development");

        act.Should().NotThrow();
    }

    private static IConfiguration BuildConfiguration(string environment, string? key)
        => new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ASPNETCORE_ENVIRONMENT"] = environment,
                ["Security:TotpEncryptionKey"] = key
            })
            .Build();
}
