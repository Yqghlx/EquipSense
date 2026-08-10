using EquipAI.Application.Security;
using FluentAssertions;
using Microsoft.Extensions.Configuration;

namespace EquipAI.Tests.Unit.Security;

/// <summary>
/// 用户 PII 加密密钥生产配置门禁测试。
/// </summary>
public sealed class PiiProtectionValidatorTests
{
    [Fact]
    public void 生产环境缺少密钥时必须拒绝启动()
    {
        var configuration = BuildConfiguration("Production", null);

        var act = () => PiiProtectionValidator.ValidateForEnvironment(
            configuration,
            "Production");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*PiiEncryptionKey*");
    }

    [Fact]
    public void 生产环境密钥不是32字节时必须拒绝启动()
    {
        var configuration = BuildConfiguration(
            "Production",
            Convert.ToBase64String(new byte[16]));

        var act = () => PiiProtectionValidator.ValidateForEnvironment(
            configuration,
            "Production");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*32*字节*");
    }

    [Fact]
    public void 生产环境合法密钥可以通过校验()
    {
        var configuration = BuildConfiguration(
            "Production",
            Convert.ToBase64String(new byte[32]));

        var act = () => PiiProtectionValidator.ValidateForEnvironment(
            configuration,
            "Production");

        act.Should().NotThrow();
    }

    [Fact]
    public void 非生产环境可以不配置外部密钥()
    {
        var configuration = BuildConfiguration("Development", null);

        var act = () => PiiProtectionValidator.ValidateForEnvironment(
            configuration,
            "Development");

        act.Should().NotThrow();
    }

    private static IConfiguration BuildConfiguration(string environment, string? key)
        => new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ASPNETCORE_ENVIRONMENT"] = environment,
                ["Security:PiiEncryptionKey"] = key
            })
            .Build();
}
