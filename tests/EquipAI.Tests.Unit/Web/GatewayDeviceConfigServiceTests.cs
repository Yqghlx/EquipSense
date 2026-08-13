using System.Net;
using System.Net.Http.Json;
using EquipAI.Application.DTOs.Gateway;
using EquipAI.Application.Services;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace EquipAI.Tests.Unit.Web;

/// <summary>
/// 网关代理请求安全测试。
/// </summary>
public sealed class GatewayDeviceConfigServiceTests
{
    [Fact]
    public async Task ListAsync_应只返回服务租户配置()
    {
        // Arrange：故意让 DbContext 的过滤器租户与服务租户不一致，验证显式业务谓词优先。
        await using var db = CreateDb(out var contextTenantId);
        var serviceTenantId = Guid.NewGuid();
        db.GatewayDevices.Add(CreateGatewayDevice(contextTenantId, "上下文租户配置"));
        await db.SaveChangesAsync();
        var service = CreateService(db, serviceTenantId);

        // Act
        var result = await service.ListAsync();

        // Assert：旧实现会返回全局过滤器命中的上下文租户配置；显式租户谓词应将其排除。
        result.Should().BeEmpty("网关配置列表不得依赖可能失配的全局过滤器上下文");
    }

    [Fact]
    public async Task UpdateAsync_其他租户配置_应返回null且保持原数据()
    {
        // Arrange：实体已被当前上下文跟踪，复现 FindAsync 命中其他租户配置的路径。
        await using var db = CreateDb(out var contextTenantId);
        var serviceTenantId = Guid.NewGuid();
        var entity = CreateGatewayDevice(contextTenantId, "不可修改配置");
        db.GatewayDevices.Add(entity);
        await db.SaveChangesAsync();
        var service = CreateService(db, serviceTenantId);

        // Act
        var result = await service.UpdateAsync(
            entity.Id,
            new UpdateGatewayDeviceRequest { DeviceName = "越权修改" });

        // Assert
        result.Should().BeNull("其他租户配置按不存在处理");
        var persisted = await db.GatewayDevices.IgnoreQueryFilters()
            .AsNoTracking()
            .SingleAsync(d => d.Id == entity.Id);
        persisted.DeviceName.Should().Be("不可修改配置");
    }

    [Fact]
    public async Task DeleteAsync_其他租户配置_应返回false且保留原数据()
    {
        // Arrange：实体已被当前上下文跟踪，复现 FindAsync 导致跨租户删除的路径。
        await using var db = CreateDb(out var contextTenantId);
        var serviceTenantId = Guid.NewGuid();
        var entity = CreateGatewayDevice(contextTenantId, "不可删除配置");
        db.GatewayDevices.Add(entity);
        await db.SaveChangesAsync();
        var service = CreateService(db, serviceTenantId);

        // Act
        var deleted = await service.DeleteAsync(entity.Id);

        // Assert
        deleted.Should().BeFalse("其他租户配置不得被删除");
        var exists = await db.GatewayDevices.IgnoreQueryFilters()
            .AsNoTracking()
            .AnyAsync(d => d.Id == entity.Id);
        exists.Should().BeTrue();
    }

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

    [Fact]
    public async Task 代理连接测试收到取消时应传播取消而不是回退校验()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Gateway:AllowedHosts:0"] = "10.20.0.15",
                ["Gateway:AuthKey"] = "gateway-secret",
            })
            .Build();
        var policy = new GatewayEndpointPolicy(configuration);
        using var httpClient = new HttpClient(new CancellationHandler());
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(item => item.CreateClient("GatewayProxy")).Returns(httpClient);

        var service = new GatewayDeviceConfigService(
            dbContext: null!,
            tenantContext: Mock.Of<ITenantContext>(),
            endpointPolicy: policy,
            httpClientFactory: factory.Object,
            logger: NullLogger<GatewayDeviceConfigService>.Instance);

        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();

        var act = () => service.ProxyTestConnectionAsync(
            "modbus-tcp",
            "{\"host\":\"10.20.0.20\",\"port\":502}",
            new Gateway
            {
                GatewayId = "gateway-001",
                Host = "10.20.0.15",
                HealthPort = 8081,
                Enabled = true,
            },
            cancellation.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    private static AppDbContext CreateDb(out Guid tenantId)
    {
        tenantId = Guid.NewGuid();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"GatewayConfig_{Guid.NewGuid()}")
            .Options;
        return new AppDbContext(options, new FixedTenantContext(tenantId));
    }

    private static GatewayDeviceConfigService CreateService(AppDbContext db, Guid tenantId)
    {
        var configuration = new ConfigurationBuilder().Build();
        return new GatewayDeviceConfigService(
            db,
            new FixedTenantContext(tenantId),
            new GatewayEndpointPolicy(configuration),
            new Mock<IHttpClientFactory>().Object,
            NullLogger<GatewayDeviceConfigService>.Instance);
    }

    private static GatewayDevice CreateGatewayDevice(Guid tenantId, string name)
        => new()
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            GatewayId = "gateway-001",
            DeviceName = name,
            Protocol = "modbus-tcp",
            ConnectionConfig = "{\"host\":\"10.0.0.1\",\"port\":502}",
            DataPoints = "{}",
            PollIntervalMs = 3000,
            Enabled = true,
        };

    private sealed class FixedTenantContext(Guid tenantId) : ITenantContext
    {
        public Guid TenantId { get; } = tenantId;
        public string IsolationMode { get; } = "Shared";
        public bool IsSystemAdmin { get; } = false;
        public Guid UserId { get; } = Guid.Empty;
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

    private sealed class CancellationHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
            => Task.FromException<HttpResponseMessage>(new OperationCanceledException(cancellationToken));
    }
}
