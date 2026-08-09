using System.Text.Encodings.Web;
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

    [Fact]
    public async Task GetAllAsync_仅返回脱敏集成摘要_不得泄露租户凭证或其他设置()
    {
        _db.Tenants.Add(new Tenant
        {
            Id = _tenantId,
            Name = "测试租户",
            Slug = $"tenant-{Guid.NewGuid():N}",
            Settings = JsonSerializer.Serialize(new
            {
                internalSecret = "不得返回的租户级秘密",
                integrations = new
                {
                    webhook = new
                    {
                        enabled = true,
                        url = "https://hooks.example.com/api?token=webhook-token",
                        secret = "webhook-signing-secret",
                        headers = new Dictionary<string, string>
                        {
                            ["Authorization"] = "Bearer header-secret",
                        },
                    },
                    eam = new
                    {
                        enabled = true,
                        endpoint = "https://eam.example.com/maximo",
                        apiKey = "eam-api-key",
                        password = "eam-password",
                    },
                },
            }),
        });
        await _db.SaveChangesAsync();

        var (settings, found) = await _sut.GetAllAsync();

        found.Should().BeTrue();
        settings.Should().NotBeNull();
        var responseJson = JsonSerializer.Serialize(settings, new JsonSerializerOptions
        {
            Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        });
        responseJson.Should().Contain("\"integrations\"");
        responseJson.Should().Contain("\"enabled\":true");
        responseJson.Should().Contain("[已配置]");
        responseJson.Should().Contain("https://hooks.example.com/…");
        responseJson.Should().Contain("https://eam.example.com/…");
        responseJson.Should().NotContain("不得返回的租户级秘密");
        responseJson.Should().NotContain("webhook-token");
        responseJson.Should().NotContain("webhook-signing-secret");
        responseJson.Should().NotContain("header-secret");
        responseJson.Should().NotContain("eam-api-key");
        responseJson.Should().NotContain("eam-password");
    }

    [Fact]
    public async Task UpdateAsync_空白或脱敏占位符_不得覆盖服务端已有凭证和端点()
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
                    webhook = new
                    {
                        enabled = true,
                        url = "https://hooks.example.com/api?token=original-token",
                        secret = "original-signing-secret",
                    },
                },
            }),
        });
        await _db.SaveChangesAsync();

        var (updated, error) = await _sut.UpdateAsync("webhook", new UpdateIntegrationRequest
        {
            Enabled = false,
            Config = JsonSerializer.Serialize(new
            {
                url = "https://hooks.example.com/…",
                secret = "[已配置]",
            }),
        });

        updated.Should().BeTrue();
        error.Should().BeNull();
        var savedTenant = await _db.Tenants.FirstAsync(t => t.Id == _tenantId);
        using var savedSettings = JsonDocument.Parse(savedTenant.Settings);
        var savedWebhook = savedSettings.RootElement
            .GetProperty("integrations")
            .GetProperty("webhook");
        savedWebhook.GetProperty("url").GetString()
            .Should().Be("https://hooks.example.com/api?token=original-token");
        savedWebhook.GetProperty("secret").GetString().Should().Be("original-signing-secret");
        savedWebhook.GetProperty("enabled").GetBoolean().Should().BeFalse();
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
