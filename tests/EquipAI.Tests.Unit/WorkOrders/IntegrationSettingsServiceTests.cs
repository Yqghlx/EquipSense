using System.Text.Json;
using EquipAI.Application.Services;
using EquipAI.Application.WorkOrders.Integration;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace EquipAI.Tests.Unit.WorkOrders;

/// <summary>
/// 集成配置服务测试。
/// </summary>
public class IntegrationSettingsServiceTests : IAsyncDisposable
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly AppDbContext _db;
    private readonly IntegrationSettingsService _sut;

    public IntegrationSettingsServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"IntegrationSettings_{Guid.NewGuid():N}")
            .Options;
        var tenantContext = new TestTenantContext(_tenantId);
        _db = new AppDbContext(options, tenantContext);

        var integration = new Mock<IWorkOrderIntegration>();
        integration.SetupGet(item => item.IntegrationType).Returns("webhook");
        integration.Setup(item => item.PushCreatedAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ASPNETCORE_ENVIRONMENT"] = "Testing",
            })
            .Build();

        _sut = new IntegrationSettingsService(
            _db,
            tenantContext,
            [integration.Object],
            new OutboundEndpointPolicy(configuration),
            NullLogger<IntegrationSettingsService>.Instance);
    }

    [Fact]
    public async Task TestAsync_外部集成返回空结果时_应标记为失败()
    {
        _db.Tenants.Add(new Tenant
        {
            Id = _tenantId,
            Name = "测试租户",
            Slug = $"tenant-{Guid.NewGuid():N}",
            Settings = JsonSerializer.Serialize(new
            {
                integrations = new
                {
                    webhook = new { enabled = true, url = "https://example.com/webhook" },
                },
            }),
        });
        await _db.SaveChangesAsync();

        var (result, notFound) = await _sut.TestAsync("webhook");

        notFound.Should().BeFalse();
        result.Should().NotBeNull();
        result!.Success.Should().BeFalse();
        result.Message.Should().Contain("失败");
    }

    public async ValueTask DisposeAsync() => await _db.DisposeAsync();

    private sealed class TestTenantContext(Guid tenantId) : ITenantContext
    {
        public Guid TenantId { get; } = tenantId;
        public string IsolationMode { get; } = "shared";
        public bool IsSystemAdmin => false;
        public Guid UserId { get; } = Guid.NewGuid();
    }
}
