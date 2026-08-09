using System.Security.Cryptography;
using EquipAI.Infrastructure.Identity;
using FluentAssertions;
using Microsoft.Extensions.Configuration;

namespace EquipAI.Tests.Unit.Security;

/// <summary>
/// TOTP 密钥 AES-GCM 保护测试。
/// </summary>
public class TotpSecretProtectorTests
{
    [Fact]
    public void 加密后不应包含明文且可以解密还原()
    {
        var protector = new TotpSecretProtector(BuildConfiguration("Development"));
        const string secret = "JBSWY3DPEHPK3PXP";

        var protectedValue = protector.Protect(secret);

        protectedValue.Should().StartWith("enc:v1:");
        protectedValue.Should().NotContain(secret);
        protector.Unprotect(protectedValue).Should().Be(secret);
    }

    [Fact]
    public void 密文被篡改时必须拒绝解密()
    {
        var protector = new TotpSecretProtector(BuildConfiguration("Development"));
        var protectedValue = protector.Protect("JBSWY3DPEHPK3PXP");
        var last = protectedValue[^1];
        var tampered = protectedValue[..^1] + (last == 'A' ? 'B' : 'A');

        var act = () => protector.Unprotect(tampered);

        act.Should().Throw<CryptographicException>();
    }

    [Fact]
    public void 生产环境缺少加密密钥时必须拒绝启动()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ASPNETCORE_ENVIRONMENT"] = "Production"
            })
            .Build();

        var act = () => new TotpSecretProtector(configuration);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*TotpEncryptionKey*");
    }

    [Fact]
    public void 仅通过DOTNET_ENVIRONMENT声明生产环境时也必须拒绝缺失密钥()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["DOTNET_ENVIRONMENT"] = "Production"
            })
            .Build();

        var act = () => new TotpSecretProtector(configuration);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*TotpEncryptionKey*");
    }

    [Fact]
    public void 历史明文密钥可以读取以支持平滑迁移()
    {
        var protector = new TotpSecretProtector(BuildConfiguration("Development"));

        protector.Unprotect("JBSWY3DPEHPK3PXP").Should().Be("JBSWY3DPEHPK3PXP");
    }

    private static IConfiguration BuildConfiguration(string environment)
        => new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ASPNETCORE_ENVIRONMENT"] = environment,
                ["Security:TotpEncryptionKey"] = Convert.ToBase64String(new byte[32])
            })
            .Build();
}
