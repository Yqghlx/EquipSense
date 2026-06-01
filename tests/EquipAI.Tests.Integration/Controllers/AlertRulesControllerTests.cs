using System.Net;
using System.Net.Http.Json;
using EquipAI.Application.Alerts.DTOs;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Application.DTOs.Common;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 告警规则控制器集成测试
/// 覆盖告警规则的 CRUD 全流程：创建、查询、更新和删除
/// 使用共享测试集合确保 WebApplicationFactory 单例
/// </summary>
[Collection("SharedFactory")]
public class AlertRulesControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public AlertRulesControllerTests(CustomWebApplicationFactory factory)
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
    /// 验证：GET /api/v1/alert-rules 返回分页列表
    /// </summary>
    [Fact]
    public async Task GetAlertRules_ReturnsPagedList()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/alert-rules?page=1&pageSize=10");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<AlertRuleDto>>();
        result.Should().NotBeNull();
        result!.Items.Should().NotBeNull();
        result.Page.Should().Be(1);
        result.PageSize.Should().Be(10);
    }

    /// <summary>
    /// 验证：POST /api/v1/alert-rules 创建新告警规则并返回 201 Created
    /// 注意：枚举字段（RuleType、Severity）序列化为 PascalCase 格式
    /// </summary>
    [Fact]
    public async Task CreateAlertRule_WithValidData_Returns201()
    {
        var client = await GetAuthenticatedClientAsync();

        var request = new CreateAlertRuleRequest
        {
            Name = $"温度超限告警-{Guid.NewGuid():N}".Substring(0, 30),
            DeviceType = "空压机",
            Metric = "oil_temperature",
            RuleType = "threshold",
            Operator = "GreaterThan",
            Threshold = 90m,
            Severity = "high",
            CooldownSeconds = 300,
            AutoCreateWorkorder = false
        };

        var response = await client.PostAsJsonAsync("/api/v1/alert-rules", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var rule = await response.Content.ReadFromJsonAsync<AlertRuleDto>();
        rule.Should().NotBeNull();
        rule!.Name.Should().StartWith("温度超限告警");
        rule.Metric.Should().Be("oil_temperature");
        rule.RuleType.Should().Be("Threshold"); // 枚举序列化为 PascalCase
        rule.Operator.Should().Be("GreaterThan");
        rule.Threshold.Should().Be(90m);
        rule.Severity.Should().Be("High"); // 枚举序列化为 PascalCase
        rule.Enabled.Should().BeTrue();
        rule.Id.Should().NotBe(Guid.Empty);
    }

    /// <summary>
    /// 验证：创建告警规则后可通过 ID 获取详情
    /// </summary>
    [Fact]
    public async Task GetAlertRule_AfterCreate_ReturnsRule()
    {
        var client = await GetAuthenticatedClientAsync();

        // 创建规则
        var createRequest = new CreateAlertRuleRequest
        {
            Name = $"振动异常告警-{Guid.NewGuid():N}".Substring(0, 30),
            DeviceType = "CNC 数控机床",
            Metric = "vibration",
            RuleType = "threshold",
            Operator = "GreaterThan",
            Threshold = 8.5m,
            Severity = "critical"
        };
        var createResponse = await client.PostAsJsonAsync("/api/v1/alert-rules", createRequest);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await createResponse.Content.ReadFromJsonAsync<AlertRuleDto>();

        // 查询规则详情
        var getResponse = await client.GetAsync($"/api/v1/alert-rules/{created!.Id}");

        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var rule = await getResponse.Content.ReadFromJsonAsync<AlertRuleDto>();
        rule.Should().NotBeNull();
        rule!.Id.Should().Be(created.Id);
        rule.Name.Should().StartWith("振动异常告警");
        rule.Metric.Should().Be("vibration");
        rule.Severity.Should().Be("Critical"); // 枚举序列化为 PascalCase
    }

    /// <summary>
    /// 验证：PUT /api/v1/alert-rules/{id} 更新告警规则
    /// </summary>
    [Fact]
    public async Task UpdateAlertRule_WithValidData_ReturnsUpdatedRule()
    {
        var client = await GetAuthenticatedClientAsync();

        // 创建规则
        var createRequest = new CreateAlertRuleRequest
        {
            Name = $"压力告警-{Guid.NewGuid():N}".Substring(0, 20),
            Metric = "discharge_pressure",
            RuleType = "threshold",
            Operator = "GreaterThan",
            Threshold = 1.0m,
            Severity = "normal"
        };
        var createResponse = await client.PostAsJsonAsync("/api/v1/alert-rules", createRequest);
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<AlertRuleDto>();

        // 更新规则
        var updateRequest = new UpdateAlertRuleRequest
        {
            Name = "排气压力超高告警",
            Threshold = 1.5m,
            Severity = "high",
            CooldownSeconds = 600
        };

        var updateResponse = await client.PutAsJsonAsync($"/api/v1/alert-rules/{created!.Id}", updateRequest);

        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated = await updateResponse.Content.ReadFromJsonAsync<AlertRuleDto>();
        updated.Should().NotBeNull();
        updated!.Name.Should().Be("排气压力超高告警");
        updated.Threshold.Should().Be(1.5m);
        updated.Severity.Should().Be("High"); // 枚举序列化为 PascalCase
        updated.CooldownSeconds.Should().Be(600);
    }

    /// <summary>
    /// 验证：DELETE /api/v1/alert-rules/{id} 删除告警规则后返回 204 No Content
    /// </summary>
    [Fact]
    public async Task DeleteAlertRule_WithExistingId_Returns204()
    {
        var client = await GetAuthenticatedClientAsync();

        // 创建规则
        var createRequest = new CreateAlertRuleRequest
        {
            Name = $"待删除规则-{Guid.NewGuid():N}".Substring(0, 20),
            Metric = "motor_current",
            RuleType = "threshold",
            Operator = "GreaterThan",
            Threshold = 180m,
            Severity = "normal"
        };
        var createResponse = await client.PostAsJsonAsync("/api/v1/alert-rules", createRequest);
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<AlertRuleDto>();

        // 删除规则
        var deleteResponse = await client.DeleteAsync($"/api/v1/alert-rules/{created!.Id}");

        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // 验证删除后再查询返回 404
        var getResponse = await client.GetAsync($"/api/v1/alert-rules/{created.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    /// <summary>
    /// 验证：未认证请求应返回 401 Unauthorized
    /// </summary>
    [Fact]
    public async Task GetAlertRules_WithoutAuth_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();

        var response = await client.GetAsync("/api/v1/alert-rules");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    /// <summary>
    /// 验证：查询不存在的告警规则返回 404
    /// </summary>
    [Fact]
    public async Task GetAlertRule_WithNonexistentId_Returns404()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync($"/api/v1/alert-rules/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    /// <summary>
    /// 验证：创建告警规则后列表中能查询到
    /// </summary>
    [Fact]
    public async Task GetAlertRules_AfterCreate_ContainsNewRule()
    {
        var client = await GetAuthenticatedClientAsync();

        var ruleName = $"列表查询规则-{Guid.NewGuid():N}".Substring(0, 20);
        var request = new CreateAlertRuleRequest
        {
            Name = ruleName,
            Metric = "coolant_temperature",
            RuleType = "threshold",
            Operator = "GreaterThan",
            Threshold = 40m,
            Severity = "normal"
        };

        await client.PostAsJsonAsync("/api/v1/alert-rules", request);

        var response = await client.GetAsync("/api/v1/alert-rules?page=1&pageSize=50");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<AlertRuleDto>>();
        result.Should().NotBeNull();
        result!.Items.Should().ContainSingle(r => r.Name == ruleName);
    }
}
