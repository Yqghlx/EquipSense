using FluentAssertions;
using Xunit.Sdk;

namespace EquipAI.Tests.Unit.EdgeGateway;

/// <summary>
/// 验证工业协议集成测试的启用和失败边界。
/// </summary>
public sealed class ProtocolIntegrationTestEnvironmentTests
{
    /// <summary>
    /// 未配置端点时应使用仓库 Simulator 的默认 OPC UA 地址。
    /// </summary>
    [Fact]
    public void 未配置端点时使用默认地址()
    {
        var endpoint = ProtocolIntegrationTestEnvironment.ReadEndpoint(
            "EQUIPAI_OPCUA_TEST_ENDPOINT",
            "opc.tcp://127.0.0.1:4840",
            new Dictionary<string, string?>());

        endpoint.Should().Be("opc.tcp://127.0.0.1:4840");
    }

    /// <summary>
    /// 显式端点应原样传递，便于 CI 或本地隔离环境覆盖端口。
    /// </summary>
    [Fact]
    public void 显式端点时原样传递()
    {
        var endpoint = ProtocolIntegrationTestEnvironment.ReadEndpoint(
            "EQUIPAI_MODBUS_TEST_ENDPOINT",
            "127.0.0.1:5020",
            new Dictionary<string, string?>
            {
                ["EQUIPAI_MODBUS_TEST_ENDPOINT"] = "127.0.0.1:15020",
            });

        endpoint.Should().Be("127.0.0.1:15020");
    }

    /// <summary>
    /// 默认未启用协议测试且模拟器不可用时，必须是可识别的跳过。
    /// </summary>
    [Fact]
    public void 未启用且模拟器不可用时明确跳过()
    {
        var act = () => ProtocolIntegrationTestEnvironment.EnsureAvailable(
            "OPC UA",
            enabled: false,
            available: false);

        act.Should().Throw<SkipException>()
            .WithMessage("*OPC UA*");
    }

    /// <summary>
    /// 显式启用协议测试但模拟器不可用时，必须失败而不是静默跳过。
    /// </summary>
    [Fact]
    public void 显式启用但模拟器不可用时失败关闭()
    {
        var act = () => ProtocolIntegrationTestEnvironment.EnsureAvailable(
            "Modbus TCP",
            enabled: true,
            available: false);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Modbus TCP*");
    }

    /// <summary>
    /// 未显式启用时，自定义 Fact 属性应在发现阶段提供跳过原因。
    /// </summary>
    [Fact]
    public void 未启用时协议Fact属性包含跳过原因()
    {
        var attribute = new ProtocolFactAttribute(enabled: false);

        attribute.Skip.Should().Contain(ProtocolIntegrationTestEnvironment.RunEnvironmentVariable);
    }

    /// <summary>
    /// 显式启用时，自定义 Fact 属性不得提前跳过测试。
    /// </summary>
    [Fact]
    public void 显式启用时协议Fact属性不跳过()
    {
        var attribute = new ProtocolFactAttribute(enabled: true);

        attribute.Skip.Should().BeNull();
    }
}
