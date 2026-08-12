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

    private async Task<HttpClient> GetAuthenticatedClientAsync(string username = "admin", string password = "Admin@123")
    {
        var client = await _factory.CreateClientWithSeedAsync();
        var loginResponse = await client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest { Username = username, Password = password });
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
    /// FMEA 不能关联其他租户的知识规则，避免跨租户关系污染诊断链路。
    /// </summary>
    [Fact]
    public async Task CreateFmea_WithOtherTenantKnowledgeRule_ReturnsBadRequest()
    {
        var client = await GetAuthenticatedClientAsync();
        var knowledgeRuleId = Guid.NewGuid();
        var otherTenantId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.KnowledgeRules.Add(new KnowledgeRule
            {
                Id = knowledgeRuleId,
                TenantId = otherTenantId,
                DeviceType = "测试设备",
                Name = "其他租户规则",
                Conditions = "[]",
                Conclusion = "测试结论",
            });
            await db.SaveChangesAsync();
        }

        try
        {
            var response = await client.PostAsJsonAsync("/api/v1/fmea", CreateRequest(knowledgeRuleId));

            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
            var body = await response.Content.ReadAsStringAsync();
            body.Should().Contain("KNOWLEDGE_RULE_NOT_ACCESSIBLE");
        }
        finally
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var rule = await db.KnowledgeRules
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(item => item.Id == knowledgeRuleId);
            if (rule is not null)
            {
                db.KnowledgeRules.Remove(rule);
                await db.SaveChangesAsync();
            }
        }
    }

    /// <summary>
    /// 维保主管按产品 RBAC 矩阵拥有 FMEA 新建权限，前后端必须保持一致。
    /// </summary>
    [Fact]
    public async Task CreateFmea_AsMaintenanceLead_ReturnsCreated()
    {
        var client = await GetAuthenticatedClientAsync("lead", "Lead@123");

        var response = await client.PostAsJsonAsync("/api/v1/fmea", CreateRequest());

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var entry = await response.Content.ReadFromJsonAsync<FmeaEntryResponse>();
        entry.Should().NotBeNull();

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var created = await db.FmeaLibrary
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(item => item.Id == entry!.Id);
        if (created is not null)
        {
            db.FmeaLibrary.Remove(created);
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

    /// <summary>
    /// 构造最小有效 FMEA 请求，供控制器权限与引用校验测试复用。
    /// </summary>
    private static CreateFmeaEntryRequest CreateRequest(Guid? knowledgeRuleId = null)
    {
        return new CreateFmeaEntryRequest
        {
            DeviceType = "测试设备",
            FailureMode = "测试故障",
            Cause = "测试原因",
            Effect = "测试影响",
            Detection = "测试检测",
            RecommendedAction = "测试措施",
            Severity = 5,
            Occurrence = 5,
            Detectability = 5,
            KnowledgeRuleId = knowledgeRuleId,
        };
    }
}
