using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using EquipAI.Application.Devices;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Infrastructure.Data;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 设备配置向导控制器集成测试
/// 覆盖模板查询、快速注册（含重复编码校验）、认证拦截
/// </summary>
[Collection("SharedFactory")]
public class DeviceConfigControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public DeviceConfigControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<HttpClient> GetAuthenticatedClientAsync()
    {
        var client = await _factory.CreateClientWithSeedAsync();
        var loginResponse = await client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest { Username = "admin", Password = "Admin@123" });
        loginResponse.EnsureSuccessStatusCode();
        var loginData = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();
        loginData.Should().NotBeNull();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", loginData!.AccessToken);
        return client;
    }

    [Fact]
    public async Task GetTemplates_WithoutAuth_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();
        var response = await client.GetAsync("/api/v1/device-config/templates");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetTemplates_WithAuth_ReturnsTemplateList()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/device-config/templates");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task QuickRegister_WithAuth_CreatesDevice()
    {
        var client = await GetAuthenticatedClientAsync();
        var code = $"QR-{Guid.NewGuid():N}".Substring(0, 16);

        var response = await client.PostAsJsonAsync("/api/v1/device-config/quick-register",
            new QuickRegisterRequest
            {
                DeviceCode = code,
                Name = "快速注册设备",
                DeviceType = "电机"
            });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task QuickRegister_WithVisibleTemplate_CreatesDeviceWithoutDefaultRulesWhenNotSelected()
    {
        var client = await GetAuthenticatedClientAsync();
        var templatesResponse = await client.GetAsync("/api/v1/device-config/templates");
        templatesResponse.EnsureSuccessStatusCode();
        using var templates = JsonDocument.Parse(await templatesResponse.Content.ReadAsStringAsync());
        var templateId = templates.RootElement.EnumerateArray()
            .Select(template => template.GetProperty("id").GetGuid())
            .First();

        var response = await client.PostAsJsonAsync("/api/v1/device-config/quick-register",
            new QuickRegisterRequest
            {
                TemplateId = templateId,
                ApplyDefaultAlarmRules = false,
                DeviceCode = $"QR-TPL-{Guid.NewGuid():N}"[..16],
                Name = "模板注册设备"
            });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task QuickRegister_WithInvisibleTemplate_Returns404WithStableCode()
    {
        var client = await GetAuthenticatedClientAsync();
        var foreignTemplateId = await AddForeignTemplateAsync();

        var response = await client.PostAsJsonAsync("/api/v1/device-config/quick-register",
            new QuickRegisterRequest
            {
                TemplateId = foreignTemplateId,
                ApplyDefaultAlarmRules = true,
                DeviceCode = $"QR-NOTPL-{Guid.NewGuid():N}"[..16]
            });

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await response.Content.ReadAsStringAsync()).Should().Contain("TEMPLATE_NOT_FOUND");
    }

    private async Task<Guid> AddForeignTemplateAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var foreignTenantId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        if (!await db.UnfilteredSet<Tenant>().AnyAsync(tenant => tenant.Id == foreignTenantId))
        {
            db.Tenants.Add(new Tenant
            {
                Id = foreignTenantId,
                Name = "集成测试租户B",
                Slug = "integration-tenant-b",
                Plan = TenantPlan.Basic,
                MaxDevices = 50,
                MaxUsers = 20,
                IsActive = true
            });
            await db.SaveChangesAsync();
        }

        var template = new DeviceTypeTemplate
        {
            TenantId = foreignTenantId,
            Name = $"其他租户模板-{Guid.NewGuid():N}",
            Parameters = "{}",
            DefaultAlarmRules = "[]"
        };
        db.DeviceTypeTemplates.Add(template);
        await db.SaveChangesAsync();
        return template.Id;
    }

    [Fact]
    public async Task QuickRegister_DuplicateCode_Returns409()
    {
        var client = await GetAuthenticatedClientAsync();
        var code = $"DUP-{Guid.NewGuid():N}".Substring(0, 16);
        var request = new QuickRegisterRequest { DeviceCode = code, Name = "首次", DeviceType = "电机" };

        // 第一次创建成功
        var first = await client.PostAsJsonAsync("/api/v1/device-config/quick-register", request);
        first.StatusCode.Should().Be(HttpStatusCode.Created);

        // 相同编码再次注册应被拒绝
        var second = await client.PostAsJsonAsync("/api/v1/device-config/quick-register", request);
        second.StatusCode.Should().Be(HttpStatusCode.Conflict);
        var body = await second.Content.ReadAsStringAsync();
        body.Should().Contain("DUPLICATE_CODE");
    }

    [Fact]
    public async Task QuickRegister_并发相同编码_只能创建一个并将另一个映射为409()
    {
        var firstClient = await GetAuthenticatedClientAsync();
        var secondClient = await GetAuthenticatedClientAsync();
        var code = $"QR-RACE-{Guid.NewGuid():N}";
        var request = new QuickRegisterRequest { DeviceCode = code, Name = "并发设备" };
        var defaultTenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        using var beforeScope = _factory.Services.CreateScope();
        var beforeDb = beforeScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var countBefore = await beforeDb.UnfilteredSet<Tenant>()
            .Where(tenant => tenant.Id == defaultTenantId)
            .Select(tenant => tenant.CurrentDeviceCount)
            .SingleAsync();

        var responses = await Task.WhenAll(
            firstClient.PostAsJsonAsync("/api/v1/device-config/quick-register", request),
            secondClient.PostAsJsonAsync("/api/v1/device-config/quick-register", request));

        responses.Select(response => response.StatusCode)
            .Should()
            .BeEquivalentTo(new[] { HttpStatusCode.Created, HttpStatusCode.Conflict });
        var conflict = responses.Single(response => response.StatusCode == HttpStatusCode.Conflict);
        (await conflict.Content.ReadAsStringAsync()).Should().Contain("DUPLICATE_CODE");

        using var afterScope = _factory.Services.CreateScope();
        var afterDb = afterScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var countAfter = await afterDb.UnfilteredSet<Tenant>()
            .Where(tenant => tenant.Id == defaultTenantId)
            .Select(tenant => tenant.CurrentDeviceCount)
            .SingleAsync();
        countAfter.Should().Be(countBefore + 1);
    }
}
