using AutoMapper;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Application.DTOs.Users;
using EquipAI.Application.Interfaces;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Cache;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
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

    /// <summary>
    /// 连续登录失败达到此数值时自动锁定账户
    /// </summary>
    private const int MaxAccessAttempts = 5;

    /// <summary>
    /// 账户锁定时长（分钟）
    /// </summary>
    private const int LockoutDurationMinutes = 15;

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
        IAuditLogService auditLogService)
    {
        _dbContext = dbContext;
        _jwtTokenService = jwtTokenService;
        _redisService = redisService;
        _mapper = mapper;
        _logger = logger;
        _auditLogService = auditLogService;
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
            UserInfo = _mapper.Map<UserDto>(user)!
        };
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

        // 从旧 Access Token 中解析用户 ID（客户端需在请求体中附带过期 Access Token）
        // 此处简化：遍历 Redis 查找匹配的刷新令牌（单用户场景高效）
        // 改进方案：后续可在请求中携带 userId 或使用 refreshToken 查找索引

        // 查找所有用户的刷新令牌并比对——仅适用于小规模场景
        // 生产优化：使用 Redis 反向索引 refreshToken → userId
        var allUsers = await _dbContext.UnfilteredSet<Core.Entities.User>()
            .Where(u => u.IsActive)
            .ToListAsync();

        Core.Entities.User? matchedUser = null;
        foreach (var u in allUsers)
        {
            var storedToken = await _redisService.GetRefreshTokenAsync(u.Id);
            if (storedToken == refreshToken)
            {
                matchedUser = u;
                break;
            }
        }

        if (matchedUser == null)
        {
            _logger.LogWarning("刷新令牌无效或已过期");
            throw new UnauthorizedAccessException("刷新令牌无效或已过期");
        }

        // 生成新的令牌对
        var newAccessToken = _jwtTokenService.GenerateAccessToken(matchedUser);
        var newRefreshToken = _jwtTokenService.GenerateRefreshToken();

        // 更新 Redis 中的刷新令牌（旋转令牌，旧令牌失效）
        await _redisService.SetRefreshTokenAsync(matchedUser.Id, newRefreshToken, TimeSpan.FromDays(7));

        _logger.LogInformation("用户 {Username} 刷新令牌成功", matchedUser.Username);

        return new AuthResponse
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            UserInfo = _mapper.Map<UserDto>(matchedUser)!
        };
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

        // 递增 TokenVersion，使已颁发的 JWT 在下次验证时因版本不匹配而失效
        user.TokenVersion++;

        // 密码修改成功后清除强制改密标记
        user.MustChangePassword = false;

        // 移除刷新令牌，强制重新登录
        await _redisService.RemoveRefreshTokenAsync(userId);

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("用户 {UserId} 密码修改成功", userId);
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
