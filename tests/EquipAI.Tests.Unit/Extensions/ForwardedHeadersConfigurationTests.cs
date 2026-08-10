using System.Net;
using EquipAI.WebAPI.Extensions;
using FluentAssertions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace EquipAI.Tests.Unit.Extensions;

/// <summary>
/// 反向代理转发头配置测试。
/// </summary>
public sealed class ForwardedHeadersConfigurationTests
{
    /// <summary>
    /// 未显式配置时使用 Docker 默认私有网段，保证生产 Compose 中的 Nginx 可以被识别为可信代理。
    /// </summary>
    [Fact]
    public void ParseTrustedProxyNetworks_WhenEmpty_UsesDockerPrivateNetwork()
    {
        var networks = ForwardedHeadersConfiguration.ParseTrustedProxyNetworks(null);

        networks.Should().ContainSingle();
        networks[0].PrefixLength.Should().Be(12);
        networks[0].Prefix.Should().Be(IPAddress.Parse("172.16.0.0"));
    }

    /// <summary>
    /// 支持多个 IPv4/IPv6 网段，便于部署到自定义 Docker 网络或双栈网络。
    /// </summary>
    [Fact]
    public void ParseTrustedProxyNetworks_WhenConfigured_ReturnsAllNetworks()
    {
        var networks = ForwardedHeadersConfiguration.ParseTrustedProxyNetworks(
            "10.20.0.0/16, fd00:1234::/64");

        networks.Should().HaveCount(2);
        networks[0].Prefix.Should().Be(IPAddress.Parse("10.20.0.0"));
        networks[0].PrefixLength.Should().Be(16);
        networks[1].Prefix.Should().Be(IPAddress.Parse("fd00:1234::"));
        networks[1].PrefixLength.Should().Be(64);
    }

    /// <summary>
    /// 无效网段必须在启动阶段拒绝，而不是静默关闭转发头处理导致限流失真。
    /// </summary>
    [Theory]
    [InlineData("10.20.0.0")]
    [InlineData("10.20.0.0/33")]
    [InlineData("not-a-network/24")]
    [InlineData("10.20.0.0/16,broken")]
    public void ParseTrustedProxyNetworks_WhenInvalid_Throws(string value)
    {
        var act = () => ForwardedHeadersConfiguration.ParseTrustedProxyNetworks(value);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*TRUSTED_PROXY_NETWORKS*");
    }

    /// <summary>
    /// 反向代理模式必须注册真实客户端 IP 还原，并限制为单跳可信代理。
    /// </summary>
    [Fact]
    public void AddTrustedForwardedHeaders_WhenBehindProxy_ConfiguresOneTrustedHop()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["BEHIND_PROXY"] = "true",
                ["TRUSTED_PROXY_NETWORKS"] = "10.20.0.0/16",
            })
            .Build();
        var services = new ServiceCollection();
        services.AddOptions();

        services.AddTrustedForwardedHeaders(configuration);

        using var provider = services.BuildServiceProvider();
        var options = provider.GetRequiredService<IOptions<ForwardedHeadersOptions>>().Value;
        options.ForwardedHeaders.Should().Be(ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto);
        options.ForwardLimit.Should().Be(1);
        options.RequireHeaderSymmetry.Should().BeTrue();
        options.KnownNetworks.Should().ContainSingle(network => network.PrefixLength == 16);
    }
}
