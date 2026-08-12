using EquipAI.WebAPI.Metrics;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Metrics;

/// <summary>
/// 生产证书监控配置门禁测试。
/// </summary>
public sealed class CertificateMonitoringOptionsValidatorTests
{
    [Fact]
    public void Production关闭证书监控_应拒绝启动()
    {
        var options = new CertificateMonitoringOptions
        {
            Enabled = false,
            Certificates = CreateCertificates(),
        };

        var action = () => CertificateMonitoringOptionsValidator.ValidateForEnvironment(options, "Production");

        action.Should().Throw<InvalidOperationException>()
            .WithMessage("*必须启用证书生命周期监控*");
    }

    [Fact]
    public void Production缺少任一关键证书_应拒绝启动()
    {
        var certificates = CreateCertificates();
        certificates.Remove("mqtt_ca");
        var options = new CertificateMonitoringOptions
        {
            Enabled = true,
            Certificates = certificates,
        };

        var action = () => CertificateMonitoringOptionsValidator.ValidateForEnvironment(options, "Production");

        action.Should().Throw<InvalidOperationException>()
            .WithMessage("*mqtt_ca*");
    }

    [Fact]
    public void Production证书路径被覆盖或加入未知证书_应拒绝启动()
    {
        var certificates = CreateCertificates();
        certificates["mqtt_server"] = "/tmp/another-certificate.crt";
        certificates["unexpected"] = "/etc/passwd";
        var options = new CertificateMonitoringOptions
        {
            Enabled = true,
            Certificates = certificates,
        };

        var action = () => CertificateMonitoringOptionsValidator.ValidateForEnvironment(options, "Production");

        action.Should().Throw<InvalidOperationException>()
            .WithMessage("*mqtt_server*")
            .WithMessage("*unexpected*");
    }

    [Fact]
    public void 非Production关闭证书监控_应允许启动()
    {
        var options = new CertificateMonitoringOptions
        {
            Enabled = false,
        };

        var action = () => CertificateMonitoringOptionsValidator.ValidateForEnvironment(options, "Testing");

        action.Should().NotThrow();
    }

    /// <summary>
    /// 创建完整的生产证书配置。
    /// </summary>
    private static Dictionary<string, string> CreateCertificates() => new()
    {
        ["nginx_tls"] = "/etc/equipai/tls/cert.pem",
        ["mqtt_server"] = "/etc/equipai/mqtt-certs/server.crt",
        ["mqtt_ca"] = "/etc/equipai/mqtt-certs/ca.crt",
    };
}
