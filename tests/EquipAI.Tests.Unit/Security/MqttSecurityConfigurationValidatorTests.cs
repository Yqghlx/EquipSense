using EquipAI.Core.Security;
using EquipAI.Infrastructure.Messaging;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using MQTTnet.Client;

namespace EquipAI.Tests.Unit.Security;

/// <summary>
/// MQTT 安全配置校验测试。
/// </summary>
public class MqttSecurityConfigurationValidatorTests
{
    [Fact]
    public void 生产环境必须启用TLS()
    {
        var act = () => MqttSecurityConfigurationValidator.Validate(
            componentName: "Mqtt",
            environmentName: "Production",
            port: 1883,
            useTls: false,
            allowUntrustedCertificates: false,
            caCertificatePath: null,
            username: "mqtt-user",
            password: "not-a-real-secret");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Mqtt:UseTls*");
    }

    [Fact]
    public void 生产环境禁止忽略服务端证书校验()
    {
        var act = () => MqttSecurityConfigurationValidator.Validate(
            componentName: "Gateway",
            environmentName: "Production",
            port: 8883,
            useTls: true,
            allowUntrustedCertificates: true,
            caCertificatePath: null,
            username: "mqtt-user",
            password: "not-a-real-secret");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Gateway:AllowUntrustedCertificates*");
    }

    [Fact]
    public void 生产环境必须配置MQTT认证凭据()
    {
        var act = () => MqttSecurityConfigurationValidator.Validate(
            componentName: "Mqtt",
            environmentName: "Production",
            port: 8883,
            useTls: true,
            allowUntrustedCertificates: false,
            caCertificatePath: null,
            username: null,
            password: null);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Mqtt:Username*")
            .And.Message.Should().Contain("Mqtt:Password");
    }

    [Fact]
    public void 生产环境禁止公开的MQTT默认凭据()
    {
        var act = () => MqttSecurityConfigurationValidator.Validate(
            componentName: "Mqtt",
            environmentName: "Production",
            port: 8883,
            useTls: true,
            allowUntrustedCertificates: false,
            caCertificatePath: null,
            username: "device",
            password: "device123");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Mqtt:Username*")
            .And.Message.Should().Contain("Mqtt:Password");
    }

    [Fact]
    public void 开发环境允许明文且允许匿名连接()
    {
        var act = () => MqttSecurityConfigurationValidator.Validate(
            componentName: "Mqtt",
            environmentName: "Development",
            port: 1883,
            useTls: false,
            allowUntrustedCertificates: false,
            caCertificatePath: null,
            username: null,
            password: null);

        act.Should().NotThrow();
    }

    [Fact]
    public void 配置了不存在的CA证书时必须拒绝启动()
    {
        var act = () => MqttSecurityConfigurationValidator.Validate(
            componentName: "Gateway",
            environmentName: "Development",
            port: 8883,
            useTls: true,
            allowUntrustedCertificates: false,
            caCertificatePath: Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N"), "ca.crt"),
            username: "mqtt-user",
            password: "not-a-real-secret");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Gateway:CaCertificatePath*");
    }

    [Fact]
    public void 后端MQTT客户端必须把TLS配置传给MQTTnet()
    {
        var service = new MqttClientService(
            Options.Create(new MqttOptions
            {
                Host = "mqtt.example.com",
                Port = 8883,
                UseTls = true,
                AllowUntrustedCertificates = false,
                Username = "mqtt-user",
                Password = "not-a-real-secret"
            }),
            NullLogger<MqttClientService>.Instance);

        var clientOptions = service.BuildClientOptionsForTest();

        var tcpOptions = clientOptions.ChannelOptions.Should()
            .BeOfType<MqttClientTcpOptions>().Subject;
        tcpOptions.TlsOptions.Should().NotBeNull();
        tcpOptions.TlsOptions!.UseTls.Should().BeTrue();
        tcpOptions.TlsOptions.AllowUntrustedCertificates.Should().BeFalse();
        tcpOptions.TlsOptions.IgnoreCertificateChainErrors.Should().BeFalse();
        tcpOptions.TlsOptions.IgnoreCertificateRevocationErrors.Should().BeFalse();
    }
}
