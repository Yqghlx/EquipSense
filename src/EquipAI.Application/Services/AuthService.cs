using AutoMapper;
using System.Security.Cryptography;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Application.DTOs.Users;
using EquipAI.Application.Interfaces;
using EquipAI.Application.Notifications;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Cache;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Identity;
using EquipAI.Application.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Services;

/// <summary>
/// 认证服务实现，提供用户登录、令牌刷新、登出和修改密码等能力
/// 登录操作使用 IgnoreQueryFilters 跨租户查找用户（登录时尚无租户上下文）
/// 刷新令牌存储在 Redis 中，有效期 7 天
/// </summary>
public class AuthService : IAuthService
{
    private readonly AppDbContext _dbContext;
    private readonly JwtTokenService _jwtTokenService;
    private readonly RedisService _redisService;
    private readonly IMapper _mapper;
    private readonly ILogger<AuthService> _logger;
    private readonly IAuditLogService _auditLogService;
    private readonly SmtpEmailNotificationService _emailService;
    private readonly ITotpService _totpService;
    private readonly ITotpSecretProtector _totpSecretProtector;
    private readonly IDistributedLockProvider _distributedLockProvider;
    private readonly MfaPolicyOptions _mfaPolicy;
    private readonly IPiiProtector _piiProtector;
    private readonly ITenantContext _tenantContext;

    /// <summary>
    /// 连续登录失败达到此数值时自动锁定账户
    /// </summary>
    private const int MaxAccessAttempts = 5;

    /// <summary>
    /// 账户锁定时长（分钟）
    /// </summary>
    private const int LockoutDurationMinutes = 15;

    /// <summary>
    /// 密码重置 token 有效期（分钟）
    /// </summary>
    private const int PasswordResetTokenMinutes = 30;

    /// <summary>
    /// 密码重置 token 在 Redis 中的键前缀
    /// </summary>
    private const string PasswordResetKeyPrefix = "pwdreset:";

    /// <summary>
    /// MFA 登录挑战令牌在 Redis 中的键前缀
    /// 键格式：mfa_challenge:{token} → userId（GUID 字符串）
    /// 有效期：5 分钟，一次性使用
    /// </summary>
    private const string MfaChallengeKeyPrefix = "mfa_challenge:";

    /// <summary>
    /// MFA 首次注册令牌在 Redis 中的键前缀。
    /// 键格式：mfa_enrollment:{token} → userId。
    /// </summary>
    private const string MfaEnrollmentKeyPrefix = "mfa_enrollment:";

    /// <summary>
    /// MFA 首次注册临时密钥在 Redis 中的键前缀。
    /// 键格式：mfa_enrollment_setup:{token} → secret。
    /// </summary>
    private const string MfaEnrollmentSetupKeyPrefix = "mfa_enrollment_setup:";

    /// <summary>
    /// MFA 首次注册令牌有效期（分钟）。
    /// </summary>
    private const int MfaEnrollmentTokenMinutes = 10;

    /// <summary>
    /// MFA 设置流程的临时 TOTP 密钥在 Redis 中的键前缀
    /// 键格式：mfa_setup:{userId} → secret（Base32 字符串）
    /// 有效期：10 分钟（用户需在此时间内扫码并确认）
    /// </summary>
    private const string MfaSetupKeyPrefix = "mfa_setup:";

    /// <summary>
    /// MFA 恢复码按用户加锁，避免并行挑战重复消费同一个一次性恢复码。
    /// </summary>
    private const string MfaRecoveryLockPrefix = "auth:mfa-recovery:";

    /// <summary>
    /// 恢复码消费和重新生成的锁租约时长，覆盖一次数据库瞬态重试窗口。
    /// </summary>
    private static readonly TimeSpan MfaRecoveryLockExpiry = TimeSpan.FromMinutes(2);

    /// <summary>
    /// 等待同一用户的另一个恢复码操作完成的最长时间。
    /// </summary>
    private static readonly TimeSpan MfaRecoveryLockWaitTime = TimeSpan.FromSeconds(5);

    /// <summary>
    /// 刷新令牌按用户加锁，避免并发请求同时轮换同一个 Refresh Token。
    /// </summary>
    private const string RefreshTokenLockPrefix = "auth:refresh:";

    /// <summary>
    /// 刷新流程锁租约时长，覆盖数据库查询和 Redis 令牌轮换的瞬态重试窗口。
    /// </summary>
    private static readonly TimeSpan RefreshTokenLockExpiry = TimeSpan.FromMinutes(2);

    /// <summary>
    /// 等待同一用户的另一个刷新请求完成的最长时间。
    /// </summary>
    private static readonly TimeSpan RefreshTokenLockWaitTime = TimeSpan.FromSeconds(5);

    /// <summary>
    /// 各套餐对应的配额限制（最大设备数、最大用户数、数据保留天数）
    /// 0 表示不限制
    /// </summary>
    private static readonly Dictionary<TenantPlan, (int MaxDevices, int MaxUsers, int RetentionDays)> PlanLimits = new()
    {
        [TenantPlan.Trial] = (5, 3, 7),
        [TenantPlan.Professional] = (50, 20, 90),
        [TenantPlan.Enterprise] = (0, 0, 365),
    };

    /// <summary>
    /// 套餐的展示信息（标识、名称、描述、月度价格）
    /// </summary>
    private static readonly List<(TenantPlan Plan, string DisplayName, string Description, decimal Price)> PlanDisplayInfo = new()
    {
        (TenantPlan.Trial, "试用版", "14 天免费试用，最多 5 台设备、3 个用户", 0m),
        (TenantPlan.Professional, "专业版", "适合中小团队，最多 50 台设备、20 个用户", 299m),
        (TenantPlan.Enterprise, "企业版", "不限设备与用户，365 天数据保留", 999m),
    };

    /// <summary>
    /// 初始化认证服务
    /// </summary>
    public AuthService(
        AppDbContext dbContext,
        JwtTokenService jwtTokenService,
        RedisService redisService,
        IMapper mapper,
        ILogger<AuthService> logger,
        IAuditLogService auditLogService,
        SmtpEmailNotificationService emailService,
        ITotpService totpService,
        IConfiguration configuration,
        ITotpSecretProtector totpSecretProtector,
        IDistributedLockProvider distributedLockProvider,
        IPiiProtector piiProtector,
        ITenantContext tenantContext)
    {
        _dbContext = dbContext;
        _jwtTokenService = jwtTokenService;
        _redisService = redisService;
        _mapper = mapper;
        _logger = logger;
        _auditLogService = auditLogService;
        _emailService = emailService;
        _totpService = totpService;
        _totpSecretProtector = totpSecretProtector;
        _distributedLockProvider = distributedLockProvider;
        _piiProtector = piiProtector;
        _tenantContext = tenantContext;
        _mfaPolicy = MfaPolicyOptions.FromConfiguration(configuration);
    }

