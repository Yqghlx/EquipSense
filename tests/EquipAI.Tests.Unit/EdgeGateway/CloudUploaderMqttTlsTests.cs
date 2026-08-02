using EquipAI.EdgeGateway;
using EquipAI.EdgeGateway.Pipeline;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MQTTnet.Client;

namespace EquipAI.Tests.Unit.EdgeGateway;

/// <summary>
/// 边缘网关 MQTT TLS 选项构建测试。
/// </summary>
public class CloudUploaderMqttTlsTests
{
    [Fact]
    public void 边缘网关MQTT客户端必须把TLS配置传给MQTTnet()
    {
        var uploader = new CloudUploader(
            NullLogger<CloudUploader>.Instance,
            new GatewayOptions
            {
                MqttBroker = "mqtt.example.com:8883",
                MqttUseTls = true,
                MqttAllowUntrustedCertificates = false,
                MqttUsername = "mqtt-user",
                MqttPassword = "not-a-real-secret"
            });

        var clientOptions = uploader.BuildMqttClientOptionsForTest();

        var tcpOptions = clientOptions.ChannelOptions.Should()
            .BeOfType<MqttClientTcpOptions>().Subject;
        tcpOptions.TlsOptions.Should().NotBeNull();
        tcpOptions.TlsOptions!.UseTls.Should().BeTrue();
        tcpOptions.TlsOptions.AllowUntrustedCertificates.Should().BeFalse();
        tcpOptions.TlsOptions.IgnoreCertificateChainErrors.Should().BeFalse();
        tcpOptions.TlsOptions.IgnoreCertificateRevocationErrors.Should().BeFalse();
    }
}
