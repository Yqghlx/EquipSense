using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using EquipAI.WebAPI.Metrics;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Metrics;

/// <summary>
/// 证书读取器单元测试，锁定运行时证书监控的三种核心状态。
/// </summary>
public sealed class CertificateMetricsReaderTests : IDisposable
{
    private readonly string _tempDirectory = Path.Combine(
        Path.GetTempPath(),
        $"equipsense-certificate-tests-{Guid.NewGuid():N}");

    /// <summary>
    /// 初始化测试临时目录。
    /// </summary>
    public CertificateMetricsReaderTests()
    {
        Directory.CreateDirectory(_tempDirectory);
    }

    /// <summary>
    /// 清理测试临时目录。
    /// </summary>
    public void Dispose()
    {
        if (Directory.Exists(_tempDirectory))
        {
            Directory.Delete(_tempDirectory, recursive: true);
        }
    }

    [Fact]
    public void 读取有效证书_应返回可用状态和到期时间()
    {
        var certificatePath = Path.Combine(_tempDirectory, "valid.crt");
        var expectedExpiry = DateTimeOffset.UtcNow.AddDays(40);
        WriteCertificate(certificatePath, expectedExpiry);

        var result = new CertificateMetricsReader().Read(new Dictionary<string, string>
        {
            ["nginx_tls"] = certificatePath,
        });

        result.Should().ContainSingle();
        var certificate = result[0];
        certificate.Name.Should().Be("nginx_tls");
        certificate.IsAvailable.Should().BeTrue();
        certificate.ExpiryTimestampSeconds.Should().BeApproximately(
            expectedExpiry.ToUnixTimeSeconds(),
            precision: 2);
        certificate.DaysUntilExpiry.Should().BeGreaterThan(39);
        certificate.Error.Should().BeNull();
    }

    [Fact]
    public void 读取缺失证书_应返回不可用状态而不是抛异常()
    {
        var result = new CertificateMetricsReader().Read(new Dictionary<string, string>
        {
            ["mqtt_server"] = Path.Combine(_tempDirectory, "missing.crt"),
        });

        result.Should().ContainSingle();
        var certificate = result[0];
        certificate.IsAvailable.Should().BeFalse();
        certificate.ExpiryTimestampSeconds.Should().Be(0);
        certificate.DaysUntilExpiry.Should().Be(0);
        certificate.Error.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void 读取损坏证书_应返回不可用状态而不是抛异常()
    {
        var certificatePath = Path.Combine(_tempDirectory, "invalid.crt");
        File.WriteAllText(certificatePath, "不是有效的 X.509 证书");

        var result = new CertificateMetricsReader().Read(new Dictionary<string, string>
        {
            ["mqtt_ca"] = certificatePath,
        });

        result.Should().ContainSingle();
        var certificate = result[0];
        certificate.IsAvailable.Should().BeFalse();
        certificate.ExpiryTimestampSeconds.Should().Be(0);
        certificate.Error.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void 读取包含私钥的Pfx_应拒绝加载()
    {
        var certificatePath = Path.Combine(_tempDirectory, "private-key.pfx");
        using var rsa = RSA.Create(2048);
        var request = new CertificateRequest(
            "CN=EquipSense private key test certificate",
            rsa,
            HashAlgorithmName.SHA256,
            RSASignaturePadding.Pkcs1);
        using var certificate = request.CreateSelfSigned(
            DateTimeOffset.UtcNow.AddMinutes(-1),
            DateTimeOffset.UtcNow.AddDays(40));
        File.WriteAllBytes(certificatePath, certificate.Export(X509ContentType.Pfx));

        var result = new CertificateMetricsReader().Read(new Dictionary<string, string>
        {
            ["nginx_tls"] = certificatePath,
        });

        result.Should().ContainSingle();
        result[0].IsAvailable.Should().BeFalse();
        result[0].Error.Should().Be("PrivateKeyNotAllowed");
    }

    [Fact]
    public void 读取符号链接证书_应拒绝访问()
    {
        var targetPath = Path.Combine(_tempDirectory, "target.crt");
        var linkPath = Path.Combine(_tempDirectory, "linked.crt");
        WriteCertificate(targetPath, DateTimeOffset.UtcNow.AddDays(40));
        File.CreateSymbolicLink(linkPath, targetPath);

        var result = new CertificateMetricsReader().Read(new Dictionary<string, string>
        {
            ["mqtt_ca"] = linkPath,
        });

        result.Should().ContainSingle();
        result[0].IsAvailable.Should().BeFalse();
        result[0].Error.Should().Be("SymbolicLinkNotAllowed");
    }

    [Fact]
    public void 读取过大证书文件_应在加载前拒绝()
    {
        var certificatePath = Path.Combine(_tempDirectory, "oversized.crt");
        using (var file = File.Create(certificatePath))
        {
            file.SetLength(4 * 1024 * 1024 + 1);
        }

        var result = new CertificateMetricsReader().Read(new Dictionary<string, string>
        {
            ["mqtt_ca"] = certificatePath,
        });

        result.Should().ContainSingle();
        result[0].IsAvailable.Should().BeFalse();
        result[0].Error.Should().Be("FileTooLarge");
    }

    /// <summary>
    /// 生成仅包含公钥的临时证书，模拟生产容器挂载的证书文件。
    /// </summary>
    private static void WriteCertificate(string path, DateTimeOffset expectedExpiry)
    {
        using var rsa = RSA.Create(2048);
        var request = new CertificateRequest(
            "CN=EquipSense test certificate",
            rsa,
            HashAlgorithmName.SHA256,
            RSASignaturePadding.Pkcs1);
        using var certificate = request.CreateSelfSigned(
            DateTimeOffset.UtcNow.AddMinutes(-1),
            expectedExpiry);
        File.WriteAllBytes(path, certificate.Export(X509ContentType.Cert));
    }
}
