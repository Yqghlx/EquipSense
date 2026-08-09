using EquipAI.Application.Services;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace EquipAI.Tests.Unit.Web;

/// <summary>
/// 出站集成目标安全策略测试。
/// </summary>
public class OutboundEndpointPolicyTests
{
    [Theory]
    [InlineData("http://127.0.0.1:8080/internal")]
    [InlineData("http://169.254.169.254/latest/meta-data")]
    [InlineData("http://metadata.google.internal/computeMetadata/v1")]
    [InlineData("file:///etc/passwd")]
    [InlineData("https://user:password@example.com/webhook")]
    public void ValidateConfiguredUri_危险目标_应拒绝(string url)
    {
        var policy = CreatePolicy();

        var result = policy.ValidateConfiguredUri(url);

        result.Allowed.Should().BeFalse();
    }

    [Fact]
    public void ValidateConfiguredUri_生产默认拒绝私网地址()
    {
        var policy = CreatePolicy();

        var result = policy.ValidateConfiguredUri("https://192.168.1.20/api");

        result.Allowed.Should().BeFalse();
    }

    [Fact]
    public void ValidateConfiguredUri_显式允许私网时_应允许企业内网地址()
    {
        var policy = CreatePolicy(allowPrivateNetworks: true);

        var result = policy.ValidateConfiguredUri("https://192.168.1.20/api");

        result.Allowed.Should().BeTrue();
    }

    [Fact]
    public async Task OutboundEndpointValidationHandler_历史回环配置_应在发送前拒绝()
    {
        var policy = CreatePolicy();
        var inner = new RecordingHandler();
        var handler = new OutboundEndpointValidationHandler(
            policy,
            NullLogger<OutboundEndpointValidationHandler>.Instance)
        {
            InnerHandler = inner,
        };
        using var client = new HttpMessageInvoker(handler);

        var act = () => client.SendAsync(new HttpRequestMessage(
            HttpMethod.Post, "http://127.0.0.1:8080/internal"), CancellationToken.None);

        await act.Should().ThrowAsync<HttpRequestException>();
        inner.Called.Should().BeFalse();
    }

    private static OutboundEndpointPolicy CreatePolicy(bool allowPrivateNetworks = false)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ASPNETCORE_ENVIRONMENT"] = "Production",
                ["Security:OutboundHttp:AllowPrivateNetworks"] = allowPrivateNetworks.ToString(),
            })
            .Build();

        return new OutboundEndpointPolicy(configuration);
    }

    private sealed class RecordingHandler : HttpMessageHandler
    {
        public bool Called { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            Called = true;
            return Task.FromResult(new HttpResponseMessage(System.Net.HttpStatusCode.OK));
        }
    }
}
