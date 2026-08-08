using System.Net;
using System.Net.Http.Json;
using EquipAI.Application.Devices;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Core.Entities;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 设备类型模板控制器集成测试
/// 覆盖模板列表查询（含行业筛选、系统租户预置模板可见）、认证拦截
/// </summary>
[Collection("SharedFactory")]
public class DeviceTypesControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public DeviceTypesControllerTests(CustomWebApplicationFactory factory)
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
    public async Task GetDeviceTypes_WithoutAuth_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();
        var response = await client.GetAsync("/api/v1/device-types");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetDeviceTypes_WithAuth_ReturnsTemplatesIncludingSystemPresets()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/device-types");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var templates = await response.Content.ReadFromJsonAsync<List<DeviceTypeTemplate>>();
        templates.Should().NotBeNull();
        // 种子预置了行业模板（归属系统租户），当前租户应能查到
        templates!.Should().NotBeEmpty("系统预置模板应对所有租户可见");
    }

    [Fact]
    public async Task GetDeviceTypes_FilterByIndustry_ReturnsOnlyMatchingTemplates()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/device-types?industry=制造业");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var templates = await response.Content.ReadFromJsonAsync<List<DeviceTypeTemplate>>();
        templates.Should().NotBeNull();
        templates!.All(t => t.Industry == "制造业").Should().BeTrue("按行业筛选应只返回匹配的模板");
    }

    [Fact]
    public async Task CreateDeviceType_WithAuth_CreatesAndReturnsTemplate()
    {
        var client = await GetAuthenticatedClientAsync();
        var request = new CreateDeviceTypeTemplateRequest
        {
            Name = $"测试模板-{Guid.NewGuid():N}".Substring(0, 20),
            Industry = "化工业",
            Parameters = "{\"temperature\":{\"unit\":\"℃\"}}"
        };

        var response = await client.PostAsJsonAsync("/api/v1/device-types", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await response.Content.ReadFromJsonAsync<DeviceTypeTemplate>();
        created.Should().NotBeNull();
        created!.Name.Should().Be(request.Name);
        created.Parameters.Should().Be(request.Parameters);
    }
}
