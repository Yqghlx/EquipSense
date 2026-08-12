using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using EquipAI.WebAPI.Metrics;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;

namespace EquipAI.Tests.Unit.Metrics;

/// <summary>
/// 证书后台采集服务单元测试。
/// </summary>
public sealed class CertificateMetricsCollectorTests : IDisposable
{
    private readonly string _tempDirectory = Path.Combine(
        Path.GetTempPath(),
        $"equipsense-certificate-collector-tests-{Guid.NewGuid():N}");

    /// <summary>
    /// 初始化测试临时目录。
    /// </summary>
    public CertificateMetricsCollectorTests()
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
    public void 采集有效和缺失证书_应分别写入可用与不可用结果()
    {
        var validPath = Path.Combine(_tempDirectory, "valid.crt");
        WriteCertificate(validPath);
        var sink = new RecordingCertificateMetricsSink();
        var options = new CertificateMonitoringOptions
        {
            Enabled = true,
            Certificates = new Dictionary<string, string>
            {
                ["nginx_tls"] = validPath,
                ["mqtt_server"] = Path.Combine(_tempDirectory, "missing.crt"),
            },
        };

        var collector = new CertificateMetricsCollector(
            options,
            new CertificateMetricsReader(),
            sink,
            NullLogger<CertificateMetricsCollector>.Instance);

        collector.CollectOnce();

        sink.Results.Should().HaveCount(2);
        sink.Results.Single(result => result.Name == "nginx_tls").IsAvailable.Should().BeTrue();
        sink.Results.Single(result => result.Name == "mqtt_server").IsAvailable.Should().BeFalse();
    }

    [Fact]
    public void 监控关闭时_不应读取证书或写入指标()
    {
        var sink = new RecordingCertificateMetricsSink();
        var options = new CertificateMonitoringOptions
        {
            Enabled = false,
            Certificates = new Dictionary<string, string>
            {
                ["nginx_tls"] = Path.Combine(_tempDirectory, "missing.crt"),
            },
        };

        var collector = new CertificateMetricsCollector(
            options,
            new CertificateMetricsReader(),
            sink,
            NullLogger<CertificateMetricsCollector>.Instance);

        collector.CollectOnce();

        sink.Results.Should().BeEmpty();
    }

    [Fact]
    public void 指标写入器异常时_不应阻止其他证书继续采集()
    {
        var firstPath = Path.Combine(_tempDirectory, "first.crt");
        var secondPath = Path.Combine(_tempDirectory, "second.crt");
        WriteCertificate(firstPath);
        WriteCertificate(secondPath);
        var sink = new ThrowingCertificateMetricsSink("nginx_tls");
        var options = new CertificateMonitoringOptions
        {
            Enabled = true,
            Certificates = new Dictionary<string, string>
            {
                ["nginx_tls"] = firstPath,
                ["mqtt_ca"] = secondPath,
            },
        };

        var collector = new CertificateMetricsCollector(
            options,
            new CertificateMetricsReader(),
            sink,
            NullLogger<CertificateMetricsCollector>.Instance);

        var action = () => collector.CollectOnce();

        action.Should().NotThrow();
        sink.Results.Should().ContainSingle(result => result.Name == "mqtt_ca");
    }

    /// <summary>
    /// 生成仅包含公钥的临时证书。
    /// </summary>
    private static void WriteCertificate(string path)
    {
        using var rsa = RSA.Create(2048);
        var request = new CertificateRequest(
            "CN=EquipSense collector test certificate",
            rsa,
            HashAlgorithmName.SHA256,
            RSASignaturePadding.Pkcs1);
        using var certificate = request.CreateSelfSigned(
            DateTimeOffset.UtcNow.AddMinutes(-1),
            DateTimeOffset.UtcNow.AddDays(40));
        File.WriteAllBytes(path, certificate.Export(X509ContentType.Cert));
    }

    /// <summary>
    /// 记录采集结果的测试指标写入器。
    /// </summary>
    private sealed class RecordingCertificateMetricsSink : ICertificateMetricsSink
    {
        /// <summary>已记录的证书结果。</summary>
        public List<CertificateReadResult> Results { get; } = [];

        /// <summary>
        /// 记录一条证书结果。
        /// </summary>
        public void Set(CertificateReadResult result)
        {
            Results.Add(result);
        }
    }

    /// <summary>
    /// 对指定证书模拟指标注册表写入异常，验证后台采集边界不会被单个指标拖垮。
    /// </summary>
    private sealed class ThrowingCertificateMetricsSink : ICertificateMetricsSink
    {
        private readonly string _failingCertificate;

        /// <summary>成功写入的证书结果。</summary>
        public List<CertificateReadResult> Results { get; } = [];

        /// <summary>初始化异常模拟写入器。</summary>
        public ThrowingCertificateMetricsSink(string failingCertificate)
        {
            _failingCertificate = failingCertificate;
        }

        /// <summary>按配置模拟一次写入失败。</summary>
        public void Set(CertificateReadResult result)
        {
            if (result.Name == _failingCertificate)
            {
                throw new InvalidOperationException("测试用指标写入失败");
            }

            Results.Add(result);
        }
    }
}
