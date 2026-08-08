using System.Net;
using System.Net.Http.Json;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 通知控制器集成测试
/// 覆盖通知列表查询、未读计数、标记已读、通知偏好、认证拦截
/// </summary>
[Collection("SharedFactory")]
public class NotificationsControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public NotificationsControllerTests(CustomWebApplicationFactory factory)
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
    public async Task GetNotifications_WithoutAuth_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();
        var response = await client.GetAsync("/api/v1/notifications");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetNotifications_WithAuth_ReturnsPagedList()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/notifications?page=1&pageSize=10");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("total");
        body.Should().Contain("page");
    }

    [Fact]
    public async Task GetUnreadCount_WithAuth_ReturnsIntegerCount()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/notifications/unread-count");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        // 返回 Ok(count) —— 反序列化为整数
        int.Parse(body).Should().BeGreaterThanOrEqualTo(0);
    }

    [Fact]
    public async Task MarkAllRead_WithAuth_ReturnsNoContent()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.PutAsync("/api/v1/notifications/read-all", null);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // 标记后未读应为 0
        var countResponse = await client.GetAsync("/api/v1/notifications/unread-count");
        countResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        int.Parse(await countResponse.Content.ReadAsStringAsync()).Should().Be(0);
    }

    [Fact]
    public async Task GetPreferences_WithAuth_ReturnsPreferences()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/v1/notifications/preferences");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task DeleteNotification_WithNonexistentId_Returns404()
    {
        var client = await GetAuthenticatedClientAsync();

        var response = await client.DeleteAsync($"/api/v1/notifications/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