    /// <summary>
    /// 用户登录，验证凭据并返回 JWT 令牌。
    /// 包含账户锁定和登录失败计数机制：连续失败 5 次后自动锁定 15 分钟。
    /// 使用 IgnoreQueryFilters 跨租户查找用户，因为登录时尚未建立租户上下文。
    /// </summary>
    /// <param name="request">登录请求（用户名 + 密码）</param>
    /// <returns>认证响应（含 Access Token、Refresh Token 和用户信息）</returns>
    /// <exception cref="UnauthorizedAccessException">用户名或密码错误，或账户已被停用/锁定</exception>
    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        // 跨租户查找用户：登录请求没有租户上下文，需要忽略全局租户过滤器
        var user = await _dbContext.UnfilteredSet<Core.Entities.User>()
            .FirstOrDefaultAsync(u => u.Username == request.Username);

        // 用户不存在时仍返回统一错误信息，避免枚举用户名
        if (user == null)
        {
            _logger.LogWarning("登录失败：用户名 {Username} 不存在", request.Username);
            throw new UnauthorizedAccessException("用户名或密码错误");
        }

        // 检查账户是否被锁定
        if (user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTime.UtcNow)
        {
            _logger.LogWarning("登录失败：用户 {Username} 账户已锁定至 {LockoutEnd}", user.Username, user.LockoutEnd.Value);
            await _auditLogService.LogAsync(user.TenantId, "AuthLoginLocked", "User", user.Id.ToString(),
                "账户已锁定，尝试登录被拒绝", default);
            throw new UnauthorizedAccessException("账户已被锁定，请稍后再试");
        }

        // 锁定已过期则自动解锁
        if (user.LockoutEnd.HasValue && user.LockoutEnd.Value <= DateTime.UtcNow)
        {
            user.LockoutEnd = null;
            user.AccessFailedCount = 0;
        }

        // 验证密码
        if (!PasswordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            user.AccessFailedCount++;

            // 连续失败达到上限时锁定账户
            if (user.AccessFailedCount >= MaxAccessAttempts)
            {
                user.LockoutEnd = DateTime.UtcNow.AddMinutes(LockoutDurationMinutes);
                _logger.LogWarning("用户 {Username} 连续登录失败 {Count} 次，账户锁定 {Minutes} 分钟",
                    user.Username, user.AccessFailedCount, LockoutDurationMinutes);
                await _dbContext.SaveChangesAsync();
                await _auditLogService.LogAsync(user.TenantId, "AuthAccountLocked", "User", user.Id.ToString(),
                    $"连续登录失败 {user.AccessFailedCount} 次，账户锁定 {LockoutDurationMinutes} 分钟", default);
            }
            else
            {
                _logger.LogWarning("用户 {Username} 登录失败，已累计失败 {Count} 次", user.Username, user.AccessFailedCount);
                await _dbContext.SaveChangesAsync();
                await _auditLogService.LogAsync(user.TenantId, "AuthLoginFailed", "User", user.Id.ToString(),
                    $"登录失败（密码错误），累计失败 {user.AccessFailedCount} 次", default);
            }

            throw new UnauthorizedAccessException("用户名或密码错误");
        }

        if (!user.IsActive)
        {
            _logger.LogWarning("登录失败：用户 {Username} 已被停用", user.Username);
            await _auditLogService.LogAsync(user.TenantId, "AuthLoginFailed", "User", user.Id.ToString(),
                "登录失败：账户已被停用", default);
            throw new UnauthorizedAccessException("该账户已被停用");
        }

        // 登录成功：重置失败计数和锁定状态
        user.AccessFailedCount = 0;
        user.LockoutEnd = null;

        // 生产高权限账户在完成 MFA 注册前不得获得任何 JWT。
        // 通过短期 enrollment token 引导首次配置，避免运维人员直接改库或把安全策略变成不可用的硬拒绝。
        if (_mfaPolicy.IsRequiredFor(user.Role) && !HasConfiguredMfa(user))
        {
            var enrollmentToken = Guid.NewGuid().ToString("N");
            await _redisService.SetStringAsync(
                $"{MfaEnrollmentKeyPrefix}{enrollmentToken}",
                user.Id.ToString(),
                TimeSpan.FromMinutes(MfaEnrollmentTokenMinutes));

            await _dbContext.SaveChangesAsync();
            await _auditLogService.LogAsync(user.TenantId, "AuthMfaEnrollmentRequired", "User", user.Id.ToString(),
                $"用户 {user.Username} 通过密码验证，必须先完成 MFA 注册", default);

            return new AuthResponse
            {
                MfaEnrollmentRequired = true,
                MfaEnrollmentToken = enrollmentToken,
                UserInfo = _mapper.Map<UserDto>(user)!,
            };
        }

        // MFA 二步验证检查：若用户启用了 TOTP，不直接颁发令牌，而是返回挑战令牌
        // 客户端需携带挑战令牌 + TOTP 验证码调用 /auth/mfa/verify 完成登录
        if (HasConfiguredMfa(user))
        {
            // 生成一次性挑战令牌（GUID 去掉连字符），存入 Redis 与 userId 绑定
            var challengeToken = Guid.NewGuid().ToString("N");
            await _redisService.SetStringAsync(
                $"{MfaChallengeKeyPrefix}{challengeToken}",
                user.Id.ToString(),
                TimeSpan.FromMinutes(5));

            // 更新最后登录时间（MFA 验证前即记录，避免挑战令牌过期后无法追踪登录尝试）
            user.LastLoginAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("用户 {Username} 密码验证通过，进入 MFA 二次验证阶段", user.Username);
            await _auditLogService.LogAsync(user.TenantId, "AuthMfaChallenge", "User", user.Id.ToString(),
                $"用户 {user.Username} 通过密码验证，等待 MFA 验证码", default);

            return new AuthResponse
            {
                // MFA 阶段不颁发令牌，前端应识别 MfaRequired=true 并展示验证码输入界面
                MfaRequired = true,
                MfaChallengeToken = challengeToken,
                UserInfo = _mapper.Map<UserDto>(user)!,
            };
        }

        // 每次登录创建独立会话；同一用户的其他设备不能因为本次登录而失效。
        var sessionId = Guid.NewGuid().ToString("N");
        var accessToken = _jwtTokenService.GenerateAccessToken(user, sessionId);
        var refreshToken = _jwtTokenService.GenerateRefreshToken();

        // 登录与刷新都会替换用户当前会话；共用同一把锁，避免两个流程交错写入正反向索引。
        await using var refreshLock = await AcquireRefreshTokenMutationLockAsync(user.Id);

        // 刷新令牌存入 Redis，有效期 7 天
        await _redisService.SetRefreshTokenAsync(user.Id, sessionId, refreshToken, TimeSpan.FromDays(7));

