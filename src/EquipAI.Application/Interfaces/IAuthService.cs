using EquipAI.Application.DTOs.Auth;
using EquipAI.Application.DTOs.Users;

namespace EquipAI.Application.Interfaces;

/// <summary>
/// 认证服务接口，提供登录、令牌刷新、登出和修改密码等能力
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// 用户登录，验证凭据并返回 JWT 令牌
    /// </summary>
    /// <param name="request">登录请求（用户名 + 密码）</param>
    /// <returns>认证响应（含 Access Token、Refresh Token 和用户信息）</returns>
    Task<AuthResponse> LoginAsync(LoginRequest request);

    /// <summary>
    /// 使用 Refresh Token 刷新 Access Token
    /// </summary>
    /// <param name="refreshToken">刷新令牌</param>
    /// <returns>新的认证响应</returns>
    Task<AuthResponse> RefreshTokenAsync(string refreshToken);

    /// <summary>
    /// 用户登出，使当前 Token 失效
    /// </summary>
    /// <param name="userId">用户 ID</param>
    Task LogoutAsync(Guid userId);

    /// <summary>
    /// 修改密码
    /// </summary>
    /// <param name="userId">用户 ID</param>
    /// <param name="request">修改密码请求（当前密码 + 新密码）</param>
    Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request);

    /// <summary>
    /// 公开注册，创建租户和管理员账户并自动登录
    /// </summary>
    /// <param name="request">注册请求（含企业信息和管理员信息）</param>
    /// <returns>认证响应（含 Access Token、Refresh Token 和用户信息）</returns>
    /// <exception cref="InvalidOperationException">企业标识或用户名已被占用</exception>
    Task<AuthResponse> RegisterAsync(RegisterRequest request);

    /// <summary>
    /// 获取所有可用套餐列表
    /// </summary>
    /// <returns>套餐信息列表</returns>
    Task<List<PlanDto>> GetPlansAsync();
}
