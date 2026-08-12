using EquipAI.EdgeGateway;
using EquipAI.EdgeGateway.Pipeline;
using EquipAI.EdgeGateway.Protocols;
using FluentAssertions;

namespace EquipAI.Tests.Unit.EdgeGateway;

/// <summary>
/// 配置动态刷新安全门禁测试。
/// </summary>
public class ConfigRefreshServiceTests
{
    [Fact]
    public void 后端成功返回空列表与后端不可达必须区分()
    {
        var available = DeviceConfigurationFetchResult.FromBackend([]);
        var unavailable = DeviceConfigurationFetchResult.Unavailable();

        available.IsAvailable.Should().BeTrue();
        available.Devices.Should().BeEmpty();
        unavailable.IsAvailable.Should().BeFalse();
        unavailable.Devices.Should().BeEmpty();
    }

    [Fact]
    public void Production动态加入OPCUA设备时必须复用启动安全门禁()
    {
        var options = new GatewayOptions
        {
            OpcUaSecurityMode = "None",
            AllowInsecureOpcUa = false,
        };
        var devices = new[]
        {
            new DeviceConfig(
                "device-001",
                "opcua",
                "opc.tcp://plc:4840",
                new Dictionary<string, string> { ["temperature"] = "ns=2;s=Temperature" }),
        };

        var act = () => ConfigRefreshService.ValidateRuntimeConfiguration(
            "Production",
            options,
            devices);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*AllowInsecureOpcUa*");
    }

    [Fact]
    public void 非OPCUA动态配置不应被OPCUA安全模式阻断()
    {
        var options = new GatewayOptions
        {
            OpcUaSecurityMode = "UnknownMode",
            AllowInsecureOpcUa = false,
        };
        var devices = new[]
        {
            new DeviceConfig(
                "device-002",
                "modbus-tcp",
                "plc:502",
                new Dictionary<string, string> { ["temperature"] = "holding_register:1" }),
        };

        var act = () => ConfigRefreshService.ValidateRuntimeConfiguration(
            "Production",
            options,
            devices);

        act.Should().NotThrow();
    }
}
