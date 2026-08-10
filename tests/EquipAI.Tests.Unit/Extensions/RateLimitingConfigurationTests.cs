using EquipAI.WebAPI.Extensions;
using FluentAssertions;
using Microsoft.Extensions.Configuration;

namespace EquipAI.Tests.Unit.Extensions;

/// <summary>
/// 限流配置和环境门禁测试。
/// </summary>
public sealed class RateLimitingConfigurationTests
{
    [Fact]
    public void 生产环境即使存在禁用开关也必须保持限流()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            ["DISABLE_RATE_LIMITING"] = "true",
            ["DisableRateLimiting"] = "true",
        });

        RateLimitingConfiguration.ShouldDisable("Production", configuration)
            .Should().BeFalse();
    }

    [Fact]
    public void 测试环境允许显式关闭限流()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            ["DISABLE_RATE_LIMITING"] = "true",
        });

        RateLimitingConfiguration.ShouldDisable("Testing", configuration)
            .Should().BeTrue();
    }

    [Fact]
    public void 生产配置应读取完整限流参数()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            ["RateLimiting:PermitLimit"] = "500",
            ["RateLimiting:AuthPermitLimit"] = "80",
            ["RateLimiting:TenantPermitLimit"] = "5000",
            ["RateLimiting:Window"] = "00:02:00",
        });

        var options = RateLimitingOptions.FromConfiguration(configuration);

        options.PermitLimit.Should().Be(500);
        options.AuthPermitLimit.Should().Be(80);
        options.TenantPermitLimit.Should().Be(5000);
        options.Window.Should().Be(TimeSpan.FromMinutes(2));
    }

    [Fact]
    public void 限流参数为非正数时拒绝启动()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            ["RateLimiting:AuthPermitLimit"] = "0",
        });

        var act = () => RateLimitingOptions.FromConfiguration(configuration);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*AuthPermitLimit*");
    }

    private static IConfiguration BuildConfiguration(
        IReadOnlyDictionary<string, string?>? values = null)
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(values ?? new Dictionary<string, string?>())
            .Build();
    }
}
