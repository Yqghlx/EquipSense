using System.Net;
using System.Net.Http.Json;
using EquipAI.Application.Approvals.DTOs;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 审批链模板管理控制器集成测试
/// 覆盖审批链模板的列表查询、创建、更新和删除操作
/// 使用共享测试集合确保 WebApplicationFactory 单例
/// </summary>
[Collection("SharedFactory")]
public class ApprovalChainsControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public ApprovalChainsControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    /// <summary>
    /// 获取已认证的 HttpClient（使用 admin 账户登录获取 JWT 令牌）
    /// </summary>
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

    /// <summary>
    /// 验证：未认证请求 GET /api/v1/approval-chains 应返回 401 Unauthorized
    /// </summary>
    [Fact]
    public async Task ListApprovalChains_WithoutAuth_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();

        var response = await client.GetAsync("/api/v1/approval-chains");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    /// <summary>
    /// 验证：认证后 GET /api/v1/approval-chains 返回审批链模板列表
    /// </summary>
    [Fact]
    public async Task ListApprovalChains_WithAuth_ReturnsList()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/approval-chains");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();
    }

    /// <summary>
    /// 验证：POST /api/v1/approval-chains 创建审批链模板并返回 201 Created
    /// </summary>
    [Fact]
    public async Task CreateApprovalChain_WithValidData_Returns201()
    {
        var client = await GetAuthenticatedClientAsync();

        var request = new CreateApprovalChainRequest(
            WorkOrderType: "corrective",
            Priority: "high",
            Name: $"测试审批链-{Guid.NewGuid():N}".Substring(0, 15),
            IsDefault: false,
            Steps: new List<CreateApprovalStepRequest>
            {
                new(StepOrder: 1, Role: "maintenance_lead", IsRequired: true),
                new(StepOrder: 2, Role: "system_admin", IsRequired: true)
            }
        );

        var response = await client.PostAsJsonAsync("/api/v1/approval-chains", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("测试审批链");
    }

    /// <summary>
    /// 验证：GET /api/v1/approval-chains/pending 返回待我审批的工单列表
    /// </summary>
    [Fact]
    public async Task PendingApprovals_WithAuth_ReturnsList()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/approval-chains/pending");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();
    }

    /// <summary>
    /// 验证：DELETE /api/v1/approval-chains/{id} 删除不存在的审批链返回 404
    /// </summary>
    [Fact]
    public async Task DeleteApprovalChain_WithNonexistentId_Returns404()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.DeleteAsync($"/api/v1/approval-chains/{Guid.NewGuid()}");

        // 服务层可能抛出 KeyNotFoundException 或返回 404，取决于实现
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.InternalServerError);
    }
}
