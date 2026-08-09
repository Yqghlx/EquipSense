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
    private readonly MfaPolicyOptions _mfaPolicy;

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
        ITotpSecretProtector totpSecretProtector)
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

        // 生成访问令牌和刷新令牌
        var accessToken = _jwtTokenService.GenerateAccessToken(user);
        var refreshToken = _jwtTokenService.GenerateRefreshToken();

        // 刷新令牌存入 Redis，有效期 7 天
        await _redisService.SetRefreshTokenAsync(user.Id, refreshToken, TimeSpan.FromDays(7));

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

        // 三态查询：Valid（当前令牌）/ Reused（已轮换墓碑——重放）/ Unknown（不存在）
        var state = await _redisService.GetRefreshTokenStateAsync(refreshToken);

        // 重放检测（OAuth 2.0 BCP）：该 token 曾有效但已被轮换——说明同一 token 被两方持有（典型失窃场景）。
        // 立即吊销整个会话（攻击者持有的当前 token 一并失效），强制重新登录，并记审计告警。
        if (state.Status == RefreshTokenStatus.Reused && state.UserId.HasValue)
        {
            var reusedUserId = state.UserId.Value;
            _logger.LogWarning(
                "检测到刷新令牌重用（用户 {UserId}）：曾有效的令牌被再次提交，可能已泄露，已吊销该用户全部刷新令牌",
                reusedUserId);
            await _auditLogService.LogAsync(reusedUserId, "AuthRefreshTokenReused", "User", reusedUserId.ToString(),
                "刷新令牌重用检测命中：曾有效的令牌被再次提交，已吊销会话以防令牌失窃", default);
            await _redisService.RemoveRefreshTokenAsync(reusedUserId);
            throw new UnauthorizedAccessException("刷新令牌无效或已过期");
        }

        if (state.Status != RefreshTokenStatus.Valid || !state.UserId.HasValue)
        {
            _logger.LogWarning("刷新令牌无效或已过期");
            throw new UnauthorizedAccessException("刷新令牌无效或已过期");
        }

        var userId = state.UserId.Value;

        var matchedUser = await _dbContext.UnfilteredSet<Core.Entities.User>()
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);

        if (matchedUser == null)
        {
            // 反向索引存在但用户不存在或已禁用（账号删除/禁用后残留索引）
            _logger.LogWarning("刷新令牌对应用户 {UserId} 不存在或已禁用，清理残留索引", userId);
            await _redisService.RemoveRefreshTokenAsync(userId);
            throw new UnauthorizedAccessException("刷新令牌无效或已过期");
        }

        // 角色策略可能在用户已有会话期间被启用；刷新时再次检查，避免旧 Refresh Token 绕过 MFA 门禁。
        if (_mfaPolicy.IsRequiredFor(matchedUser.Role) && !HasConfiguredMfa(matchedUser))
        {
            await _redisService.RemoveRefreshTokenAsync(matchedUser.Id);
            await _auditLogService.LogAsync(matchedUser.TenantId, "AuthMfaPolicyBlocked", "User",
                matchedUser.Id.ToString(), "高权限账户未完成 MFA 注册，刷新令牌已吊销", default);
            throw new UnauthorizedAccessException("该高权限账户必须先完成 MFA 注册");
        }

        // 验证正向索引与反向索引一致性（防止 Redis 数据不一致）
        var forwardKey = $"refresh:{matchedUser.Id}";
        var storedToken = await _redisService.GetStringAsync(forwardKey);
        if (storedToken != refreshToken)
        {
            _logger.LogWarning("刷新令牌正反向索引不一致（用户：{UserId}），可能已轮换", matchedUser.Id);
            throw new UnauthorizedAccessException("刷新令牌无效或已过期");
        }

        // 生成新的令牌对
        var newAccessToken = _jwtTokenService.GenerateAccessToken(matchedUser);
        var newRefreshToken = _jwtTokenService.GenerateRefreshToken();

        // 更新 Redis 中的刷新令牌（SetRefreshTokenAsync 内部自动清理旧反向索引 + 写入新正反向索引）
        await _redisService.SetRefreshTokenAsync(matchedUser.Id, newRefreshToken, TimeSpan.FromDays(7));

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
        var userIdStr = await _redisService.GetStringAsync(challengeKey);
        await _redisService.RemoveKeyAsync(challengeKey); // 无论成败均删除，防重放

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

        if (!_totpService.VerifyCode(plainTotpSecret, totpCode))
        {
            _logger.LogWarning("MFA 验证失败：用户 {Username} TOTP 验证码错误", user.Username);
            await _auditLogService.LogAsync(user.TenantId, "AuthMfaFailed", "User", user.Id.ToString(),
                $"用户 {user.Username} MFA 验证码错误", default);
            throw new UnauthorizedAccessException("验证码错误，请重试");
        }

        // 历史明文密钥在第一次成功验证后自动升级为密文；新密钥也重新使用随机 nonce 保护。
        user.TotpSecret = _totpSecretProtector.Protect(plainTotpSecret);
        await _dbContext.SaveChangesAsync();

        // MFA 验证通过：颁发令牌（与正常登录相同流程）
        var accessToken = _jwtTokenService.GenerateAccessToken(user);
        var refreshToken = _jwtTokenService.GenerateRefreshToken();
        await _redisService.SetRefreshTokenAsync(user.Id, refreshToken, TimeSpan.FromDays(7));

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
        await _dbContext.SaveChangesAsync();

        // 成功确认后令牌立即失效，防止同一注册凭据被重复使用。
        await _redisService.RemoveKeyAsync(enrollmentKey);
        await _redisService.RemoveKeyAsync(setupKey);

        var accessToken = _jwtTokenService.GenerateAccessToken(user);
        var refreshToken = _jwtTokenService.GenerateRefreshToken();
        await _redisService.SetRefreshTokenAsync(user.Id, refreshToken, TimeSpan.FromDays(7));

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
        var user = await _dbContext.UnfilteredSet<Core.Entities.User>()
            .FirstOrDefaultAsync(u => u.Id == userId)
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
    public async Task ConfirmMfaSetupAsync(Guid userId, string totpCode)
    {
        if (string.IsNullOrWhiteSpace(totpCode))
        {
            throw new UnauthorizedAccessException("验证码不能为空");
        }

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
        var user = await _dbContext.UnfilteredSet<Core.Entities.User>()
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException($"用户 {userId} 不存在");

        user.TotpSecret = _totpSecretProtector.Protect(secret);
        user.MfaEnabled = true;
        await _dbContext.SaveChangesAsync();

        // 清理临时密钥
        await _redisService.RemoveKeyAsync(setupKey);

        _logger.LogInformation("用户 {Username} 已成功启用 MFA", user.Username);
        await _auditLogService.LogAsync(user.TenantId, "MfaEnabled", "User", user.Id.ToString(),
            $"用户 {user.Username} 启用多因素认证", default);
    }

    /// <summary>
    /// 禁用 MFA：清除用户的 TOTP 密钥并标记 MfaEnabled=false
    /// </summary>
    public async Task DisableMfaAsync(Guid userId)
    {
        var user = await _dbContext.UnfilteredSet<Core.Entities.User>()
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException($"用户 {userId} 不存在");

        if (_mfaPolicy.IsRequiredFor(user.Role))
        {
            await _auditLogService.LogAsync(user.TenantId, "MfaDisableBlocked", "User", user.Id.ToString(),
                $"用户 {user.Username} 所属角色必须启用 MFA，拒绝禁用操作", default);
            throw new InvalidOperationException("该角色在生产环境必须启用 MFA，不能禁用");
        }

        user.TotpSecret = null;
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
    public async Task LogoutAsync(Guid userId)
    {
        await _redisService.RemoveRefreshTokenAsync(userId);
        _logger.LogInformation("用户 {UserId} 已登出", userId);
    }

    /// <summary>
    /// 修改密码
    /// 验证当前密码正确后，哈希新密码并递增 TokenVersion 使已颁发的令牌失效
    /// </summary>
    /// <param name="userId">用户 ID</param>
    /// <param name="request">修改密码请求（当前密码 + 新密码）</param>
    /// <exception cref="KeyNotFoundException">用户不存在</exception>
    /// <exception cref="UnauthorizedAccessException">当前密码错误</exception>
    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        var user = await _dbContext.UnfilteredSet<Core.Entities.User>()
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException($"用户 {userId} 不存在");

        if (!PasswordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("当前密码错误");
        }

        // 更新密码哈希
        user.PasswordHash = PasswordHasher.HashPassword(request.NewPassword);

        // 递增 TokenVersion：保留作为令牌版本号（未来可在请求管线做 per-request 校验实现即时吊销）。
        // 即时吊销当前由两道防线达成：（1）下方移除 refresh token 使旧会话无法续期；
        // （2）access token 短有效期（默认 15min）——旧 access token 最迟 15 分钟后自然失效。
        user.TokenVersion++;

        // 密码修改成功后清除强制改密标记
        user.MustChangePassword = false;

        // 移除刷新令牌，强制重新登录
        await _redisService.RemoveRefreshTokenAsync(userId);

        await _dbContext.SaveChangesAsync();

        // 改密码是认证系统最高敏感操作之一（修改哈希 + 吊销全部会话 + TokenVersion++），必须留痕审计：
        // 追溯"谁在何时改了密码"。同 AuthService 内密码重置（ResetPasswordAsync）已记 PasswordReset，
        // 改密码（ChangePasswordAsync）同为密码变更却历史缺审计 → 不可追溯（ISO 27001 / IEC 62443 可审计性）。
        await _auditLogService.LogAsync(user.TenantId, "ChangePassword", "User",
            user.Id.ToString(), $"用户 {user.Username} 修改密码", default);

        _logger.LogInformation("用户 {UserId} 密码修改成功", userId);
    }

    /// <summary>
    /// 申请密码重置：按邮箱查找用户，生成一次性重置 token 存入 Redis（30 分钟过期），
    /// 并发送含重置链接的邮件。即使用户不存在也返回成功（防止邮箱枚举攻击）。
    /// </summary>
    /// <param name="email">用户邮箱</param>
    /// <param name="resetUrlTemplate">重置链接模板，{token} 占位符会被替换为实际 token</param>
    /// <param name="ct">取消令牌</param>
    public async Task RequestPasswordResetAsync(string email, string resetUrlTemplate, CancellationToken ct = default)
    {
        // 无论用户是否存在都走完流程，最后才决定是否发邮件，防止邮箱枚举
        var user = await _dbContext.UnfilteredSet<Core.Entities.User>()
            .FirstOrDefaultAsync(u => u.Email == email, ct);

        if (user is null || string.IsNullOrEmpty(user.Email) || !user.IsActive)
        {
            _logger.LogWarning("密码重置请求：邮箱 {Email} 未找到或账户已停用", email);
            return; // 静默返回，不暴露用户是否存在
        }

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
            await _emailService.SendAsync(user.Email, subject, htmlBody);
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
        var userIdStr = await _redisService.GetStringAsync(key);

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

        // 删除重置 token（一次性使用）
        await _redisService.RemoveKeyAsync(key);
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
        var accessToken = _jwtTokenService.GenerateAccessToken(adminUser);
        var refreshToken = _jwtTokenService.GenerateRefreshToken();

        // 刷新令牌存入 Redis，有效期 7 天
        await _redisService.SetRefreshTokenAsync(adminUser.Id, refreshToken, TimeSpan.FromDays(7));

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
