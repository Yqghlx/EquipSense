using EquipAI.Core.Security;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Security;

/// <summary>
/// OPC UA 安全模式配置校验测试。
/// 校验器只返回结构化级别，具体是否阻断由边缘网关宿主决定；
/// 生产环境的 Error 结果会在宿主层形成启动门禁，老旧设备兼容必须显式 break-glass。
/// </summary>
public class OpcUaSecurityConfigurationValidatorTests
{
    private const string Production = "Production";
    private const string Development = "Development";

    [Fact]
    public void 生产环境None模式必须返回Error级别告警()
    {
        var result = OpcUaSecurityConfigurationValidator.Validate(
            environmentName: Production,
            securityMode: "None");

        result.Should().NotBeNull();
        result!.Value.Level.Should().Be(OpcUaSecurityAlertLevel.Error);
        result.Value.Message.Should().Contain("明文采集");
    }

    [Fact]
    public void 生产环境未配置安全模式视为None并返回Error()
    {
        var result = OpcUaSecurityConfigurationValidator.Validate(
            environmentName: Production,
            securityMode: null);

        result.Should().NotBeNull();
        result!.Value.Level.Should().Be(OpcUaSecurityAlertLevel.Error);
    }

    [Fact]
    public void 生产环境空字符串安全模式视为None并返回Error()
    {
        var result = OpcUaSecurityConfigurationValidator.Validate(
            environmentName: Production,
            securityMode: "  ");

        result.Should().NotBeNull();
        result!.Value.Level.Should().Be(OpcUaSecurityAlertLevel.Error);
    }

    [Fact]
    public void 生产环境Sign模式返回Warning级别告警()
    {
        var result = OpcUaSecurityConfigurationValidator.Validate(
            environmentName: Production,
            securityMode: "Sign");

        result.Should().NotBeNull();
        result!.Value.Level.Should().Be(OpcUaSecurityAlertLevel.Warning);
        result.Value.Message.Should().Contain("仅签名");
        result.Value.Message.Should().Contain("嗅探");
    }

    [Fact]
    public void 生产环境SignAndEncrypt模式无告警()
    {
        var result = OpcUaSecurityConfigurationValidator.Validate(
            environmentName: Production,
            securityMode: "SignAndEncrypt");

        result.Should().BeNull();
    }

    [Fact]
    public void 开发环境None模式不产生告警()
    {
        var result = OpcUaSecurityConfigurationValidator.Validate(
            environmentName: Development,
            securityMode: "None");

        result.Should().BeNull();
    }

    [Fact]
    public void 安全模式大小写不敏感()
    {
        var lower = OpcUaSecurityConfigurationValidator.Validate(
            environmentName: Production,
            securityMode: "signandencrypt");
        var mixed = OpcUaSecurityConfigurationValidator.Validate(
            environmentName: Production,
            securityMode: "SIGNANDENCRYPT");

        lower.Should().BeNull();
        mixed.Should().BeNull();
    }

    [Fact]
    public void OPCUA未启用时不校验安全模式()
    {
        // 仅配置了 modbus-tcp，不校验 OPC UA 安全模式
        var result = OpcUaSecurityConfigurationValidator.Validate(
            environmentName: Production,
            securityMode: "None",
            enabledProtocols: ["modbus-tcp", "modbus-rtu"]);

        result.Should().BeNull();
    }

    [Fact]
    public void 当前没有设备配置时不校验OPCUA安全模式()
    {
        // 空协议列表表示当前没有实际启用 OPC UA，不能因为配置默认值为 None 阻断空网关启动。
        var result = OpcUaSecurityConfigurationValidator.Validate(
            environmentName: Production,
            securityMode: "None",
            enabledProtocols: []);

        result.Should().BeNull();
    }

    [Fact]
    public void 启用协议列表含OPCUA时校验安全模式()
    {
        var result = OpcUaSecurityConfigurationValidator.Validate(
            environmentName: Production,
            securityMode: "None",
            enabledProtocols: ["opcua", "modbus-tcp"]);

        result.Should().NotBeNull();
        result!.Value.Level.Should().Be(OpcUaSecurityAlertLevel.Error);
    }

    [Fact]
    public void 启用协议检查大小写不敏感()
    {
        var result = OpcUaSecurityConfigurationValidator.Validate(
            environmentName: Production,
            securityMode: "None",
            enabledProtocols: ["OpcUa"]);

        result.Should().NotBeNull();
        result!.Value.Level.Should().Be(OpcUaSecurityAlertLevel.Error);
    }

    [Fact]
    public void 未传入启用协议列表时默认校验()
    {
        // enabledProtocols 为 null：不跳过校验（保守策略——不确定是否启用时仍校验）
        var result = OpcUaSecurityConfigurationValidator.Validate(
            environmentName: Production,
            securityMode: "None",
            enabledProtocols: null);

        result.Should().NotBeNull();
    }

    [Fact]
    public void 启用协议列表包含空值时不应抛出空引用异常()
    {
        var result = OpcUaSecurityConfigurationValidator.Validate(
            environmentName: Production,
            securityMode: "None",
            enabledProtocols: new[] { (string)null! });

        result.Should().BeNull();
    }

    [Fact]
    public void 生产环境未知安全模式必须返回Error级别告警()
    {
        var result = OpcUaSecurityConfigurationValidator.Validate(
            environmentName: Production,
            securityMode: "UnknownMode");

        result.Should().NotBeNull();
        result!.Value.Level.Should().Be(OpcUaSecurityAlertLevel.Error);
        result.Value.Message.Should().Contain("不支持");
    }
}