        // 更新最后登录时间
        user.LastLoginAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("用户 {Username} 登录成功（租户：{TenantId}）", user.Username, user.TenantId);
        await _auditLogService.LogAsync(user.TenantId, "AuthLoginSuccess", "User", user.Id.ToString(),
            $"用户 {user.Username} 登录成功", default);

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            // 与 JWT exp 同源，前端据此调度主动刷新；Cookie MaxAge 也取此值
            ExpiresIn = _jwtTokenService.AccessTokenMinutes * 60,
            UserInfo = _mapper.Map<UserDto>(user)!
        };
    }

    /// <summary>
    /// 判断用户是否已经完成可用的 MFA 配置。
    /// </summary>
    private static bool HasConfiguredMfa(Core.Entities.User user)
        => user.MfaEnabled && !string.IsNullOrWhiteSpace(user.TotpSecret);

    /// <summary>
    /// 构造已认证用户的租户限定查询。
    /// 这些方法由 JWT 已认证请求调用，用户 ID 来自令牌，但仍必须显式校验租户，
    /// 防止服务层被错误参数调用时把当前租户的写操作落到其他租户用户上。
    /// </summary>
    /// <param name="userId">当前认证用户 ID。</param>
    /// <returns>同时按用户 ID 和当前租户 ID 限定的用户查询。</returns>
    private IQueryable<Core.Entities.User> QueryTenantUser(Guid userId)
    {
        EnsureCurrentUser(userId);
        var tenantId = _tenantContext.TenantId;
        return _dbContext.UnfilteredSet<Core.Entities.User>()
            .Where(user => user.Id == userId && user.TenantId == tenantId);
    }

    /// <summary>
    /// 校验服务调用方是否就是当前认证用户。
    /// JWT 中的用户 ID 是控制器传入参数的权威来源；服务层再次校验可以防止未来新增调用方
    /// 把同租户其他用户的 ID 误传给自助认证接口。空用户上下文仅用于登录前流程和无请求单元测试。
    /// </summary>
    /// <param name="userId">待操作的用户 ID。</param>
    /// <exception cref="UnauthorizedAccessException">用户 ID 与当前认证身份不一致。</exception>
    private void EnsureCurrentUser(Guid userId)
    {
        if (_tenantContext.UserId != Guid.Empty && _tenantContext.UserId != userId)
        {
            _logger.LogWarning(
                "拒绝认证自助操作：请求用户 {RequestedUserId} 与当前身份 {CurrentUserId} 不一致",
                userId,
                _tenantContext.UserId);
            throw new UnauthorizedAccessException("只能操作当前登录用户");
        }
    }

    /// <summary>
    /// 获取用户级刷新令牌变更锁。
    /// 登录、MFA 登录、注册自动登录和刷新都会改写同一组 Redis 会话索引；
    /// 任一路径无法获得锁时都必须拒绝签发，避免返回一个已被其他请求覆盖的令牌。
    /// </summary>
    /// <param name="userId">会话所属用户 ID</param>
    /// <returns>已获取的分布式锁句柄，调用方负责使用 <c>await using</c> 释放</returns>
    /// <exception cref="UnauthorizedAccessException">锁不可用或在等待窗口内未获取</exception>
    private async Task<IDistributedLockHandle> AcquireRefreshTokenMutationLockAsync(Guid userId)
    {
        var refreshLock = await _distributedLockProvider.AcquireAsync(
            $"{RefreshTokenLockPrefix}{userId}",
            RefreshTokenLockExpiry,
            RefreshTokenLockWaitTime);
        if (!refreshLock.IsAcquired)
        {
            await refreshLock.DisposeAsync();
            _logger.LogWarning("获取刷新令牌用户锁超时：{UserId}", userId);
            throw new UnauthorizedAccessException("认证请求正在处理中，请稍后重试");
        }

        return refreshLock;
    }

    /// <summary>
    /// 使用 Refresh Token 刷新 Access Token
    /// 验证 Redis 中存储的刷新令牌是否匹配，匹配则颁发新令牌对并更新 Redis
    /// </summary>
    /// <param name="refreshToken">刷新令牌</param>
    /// <returns>新的认证响应（含新的 Access Token 和 Refresh Token）</returns>
    /// <exception cref="UnauthorizedAccessException">刷新令牌无效或已过期</exception>
    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            throw new UnauthorizedAccessException("刷新令牌不能为空");
        }

        // 三态查询：Valid（当前令牌）/ Reused（已轮换墓碑——重放）/ Unknown（不存在）。
        // Valid 和 Reused 都携带用户 ID，可先据此获取用户级锁；Unknown 直接拒绝，避免无效请求放大锁竞争。
        var state = await _redisService.GetRefreshTokenStateAsync(refreshToken);

        if ((state.Status != RefreshTokenStatus.Valid && state.Status != RefreshTokenStatus.Reused)
            || !state.UserId.HasValue)
        {
            _logger.LogWarning("刷新令牌无效或已过期");
            throw new UnauthorizedAccessException("刷新令牌无效或已过期");
        }

        var lockUserId = state.UserId.Value;
        await using var refreshLock = await AcquireRefreshTokenMutationLockAsync(lockUserId);

        // 锁内重新读取状态：另一个并发请求可能已经完成轮换，不能继续使用锁外读取到的旧 Valid 状态。
        state = await _redisService.GetRefreshTokenStateAsync(refreshToken);

        var sessionId = state.SessionId ?? RedisService.LegacySessionId;

        // 重放检测（OAuth 2.0 BCP）：该 token 曾有效但已被轮换——说明同一 token 被两方持有（典型失窃场景）。
        // 只吊销发生重放的会话，避免把同一用户其他设备的正常会话一并踢下线。
        if (state.Status == RefreshTokenStatus.Reused && state.UserId.HasValue)
        {
            var reusedUserId = state.UserId.Value;
            _logger.LogWarning(
                "检测到刷新令牌重用（用户 {UserId}，会话 {SessionId}）：曾有效的令牌被再次提交，可能已泄露，已吊销当前会话",
                reusedUserId,
                sessionId);
            await _auditLogService.LogAsync(reusedUserId, "AuthRefreshTokenReused", "User", reusedUserId.ToString(),
                "刷新令牌重用检测命中：曾有效的令牌被再次提交，已吊销当前会话以防令牌失窃", default);
            await _redisService.RemoveRefreshTokenSessionAsync(reusedUserId, sessionId);
            throw new UnauthorizedAccessException("刷新令牌无效或已过期");
        }

        if (state.Status != RefreshTokenStatus.Valid
            || !state.UserId.HasValue
            || state.UserId.Value != lockUserId)
        {
            _logger.LogWarning("刷新令牌在锁内失效或用户归属发生变化：{UserId}", lockUserId);
            throw new UnauthorizedAccessException("刷新令牌无效或已过期");
        }

        var userId = state.UserId.Value;

        var matchedUser = await _dbContext.UnfilteredSet<Core.Entities.User>()
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);

        if (matchedUser == null)
        {
            // 反向索引存在但用户不存在或已禁用（账号删除/禁用后残留索引）
            _logger.LogWarning("刷新令牌对应用户 {UserId} 不存在或已禁用，清理残留索引", userId);
            await _redisService.RemoveRefreshTokenSessionAsync(userId, sessionId);
            throw new UnauthorizedAccessException("刷新令牌无效或已过期");
        }

        // 角色策略可能在用户已有会话期间被启用；刷新时再次检查，避免旧 Refresh Token 绕过 MFA 门禁。
        if (_mfaPolicy.IsRequiredFor(matchedUser.Role) && !HasConfiguredMfa(matchedUser))
        {
            await _redisService.RemoveRefreshTokenSessionAsync(matchedUser.Id, sessionId);
            await _auditLogService.LogAsync(matchedUser.TenantId, "AuthMfaPolicyBlocked", "User",
                matchedUser.Id.ToString(), "高权限账户未完成 MFA 注册，刷新令牌已吊销", default);
            throw new UnauthorizedAccessException("该高权限账户必须先完成 MFA 注册");
        }

        // 验证当前会话正向索引与反向索引一致性（防止 Redis 数据不一致）。
        var storedToken = await _redisService.GetRefreshTokenForSessionAsync(matchedUser.Id, sessionId);
        if (storedToken != refreshToken)
        {
            _logger.LogWarning("刷新令牌正反向索引不一致（用户：{UserId}，会话：{SessionId}），可能已轮换", matchedUser.Id, sessionId);
            throw new UnauthorizedAccessException("刷新令牌无效或已过期");
        }

        // 生成新的令牌对
        var newAccessToken = _jwtTokenService.GenerateAccessToken(matchedUser, sessionId);
        var newRefreshToken = _jwtTokenService.GenerateRefreshToken();

        // 更新当前会话的刷新令牌；其他设备会话保持不变。
        await _redisService.SetRefreshTokenAsync(matchedUser.Id, sessionId, newRefreshToken, TimeSpan.FromDays(7));

        _logger.LogInformation("用户 {Username} 刷新令牌成功", matchedUser.Username);

        return new AuthResponse
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            ExpiresIn = _jwtTokenService.AccessTokenMinutes * 60,
            UserInfo = _mapper.Map<UserDto>(matchedUser)!
        };
    }

    /// <summary>
    /// 验证 MFA 挑战令牌和 TOTP 验证码，完成登录
    ///
    /// 安全机制：
    ///   - 挑战令牌一次性：验证成功后立即从 Redis 删除，防止重放攻击
    ///   - 挑战令牌 5 分钟过期：超时需重新输入密码
    ///   - 验证码 ±1 步窗口：容忍客户端/服务器时钟偏差 30 秒
    /// </summary>
    public async Task<AuthResponse> VerifyMfaAsync(string challengeToken, string totpCode)
    {
        if (string.IsNullOrWhiteSpace(challengeToken) || string.IsNullOrWhiteSpace(totpCode))
        {
            throw new UnauthorizedAccessException("挑战令牌和验证码不能为空");
        }

        // 从 Redis 读取挑战令牌对应的 userId（读取后立即删除，实现一次性使用）
        var challengeKey = $"{MfaChallengeKeyPrefix}{challengeToken}";
        var userIdStr = await _redisService.GetAndDeleteStringAsync(challengeKey);

        if (userIdStr == null || !Guid.TryParse(userIdStr, out var userId))
        {
            _logger.LogWarning("MFA 验证失败：挑战令牌无效或已过期");
            throw new UnauthorizedAccessException("挑战令牌无效或已过期，请重新登录");
        }

        var user = await _dbContext.UnfilteredSet<Core.Entities.User>()
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);

        if (user == null || !user.MfaEnabled || string.IsNullOrEmpty(user.TotpSecret))
        {
            _logger.LogWarning("MFA 验证失败：用户 {UserId} 不存在或 MFA 未启用", userId);
            throw new UnauthorizedAccessException("用户状态异常，请重新登录");
        }

        // 校验 TOTP 验证码
        string plainTotpSecret;
        try
        {
            plainTotpSecret = _totpSecretProtector.Unprotect(user.TotpSecret);
        }
        catch (CryptographicException ex)
        {
            _logger.LogError(ex, "用户 {UserId} 的 TOTP 密钥无法解密，拒绝 MFA 登录", user.Id);
            throw new UnauthorizedAccessException("MFA 配置不可用，请联系系统管理员重置", ex);
        }

        var totpVerified = _totpService.VerifyCode(plainTotpSecret, totpCode);
        var recoveryCodeConsumed = false;
        if (!totpVerified)
        {
            // 恢复码是数据库中的一次性凭据，必须在共享锁内重新读取并保存，
            // 否则两个并行 MFA 挑战可能同时读取同一份 JSON 并各自成功消费。
            await using var recoveryLock = await _distributedLockProvider.AcquireAsync(
                $"{MfaRecoveryLockPrefix}{user.Id}",
                MfaRecoveryLockExpiry,
                MfaRecoveryLockWaitTime);
            if (!recoveryLock.IsAcquired)
            {
                _logger.LogWarning("MFA 恢复码验证获取用户锁超时：{UserId}", user.Id);
                throw new UnauthorizedAccessException("MFA 请求正在处理中，请重新登录后重试");
            }

            // 锁内重新查询，确保消费的是最新恢复码摘要；同时兼容另一个请求刚刚禁用 MFA 的情况。
            _dbContext.Entry(user).State = EntityState.Detached;
            user = await _dbContext.UnfilteredSet<Core.Entities.User>()
                .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);
            if (user == null || !user.MfaEnabled || string.IsNullOrEmpty(user.TotpSecret))
            {
                throw new UnauthorizedAccessException("用户状态异常，请重新登录");
            }

            try
            {
                plainTotpSecret = _totpSecretProtector.Unprotect(user.TotpSecret);
            }
            catch (CryptographicException ex)
            {
                _logger.LogError(ex, "用户 {UserId} 的 TOTP 密钥无法解密，拒绝 MFA 登录", user.Id);
                throw new UnauthorizedAccessException("MFA 配置不可用，请联系系统管理员重置", ex);
            }

            // 等待锁期间验证码可能跨过时间窗口，再校验一次 TOTP，避免把有效验证码误判为恢复码。
            totpVerified = _totpService.VerifyCode(plainTotpSecret, totpCode);
            if (!totpVerified)
            {
                recoveryCodeConsumed = MfaRecoveryCodeService.TryConsume(
                    user.MfaRecoveryCodes,
                    totpCode,
                    out var remainingRecoveryCodes);

                if (recoveryCodeConsumed)
                {
                    user.MfaRecoveryCodes = remainingRecoveryCodes;
                    await _auditLogService.LogAsync(
                        user.TenantId,
                        "AuthMfaRecoveryCodeUsed",
                        "User",
                        user.Id.ToString(),
                        $"用户 {user.Username} 使用一次性 MFA 恢复码登录",
                        default);
                }
            }

            if (!totpVerified && !recoveryCodeConsumed)
            {
                _logger.LogWarning("MFA 验证失败：用户 {Username} TOTP 验证码错误", user.Username);
                await _auditLogService.LogAsync(user.TenantId, "AuthMfaFailed", "User", user.Id.ToString(),
                    $"用户 {user.Username} MFA 验证码错误", default);
                throw new UnauthorizedAccessException("验证码错误，请重试");
            }

            // 在锁内提交恢复码消费，确保下一请求只能看到已删除当前摘要的最新值。
            user.TotpSecret = _totpSecretProtector.Protect(plainTotpSecret);
            await _dbContext.SaveChangesAsync();
        }
        else
        {
            // 历史明文密钥在第一次成功验证后自动升级为密文；新密钥也重新使用随机 nonce 保护。
            user.TotpSecret = _totpSecretProtector.Protect(plainTotpSecret);
            await _dbContext.SaveChangesAsync();
        }

        // MFA 验证通过：颁发令牌（与正常登录相同流程）
        var sessionId = Guid.NewGuid().ToString("N");
        var accessToken = _jwtTokenService.GenerateAccessToken(user, sessionId);
        var refreshToken = _jwtTokenService.GenerateRefreshToken();
        await using var refreshLock = await AcquireRefreshTokenMutationLockAsync(user.Id);
        await _redisService.SetRefreshTokenAsync(user.Id, sessionId, refreshToken, TimeSpan.FromDays(7));

        _logger.LogInformation("用户 {Username} MFA 验证通过，登录成功", user.Username);
        await _auditLogService.LogAsync(user.TenantId, "AuthMfaSuccess", "User", user.Id.ToString(),
            $"用户 {user.Username} MFA 验证通过，登录成功", default);

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresIn = _jwtTokenService.AccessTokenMinutes * 60,
            UserInfo = _mapper.Map<UserDto>(user)!,
        };
    }

    /// <summary>
    /// 使用首次登录注册令牌初始化强制 MFA 设置。
    /// 注册令牌本身只证明用户刚刚完成密码验证，不颁发任何业务访问权限。
    /// </summary>
    public async Task<MfaSetupResponse> SetupMfaEnrollmentAsync(string enrollmentToken)
    {
        var (_, user) = await GetMfaEnrollmentUserAsync(enrollmentToken);
        var secret = _totpService.GenerateSecret();

        await _redisService.SetStringAsync(
            $"{MfaEnrollmentSetupKeyPrefix}{enrollmentToken}",
            secret,
            TimeSpan.FromMinutes(MfaEnrollmentTokenMinutes));

        var account = user.Email ?? user.Username;
        return new MfaSetupResponse
        {
            Secret = secret,
            QrCodeUri = _totpService.BuildQrCodeUri(secret, account, "EquipSense"),
        };
    }

    /// <summary>
    /// 确认强制 MFA 设置并完成登录。
    /// 验证码错误时保留注册令牌，允许用户在短期窗口内重试；成功后同时删除注册令牌和临时密钥。
    /// </summary>
    public async Task<AuthResponse> ConfirmMfaEnrollmentAsync(string enrollmentToken, string totpCode)
    {
        var (enrollmentKey, user) = await GetMfaEnrollmentUserAsync(enrollmentToken);
        var setupKey = $"{MfaEnrollmentSetupKeyPrefix}{enrollmentToken}";
        var secret = await _redisService.GetStringAsync(setupKey);

        if (string.IsNullOrWhiteSpace(secret))
        {
            throw new UnauthorizedAccessException("MFA 注册已过期，请重新登录并初始化设置");
        }

        if (!_totpService.VerifyCode(secret, totpCode))
        {
            await _auditLogService.LogAsync(user.TenantId, "AuthMfaEnrollmentFailed", "User", user.Id.ToString(),
                $"用户 {user.Username} 确认 MFA 注册失败：验证码错误", default);
            throw new UnauthorizedAccessException("验证码错误，请检查 authenticator 应用中的时间是否准确");
        }

        user.TotpSecret = _totpSecretProtector.Protect(secret);
        user.MfaEnabled = true;
        var recoveryCodeSet = MfaRecoveryCodeService.Generate();
        user.MfaRecoveryCodes = recoveryCodeSet.SerializedHashes;
        await _dbContext.SaveChangesAsync();

        // 成功确认后令牌立即失效，防止同一注册凭据被重复使用。
        await _redisService.RemoveKeyAsync(enrollmentKey);
        await _redisService.RemoveKeyAsync(setupKey);

        var sessionId = Guid.NewGuid().ToString("N");
        var accessToken = _jwtTokenService.GenerateAccessToken(user, sessionId);
        var refreshToken = _jwtTokenService.GenerateRefreshToken();
        await using var refreshLock = await AcquireRefreshTokenMutationLockAsync(user.Id);
        await _redisService.SetRefreshTokenAsync(user.Id, sessionId, refreshToken, TimeSpan.FromDays(7));

        user.LastLoginAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        await _auditLogService.LogAsync(user.TenantId, "AuthMfaEnrollmentSuccess", "User", user.Id.ToString(),
            $"用户 {user.Username} 完成强制 MFA 注册并登录成功", default);

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresIn = _jwtTokenService.AccessTokenMinutes * 60,
            UserInfo = _mapper.Map<UserDto>(user)!,
            MfaRecoveryCodes = recoveryCodeSet.Codes.ToList(),
        };
    }

    /// <summary>
    /// 解析并校验强制 MFA 注册令牌。
    /// </summary>
    private async Task<(string EnrollmentKey, Core.Entities.User User)> GetMfaEnrollmentUserAsync(string enrollmentToken)
    {
        if (string.IsNullOrWhiteSpace(enrollmentToken))
        {
            throw new UnauthorizedAccessException("MFA 注册令牌不能为空");
        }

        var enrollmentKey = $"{MfaEnrollmentKeyPrefix}{enrollmentToken}";
        var userIdValue = await _redisService.GetStringAsync(enrollmentKey);
        if (userIdValue == null || !Guid.TryParse(userIdValue, out var userId))
        {
            throw new UnauthorizedAccessException("MFA 注册令牌无效或已过期，请重新登录");
        }

        var user = await _dbContext.UnfilteredSet<Core.Entities.User>()
            .FirstOrDefaultAsync(candidate => candidate.Id == userId && candidate.IsActive);

        if (user == null
            || !_mfaPolicy.IsRequiredFor(user.Role)
            || HasConfiguredMfa(user))
        {
            throw new UnauthorizedAccessException("用户状态不允许进行 MFA 注册，请重新登录");
        }

        return (enrollmentKey, user);
    }

    /// <summary>
    /// 初始化 MFA 设置：生成 TOTP 密钥和 QR 码 URI
    /// 临时密钥存 Redis（10 分钟有效），不写入数据库，需调用 ConfirmMfaSetupAsync 确认后才正式启用
    /// </summary>
    public async Task<MfaSetupResponse> SetupMfaAsync(Guid userId)
    {
        var user = await QueryTenantUser(userId)
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"用户 {userId} 不存在");

        var secret = _totpService.GenerateSecret();

        // 临时密钥存 Redis，10 分钟内未确认则自动失效
        await _redisService.SetStringAsync(
            $"{MfaSetupKeyPrefix}{userId}",
            secret,
            TimeSpan.FromMinutes(10));

        // 构建 QR 码 URI（优先使用邮箱，其次用户名，作为 authenticator 中的账户标识）
        var account = user.Email ?? user.Username;
        var qrCodeUri = _totpService.BuildQrCodeUri(secret, account, "EquipSense");

        _logger.LogInformation("用户 {Username} 初始化 MFA 设置", user.Username);

        return new MfaSetupResponse
        {
            Secret = secret,
            QrCodeUri = qrCodeUri,
        };
    }

    /// <summary>
    /// 确认 MFA 设置：用户扫码后输入验证码，验证成功后将临时密钥正式写入用户记录
    /// 若验证码错误，临时密钥保留（允许用户重试直到 10 分钟超时）
    /// </summary>
    public async Task<MfaRecoveryCodesResponse> ConfirmMfaSetupAsync(Guid userId, string totpCode)
    {
        if (string.IsNullOrWhiteSpace(totpCode))
        {
            throw new UnauthorizedAccessException("验证码不能为空");
        }

        // 先校验 JWT 身份，再访问按用户 ID 命名的 Redis 临时密钥，避免错误用户探测其他账户的 MFA 状态。
        EnsureCurrentUser(userId);

        var setupKey = $"{MfaSetupKeyPrefix}{userId}";
        var secret = await _redisService.GetStringAsync(setupKey);

        if (string.IsNullOrEmpty(secret))
        {
            throw new UnauthorizedAccessException("MFA 设置已过期，请重新初始化");
        }

        // 校验验证码（确认用户 authenticator 中的密钥与服务器生成的一致）
        if (!_totpService.VerifyCode(secret, totpCode))
        {
            _logger.LogWarning("MFA 设置确认失败：用户 {UserId} 验证码错误", userId);
            throw new UnauthorizedAccessException("验证码错误，请检查 authenticator 应用中的时间是否准确");
        }

        // 验证通过：将密钥正式写入用户记录并启用 MFA
        var user = await QueryTenantUser(userId)
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"用户 {userId} 不存在");

        user.TotpSecret = _totpSecretProtector.Protect(secret);
        user.MfaEnabled = true;
        var recoveryCodeSet = MfaRecoveryCodeService.Generate();
        user.MfaRecoveryCodes = recoveryCodeSet.SerializedHashes;
        await _dbContext.SaveChangesAsync();

        // 清理临时密钥
        await _redisService.RemoveKeyAsync(setupKey);

        _logger.LogInformation("用户 {Username} 已成功启用 MFA", user.Username);
        await _auditLogService.LogAsync(user.TenantId, "MfaEnabled", "User", user.Id.ToString(),
            $"用户 {user.Username} 启用多因素认证", default);

        return new MfaRecoveryCodesResponse
        {
            RecoveryCodes = recoveryCodeSet.Codes.ToList(),
        };
    }

    /// <summary>
    /// 使用当前 TOTP 验证码重新生成一次性 MFA 恢复码。
    /// 重新生成会立即使旧恢复码全部失效，避免旧备份继续拥有登录能力。
    /// </summary>
    public async Task<MfaRecoveryCodesResponse> RegenerateMfaRecoveryCodesAsync(Guid userId, string totpCode)
    {
        if (string.IsNullOrWhiteSpace(totpCode))
        {
            throw new UnauthorizedAccessException("验证码不能为空");
        }

        // 认证校验必须先于获取用户级锁，避免错误用户制造跨账户锁竞争。
        EnsureCurrentUser(userId);

        // 重新生成会使旧恢复码全部失效，必须和恢复码消费共用同一把用户级锁。
        await using var recoveryLock = await _distributedLockProvider.AcquireAsync(
            $"{MfaRecoveryLockPrefix}{userId}",
            MfaRecoveryLockExpiry,
            MfaRecoveryLockWaitTime);
        if (!recoveryLock.IsAcquired)
        {
            throw new UnauthorizedAccessException("MFA 请求正在处理中，请稍后重试");
        }

        var user = await QueryTenantUser(userId)
            .Where(u => u.IsActive)
            .FirstOrDefaultAsync()
            ?? throw new UnauthorizedAccessException("用户不存在或已停用");

        if (!HasConfiguredMfa(user) || string.IsNullOrWhiteSpace(user.TotpSecret))
        {
            throw new InvalidOperationException("请先启用 MFA，再生成恢复码");
        }

        string plainTotpSecret;
        try
        {
            plainTotpSecret = _totpSecretProtector.Unprotect(user.TotpSecret);
        }
        catch (CryptographicException ex)
        {
            _logger.LogError(ex, "用户 {UserId} 的 TOTP 密钥无法解密，拒绝重新生成恢复码", user.Id);
            throw new UnauthorizedAccessException("MFA 配置不可用，请联系系统管理员重置", ex);
        }

        if (!_totpService.VerifyCode(plainTotpSecret, totpCode))
        {
            await _auditLogService.LogAsync(user.TenantId, "MfaRecoveryCodesRegenerateFailed", "User",
                user.Id.ToString(), $"用户 {user.Username} 重新生成恢复码时验证码错误", default);
            throw new UnauthorizedAccessException("验证码错误，请重试");
        }

        var recoveryCodeSet = MfaRecoveryCodeService.Generate();
        user.MfaRecoveryCodes = recoveryCodeSet.SerializedHashes;
        await _dbContext.SaveChangesAsync();

        await _auditLogService.LogAsync(user.TenantId, "MfaRecoveryCodesRegenerated", "User",
            user.Id.ToString(), $"用户 {user.Username} 重新生成 MFA 恢复码，旧恢复码已全部失效", default);

        return new MfaRecoveryCodesResponse
        {
            RecoveryCodes = recoveryCodeSet.Codes.ToList(),
        };
    }

    /// <summary>
    /// 禁用 MFA：普通角色清除用户的 TOTP 密钥并标记 MfaEnabled=false；生产强制角色会被拒绝
    /// </summary>
    public async Task DisableMfaAsync(Guid userId)
    {
        // 认证校验必须先于获取用户级锁，避免错误用户制造跨账户锁竞争。
        EnsureCurrentUser(userId);

        // 禁用 MFA 会清除恢复码，和恢复码登录/重新生成必须串行，避免并发请求产生状态覆盖。
        await using var recoveryLock = await _distributedLockProvider.AcquireAsync(
            $"{MfaRecoveryLockPrefix}{userId}",
            MfaRecoveryLockExpiry,
            MfaRecoveryLockWaitTime);
        if (!recoveryLock.IsAcquired)
        {
            throw new InvalidOperationException("MFA 请求正在处理中，请稍后重试");
        }

        var user = await QueryTenantUser(userId)
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"用户 {userId} 不存在");

        if (_mfaPolicy.IsRequiredFor(user.Role))
        {
            await _auditLogService.LogAsync(user.TenantId, "MfaDisableBlocked", "User", user.Id.ToString(),
                $"用户 {user.Username} 所属角色必须启用 MFA，拒绝禁用操作", default);
            throw new InvalidOperationException("该角色在生产环境必须启用 MFA，不能禁用");
        }

        user.TotpSecret = null;
        user.MfaRecoveryCodes = null;
        user.MfaEnabled = false;
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("用户 {Username} 已禁用 MFA", user.Username);
        await _auditLogService.LogAsync(user.TenantId, "MfaDisabled", "User", user.Id.ToString(),
            $"用户 {user.Username} 禁用多因素认证", default);
    }

    /// <summary>
    /// 用户登出，从 Redis 中移除刷新令牌以使其失效
    /// </summary>
    /// <param name="userId">用户 ID</param>
    public async Task LogoutAsync(Guid userId, string? sessionId = null)
    {
        EnsureCurrentUser(userId);

        if (string.IsNullOrWhiteSpace(sessionId))
        {
            await _redisService.RemoveRefreshTokenAsync(userId);
            _logger.LogInformation("用户 {UserId} 已全局登出", userId);
            return;
        }

        await _redisService.RemoveRefreshTokenSessionAsync(userId, sessionId);
        _logger.LogInformation("用户 {UserId} 会话 {SessionId} 已登出", userId, sessionId);
    }

    /// <summary>
    /// 修改密码并刷新当前会话
    /// 验证当前密码正确后，哈希新密码、吊销旧刷新令牌并签发不带强制改密声明的新令牌对。
    /// </summary>
    /// <param name="userId">用户 ID</param>
    /// <param name="request">修改密码请求（当前密码 + 新密码）</param>
    /// <exception cref="KeyNotFoundException">用户不存在</exception>
    /// <exception cref="UnauthorizedAccessException">当前密码错误</exception>
    public async Task<AuthResponse> ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        // 认证校验必须先于获取用户级锁，避免错误用户制造跨账户锁竞争。
        EnsureCurrentUser(userId);

        // 改密会同时清理和重建刷新令牌索引，必须与登录/刷新共用用户级锁，
        // 否则并发刷新可能在旧会话清理后又把已吊销令牌写回 Redis。
        await using var refreshLock = await AcquireRefreshTokenMutationLockAsync(userId);

        var user = await QueryTenantUser(userId)
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"用户 {userId} 不存在");

        if (!PasswordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("当前密码错误");
        }

        // 更新密码哈希
        user.PasswordHash = PasswordHasher.HashPassword(request.NewPassword);

        // 递增 TokenVersion：保留作为令牌版本号，供后续按请求校验实现即时吊销。
        // 旧 access token 仍会在短有效期内自然过期；当前浏览器会在下方获得新的令牌对。
        user.TokenVersion++;

        // 密码修改成功后清除强制改密标记
        user.MustChangePassword = false;

        // 先吊销所有旧刷新令牌，再为刚完成改密的当前会话创建全新令牌对。
        await _redisService.RemoveRefreshTokenAsync(userId);

        await _dbContext.SaveChangesAsync();

        var sessionId = Guid.NewGuid().ToString("N");
        var accessToken = _jwtTokenService.GenerateAccessToken(user, sessionId);
        var refreshToken = _jwtTokenService.GenerateRefreshToken();
        await _redisService.SetRefreshTokenAsync(userId, sessionId, refreshToken, TimeSpan.FromDays(7));

        // 改密码是认证系统最高敏感操作之一（修改哈希 + 吊销全部会话 + TokenVersion++），必须留痕审计：
        // 追溯"谁在何时改了密码"。同 AuthService 内密码重置（ResetPasswordAsync）已记 PasswordReset，
        // 改密码（ChangePasswordAsync）同为密码变更却历史缺审计 → 不可追溯（ISO 27001 / IEC 62443 可审计性）。
        await _auditLogService.LogAsync(user.TenantId, "ChangePassword", "User",
            user.Id.ToString(), $"用户 {user.Username} 修改密码", default);

        _logger.LogInformation("用户 {UserId} 密码修改成功", userId);

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresIn = _jwtTokenService.AccessTokenMinutes * 60,
            UserInfo = _mapper.Map<UserDto>(user)!,
        };
    }

    /// <summary>
    /// 申请密码重置：按邮箱查找唯一的启用用户，生成一次性重置 token 存入 Redis（30 分钟过期），
    /// 并发送含重置链接的邮件。邮箱对应多个启用用户时拒绝发放令牌，避免重置错号；
    /// 即使用户不存在也返回成功（防止邮箱枚举攻击）。
    /// </summary>
    /// <param name="email">用户邮箱</param>
    /// <param name="resetUrlTemplate">重置链接模板，{token} 占位符会被替换为实际 token</param>
    /// <param name="ct">取消令牌</param>
    public async Task RequestPasswordResetAsync(string email, string resetUrlTemplate, CancellationToken ct = default)
    {
        // 数据库只保存联系方式密文，认证查找必须使用盲索引；否则随机 nonce 密文无法等值匹配。
        var emailLookupHash = _piiProtector.CreateLookupHash("email", email);
        var normalizedEmail = _piiProtector.Normalize("email", email);
        var candidateUsers = emailLookupHash is null
            ? []
            : await _dbContext.UnfilteredSet<Core.Entities.User>()
                .Where(u => u.EmailLookupHash == emailLookupHash && u.IsActive)
                .ToListAsync(ct);

        // 盲索引碰撞概率极低，但仍用解密后的值做二次核验，避免错误命中。
        // 邮箱允许跨租户重复；多个启用账户共享邮箱时无法安全判断目标，只能拒绝发放令牌，防止重置错号。
        var matchedUsers = candidateUsers
            .Where(u => !string.IsNullOrEmpty(u.Email)
                && string.Equals(
                    _piiProtector.Normalize("email", u.Email),
                    normalizedEmail,
                    StringComparison.Ordinal))
            .Take(2)
            .ToArray();

        if (matchedUsers.Length != 1)
        {
            _logger.LogWarning(
                "密码重置请求未能唯一匹配启用账户，候选数量 {CandidateCount}",
                matchedUsers.Length);
            return; // 静默返回，不暴露用户是否存在
        }

        var user = matchedUsers[0];
        // matchedUsers 已经过非空邮箱过滤，此处保留非空值供邮件服务发送。
        var recipientEmail = user.Email!;

        // 生成密码重置 token（URL 安全的随机字符串）
        var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray())
            .Replace('+', '-').Replace('/', '_').TrimEnd('=');

        // 存入 Redis，键含用户 ID，30 分钟过期
        var key = $"{PasswordResetKeyPrefix}{token}";
        await _redisService.SetStringAsync(key, user.Id.ToString(), TimeSpan.FromMinutes(PasswordResetTokenMinutes));

        // 发送重置邮件（失败仅记录日志，不中断流程）
        var resetLink = resetUrlTemplate.Replace("{token}", token);
        var subject = "【EquipSense】密码重置";
        var htmlBody = $@"
