using EquipAI.EdgeGateway;
using FluentAssertions;

namespace EquipAI.Tests.Unit.EdgeGateway;

/// <summary>
/// 边缘网关生产配置门禁测试，确保配置缺失时不会以“健康”状态运行。
/// </summary>
public class GatewayConfigurationValidatorTests
{
    private static GatewayOptions CreateValidProductionOptions()
        => new()
        {
            Id = "gateway-001",
            TenantId = "11111111-1111-1111-1111-111111111111",
            BackendUrl = "http://backend:8080",
            AuthKey = "gateway-auth-key-that-is-longer-than-32",
            BufferPath = "/data/buffer.db",
        };

    [Fact]
    public void 生产环境必须配置有效租户ID()
    {
        var options = CreateValidProductionOptions();
        options.TenantId = string.Empty;

        var act = () => GatewayConfigurationValidator.Validate("Production", options);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*TenantId*");
    }

    [Theory]
    [InlineData("backend:8080")]
    [InlineData("ftp://backend:8080")]
    [InlineData("不是有效地址")]
    public void 生产环境后端地址必须是绝对HTTP或HTTPS地址(string backendUrl)
    {
        var options = CreateValidProductionOptions();
        options.BackendUrl = backendUrl;

        var act = () => GatewayConfigurationValidator.Validate("Production", options);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*BackendUrl*");
    }

    [Theory]
    [InlineData(":8883")]
    [InlineData("mosquitto:not-a-port")]
    [InlineData("mosquitto:70000")]
    public void 生产环境MQTT地址格式错误时必须拒绝启动(string mqttBroker)
    {
        var options = CreateValidProductionOptions();
        options.MqttBroker = mqttBroker;

        var act = () => GatewayConfigurationValidator.Validate("Production", options);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*MqttBroker*");
    }

    [Fact]
    public void 生产环境MQTT地址缺失时必须拒绝启动而不是抛出空引用异常()
    {
        var options = CreateValidProductionOptions();
        options.MqttBroker = null!;

        var act = () => GatewayConfigurationValidator.Validate("Production", options);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*MqttBroker*");
    }

    [Fact]
    public void 生产环境网关密钥过短时必须拒绝启动()
    {
        var options = CreateValidProductionOptions();
        options.AuthKey = "short-key";

        var act = () => GatewayConfigurationValidator.Validate("Production", options);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*AuthKey*");
    }

    [Theory]
    [InlineData("${GATEWAY_AUTH_KEY}")]
    [InlineData("SET_VIA_USER_SECRETS")]
    [InlineData("PLEASE_CHANGE_THIS_TO_ASCII_STRONG_KEY_AT_LEAST_32_CHARS")]
    public void 生产环境网关密钥为占位值时必须拒绝启动(string placeholder)
    {
        var options = CreateValidProductionOptions();
        options.AuthKey = placeholder;

        var act = () => GatewayConfigurationValidator.Validate("Production", options);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*AuthKey*");
    }

    [Fact]
    public void 生产环境网关密钥含非ASCII字符时必须拒绝启动()
    {
        var options = CreateValidProductionOptions();
        options.AuthKey = "这是一个长度足够但不应通过的网关密钥1234567890";

        var act = () => GatewayConfigurationValidator.Validate("Production", options);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*AuthKey*");
    }

    [Fact]
    public void 生产环境必须使用绝对路径保存离线缓存()
    {
        var options = CreateValidProductionOptions();
        options.BufferPath = "data/buffer.db";

        var act = () => GatewayConfigurationValidator.Validate("Production", options);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*BufferPath*");
    }

    [Fact]
    public void 生产环境健康端口必须是可由非特权进程监听的有效端口()
    {
        var options = CreateValidProductionOptions();
        options.HealthPort = 70000;

        var act = () => GatewayConfigurationValidator.Validate("Production", options);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*HealthPort*");
    }

    [Fact]
    public void 非生产环境保留本地开发配置兼容性()
    {
        var options = new GatewayOptions();

        var act = () => GatewayConfigurationValidator.Validate("Development", options);

        act.Should().NotThrow();
    }
}
