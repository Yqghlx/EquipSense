using EquipAI.Application.Services;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.WebAPI.Controllers;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace EquipAI.Tests.Unit.Web;

/// <summary>
/// 网关状态代理控制器测试。
/// </summary>
public sealed class GatewaysControllerTests
{
    [Fact]
    public async Task 网关状态代理收到取消时应传播取消而不是返回离线()
    {
        var tenantId = Guid.NewGuid();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"GatewaysController_{Guid.NewGuid()}")
            .Options;
        await using var db = new AppDbContext(options, new FixedTenantContext(tenantId));
        db.Set<Gateway>().Add(new Gateway
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            GatewayId = "gateway-001",
            Name = "测试网关",
            Host = "10.20.0.15",
            HealthPort = 8081,
            Status = "online",
            Enabled = true,
        });
        await db.SaveChangesAsync();

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Gateway:AllowedHosts:0"] = "10.20.0.15",
                ["Gateway:AuthKey"] = "gateway-secret",
            })
            .Build();
        var endpointPolicy = new GatewayEndpointPolicy(configuration);
        using var cancellation = new CancellationTokenSource();
        using var httpClient = new HttpClient(new CancellationHandler(cancellation));
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(item => item.CreateClient("GatewayProxy")).Returns(httpClient);
        var service = new GatewayManagementService(
            db,
            new FixedTenantContext(tenantId),
            endpointPolicy,
            NullLogger<GatewayManagementService>.Instance);
        var controller = new GatewaysController(
            service,
            endpointPolicy,
            factory.Object,
            configuration,
            NullLogger<GatewaysController>.Instance);

        var act = () => controller.GetStatus("gateway-001", cancellation.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    private sealed class FixedTenantContext(Guid tenantId) : ITenantContext
    {
        public Guid TenantId { get; } = tenantId;
        public string IsolationMode { get; } = "Shared";
        public bool IsSystemAdmin { get; } = false;
        public Guid UserId { get; } = Guid.Empty;
    }

    private sealed class CancellationHandler : HttpMessageHandler
    {
        private readonly CancellationTokenSource _cancellation;

        public CancellationHandler(CancellationTokenSource cancellation)
        {
            _cancellation = cancellation;
        }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            _cancellation.Cancel();
            return Task.FromException<HttpResponseMessage>(new OperationCanceledException(cancellationToken));
        }
    }
}