<div style='font-family:sans-serif;max-width:480px;margin:0 auto'>
  <h2 style='color:#1e40af'>密码重置</h2>
  <p>您好 {user.DisplayName ?? user.Username}，</p>
  <p>我们收到了您的密码重置请求。请点击下方按钮重置密码：</p>
  <p style='margin:24px 0'>
    <a href='{resetLink}' style='display:inline-block;padding:10px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px'>重置密码</a>
  </p>
  <p style='color:#6b7280;font-size:13px'>
    该链接 {PasswordResetTokenMinutes} 分钟后失效。如果这不是您本人的操作，请忽略此邮件。
  </p>
  <hr style='border:none;border-top:1px solid #e5e7eb;margin:24px 0'>
  <p style='color:#9ca3af;font-size:12px'>此邮件由系统自动发送，请勿回复。</p>
</div>";

        try
        {
            await _emailService.SendAsync(recipientEmail, subject, htmlBody);
            _logger.LogInformation("密码重置邮件已发送: UserId={UserId}", user.Id);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "密码重置邮件发送失败: UserId={UserId}", user.Id);
            // 不抛异常，避免暴露 SMTP 配置状态
        }

        await _auditLogService.LogFromContextAsync(
            action: "PasswordResetRequested",
            resourceType: "User",
            resourceId: user.Id.ToString(),
            description: $"用户 {user.Username} 请求密码重置",
            ct: ct);
    }

    /// <summary>
    /// 重置密码：验证 token，设置新密码，使旧 JWT 失效，删除重置 token（一次性）
    /// </summary>
    /// <param name="token">重置 token</param>
    /// <param name="newPassword">新密码</param>
    /// <param name="ct">取消令牌</param>
    /// <exception cref="UnauthorizedAccessException">token 无效或已过期</exception>
    public async Task ResetPasswordAsync(string token, string newPassword, CancellationToken ct = default)
    {
        var key = $"{PasswordResetKeyPrefix}{token}";
        // 密码重置令牌也是一次性凭据，使用 Redis GETDEL 避免并发请求重复使用同一链接。
        var userIdStr = await _redisService.GetAndDeleteStringAsync(key);

        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            throw new UnauthorizedAccessException("重置链接无效或已过期，请重新申请");

        var user = await _dbContext.UnfilteredSet<Core.Entities.User>()
            .FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new UnauthorizedAccessException("用户不存在");

        // 更新密码
        user.PasswordHash = PasswordHasher.HashPassword(newPassword);
        user.TokenVersion++;          // 令牌版本号（即时吊销见 refresh 移除 + 短有效期，见 ChangePasswordAsync 注释）
        user.MustChangePassword = false;
        user.AccessFailedCount = 0;   // 清除登录失败计数
        user.LockoutEnd = null;       // 解除锁定

        // 移除刷新令牌，强制重新登录
        await _redisService.RemoveRefreshTokenAsync(userId);

        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("用户 {UserId} 通过重置 token 修改密码成功", userId);

        await _auditLogService.LogFromContextAsync(
            action: "PasswordReset",
            resourceType: "User",
            resourceId: userId.ToString(),
            description: $"用户 {user.Username} 通过重置链接修改密码",
            ct: ct);
    }

    /// <summary>
    /// 公开注册，创建租户和管理员账户并自动登录
    /// 使用 UnfilteredSet 跨租户查询 Slug 和用户名的唯一性
    /// </summary>
    /// <param name="request">注册请求（含企业信息和管理员信息）</param>
    /// <returns>认证响应（含 Access Token、Refresh Token 和用户信息）</returns>
    /// <exception cref="InvalidOperationException">企业标识或用户名已被占用</exception>
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        // 1. 检查企业标识（Slug）唯一性
        var slugExists = await _dbContext.UnfilteredSet<Tenant>()
            .AnyAsync(t => t.Slug == request.Slug);
        if (slugExists)
        {
            _logger.LogWarning("注册失败：企业标识 {Slug} 已被占用", request.Slug);
            throw new InvalidOperationException($"企业标识 '{request.Slug}' 已被占用");
        }

        // 2. 检查用户名全局唯一性（用户名跨租户唯一，避免混淆）
        var usernameExists = await _dbContext.UnfilteredSet<User>()
            .AnyAsync(u => u.Username == request.Username);
        if (usernameExists)
        {
            _logger.LogWarning("注册失败：用户名 {Username} 已被占用", request.Username);
            throw new InvalidOperationException($"用户名 '{request.Username}' 已被占用");
        }

        // 3. 解析套餐并获取配额
        if (!Enum.TryParse<TenantPlan>(request.Plan, ignoreCase: true, out var plan))
        {
            plan = TenantPlan.Trial;
        }
        // Basic 套餐不允许公开注册，降级为 Trial
        if (plan == TenantPlan.Basic)
        {
            plan = TenantPlan.Trial;
        }

        var (maxDevices, maxUsers, retentionDays) = PlanLimits.GetValueOrDefault(plan, (5, 3, 7));

        // 4. 创建租户
        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = request.TenantName,
            Slug = request.Slug,
            Plan = plan,
            Status = TenantStatus.Trial,
            IsolationMode = TenantIsolationMode.Shared,
            MaxDevices = maxDevices,
            MaxUsers = maxUsers,
            DataRetentionDays = retentionDays,
            WorkOrderMode = WorkOrderMode.Independent,
            CurrentDeviceCount = 0,
            CurrentUserCount = 1,
            TrialEndsAt = DateTime.UtcNow.AddDays(14),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };

        _dbContext.Add(tenant);

        // 5. 创建管理员用户
        var adminUser = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Username = request.Username,
            PasswordHash = PasswordHasher.HashPassword(request.Password),
            DisplayName = request.DisplayName ?? request.Username,
            Email = request.Email,
            Role = UserRole.SystemAdmin,
            IsActive = true,
            MustChangePassword = false,
            TokenVersion = 0,
            CreatedAt = DateTime.UtcNow,
        };

        _dbContext.Add(adminUser);

        // 6. 保存到数据库
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation(
            "新租户注册成功：{TenantName}（Slug={Slug}, Plan={Plan}），管理员：{Username}",
            request.TenantName, request.Slug, plan, request.Username);

        // 公开注册直接创建 SystemAdmin，生产环境同样必须先完成 MFA enrollment，
        // 不能因为这是注册接口就绕过登录阶段的高权限安全策略。
        if (_mfaPolicy.IsRequiredFor(adminUser.Role))
        {
            var enrollmentToken = Guid.NewGuid().ToString("N");
            await _redisService.SetStringAsync(
                $"{MfaEnrollmentKeyPrefix}{enrollmentToken}",
                adminUser.Id.ToString(),
                TimeSpan.FromMinutes(MfaEnrollmentTokenMinutes));
            await _auditLogService.LogAsync(adminUser.TenantId, "AuthMfaEnrollmentRequired", "User",
                adminUser.Id.ToString(), "新注册的系统管理员必须先完成 MFA 注册", default);

            return new AuthResponse
            {
                MfaEnrollmentRequired = true,
                MfaEnrollmentToken = enrollmentToken,
                UserInfo = _mapper.Map<UserDto>(adminUser)!,
            };
        }

        // 7. 自动登录，生成 JWT
        var sessionId = Guid.NewGuid().ToString("N");
        var accessToken = _jwtTokenService.GenerateAccessToken(adminUser, sessionId);
        var refreshToken = _jwtTokenService.GenerateRefreshToken();

        await using var refreshLock = await AcquireRefreshTokenMutationLockAsync(adminUser.Id);

        // 刷新令牌存入 Redis，有效期 7 天
        await _redisService.SetRefreshTokenAsync(adminUser.Id, sessionId, refreshToken, TimeSpan.FromDays(7));

        // 更新最后登录时间
        adminUser.LastLoginAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresIn = _jwtTokenService.AccessTokenMinutes * 60,
            UserInfo = _mapper.Map<UserDto>(adminUser)!
        };
    }

    /// <summary>
    /// 获取所有可用套餐列表，用于注册页面展示
    /// </summary>
    /// <returns>套餐信息列表</returns>
    public Task<List<PlanDto>> GetPlansAsync()
    {
        var plans = PlanDisplayInfo.Select(info =>
        {
            var (maxDevices, maxUsers, retentionDays) = PlanLimits.GetValueOrDefault(info.Plan, (0, 0, 0));
            return new PlanDto
            {
                PlanId = info.Plan.ToString(),
                DisplayName = info.DisplayName,
                Description = info.Description,
                MaxDevices = maxDevices,
                MaxUsers = maxUsers,
                DataRetentionDays = retentionDays,
                MonthlyPrice = info.Price,
                IsFree = info.Price == 0m,
            };
        }).ToList();

        return Task.FromResult(plans);
    }
}
