using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Application.Security;
using EquipAI.Application.DTOs.Users;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Infrastructure.Cache;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Identity;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OtpNet;

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
    /// 强制改密状态必须在后端管线生效，不能只依赖前端 AuthGuard。
    /// 认证闭环接口仍可访问，业务 API 应返回带标记的 403。
    /// </summary>
    [Fact]
    public async Task MustChangePassword_业务接口应被门禁拦截而认证接口仍可用()
    {
        var client = await _factory.CreateClientWithSeedAsync();
        var username = $"forced-gate-{Guid.NewGuid():N}";
        const string password = "ForcedGate@123";
        var userId = Guid.NewGuid();

        try
        {
            using (var scope = _factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                db.Users.Add(new User
                {
                    Id = userId,
                    TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    Username = username,
                    PasswordHash = PasswordHasher.HashPassword(password),
                    DisplayName = username,
                    Role = UserRole.Technician,
                    IsActive = true,
                    MustChangePassword = true,
                    Language = "zh-CN",
                });
                await db.SaveChangesAsync();
            }

            var login = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest
            {
                Username = username,
                Password = password,
            });
            login.StatusCode.Should().Be(HttpStatusCode.OK);
            var loginResult = await login.Content.ReadFromJsonAsync<AuthResponse>();
            loginResult.Should().NotBeNull();
            loginResult!.UserInfo.MustChangePassword.Should().BeTrue();

            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", loginResult.AccessToken);

            var businessResponse = await client.GetAsync("/api/v1/devices");
            businessResponse.StatusCode.Should().Be(HttpStatusCode.Forbidden);
            businessResponse.Headers.TryGetValues(
                    "X-Password-Change-Required",
                    out var passwordChangeHeaders)
                .Should().BeTrue();
            passwordChangeHeaders!.Single().Should().Be("true");

            var mfaManagementResponse = await client.PostAsync("/api/v1/auth/mfa/disable", content: null);
            mfaManagementResponse.StatusCode.Should().Be(HttpStatusCode.Forbidden);
            mfaManagementResponse.Headers.TryGetValues(
                    "X-Password-Change-Required",
                    out var mfaPasswordChangeHeaders)
                .Should().BeTrue();
            mfaPasswordChangeHeaders!.Single().Should().Be("true");

            var meResponse = await client.GetAsync("/api/v1/auth/me");
            meResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        }
        finally
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var user = await db.Users.IgnoreQueryFilters().SingleOrDefaultAsync(candidate => candidate.Id == userId);
            if (user is not null)
            {
                db.Users.Remove(user);
                await db.SaveChangesAsync();
            }
        }
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

    /// <summary>
    /// 通过完整 HTTP 管线验证恢复码的一次性消费、重新生成失效旧码、审计脱敏和响应禁止缓存。
    /// </summary>
    [Fact]
    public async Task MfaRecoveryCodes_完整Http流程_应一次性消费并使重新生成前的旧码失效()
    {
        var client = await _factory.CreateClientWithSeedAsync();
        var tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var userId = Guid.NewGuid();
        var username = $"mfa-recovery-http-{Guid.NewGuid():N}";
        const string password = "MfaRecovery@123";
        const string totpSecret = "JBSWY3DPEHPK3PXP";
        var oldRecoveryCodes = MfaRecoveryCodeService.Generate();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var protector = scope.ServiceProvider.GetRequiredService<ITotpSecretProtector>();
            db.Users.Add(new User
            {
                Id = userId,
                TenantId = tenantId,
                Username = username,
                PasswordHash = PasswordHasher.HashPassword(password),
                DisplayName = username,
                Role = UserRole.Technician,
                IsActive = true,
                MustChangePassword = false,
                MfaEnabled = true,
                TotpSecret = protector.Protect(totpSecret),
                MfaRecoveryCodes = oldRecoveryCodes.SerializedHashes,
                Language = "zh-CN",
            });
            await db.SaveChangesAsync();
        }

        try
        {
            var firstLogin = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest
            {
                Username = username,
                Password = password,
            });
            firstLogin.StatusCode.Should().Be(HttpStatusCode.OK);
            var firstLoginResult = await firstLogin.Content.ReadFromJsonAsync<AuthResponse>();
            firstLoginResult.Should().NotBeNull();
            firstLoginResult!.MfaRequired.Should().BeTrue();
            firstLoginResult.MfaChallengeToken.Should().NotBeNullOrWhiteSpace();

            var firstVerify = await client.PostAsJsonAsync("/api/v1/auth/mfa/verify", new
            {
                challengeToken = firstLoginResult.MfaChallengeToken,
                totpCode = oldRecoveryCodes.Codes[0],
            });
            firstVerify.StatusCode.Should().Be(HttpStatusCode.OK);
            ShouldNotCache(firstVerify);
            var firstAuth = await firstVerify.Content.ReadFromJsonAsync<AuthResponse>();
            firstAuth.Should().NotBeNull();
            firstAuth!.AccessToken.Should().NotBeNullOrWhiteSpace();

            var repeatedLogin = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest
            {
                Username = username,
                Password = password,
            });
            repeatedLogin.StatusCode.Should().Be(HttpStatusCode.OK);
            var repeatedLoginResult = await repeatedLogin.Content.ReadFromJsonAsync<AuthResponse>();
            repeatedLoginResult.Should().NotBeNull();

            var repeatedVerify = await client.PostAsJsonAsync("/api/v1/auth/mfa/verify", new
            {
                challengeToken = repeatedLoginResult!.MfaChallengeToken,
                totpCode = oldRecoveryCodes.Codes[0],
            });
            repeatedVerify.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", firstAuth.AccessToken);
            var currentTotpCode = new Totp(Base32Encoding.ToBytes(totpSecret)).ComputeTotp();
            var regenerate = await client.PostAsJsonAsync(
                "/api/v1/auth/mfa/recovery-codes/regenerate",
                new { totpCode = currentTotpCode });
            regenerate.StatusCode.Should().Be(HttpStatusCode.OK);
            ShouldNotCache(regenerate);
            var regenerated = await regenerate.Content.ReadFromJsonAsync<MfaRecoveryCodesResponse>();
            regenerated.Should().NotBeNull();
            regenerated!.RecoveryCodes.Should().HaveCount(8);
            regenerated.RecoveryCodes.Should().NotContain(oldRecoveryCodes.Codes);

            client.DefaultRequestHeaders.Authorization = null;
            var oldCodeLogin = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest
            {
                Username = username,
                Password = password,
            });
            oldCodeLogin.StatusCode.Should().Be(HttpStatusCode.OK);
            var oldCodeLoginResult = await oldCodeLogin.Content.ReadFromJsonAsync<AuthResponse>();
            oldCodeLoginResult.Should().NotBeNull();

            var oldCodeVerify = await client.PostAsJsonAsync("/api/v1/auth/mfa/verify", new
            {
                challengeToken = oldCodeLoginResult!.MfaChallengeToken,
                totpCode = oldRecoveryCodes.Codes[1],
            });
            oldCodeVerify.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

            var newCodeLogin = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest
            {
                Username = username,
                Password = password,
            });
            newCodeLogin.StatusCode.Should().Be(HttpStatusCode.OK);
            var newCodeLoginResult = await newCodeLogin.Content.ReadFromJsonAsync<AuthResponse>();
            newCodeLoginResult.Should().NotBeNull();

            var newCodeVerify = await client.PostAsJsonAsync("/api/v1/auth/mfa/verify", new
            {
                challengeToken = newCodeLoginResult!.MfaChallengeToken,
                totpCode = regenerated.RecoveryCodes[0],
            });
            newCodeVerify.StatusCode.Should().Be(HttpStatusCode.OK);
            ShouldNotCache(newCodeVerify);

            using var auditScope = _factory.Services.CreateScope();
            var auditDb = auditScope.ServiceProvider.GetRequiredService<AppDbContext>();
            var recoveryAudits = await auditDb.Set<AuditLog>()
                .IgnoreQueryFilters()
                .Where(audit => audit.TenantId == tenantId
                    && audit.ResourceId == userId.ToString()
                    && (audit.Action == "AuthMfaRecoveryCodeUsed"
                        || audit.Action == "MfaRecoveryCodesRegenerated"))
                .ToListAsync();

            recoveryAudits.Count(audit => audit.Action == "AuthMfaRecoveryCodeUsed")
                .Should().Be(2);
            recoveryAudits.Count(audit => audit.Action == "MfaRecoveryCodesRegenerated")
                .Should().Be(1);
            recoveryAudits.Should().OnlyContain(audit =>
                audit.TenantId == tenantId
                && audit.ResourceType == "User"
                && audit.ResourceId == userId.ToString());
            recoveryAudits.Select(audit => audit.Description)
                .Should().OnlyContain(description =>
                    !oldRecoveryCodes.Codes.Any(description.Contains)
                    && !regenerated.RecoveryCodes.Any(description.Contains)
                    && !description.Contains(currentTotpCode, StringComparison.Ordinal));
        }
        finally
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var redis = scope.ServiceProvider.GetRequiredService<RedisService>();
            var user = await db.Users.IgnoreQueryFilters()
                .SingleOrDefaultAsync(candidate => candidate.Id == userId);
            if (user is not null)
            {
                db.Users.Remove(user);
            }

            var audits = await db.Set<AuditLog>()
                .IgnoreQueryFilters()
                .Where(audit => audit.TenantId == tenantId
                    && audit.ResourceId == userId.ToString())
                .ToListAsync();
            db.Set<AuditLog>().RemoveRange(audits);
            await db.SaveChangesAsync();
            await redis.RemoveRefreshTokenAsync(userId);
        }
    }

    /// <summary>
    /// 断言敏感认证响应明确要求浏览器和中间代理不缓存。
    /// </summary>
    private static void ShouldNotCache(HttpResponseMessage response)
    {
        response.Headers.TryGetValues("Cache-Control", out var cacheControlValues)
            .Should().BeTrue();
        cacheControlValues.Should().Contain(value =>
            value.Contains("no-store", StringComparison.OrdinalIgnoreCase));
    }
}
