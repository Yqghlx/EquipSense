using EquipAI.Application.Services;
using FluentAssertions;
using Microsoft.Extensions.Configuration;

namespace EquipAI.Tests.Unit.Web;

/// <summary>
/// 网关后端代理目标校验测试，防止 Host 字段演变为 SSRF 入口。
/// </summary>
public class GatewayEndpointPolicyTests
{
    private static GatewayEndpointPolicy CreatePolicy(params string[] allowedHosts)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Gateway:AllowedHosts:0"] = string.Join(',', allowedHosts),
            })
            .Build();
        return new GatewayEndpointPolicy(configuration);
    }

    [Fact]
    public void IsAllowed_只允许配置白名单中的主机()
    {
        var policy = CreatePolicy("edgegateway", "10.20.0.15");

        policy.IsAllowed("edgegateway", 8081, out var allowedReason).Should().BeTrue(allowedReason);
        policy.IsAllowed("untrusted.example.com", 8081, out var rejectedReason).Should().BeFalse();
        rejectedReason.Should().Contain("白名单");
    }

    [Theory]
    [InlineData("127.0.0.1")]
    [InlineData("169.254.169.254")]
    [InlineData("0.0.0.0")]
    [InlineData("::1")]
    public void IsAllowed_拒绝本机和云元数据危险地址(string host)
    {
        var policy = CreatePolicy(host);

        policy.IsAllowed(host, 8081, out var reason).Should().BeFalse();
        reason.Should().NotBeNullOrWhiteSpace();
    }

    [Theory]
    [InlineData("edgegateway", 0)]
    [InlineData("edgegateway", 65536)]
    [InlineData("edge gateway", 8081)]
    public void IsAllowed_拒绝非法主机或端口(string host, int port)
    {
        var policy = CreatePolicy("edgegateway");

        policy.IsAllowed(host, port, out var reason).Should().BeFalse();
        reason.Should().NotBeNullOrWhiteSpace();
    }
}
