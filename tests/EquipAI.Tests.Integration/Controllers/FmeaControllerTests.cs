using System.Net;
using System.Net.Http.Json;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Application.Fmea.DTOs;
using EquipAI.Core.Entities;
using EquipAI.Infrastructure.Data;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// FMEA（故障模式与影响分析）控制器集成测试
/// 覆盖 FMEA 记录列表查询、认证拦截
/// </summary>
[Collection("SharedFactory")]
public class FmeaControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public FmeaControllerTests(CustomWebApplicationFactory factory)
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
    public async Task GetFmeaRecords_WithoutAuth_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();
        var response = await client.GetAsync("/api/v1/fmea");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetFmeaRecords_WithAuth_ReturnsList()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/fmea");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetFmeaById_Nonexistent_Returns404()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync($"/api/v1/fmea/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    /// <summary>
    /// 条目不在 RPN 排序后的第一页时，按 ID 查询仍必须返回目标条目，不能误报 404。
    /// 同时验证跨租户 ID 不会被当前租户读取。
    /// </summary>
    [Fact]
    public async Task GetFmeaById_目标条目不在第一页_应按Id返回且保持租户隔离()
    {
        var client = await GetAuthenticatedClientAsync();
        var tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var otherTenantId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var targetId = Guid.NewGuid();
        var firstPageId = Guid.NewGuid();
        var otherTenantEntryId = Guid.NewGuid();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.FmeaLibrary.AddRange(
                CreateEntry(targetId, tenantId, "目标故障模式", 1),
                CreateEntry(firstPageId, tenantId, "第一页故障模式", 1000),
                CreateEntry(otherTenantEntryId, otherTenantId, "其他租户故障模式", 2000));
            await db.SaveChangesAsync();
        }

        try
        {
            var response = await client.GetAsync($"/api/v1/fmea/{targetId}");

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var entry = await response.Content.ReadFromJsonAsync<FmeaEntryResponse>();
            entry.Should().NotBeNull();
            entry!.Id.Should().Be(targetId);
            entry.TenantId.Should().Be(tenantId);

            var crossTenantResponse = await client.GetAsync($"/api/v1/fmea/{otherTenantEntryId}");
            crossTenantResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }
        finally
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var entries = await db.FmeaLibrary
                .IgnoreQueryFilters()
                .Where(entry => entry.Id == targetId
                    || entry.Id == firstPageId
                    || entry.Id == otherTenantEntryId)
                .ToListAsync();
            db.FmeaLibrary.RemoveRange(entries);
            await db.SaveChangesAsync();
        }
    }

    /// <summary>
    /// 构造最小 FMEA 测试条目，使用不同 RPN 稳定控制列表排序。
    /// </summary>
    private static FmeaEntry CreateEntry(Guid id, Guid tenantId, string failureMode, int rpn)
    {
        return new FmeaEntry
        {
            Id = id,
            TenantId = tenantId,
            DeviceType = "测试设备",
            FailureMode = failureMode,
            Cause = "测试原因",
            Effect = "测试影响",
            Detection = "测试检测",
            RecommendedAction = "测试措施",
            Severity = rpn == 1 ? 1 : 10,
            Occurrence = rpn == 1 ? 1 : 10,
            Detectability = rpn == 1 ? 1 : 10,
            Rpn = rpn,
            CreatedBy = Guid.Empty,
            IsEnabled = true,
        };
    }
}
