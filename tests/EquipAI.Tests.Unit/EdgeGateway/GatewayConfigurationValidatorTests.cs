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
    public void 非生产环境保留本地开发配置兼容性()
    {
        var options = new GatewayOptions();

        var act = () => GatewayConfigurationValidator.Validate("Development", options);

        act.Should().NotThrow();
    }
}
