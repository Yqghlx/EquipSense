using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Application.Knowledge.DTOs;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 知识库管理控制器集成测试
/// 覆盖知识规则的 CRUD 操作和候选规则审核流程
/// 使用共享测试集合确保 WebApplicationFactory 单例
/// </summary>
[Collection("SharedFactory")]
public class KnowledgeControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public KnowledgeControllerTests(CustomWebApplicationFactory factory)
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
    /// 验证：未认证请求 GET /api/v1/knowledge/rules 应返回 401 Unauthorized
    /// </summary>
    [Fact]
    public async Task GetRules_WithoutAuth_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();

        var response = await client.GetAsync("/api/v1/knowledge/rules");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    /// <summary>
    /// 验证：认证后 GET /api/v1/knowledge/rules 返回分页规则列表
    /// </summary>
    [Fact]
    public async Task GetRules_WithAuth_ReturnsPagedList()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/knowledge/rules?page=1&pageSize=10");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();
        // 验证返回 JSON 中包含分页字段
        content.Should().Contain("items");
        content.Should().Contain("page");
        content.Should().Contain("pageSize");
    }

    /// <summary>
    /// 验证：POST /api/v1/knowledge/rules 创建知识规则并返回 201 Created
    /// </summary>
    [Fact]
    public async Task CreateRule_WithValidData_Returns201()
    {
        var client = await GetAuthenticatedClientAsync();

        var request = new
        {
            deviceType = "空压机",
            name = $"油温过高规则-{Guid.NewGuid():N}".Substring(0, 20),
            conditions = "[{\"metric\":\"oil_temperature\",\"operator\":\">\",\"value\":90}]",
            conclusion = "润滑油温过高，可能导致设备损坏",
            recommendedActions = "检查冷却系统，更换润滑油",
            confidenceWeight = 0.8m
        };

        var response = await client.PostAsJsonAsync("/api/v1/knowledge/rules", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("油温过高规则");
        content.Should().Contain("空压机");
    }

    /// <summary>
    /// 验证：创建规则后可通过 ID 更新规则
    /// PUT /api/v1/knowledge/rules/{id} 返回 200 和更新后的规则
    /// </summary>
    [Fact]
    public async Task UpdateRule_AfterCreate_ReturnsUpdatedRule()
    {
        var client = await GetAuthenticatedClientAsync();

        // 先创建规则
        var createRequest = new
        {
            deviceType = "CNC 数控机床",
            name = $"振动异常规则-{Guid.NewGuid():N}".Substring(0, 20),
            conditions = "[{\"metric\":\"vibration\",\"operator\":\">\",\"value\":8}]",
            conclusion = "主轴振动异常",
            confidenceWeight = 0.7m
        };
        var createResponse = await client.PostAsJsonAsync("/api/v1/knowledge/rules", createRequest);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var createdJson = await createResponse.Content.ReadFromJsonAsync<JsonDocument>();
        var ruleId = createdJson!.RootElement.GetProperty("id").GetGuid();

        // 更新规则
        var updateRequest = new UpdateKnowledgeRuleRequest
        {
            Name = "更新后的振动异常规则",
            ConfidenceWeight = 0.9m,
            ChangeSummary = "提高置信度权重"
        };

        var updateResponse = await client.PutAsJsonAsync($"/api/v1/knowledge/rules/{ruleId}", updateRequest);

        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await updateResponse.Content.ReadAsStringAsync();
        content.Should().Contain("更新后的振动异常规则");
    }

    /// <summary>
    /// 验证：PATCH /api/v1/knowledge/rules/{id}/toggle 切换规则启用状态
    /// </summary>
    [Fact]
    public async Task ToggleRule_AfterCreate_Returns200()
    {
        var client = await GetAuthenticatedClientAsync();

        // 先创建规则
        var createRequest = new
        {
            deviceType = "注塑机",
            name = $"压力异常规则-{Guid.NewGuid():N}".Substring(0, 20),
            conditions = "[{\"metric\":\"injection_pressure\",\"operator\":\">\",\"value\":180}]",
            conclusion = "注射压力过高"
        };
        var createResponse = await client.PostAsJsonAsync("/api/v1/knowledge/rules", createRequest);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var createdJson = await createResponse.Content.ReadFromJsonAsync<JsonDocument>();
        var ruleId = createdJson!.RootElement.GetProperty("id").GetGuid();

        // 切换状态（启用 → 禁用）
        var toggleResponse = await client.PatchAsync($"/api/v1/knowledge/rules/{ruleId}/toggle", null);

        toggleResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    /// <summary>
    /// 验证：GET /api/v1/knowledge/pending-rules 返回候选规则列表
    /// </summary>
    [Fact]
    public async Task GetPendingRules_WithAuth_ReturnsPagedList()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/knowledge/pending-rules?page=1&pageSize=10");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();
    }

    /// <summary>
    /// 验证：GET /api/v1/knowledge/cases 返回故障案例列表
    /// </summary>
    [Fact]
    public async Task GetCases_WithAuth_ReturnsPagedList()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/knowledge/cases?page=1&pageSize=10");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();
    }
}
