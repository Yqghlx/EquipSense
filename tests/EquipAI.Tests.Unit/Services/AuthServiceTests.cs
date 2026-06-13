using AutoMapper;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Application.Mapping;
using EquipAI.Application.Services;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Cache;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Identity;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Tests.Unit.Services;

/// <summary>
/// AuthService 单元测试 — 覆盖登录、令牌刷新、登出、修改密码、注册和套餐查询等核心认证场景
/// 使用 InMemory 数据库、真实的 JwtTokenService（测试配置）、Stub RedisService 和真实的 AutoMapper
/// </summary>
public class AuthServiceTests : IAsyncDisposable
{
    private readonly ServiceProvider _sp;
    private readonly StubRedisService _stubRedis;
    private readonly JwtTokenService _jwtService;
    private readonly Guid _tenantId;

    public AuthServiceTests()
    {
        _tenantId = Guid.NewGuid();

        // 构建 JWT 测试配置：密钥至少 32 字符以满足 HMAC-SHA256 签名要求
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = new string('x', 32),
                ["Jwt:Issuer"] = "Test",
                ["Jwt:Audience"] = "Test"
            })
            .Build();

        _jwtService = new JwtTokenService(config);

        // 使用 Stub 替代真实 RedisService，避免构造函数连接 Redis
        // StubRedisService 继承 RedisService 并用内存字典模拟 Redis 行为
        _stubRedis = new StubRedisService();

        var dbName = $"AuthServiceTest_{Guid.NewGuid()}";
        var services = new ServiceCollection();

        // 注册 InMemory 数据库，模拟租户上下文
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(dbName));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(_tenantId));

        // 注册 AutoMapper，使用项目实际的 MappingProfile
        services.AddAutoMapper(typeof(MappingProfile));

        services.AddLogging();

        // 注册 AuthService 的依赖项
        services.AddSingleton(_jwtService);
        services.AddSingleton<RedisService>(_stubRedis);  // 注册为基类 RedisService 类型
        services.AddScoped<IAuditLogService, StubAuditLogService>();
        // 注册邮件服务（测试中 SendAsync 会因无 SMTP 配置进入 catch，不影响测试逻辑）
        services.Configure<EquipAI.Application.Notifications.SmtpOptions>(_ => { });
        services.AddScoped<EquipAI.Application.Notifications.SmtpEmailNotificationService>();
        services.AddScoped<AuthService>();

        _sp = services.BuildServiceProvider();
    }

    // ==================== LoginAsync ====================

    [Fact]
    public async Task LoginAsync_正确凭据_应返回AuthResponse()
    {
        // Arrange：创建活跃用户并写入数据库
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var password = "password123";
        var user = CreateTestUser("loginuser", _tenantId, password);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var request = new LoginRequest { Username = "loginuser", Password = password };

        // Act
        var result = await service.LoginAsync(request);

        // Assert：令牌和用户信息应全部非空
        result.Should().NotBeNull();
        result.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.UserInfo.Should().NotBeNull();
        result.UserInfo.Username.Should().Be("loginuser");
    }

    [Fact]
    public async Task LoginAsync_错误密码_应抛出UnauthorizedAccessException()
    {
        // Arrange：创建用户但使用错误密码登录
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var user = CreateTestUser("wrongpwd", _tenantId, "correctpassword");
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var request = new LoginRequest { Username = "wrongpwd", Password = "incorrectpassword" };

        // Act & Assert：错误密码应抛出未授权异常
        var act = () => service.LoginAsync(request);
        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task LoginAsync_用户不存在_应抛出UnauthorizedAccessException()
    {
        // Arrange：不创建任何用户
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();

        var request = new LoginRequest { Username = "nonexistent", Password = "password123" };

        // Act & Assert：用户不存在应抛出未授权异常（不暴露具体原因，防止用户名枚举）
        var act = () => service.LoginAsync(request);
        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task LoginAsync_停用用户_应抛出UnauthorizedAccessException()
    {
        // Arrange：创建已停用的用户
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var password = "password123";
        var user = CreateTestUser("disableduser", _tenantId, password);
        user.IsActive = false;
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var request = new LoginRequest { Username = "disableduser", Password = password };

        // Act & Assert：停用用户登录应被拒绝
        var act = () => service.LoginAsync(request);
        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task LoginAsync_应更新LastLoginAt()
    {
        // Arrange：创建用户并记录登录前的时间
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var before = DateTime.UtcNow.AddSeconds(-1);
        var password = "password123";
        var user = CreateTestUser("logintimeuser", _tenantId, password);
        user.LastLoginAt = null;
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var request = new LoginRequest { Username = "logintimeuser", Password = password };

        // Act
        await service.LoginAsync(request);

        // Assert：LastLoginAt 应被更新为当前时间附近
        var updatedUser = await db.Users.FindAsync(user.Id);
        updatedUser!.LastLoginAt.Should().NotBeNull();
        updatedUser.LastLoginAt.Should().BeOnOrAfter(before);
    }

    // ==================== 账户锁定 ====================

    [Fact]
    public async Task LoginAsync_连续失败5次_应锁定账户()
    {
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var password = "password123";
        var user = CreateTestUser("lockoutuser", _tenantId, password);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var wrongRequest = new LoginRequest { Username = "lockoutuser", Password = "wrongpassword" };

        // 连续失败 4 次不应锁定
        for (var i = 0; i < 4; i++)
        {
            await service.Invoking(s => s.LoginAsync(wrongRequest)).Should().ThrowAsync<UnauthorizedAccessException>();
        }
        var userAfter4 = await db.Users.FindAsync(user.Id);
        userAfter4!.AccessFailedCount.Should().Be(4);
        userAfter4.LockoutEnd.Should().BeNull();

        // 第 5 次失败应触发锁定
        await service.Invoking(s => s.LoginAsync(wrongRequest)).Should().ThrowAsync<UnauthorizedAccessException>();
        var userAfter5 = await db.Users.FindAsync(user.Id);
        userAfter5!.LockoutEnd.Should().NotBeNull();
        userAfter5.LockoutEnd!.Value.Should().BeAfter(DateTime.UtcNow);
    }

    [Fact]
    public async Task LoginAsync_账户锁定期间_正确密码也应被拒绝()
    {
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var password = "password123";
        var user = CreateTestUser("lockeduser", _tenantId, password);
        user.LockoutEnd = DateTime.UtcNow.AddMinutes(15);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        // 即使密码正确也应被拒绝
        var request = new LoginRequest { Username = "lockeduser", Password = password };
        var act = () => service.LoginAsync(request);
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*锁定*");
    }

    [Fact]
    public async Task LoginAsync_锁定过期后_应自动解锁并允许登录()
    {
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var password = "password123";
        var user = CreateTestUser("expiredlockuser", _tenantId, password);
        // 锁定时间已过
        user.LockoutEnd = DateTime.UtcNow.AddMinutes(-1);
        user.AccessFailedCount = 5;
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var request = new LoginRequest { Username = "expiredlockuser", Password = password };
        var result = await service.LoginAsync(request);

        result.Should().NotBeNull();
        var updatedUser = await db.Users.FindAsync(user.Id);
        updatedUser!.AccessFailedCount.Should().Be(0);
        updatedUser.LockoutEnd.Should().BeNull();
    }

    [Fact]
    public async Task LoginAsync_登录成功_应重置失败计数()
    {
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var password = "password123";
        var user = CreateTestUser("resetcountuser", _tenantId, password);
        user.AccessFailedCount = 3;
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var request = new LoginRequest { Username = "resetcountuser", Password = password };
        await service.LoginAsync(request);

        var updatedUser = await db.Users.FindAsync(user.Id);
        updatedUser!.AccessFailedCount.Should().Be(0);
        updatedUser.LockoutEnd.Should().BeNull();
    }

    [Fact]
    public async Task LoginAsync_应存储RefreshToken到Redis()
    {
        // Arrange
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var password = "password123";
        var user = CreateTestUser("redisuser", _tenantId, password);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var request = new LoginRequest { Username = "redisuser", Password = password };

        // Act
        var result = await service.LoginAsync(request);

        // Assert：刷新令牌应已存入 StubRedis（内存字典），可按用户 ID 取回
        var storedToken = await _stubRedis.GetRefreshTokenAsync(user.Id);
        storedToken.Should().Be(result.RefreshToken);
    }

    // ==================== RefreshTokenAsync ====================

    [Fact]
    public async Task RefreshTokenAsync_有效token_应返回新令牌()
    {
        // Arrange：创建活跃用户，并在 StubRedis 中预设匹配的刷新令牌
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var password = "password123";
        var user = CreateTestUser("refreshuser", _tenantId, password);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var validRefreshToken = "valid-refresh-token-12345";
        await _stubRedis.SetRefreshTokenAsync(user.Id, validRefreshToken, TimeSpan.FromDays(7));

        // Act
        var result = await service.RefreshTokenAsync(validRefreshToken);

        // Assert：应返回新的令牌对和用户信息
        result.Should().NotBeNull();
        result.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.UserInfo.Username.Should().Be("refreshuser");
    }

    [Fact]
    public async Task RefreshTokenAsync_无效token_应抛出UnauthorizedAccessException()
    {
        // Arrange：创建用户但 StubRedis 中没有匹配的令牌
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var user = CreateTestUser("invalidrefresh", _tenantId, "password123");
        db.Users.Add(user);
        await db.SaveChangesAsync();

        // StubRedis 默认返回 null，即令牌不匹配

        // Act & Assert：无效令牌应抛出未授权异常
        var act = () => service.RefreshTokenAsync("nonexistent-token");
        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task RefreshTokenAsync_空字符串_应抛出UnauthorizedAccessException()
    {
        // Arrange
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();

        // Act & Assert：空字符串令牌应直接拒绝
        var act = () => service.RefreshTokenAsync(string.Empty);
        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task RefreshTokenAsync_应轮换RefreshToken()
    {
        // Arrange：准备旧令牌，验证新令牌与旧令牌不同
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var user = CreateTestUser("rotateuser", _tenantId, "password123");
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var oldRefreshToken = "old-token-to-rotate";
        await _stubRedis.SetRefreshTokenAsync(user.Id, oldRefreshToken, TimeSpan.FromDays(7));

        // Act
        var result = await service.RefreshTokenAsync(oldRefreshToken);

        // Assert：新刷新令牌应与旧令牌不同（令牌轮换机制）
        result.RefreshToken.Should().NotBe(oldRefreshToken);

        // 新令牌应已写入 StubRedis（旧令牌被替换）
        var storedToken = await _stubRedis.GetRefreshTokenAsync(user.Id);
        storedToken.Should().Be(result.RefreshToken);
    }

    // ==================== LogoutAsync ====================

    [Fact]
    public async Task LogoutAsync_应调用RedisRemoveRefreshTokenAsync()
    {
        // Arrange：先存入令牌再登出
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();

        var userId = Guid.NewGuid();
        await _stubRedis.SetRefreshTokenAsync(userId, "token-to-remove", TimeSpan.FromDays(7));

        // 验证令牌已存在
        var tokenBefore = await _stubRedis.GetRefreshTokenAsync(userId);
        tokenBefore.Should().Be("token-to-remove");

        // Act
        await service.LogoutAsync(userId);

        // Assert：登出后令牌应被移除
        var tokenAfter = await _stubRedis.GetRefreshTokenAsync(userId);
        tokenAfter.Should().BeNull();
    }

    // ==================== ChangePasswordAsync ====================

    [Fact]
    public async Task ChangePasswordAsync_正确密码_应更新哈希()
    {
        // Arrange：创建用户并记录旧密码哈希
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var currentPassword = "OldPassword123";
        var newPassword = "NewPassword456";
        var user = CreateTestUser("chgpwduser", _tenantId, currentPassword);
        var oldHash = user.PasswordHash;
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var request = new ChangePasswordRequest
        {
            CurrentPassword = currentPassword,
            NewPassword = newPassword
        };

        // Act
        await service.ChangePasswordAsync(user.Id, request);

        // Assert：密码哈希应已更新，且与旧哈希不同
        var updatedUser = await db.Users.FindAsync(user.Id);
        updatedUser!.PasswordHash.Should().NotBe(oldHash);
        updatedUser.PasswordHash.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task ChangePasswordAsync_应递增TokenVersion()
    {
        // Arrange：创建用户并记录当前 TokenVersion
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var password = "password123";
        var user = CreateTestUser("tokenveruser", _tenantId, password);
        user.TokenVersion = 3;
        var expectedVersion = user.TokenVersion + 1;
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var request = new ChangePasswordRequest
        {
            CurrentPassword = password,
            NewPassword = "NewPassword456"
        };

        // Act
        await service.ChangePasswordAsync(user.Id, request);

        // Assert：TokenVersion 应递增 1，使已颁发的 JWT 失效
        var updatedUser = await db.Users.FindAsync(user.Id);
        updatedUser!.TokenVersion.Should().Be(expectedVersion);
    }

    [Fact]
    public async Task ChangePasswordAsync_应清除MustChangePassword()
    {
        // Arrange：创建需要强制改密的用户
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var password = "password123";
        var user = CreateTestUser("mustchangeuser", _tenantId, password);
        user.MustChangePassword = true;
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var request = new ChangePasswordRequest
        {
            CurrentPassword = password,
            NewPassword = "NewPassword456"
        };

        // Act
        await service.ChangePasswordAsync(user.Id, request);

        // Assert：密码修改成功后应清除强制改密标记
        var updatedUser = await db.Users.FindAsync(user.Id);
        updatedUser!.MustChangePassword.Should().BeFalse();
    }

    [Fact]
    public async Task ChangePasswordAsync_错误密码_应抛出UnauthorizedAccessException()
    {
        // Arrange：使用错误的当前密码尝试修改
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var user = CreateTestUser("wrongpwduser", _tenantId, "correctpassword");
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var request = new ChangePasswordRequest
        {
            CurrentPassword = "wrongpassword",
            NewPassword = "NewPassword456"
        };

        // Act & Assert：当前密码错误应抛出未授权异常
        var act = () => service.ChangePasswordAsync(user.Id, request);
        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task ChangePasswordAsync_用户不存在_应抛出KeyNotFoundException()
    {
        // Arrange：使用不存在的用户 ID
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();

        var request = new ChangePasswordRequest
        {
            CurrentPassword = "password123",
            NewPassword = "NewPassword456"
        };

        // Act & Assert：用户不存在应抛出键未找到异常
        var act = () => service.ChangePasswordAsync(Guid.NewGuid(), request);
        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    // ==================== RequestPasswordResetAsync / ResetPasswordAsync ====================

    [Fact]
    public async Task RequestPasswordResetAsync_存在邮箱_应生成重置Token存入Redis()
    {
        // Arrange
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var user = CreateTestUser("resetuser", _tenantId, "OldPwd123", email: "reset@test.com");
        db.Users.Add(user);
        await db.SaveChangesAsync();

        // Act
        await service.RequestPasswordResetAsync("reset@test.com", "https://app/reset?token={token}");

        // Assert：Redis 字典应含一个 pwdreset: 前缀的键
        _stubRedis.HasStringKeyStartingWith("pwdreset:").Should().BeTrue();
    }

    [Fact]
    public async Task RequestPasswordResetAsync_不存在邮箱_应静默返回不抛异常()
    {
        // Arrange：不创建任何用户
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();

        // Act & Assert：不存在邮箱应静默返回（防邮箱枚举）
        var act = async () => await service.RequestPasswordResetAsync("nobody@test.com", "https://app/reset?token={token}");
        await act.Should().NotThrowAsync();
        _stubRedis.HasStringKeyStartingWith("pwdreset:").Should().BeFalse();
    }

    [Fact]
    public async Task ResetPasswordAsync_有效Token_应更新密码并使Token失效()
    {
        // Arrange
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var user = CreateTestUser("pwdresetuser", _tenantId, "OldPassword123", email: "pwd@test.com");
        db.Users.Add(user);
        await db.SaveChangesAsync();

        // 先申请重置，生成 token
        await service.RequestPasswordResetAsync("pwd@test.com", "https://app/reset?token={token}");
        var fullKey = _stubRedis.GetStringKeyStartingWith("pwdreset:")!;
        var token = fullKey["pwdreset:".Length..]; // 去掉前缀得到实际 token

        // Act：用 token 重置密码
        await service.ResetPasswordAsync(token, "NewPassword456");

        // Assert：密码已更新，旧密码失效
        var updatedUser = await db.Users.FirstAsync(u => u.Id == user.Id);
        PasswordHasher.VerifyPassword("NewPassword456", updatedUser.PasswordHash).Should().BeTrue();
        PasswordHasher.VerifyPassword("OldPassword123", updatedUser.PasswordHash).Should().BeFalse();
        // token 应已被删除（一次性使用）
        _stubRedis.GetStringKeyStartingWith("pwdreset:").Should().BeNull();
    }

    [Fact]
    public async Task ResetPasswordAsync_无效Token_应抛出UnauthorizedAccessException()
    {
        // Arrange
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();

        // Act & Assert：无效 token 应抛未授权异常
        var act = () => service.ResetPasswordAsync("invalid-token", "NewPassword456");
        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task ResetPasswordAsync_应清除登录失败计数和锁定()
    {
        // Arrange
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var user = CreateTestUser("lockeduser", _tenantId, "OldPassword123", email: "locked@test.com");
        user.AccessFailedCount = 5;
        user.LockoutEnd = DateTime.UtcNow.AddMinutes(10);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        await service.RequestPasswordResetAsync("locked@test.com", "https://app/reset?token={token}");
        var fullKey = _stubRedis.GetStringKeyStartingWith("pwdreset:")!;
        var token = fullKey["pwdreset:".Length..];

        // Act
        await service.ResetPasswordAsync(token, "NewPassword456");

        // Assert：重置后应清除失败计数和锁定
        var updated = await db.Users.FirstAsync(u => u.Id == user.Id);
        updated.AccessFailedCount.Should().Be(0);
        updated.LockoutEnd.Should().BeNull();
    }

    // ==================== RegisterAsync ====================

    [Fact]
    public async Task RegisterAsync_应创建租户和用户()
    {
        // Arrange
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var request = new RegisterRequest
        {
            TenantName = "测试企业",
            Slug = "test-company",
            Username = "newadmin",
            Password = "AdminPass123",
            DisplayName = "管理员",
            Plan = "Trial"
        };

        // Act
        var result = await service.RegisterAsync(request);

        // Assert：应返回认证响应，数据库中应有 1 个租户和 1 个用户
        result.Should().NotBeNull();
        result.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.UserInfo.Username.Should().Be("newadmin");

        var tenantCount = await db.UnfilteredSet<Tenant>().CountAsync();
        var userCount = await db.UnfilteredSet<User>().CountAsync();
        tenantCount.Should().Be(1);
        userCount.Should().Be(1);
    }

    [Fact]
    public async Task RegisterAsync_重复Slug_应抛出InvalidOperationException()
    {
        // Arrange：先注册一个租户，再用相同 Slug 注册
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 预先创建一个使用目标 Slug 的租户
        var existingTenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = "已有企业",
            Slug = "duplicate-slug",
            Plan = TenantPlan.Trial
        };
        db.Tenants.Add(existingTenant);
        await db.SaveChangesAsync();

        var request = new RegisterRequest
        {
            TenantName = "新企业",
            Slug = "duplicate-slug",  // 与已有租户冲突
            Username = "newuser",
            Password = "AdminPass123",
            Plan = "Trial"
        };

        // Act & Assert：重复 Slug 应抛出无效操作异常
        var act = () => service.RegisterAsync(request);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*duplicate-slug*");
    }

    [Fact]
    public async Task RegisterAsync_重复用户名_应抛出InvalidOperationException()
    {
        // Arrange：先创建一个用户，再用相同用户名注册
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 预先创建一个使用目标用户名的用户
        var existingUser = CreateTestUser("duplicateuser", Guid.NewGuid(), "password123");
        db.Users.Add(existingUser);
        await db.SaveChangesAsync();

        var request = new RegisterRequest
        {
            TenantName = "新企业",
            Slug = "unique-slug",
            Username = "duplicateuser",  // 与已有用户冲突
            Password = "AdminPass123",
            Plan = "Trial"
        };

        // Act & Assert：重复用户名应抛出无效操作异常
        var act = () => service.RegisterAsync(request);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*duplicateuser*");
    }

    // ==================== GetPlansAsync ====================

    [Fact]
    public async Task GetPlansAsync_应返回套餐列表()
    {
        // Arrange
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();

        // Act
        var result = await service.GetPlansAsync();

        // Assert：应返回至少 2 个套餐（试用版、专业版、企业版）
        result.Should().NotBeNull();
        result.Count.Should().BeGreaterOrEqualTo(2);
        result.Should().Contain(p => p.PlanId == "Trial");
        result.Should().Contain(p => p.PlanId == "Professional");
        result.Should().Contain(p => p.PlanId == "Enterprise");
    }

    // ==================== 辅助方法 ====================

    /// <summary>
    /// 创建测试用用户实体，密码通过 PasswordHasher 生成真实哈希
    /// </summary>
    /// <param name="username">用户名</param>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="password">明文密码</param>
    /// <param name="role">角色（默认 SystemAdmin）</param>
    /// <returns>用户实体（含真实密码哈希）</returns>
    private static User CreateTestUser(
        string username,
        Guid tenantId,
        string password,
        UserRole role = UserRole.SystemAdmin,
        string? email = null)
    {
        return new User
        {
            Id = Guid.NewGuid(),
            Username = username,
            TenantId = tenantId,
            PasswordHash = PasswordHasher.HashPassword(password),
            DisplayName = username,
            Email = email,
            Role = role,
            IsActive = true,
            MustChangePassword = false,
            TokenVersion = 0,
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// 测试用租户上下文 — 模拟 ITenantContext，提供租户隔离信息
    /// </summary>
    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode { get; } = "shared";
        public bool IsSystemAdmin { get; } = false;
        public Guid UserId { get; } = Guid.NewGuid();
    }

    /// <summary>
    /// RedisService 的测试替身，使用内存字典模拟 Redis 操作
    /// 继承 RedisService 并重写所有虚方法，避免构造函数尝试连接真实 Redis 服务器
    /// </summary>
    private class StubRedisService : RedisService
    {
        /// <summary>
        /// 内存字典，存储用户 ID 到刷新令牌的映射
        /// </summary>
        private readonly Dictionary<Guid, string> _store = new();

        /// <summary>
        /// 内存字典，存储通用字符串键值（密码重置 token 等）
        /// </summary>
        private readonly Dictionary<string, string> _stringStore = new();

        /// <summary>
        /// 无参构造函数 — 绕过基类需要 Redis 连接的构造函数
        /// 基类构造函数会尝试连接 Redis，此处传空配置会导致异常
        /// 因此使用一种技巧：通过反射或直接赋值来避免基类初始化
        /// </summary>
        public StubRedisService() : base(CreateStubConfiguration(), CreateStubLogger())
        {
            // StubRedisService 完全使用内存字典，不调用任何基类方法
        }

        /// <summary>
        /// 创建一个最小化的测试配置，让基类构造函数不抛异常
        /// </summary>
        private static IConfiguration CreateStubConfiguration()
        {
            return new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Redis:ConnectionString"] = "localhost:6379,abortConnect=false,connectTimeout=1"
                })
                .Build();
        }

        /// <summary>
        /// 创建一个 Stub Logger，避免基类构造函数中的日志记录失败
        /// </summary>
        private static ILogger<RedisService> CreateStubLogger()
        {
            return LoggerFactory.Create(b => { }).CreateLogger<RedisService>();
        }

        public override Task SetRefreshTokenAsync(Guid userId, string refreshToken, TimeSpan expiry)
        {
            _store[userId] = refreshToken;
            return Task.CompletedTask;
        }

        public override Task<string?> GetRefreshTokenAsync(Guid userId)
        {
            _store.TryGetValue(userId, out var token);
            return Task.FromResult(token);
        }

        public override Task RemoveRefreshTokenAsync(Guid userId)
        {
            _store.Remove(userId);
            return Task.CompletedTask;
        }

        public override Task SetStringAsync(string key, string value, TimeSpan expiry)
        {
            _stringStore[key] = value;
            return Task.CompletedTask;
        }

        public override Task<string?> GetStringAsync(string key)
        {
            _stringStore.TryGetValue(key, out var value);
            return Task.FromResult(value);
        }

        public override Task RemoveKeyAsync(string key)
        {
            _stringStore.Remove(key);
            return Task.CompletedTask;
        }

        /// <summary>是否存在以指定前缀开头的键</summary>
        public bool HasStringKeyStartingWith(string prefix) =>
            _stringStore.Keys.Any(k => k.StartsWith(prefix, StringComparison.Ordinal));

        /// <summary>获取以指定前缀开头的第一个键（用于测试提取 token）</summary>
        public string? GetStringKeyStartingWith(string prefix) =>
            _stringStore.Keys.FirstOrDefault(k => k.StartsWith(prefix, StringComparison.Ordinal));
    }

    /// <summary>
    /// 审计日志服务 Stub，用于测试中避免依赖真实的审计日志持久化
    /// </summary>
    private class StubAuditLogService : IAuditLogService
    {
        public Task LogAsync(Guid tenantId, string action, string resourceType, string? resourceId = null, string? description = null, CancellationToken ct = default)
            => Task.CompletedTask;

        public Task LogFromContextAsync(string action, string resourceType, string? resourceId = null, string? description = null, CancellationToken ct = default)
            => Task.CompletedTask;

        public Task<PagedResult<AuditLogDto>> GetAuditLogsAsync(Guid tenantId, int page = 1, int pageSize = 20, CancellationToken ct = default)
            => Task.FromResult(new PagedResult<AuditLogDto> { Items = [], Total = 0, Page = page, PageSize = pageSize });
    }

    public async ValueTask DisposeAsync() => await _sp.DisposeAsync();
}
