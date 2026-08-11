using System.Net;
using System.Net.Http.Json;
using EquipAI.Application.Services;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace EquipAI.Tests.Unit.Web;

/// <summary>
/// 网关代理请求安全测试。
/// </summary>
public sealed class GatewayDeviceConfigServiceTests
{
    [Fact]
    public async Task 代理连接测试请求应携带网关认证密钥()
    {
        const string authKey = "gateway-secret";
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Gateway:AllowedHosts:0"] = "10.20.0.15",
                ["Gateway:AuthKey"] = authKey,
            })
            .Build();
        var policy = new GatewayEndpointPolicy(configuration);
        var handler = new CapturingHandler();
        using var httpClient = new HttpClient(handler);
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(item => item.CreateClient("GatewayProxy")).Returns(httpClient);

        var service = new GatewayDeviceConfigService(
            dbContext: null!,
            tenantContext: Mock.Of<ITenantContext>(),
            endpointPolicy: policy,
            httpClientFactory: factory.Object,
            logger: NullLogger<GatewayDeviceConfigService>.Instance);

        await service.ProxyTestConnectionAsync(
            "modbus-tcp",
            "{\"host\":\"10.20.0.20\",\"port\":502}",
            new Gateway
            {
                GatewayId = "gateway-001",
                Host = "10.20.0.15",
                HealthPort = 8081,
                Enabled = true,
            });

        handler.Request.Should().NotBeNull();
        handler.Request!.Headers.TryGetValues("X-Gateway-Auth-Key", out var values).Should().BeTrue();
        values.Should().ContainSingle().Which.Should().Be(authKey);
    }

    private sealed class CapturingHandler : HttpMessageHandler
    {
        public HttpRequestMessage? Request { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            Request = request;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = JsonContent.Create(new { success = true, message = "连接测试成功" }),
            });
        }
    }
}
