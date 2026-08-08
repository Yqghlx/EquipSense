using System.Net;
using System.Net.Http.Json;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Application.WorkOrders;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 工单 SLA 管理控制器集成测试
///
/// 历史背景：此前因 PushNotificationService 构造函数在 VAPID 未配置时抛
/// InvalidOperationException（→ 409），SLA 端点全部失败。构造函数已改为延迟降级，
/// 本测试验证修复后端点可用，并覆盖 SLA 概览的认证拦截与正常返回。
/// </summary>
[Collection("SharedFactory")]
public class SlaControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public SlaControllerTests(CustomWebApplicationFactory factory) => _factory = factory;

    private async Task<HttpClient> GetAuthenticatedClientAsync()
    {
        var client = await _factory.CreateClientWithSeedAsync();
        var loginResponse = await client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest { Username = "admin", Password = "Admin@123" });
        loginResponse.EnsureSuccessStatusCode();
        var loginData = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", loginData!.AccessToken);
        return client;
    }

    /// <summary>
    /// 验证：未认证请求 GET /api/v1/work-orders/sla/summary 应返回 401
    /// </summary>
    [Fact]
    public async Task GetSummary_WithoutAuth_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();

        var response = await client.GetAsync("/api/v1/work-orders/sla/summary");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    /// <summary>
    /// 验证：已认证请求应返回 200 + SlaSummary（即使 VAPID 未配置也不应 409）
    /// </summary>
    [Fact]
    public async Task GetSummary_WithAuth_Returns200AndSummary()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/work-orders/sla/summary");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var summary = await response.Content.ReadFromJsonAsync<SlaSummary>();
        summary.Should().NotBeNull();
        // 种子数据可能无活跃工单，Total >= 0 即可
        summary!.Total.Should().BeGreaterThanOrEqualTo(0);
        (summary.OnTrack + summary.Warning + summary.Overdue).Should().Be(summary.Total);
    }
}
