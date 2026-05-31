using AutoMapper;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Application.DTOs.Users;
using EquipAI.Application.Interfaces;
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

    /// <summary>
    /// 初始化认证服务
    /// </summary>
    public AuthService(
        AppDbContext dbContext,
        JwtTokenService jwtTokenService,
        RedisService redisService,
        IMapper mapper,
        ILogger<AuthService> logger)
    {
        _dbContext = dbContext;
        _jwtTokenService = jwtTokenService;
        _redisService = redisService;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// 用户登录，验证凭据并返回 JWT 令牌
    /// 使用 IgnoreQueryFilters 跨租户查找用户，因为登录时尚未建立租户上下文
    /// </summary>
    /// <param name="request">登录请求（用户名 + 密码）</param>
    /// <returns>认证响应（含 Access Token、Refresh Token 和用户信息）</returns>
    /// <exception cref="UnauthorizedAccessException">用户名或密码错误</exception>
    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        // 跨租户查找用户：登录请求没有租户上下文，需要忽略全局租户过滤器
        var user = await _dbContext.UnfilteredSet<Core.Entities.User>()
            .FirstOrDefaultAsync(u => u.Username == request.Username);

        if (user == null || !PasswordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            _logger.LogWarning("登录失败：用户名 {Username} 凭据无效", request.Username);
            throw new UnauthorizedAccessException("用户名或密码错误");
        }

        if (!user.IsActive)
        {
            _logger.LogWarning("登录失败：用户 {Username} 已被停用", request.Username);
            throw new UnauthorizedAccessException("该账户已被停用");
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

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            UserInfo = _mapper.Map<UserDto>(user)!
        };
    }

    /// <summary>
    /// 使用 Refresh Token 刷新 Access Token
    /// Phase 1 简化实现，暂不启用刷新令牌机制
    /// </summary>
    /// <param name="refreshToken">刷新令牌</param>
    /// <returns>新的认证响应</returns>
    /// <exception cref="NotImplementedException">Phase 1 暂不实现</exception>
    public Task<AuthResponse> RefreshTokenAsync(string refreshToken)
    {
        // Phase 1 简化：刷新令牌机制将在后续阶段实现
        throw new NotImplementedException("刷新令牌功能将在后续阶段实现");
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
}
