using EquipAI.Infrastructure.Seeding;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Seeding;

/// <summary>
/// 演示数据播种策略测试，确保 Production 默认不会引入验收专用业务数据。
/// </summary>
public class DemoDataSeedingPolicyTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("false")]
    [InlineData("0")]
    [InlineData("invalid")]
    public void 生产环境未显式开启时不应播种演示数据(string? configuredValue)
    {
        DemoDataSeedingPolicy.ShouldSeedDemoData(true, configuredValue).Should().BeFalse();
    }

    [Theory]
    [InlineData("true")]
    [InlineData("TRUE")]
    [InlineData("1")]
    [InlineData("full")]
    public void 生产环境显式开启时才播种演示数据(string configuredValue)
    {
        DemoDataSeedingPolicy.ShouldSeedDemoData(true, configuredValue).Should().BeTrue();
    }

    [Fact]
    public void 非生产环境未配置开关时保持演示数据兼容性()
    {
        DemoDataSeedingPolicy.ShouldSeedDemoData(false, null).Should().BeTrue();
    }

    [Theory]
    [InlineData("full")]
    [InlineData("FULL")]
    [InlineData(" full ")]
    public void full值只应识别为完整演示数据模式(string configuredValue)
    {
        DemoDataSeedingPolicy.IsFullDemoData(configuredValue).Should().BeTrue();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("true")]
    [InlineData("1")]
    [InlineData("false")]
    [InlineData("0")]
    public void 非full值不应进入完整演示数据模式(string? configuredValue)
    {
        DemoDataSeedingPolicy.IsFullDemoData(configuredValue).Should().BeFalse();
    }

    [Fact]
    public void Production完整模式缺少隔离授权时应拒绝()
    {
        var act = () => DemoDataSeedingPolicy.EnsureFullDemoDataAllowed(
            isProduction: true,
            configuredValue: "full",
            isolatedE2eValue: null);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*EQUIPAI_ISOLATED_E2E*");
    }

    [Fact]
    public void Production完整模式带隔离授权时应允许()
    {
        var act = () => DemoDataSeedingPolicy.EnsureFullDemoDataAllowed(
            isProduction: true,
            configuredValue: "full",
            isolatedE2eValue: "true");

        act.Should().NotThrow();
    }
}
