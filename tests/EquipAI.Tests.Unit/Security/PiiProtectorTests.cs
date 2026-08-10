using System.Security.Cryptography;
using EquipAI.Infrastructure.Security;
using FluentAssertions;
using Microsoft.Extensions.Configuration;

namespace EquipAI.Tests.Unit.Security;

/// <summary>
/// 用户联系方式加密和盲索引测试。
/// </summary>
public sealed class PiiProtectorTests
{
    [Fact]
    public void 加密后不应包含明文且每次使用随机数()
    {
        var protector = new PiiProtector(BuildConfiguration("Development"));
        const string plainText = "user@example.com";

        var first = protector.Protect(plainText);
        var second = protector.Protect(plainText);

        first.Should().StartWith("enc:v1:");
        first.Should().NotContain(plainText);
        second.Should().NotBe(first);
        protector.Unprotect(first).Should().Be(plainText);
        protector.Unprotect(second).Should().Be(plainText);
    }

    [Fact]
    public void 密文被篡改时必须拒绝解密()
    {
        var protector = new PiiProtector(BuildConfiguration("Development"));
        var protectedValue = protector.Protect("13800138000")!;
        var last = protectedValue[^1];
        var tampered = protectedValue[..^1] + (last == 'A' ? 'B' : 'A');

        var act = () => protector.Unprotect(tampered);

        act.Should().Throw<CryptographicException>();
    }

    [Fact]
    public void 未加密值不能走兼容路径直接返回()
    {
        var protector = new PiiProtector(
            BuildConfiguration("Production", Convert.ToBase64String(new byte[32])));

        var act = () => protector.Unprotect("legacy@example.com");

        act.Should().Throw<CryptographicException>();
    }

    [Fact]
    public void 邮箱规范化应忽略首尾空格和大小写()
    {
        var protector = new PiiProtector(BuildConfiguration("Development"));

        protector.Normalize("email", "  User@EXAMPLE.COM ")
            .Should().Be("user@example.com");
    }

    [Fact]
    public void 手机号规范化应移除常见格式字符()
    {
        var protector = new PiiProtector(BuildConfiguration("Development"));

        protector.Normalize("phone", " +86 (138)- 0011-2233 ")
            .Should().Be("+8613800112233");
    }

    [Fact]
    public void 同一联系方式的规范化输入应得到相同盲索引()
    {
        var protector = new PiiProtector(BuildConfiguration("Development"));

        var first = protector.CreateLookupHash("email", " User@Example.com ");
        var second = protector.CreateLookupHash("email", "user@example.com");

        first.Should().NotBeNullOrWhiteSpace().And.HaveLength(64);
        second.Should().Be(first);
    }

    [Fact]
    public void 不同字段即使明文相同也必须使用不同盲索引域()
    {
        var protector = new PiiProtector(BuildConfiguration("Development"));

        var emailHash = protector.CreateLookupHash("email", "13800138000");
        var phoneHash = protector.CreateLookupHash("phone", "13800138000");

        emailHash.Should().NotBe(phoneHash);
    }

    [Fact]
    public void 空值保护和盲索引应保持为空()
    {
        var protector = new PiiProtector(BuildConfiguration("Development"));

        protector.Protect(null).Should().BeNull();
        protector.Unprotect(null).Should().BeNull();
        protector.CreateLookupHash("email", " ").Should().BeNull();
    }

    [Fact]
    public void 生产环境缺少密钥时保护器必须拒绝启动()
    {
        var configuration = BuildConfiguration("Production", null);

        var act = () => new PiiProtector(configuration);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*PiiEncryptionKey*");
    }

    private static IConfiguration BuildConfiguration(string environment, string? key = null)
        => new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ASPNETCORE_ENVIRONMENT"] = environment,
                ["Security:PiiEncryptionKey"] = key
                    ?? (string.Equals(environment, "Production", StringComparison.OrdinalIgnoreCase)
                        ? null
                        : Convert.ToBase64String(new byte[32]))
            })
            .Build();
}
