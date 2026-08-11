using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Application.DTOs.Users;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 认证控制器集成测试，验证登录接口在各种输入条件下的行为
/// 使用 WebApplicationFactory 启动完整的应用管线，包括中间件、DI 和数据库
/// 使用共享测试集合确保 WebApplicationFactory 单例
/// </summary>
[Collection("SharedFactory")]
public class AuthControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public AuthControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    /// <summary>
    /// 验证：使用正确的用户名和密码登录，应返回 200 和有效的 JWT 令牌
    /// </summary>
    [Fact]
    public async Task Login_WithValidCredentials_ReturnsTokens()
    {
        var client = await _factory.CreateClientWithSeedAsync();
        var request = new LoginRequest { Username = "admin", Password = "Admin@123" };

        var response = await client.PostAsJsonAsync("/api/v1/auth/login", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<AuthResponse>();
        result.Should().NotBeNull();
        result!.AccessToken.Should().NotBeEmpty();
        result.RefreshToken.Should().NotBeEmpty();
        result.UserInfo.Username.Should().Be("admin");
    }

    /// <summary>
    /// 验证：Cookie 会话恢复依赖的 /auth/me 必须返回完整用户上下文，
    /// 尤其是租户 ID、强制改密标记和 MFA 状态，避免前端跨标签页恢复后出现半初始化状态。
    /// </summary>
    [Fact]
    public async Task Me_ReturnsCompleteUserContext()
    {
        var client = await _factory.CreateClientWithSeedAsync();
        var login = await client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest { Username = "admin", Password = "Admin@123" });
        var loginResult = await login.Content.ReadFromJsonAsync<AuthResponse>();

        login.StatusCode.Should().Be(HttpStatusCode.OK);
        loginResult.Should().NotBeNull();
        loginResult!.AccessToken.Should().NotBeNullOrWhiteSpace();

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", loginResult.AccessToken);
        var response = await client.GetAsync("/api/v1/auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var user = await response.Content.ReadFromJsonAsync<UserDto>();
        user.Should().NotBeNull();
        user!.TenantId.Should().Be(loginResult.UserInfo.TenantId);
        user.MustChangePassword.Should().Be(loginResult.UserInfo.MustChangePassword);
        user.MfaEnabled.Should().Be(loginResult.UserInfo.MfaEnabled);
    }

    /// <summary>
    /// 验证：使用正确用户名但错误密码登录，应返回 401 Unauthorized
    /// </summary>
    [Fact]
    public async Task Login_WithInvalidCredentials_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();
        var request = new LoginRequest { Username = "admin", Password = "wrong-password" };

        var response = await client.PostAsJsonAsync("/api/v1/auth/login", request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    /// <summary>
    /// 验证：使用不存在的用户名登录，应返回 401 Unauthorized
    /// </summary>
    [Fact]
    public async Task Login_WithNonexistentUser_Returns401()
    {
        var client = await _factory.CreateClientWithSeedAsync();
        var request = new LoginRequest { Username = "nonexistent", Password = "password" };

        var response = await client.PostAsJsonAsync("/api/v1/auth/login", request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    /// <summary>
    /// 【安全】刷新令牌重用检测端到端：轮换后被取代的旧令牌重放应返回 401 并吊销整个会话，
    /// 且重用前刚轮换出的"当前令牌"也随之失效（攻击者持有的令牌被一并杀死）。
    ///
    /// 通过完整 HTTP 管线 + FakeRedisService 墓碑语义验证 OAuth 2.0 BCP 行为：
    /// 同一 refresh token 被两方持有时，重放即触发会话吊销。
    /// </summary>
    [Fact]
    public async Task Refresh_ReplayedRotatedToken_RevokesEntireSession()
    {
        var client = await _factory.CreateClientWithSeedAsync();

        // 1. 登录获取刷新令牌 T1
        var login = await client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest { Username = "admin", Password = "Admin@123" });
        login.StatusCode.Should().Be(HttpStatusCode.OK);
        var t1 = (await login.Content.ReadFromJsonAsync<AuthResponse>())!.RefreshToken;
        t1.Should().NotBeNullOrEmpty();

        // 2. 合法刷新 T1 → 轮换为 T2
        var refresh1 = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = t1 });
        refresh1.StatusCode.Should().Be(HttpStatusCode.OK);
        var t2 = (await refresh1.Content.ReadFromJsonAsync<AuthResponse>())!.RefreshToken;
        t2.Should().NotBe(t1, "刷新应轮换令牌");

        // 3. 重放 T1 —— 应被 401 拒绝（重用检测命中，会话吊销）
        var replay = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = t1 });
        replay.StatusCode.Should().Be(HttpStatusCode.Unauthorized,
            "轮换后的旧令牌重放应被识别并拒绝");

        // 4. 重用前的当前令牌 T2 也应失效（攻击者持有的令牌被一并杀死）
        var afterRevoke = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = t2 });
        afterRevoke.StatusCode.Should().Be(HttpStatusCode.Unauthorized,
            "会话吊销后，攻击者持有的当前令牌 T2 必须不能再刷新");
    }

    /// <summary>
    /// 浏览器刷新路径只依赖 HttpOnly Cookie，空请求体也必须能够完成令牌轮换。
    /// </summary>
    [Fact]
    public async Task Refresh_仅Cookie且请求体为空_应返回成功()
    {
        var client = await _factory.CreateClientWithSeedAsync();
        var login = await client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest { Username = "admin", Password = "Admin@123" });
        login.StatusCode.Should().Be(HttpStatusCode.OK);

        var refreshCookie = login.Headers
            .GetValues("Set-Cookie")
            .First(value => value.StartsWith("refresh_token=", StringComparison.Ordinal));
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh");
        request.Content = new StringContent(string.Empty, Encoding.UTF8, "application/json");
        request.Headers.TryAddWithoutValidation("Cookie", refreshCookie.Split(';', 2)[0]);

        using (request)
        {
            var response = await client.SendAsync(request);

            response.StatusCode.Should().Be(HttpStatusCode.OK,
                "Cookie-only 刷新是前端主动续期和会话恢复的实际调用方式");
        }
    }
}
