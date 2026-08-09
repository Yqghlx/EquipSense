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
    private readonly IConfigurationRoot _configuration;

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
        _configuration = config;

        _jwtService = new JwtTokenService(config);

        // 使用 Stub 替代真实 RedisService，避免构造函数连接 Redis
        // StubRedisService 继承 RedisService 并用内存字典模拟 Redis 行为
        _stubRedis = new StubRedisService();

        var dbName = $"AuthServiceTest_{Guid.NewGuid()}";
        var services = new ServiceCollection();

        // 注册 InMemory 数据库，模拟租户上下文
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(dbName));
        services.AddSingleton<IConfiguration>(_configuration);
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(_tenantId));

        // 注册 AutoMapper，使用项目实际的 MappingProfile
        services.AddAutoMapper(_ => { }, typeof(MappingProfile).Assembly);

        services.AddLogging();

        // 注册 AuthService 的依赖项
        services.AddSingleton(_jwtService);
        services.AddSingleton<RedisService>(_stubRedis);  // 注册为基类 RedisService 类型
        services.AddScoped<IAuditLogService, StubAuditLogService>();
        // 注册 TOTP 服务 Stub（默认接受任意 6 位验证码，测试 MFA 流程）
        services.AddSingleton<EquipAI.Infrastructure.Identity.ITotpService>(new StubTotpService());
        // 测试保护器使用可逆前缀模拟加密，断言不会把 TOTP 密钥明文写入实体。
        services.AddSingleton<ITotpSecretProtector, StubTotpSecretProtector>();
        // 注册邮件服务（测试中 SendAsync 会因无 SMTP 配置进入 catch，不影响测试逻辑）
        services.Configure<EquipAI.Application.Notifications.SmtpOptions>(_ => { });
        services.AddScoped<EquipAI.Application.Notifications.SmtpEmailNotificationService>();
        services.AddScoped<AuthService>();

        _sp = services.BuildServiceProvider();
    }

    // ==================== LoginAsync ====================

    [Fact]
    public async Task LoginAsync_生产策略要求高权限Mfa且用户未启用_应返回注册挑战而不颁发令牌()
    {
        // Arrange：生产策略通过配置要求系统管理员必须完成 MFA 注册。
        _configuration["Security:Mfa:RequiredRoles:0"] = nameof(UserRole.SystemAdmin);
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        const string password = "password123";
        var user = CreateTestUser("mfaenrollmentuser", _tenantId, password, UserRole.SystemAdmin);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        // Act
        var result = await service.LoginAsync(new LoginRequest
        {
            Username = user.Username,
            Password = password
        });

        // Assert：先用反射锁定新增响应字段，保证测试在实现缺失时以可读断言失败，
        // 而不是因为测试代码无法编译而掩盖真正的行为缺口。
        var enrollmentRequiredProperty = result.GetType().GetProperty("MfaEnrollmentRequired");
        enrollmentRequiredProperty.Should().NotBeNull();
        ((bool)enrollmentRequiredProperty!.GetValue(result)!).Should().BeTrue();

        var enrollmentTokenProperty = result.GetType().GetProperty("MfaEnrollmentToken");
        enrollmentTokenProperty.Should().NotBeNull();
        enrollmentTokenProperty!.GetValue(result).Should().NotBeNull();
        result.AccessToken.Should().BeEmpty();
        result.RefreshToken.Should().BeEmpty();
    }

    [Fact]
    public async Task MfaEnrollment_有效注册令牌完成确认_应启用Mfa并返回完整令牌()
    {
        // Arrange：先完成密码阶段，拿到不包含 JWT 的首次 MFA 注册令牌。
        _configuration["Security:Mfa:RequiredRoles:0"] = nameof(UserRole.SystemAdmin);
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        const string password = "password123";
        var user = CreateTestUser("mfaenrollmentflow", _tenantId, password, UserRole.SystemAdmin);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var loginResult = await service.LoginAsync(new LoginRequest
        {
            Username = user.Username,
            Password = password
        });
        var enrollmentToken = loginResult.GetType().GetProperty("MfaEnrollmentToken")?.GetValue(loginResult) as string;
        enrollmentToken.Should().NotBeNullOrWhiteSpace();

        // Act：通过反射调用尚未实现的 enrollment API，先锁定其行为契约而不让测试因缺少方法无法编译。
        var setupMethod = typeof(AuthService).GetMethod("SetupMfaEnrollmentAsync");
        setupMethod.Should().NotBeNull();
        var setupTask = (Task)setupMethod!.Invoke(service, new object[] { enrollmentToken! })!;
        await setupTask;
        var setupResult = setupTask.GetType().GetProperty("Result")!.GetValue(setupTask)!;
        (setupResult.GetType().GetProperty("Secret")!.GetValue(setupResult) as string).Should().NotBeNullOrWhiteSpace();
        (setupResult.GetType().GetProperty("QrCodeUri")!.GetValue(setupResult) as string).Should().NotBeNullOrWhiteSpace();

        var confirmMethod = typeof(AuthService).GetMethod("ConfirmMfaEnrollmentAsync");
        confirmMethod.Should().NotBeNull();
        var confirmTask = (Task)confirmMethod!.Invoke(
            service,
            new object[] { enrollmentToken!, "123456" })!;
        await confirmTask;
        var confirmResult = confirmTask.GetType().GetProperty("Result")!.GetValue(confirmTask)!;

        // Assert：确认后才落库启用 MFA，并且只在完整二次认证完成后颁发令牌。
        user.MfaEnabled.Should().BeTrue();
        user.TotpSecret.Should().NotBeNullOrWhiteSpace();
        user.TotpSecret.Should().NotBe("JBSWY3DPEHPK3PXP", "TOTP 密钥不应以明文持久化");
        (confirmResult.GetType().GetProperty("AccessToken")!.GetValue(confirmResult) as string).Should().NotBeNullOrWhiteSpace();
        (confirmResult.GetType().GetProperty("RefreshToken")!.GetValue(confirmResult) as string).Should().NotBeNullOrWhiteSpace();
        _stubRedis.GetStringKeyStartingWith("mfa_enrollment:").Should().BeNull();
        _stubRedis.GetStringKeyStartingWith("mfa_enrollment_setup:").Should().BeNull();
    }

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
        var storedToken = _stubRedis.GetStoredRefreshToken(user.Id);
        storedToken.Should().Be(result.RefreshToken);
    }

    // ==================== RefreshTokenAsync ====================

    [Fact]
    public async Task RefreshTokenAsync_生产强制角色未完成Mfa_应拒绝刷新并吊销会话()
    {
        // Arrange：模拟策略上线后，旧会话仍持有刷新令牌但账户尚未完成 MFA 注册。
        _configuration["Security:Mfa:RequiredRoles:0"] = nameof(UserRole.SystemAdmin);
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var user = CreateTestUser("mfarefreshblocked", _tenantId, "password123", UserRole.SystemAdmin);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        const string refreshToken = "mfa-policy-old-refresh-token";
        await _stubRedis.SetRefreshTokenAsync(user.Id, refreshToken, TimeSpan.FromDays(7));

        // Act & Assert：策略不能只拦截新登录，旧刷新会话也必须失效。
        var act = () => service.RefreshTokenAsync(refreshToken);
        await act.Should().ThrowAsync<UnauthorizedAccessException>();
        _stubRedis.GetStoredRefreshToken(user.Id).Should().BeNull();
    }

    [Fact]
    public async Task DisableMfaAsync_生产强制角色_应拒绝禁用()
    {
        // Arrange：系统管理员已经启用 MFA，生产策略要求其持续保持启用状态。
        _configuration["Security:Mfa:RequiredRoles:0"] = nameof(UserRole.SystemAdmin);
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var user = CreateTestUser("mfadisableblocked", _tenantId, "password123", UserRole.SystemAdmin);
        user.MfaEnabled = true;
        user.TotpSecret = "JBSWY3DPEHPK3PXP";
        db.Users.Add(user);
        await db.SaveChangesAsync();

        // Act & Assert
        var act = () => service.DisableMfaAsync(user.Id);
        await act.Should().ThrowAsync<InvalidOperationException>();
        user.MfaEnabled.Should().BeTrue();
        user.TotpSecret.Should().NotBeNullOrWhiteSpace();
    }

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
        var storedToken = _stubRedis.GetStoredRefreshToken(user.Id);
        storedToken.Should().Be(result.RefreshToken);
    }

    /// <summary>
    /// 【安全】轮换后被取代的旧 token 再次提交——应识别为重放，立即吊销整个会话并记审计告警。
    ///
    /// 场景：令牌 T1 被合法刷新轮换为 T2（T1 转为墓碑）。若 T1 再次出现，说明同一令牌被两方持有
    /// （典型失窃：攻击者与合法用户各持一份）。按 OAuth 2.0 BCP，吊销该用户全部刷新令牌，
    /// 使攻击者持有的当前 token T2 一并失效，强制重新登录。
    /// </summary>
    [Fact]
    public async Task RefreshTokenAsync_轮换后旧token再次提交_应识别为重用并吊销会话()
    {
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var audit = scope.ServiceProvider.GetRequiredService<IAuditLogService>() as StubAuditLogService;

        var user = CreateTestUser("reuseuser", _tenantId, "password123");
        db.Users.Add(user);
        await db.SaveChangesAsync();

        const string t1 = "token-t1-reused";
        await _stubRedis.SetRefreshTokenAsync(user.Id, t1, TimeSpan.FromDays(7));

        // 第一次：合法刷新 T1 → 轮换为 T2（T1 变为墓碑）
        var first = await service.RefreshTokenAsync(t1);
        first.RefreshToken.Should().NotBe(t1);
        _stubRedis.GetStoredRefreshToken(user.Id).Should().Be(first.RefreshToken, "新令牌 T2 已生效");

        // 第二次：重放 T1 —— 应抛异常并吊销会话
        var act = () => service.RefreshTokenAsync(t1);
        await act.Should().ThrowAsync<UnauthorizedAccessException>();

        // 会话被吊销：正向索引清空，攻击者持有的 T2 也无法再用
        _stubRedis.GetStoredRefreshToken(user.Id).Should().BeNull("重用检测应吊销该用户全部刷新令牌");

        // 安全事件应记审计，供运维发现令牌失窃
        audit!.LoggedActions.Should().Contain("AuthRefreshTokenReused");
    }

    /// <summary>
    /// 连续正常刷新链（每次都用当前 token）不应误报重用。
    /// 保证墓碑机制只对"被取代后再次出现"的令牌触发，不影响合法的连续续期。
    /// </summary>
    [Fact]
    public async Task RefreshTokenAsync_连续正常刷新链_不应误报重用()
    {
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var user = CreateTestUser("chainuser", _tenantId, "password123");
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var current = "chain-token-1";
        await _stubRedis.SetRefreshTokenAsync(user.Id, current, TimeSpan.FromDays(7));

        // 连续刷新 3 次，每次用上一次返回的新令牌（合法链）
        for (var i = 0; i < 3; i++)
        {
            var refreshed = await service.RefreshTokenAsync(current);
            refreshed.RefreshToken.Should().NotBe(current, "每次刷新都应轮换令牌");
            current = refreshed.RefreshToken;
        }

        // 链路未被误吊销，最新令牌仍生效
        _stubRedis.GetStoredRefreshToken(user.Id).Should().Be(current);
    }

    /// <summary>
    /// 重用吊销后，重用前刚刚轮换出的"当前 token"也应失效（攻击者持有的令牌被一并杀死）。
    ///
    /// 场景：T1→T2 合法轮换；攻击者重放 T1 触发吊销；此时攻击者持有的 T2（重用前的当前令牌）
    /// 必须不能再用于刷新，否则吊销形同虚设。
    /// </summary>
    [Fact]
    public async Task RefreshTokenAsync_重用吊销后_当前token也应失效()
    {
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var user = CreateTestUser("revokeduser", _tenantId, "password123");
        db.Users.Add(user);
        await db.SaveChangesAsync();

        const string t1 = "token-revoke-1";
        await _stubRedis.SetRefreshTokenAsync(user.Id, t1, TimeSpan.FromDays(7));

        // T1 → T2（攻击者可能持有 T2）
        var t2 = (await service.RefreshTokenAsync(t1)).RefreshToken;
        t2.Should().NotBe(t1);

        // 重放 T1 触发会话吊销
        await service.Invoking(s => s.RefreshTokenAsync(t1)).Should().ThrowAsync<UnauthorizedAccessException>();

        // 攻击者持有的 T2 现在也必须无法刷新
        var act = () => service.RefreshTokenAsync(t2);
        await act.Should().ThrowAsync<UnauthorizedAccessException>(
            "因为会话已被吊销，T2 作为会话内的当前令牌应随之失效");
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
        var tokenBefore = _stubRedis.GetStoredRefreshToken(userId);
        tokenBefore.Should().Be("token-to-remove");

        // Act
        await service.LogoutAsync(userId);

        // Assert：登出后令牌应被移除
        var tokenAfter = _stubRedis.GetStoredRefreshToken(userId);
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

    [Fact]
    public async Task ChangePasswordAsync_正确密码_应记录审计日志()
    {
        // 改密码是认证系统最高敏感操作之一（改哈希 + 吊销全部会话 + TokenVersion++），必须留痕审计。
        // 同 AuthService 内密码重置已记 PasswordReset，改密码同为密码变更却历史缺审计 → 不可追溯。
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var audit = scope.ServiceProvider.GetRequiredService<IAuditLogService>() as StubAuditLogService;

        var currentPassword = "OldPassword123";
        var user = CreateTestUser("chgpwdaudit", _tenantId, currentPassword);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var request = new ChangePasswordRequest
        {
            CurrentPassword = currentPassword,
            NewPassword = "NewPassword456"
        };

        // Act
        await service.ChangePasswordAsync(user.Id, request);

        // Assert：改密码必须留痕审计，否则"谁在何时改了密码"不可追溯（ISO 27001 / IEC 62443）
        audit!.LoggedActions.Should().Contain("ChangePassword",
            "改密码是高敏感认证操作，必须留痕审计（同 AuthService 已审计密码重置，改密码不可遗漏）");
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
    public async Task RegisterAsync_生产强制Mfa_不应通过自动登录绕过注册流程()
    {
        // Arrange：公开注册创建的管理员同样属于 SystemAdmin，不能绕过 MFA 门禁直接拿 JWT。
        _configuration["Security:Mfa:RequiredRoles:0"] = nameof(UserRole.SystemAdmin);
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AuthService>();

        // Act
        var result = await service.RegisterAsync(new RegisterRequest
        {
            TenantName = "MFA 企业",
            Slug = "mfa-company",
            Username = "mfa-admin",
            Password = "AdminPass123",
            Email = "mfa-admin@example.com",
            Plan = "Trial"
        });

        // Assert：注册接口也必须返回 enrollment token，而不是直接建立完整会话。
        var enrollmentRequiredProperty = result.GetType().GetProperty("MfaEnrollmentRequired");
        enrollmentRequiredProperty.Should().NotBeNull();
        ((bool)enrollmentRequiredProperty!.GetValue(result)!).Should().BeTrue();
        result.GetType().GetProperty("MfaEnrollmentToken")!.GetValue(result).Should().NotBeNull();
        result.AccessToken.Should().BeEmpty();
        result.RefreshToken.Should().BeEmpty();
    }

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
            // 将旧 token 反向索引转为"已轮换"墓碑（模拟真实 RedisService 重放检测行为）
            if (_store.TryGetValue(userId, out var oldToken))
            {
                _stringStore[$"refresh_token:{oldToken}"] = $"revoked:{userId}";
            }
            _store[userId] = refreshToken;
            // 同时写入 _stringStore，供 AuthService 正向索引一致性检查（GetStringAsync）读取
            _stringStore[$"refresh:{userId}"] = refreshToken;
            _stringStore[$"refresh_token:{refreshToken}"] = userId.ToString();
            return Task.CompletedTask;
        }

        public override Task<RefreshTokenEntry> GetRefreshTokenStateAsync(string refreshToken)
        {
            if (!_stringStore.TryGetValue($"refresh_token:{refreshToken}", out var raw))
            {
                return Task.FromResult(RefreshTokenEntry.Unknown());
            }
            if (raw.StartsWith("revoked:", StringComparison.Ordinal))
            {
                var uid = raw["revoked:".Length..];
                return Task.FromResult(Guid.TryParse(uid, out var userId)
                    ? RefreshTokenEntry.Reused(userId)
                    : RefreshTokenEntry.Unknown());
            }
            return Task.FromResult(Guid.TryParse(raw, out var id)
                ? RefreshTokenEntry.Valid(id)
                : RefreshTokenEntry.Unknown());
        }

        public override Task<Guid?> GetUserIdByRefreshTokenAsync(string refreshToken)
        {
            if (_stringStore.TryGetValue($"refresh_token:{refreshToken}", out var userIdStr)
                && Guid.TryParse(userIdStr, out var userId))
            {
                return Task.FromResult<Guid?>(userId);
            }
            return Task.FromResult<Guid?>(null);
        }

        public override Task RemoveRefreshTokenAsync(Guid userId)
        {
            if (_store.TryGetValue(userId, out var token))
            {
                _stringStore.Remove($"refresh_token:{token}");
            }
            _store.Remove(userId);
            _stringStore.Remove($"refresh:{userId}");
            return Task.CompletedTask;
        }

        /// <summary>
        /// 测试断言辅助：按 userId 读取存储的刷新令牌（对应正向索引）
        /// 替代原 GetRefreshTokenAsync，仅用于测试内部状态验证
        /// </summary>
        public string? GetStoredRefreshToken(Guid userId)
        {
            _store.TryGetValue(userId, out var token);
            return token;
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
        /// <summary>记录所有审计动作名（用于断言安全事件是否被记录，如令牌重用）</summary>
        public List<string> LoggedActions { get; } = new();

        public Task LogAsync(Guid tenantId, string action, string resourceType, string? resourceId = null, string? description = null, CancellationToken ct = default)
        {
            LoggedActions.Add(action);
            return Task.CompletedTask;
        }

        public Task LogFromContextAsync(string action, string resourceType, string? resourceId = null, string? description = null, CancellationToken ct = default)
            => Task.CompletedTask;

        public Task<PagedResult<AuditLogDto>> GetAuditLogsAsync(Guid tenantId, int page = 1, int pageSize = 20, CancellationToken ct = default)
            => Task.FromResult(new PagedResult<AuditLogDto> { Items = [], Total = 0, Page = page, PageSize = pageSize });
    }

    /// <summary>
    /// TOTP 服务 Stub，用于测试中避免依赖密码学随机数和真实的 TOTP 算法
    /// - GenerateSecret 返回固定测试密钥
    /// - VerifyCode 默认接受任意 6 位数字验证码（模拟正确验证码）
    /// - 通过 SetVerifyResult 可自定义验证码校验结果（用于测试验证码错误场景）
    /// </summary>
    private class StubTotpService : EquipAI.Infrastructure.Identity.ITotpService
    {
        private bool _verifyResult = true;

        public string GenerateSecret() => "JBSWY3DPEHPK3PXP"; // 固定测试密钥（Base32）

        public string BuildQrCodeUri(string secret, string account, string issuer)
            => $"otpauth://totp/{issuer}:{account}?secret={secret}&issuer={issuer}";

        public bool VerifyCode(string secret, string code)
            => _verifyResult && !string.IsNullOrWhiteSpace(code) && code.Length == 6;

        /// <summary>设置后续 VerifyCode 的返回值（用于测试验证码错误场景）</summary>
        public void SetVerifyResult(bool result) => _verifyResult = result;
    }

    /// <summary>
    /// TOTP 密钥保护器测试替身，模拟“落库值不是明文、验证时可还原”的契约。
    /// </summary>
    private sealed class StubTotpSecretProtector : ITotpSecretProtector
    {
        public string Protect(string plainTextSecret) => $"protected:{plainTextSecret}";

        public string Unprotect(string storedSecret)
            => storedSecret.StartsWith("protected:", StringComparison.Ordinal)
                ? storedSecret["protected:".Length..]
                : storedSecret;
    }

    public async ValueTask DisposeAsync() => await _sp.DisposeAsync();
}
