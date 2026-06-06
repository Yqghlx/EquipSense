using System.Security.Claims;
using EquipAI.Application.DTOs.Auth;
using EquipAI.Application.DTOs.Users;
using EquipAI.Application.Interfaces;
using EquipAI.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 认证控制器，提供登录、令牌刷新、登出和修改密码等接口
/// 登录和刷新接口无需认证，登出和修改密码需要 Bearer Token
/// </summary>
[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IRepository<EquipAI.Core.Entities.User> _userRepo;

    /// <summary>
    /// 初始化认证控制器
    /// </summary>
    /// <param name="authService">认证服务</param>
    /// <param name="userRepo">用户仓储</param>
    public AuthController(IAuthService authService, IRepository<EquipAI.Core.Entities.User> userRepo)
    {
        _authService = authService;
        _userRepo = userRepo;
    }

    /// <summary>
    /// 用户登录，验证凭据并返回 JWT 令牌
    /// </summary>
    /// <param name="request">登录请求（用户名 + 密码）</param>
    /// <returns>认证响应（含 Access Token、Refresh Token 和用户信息）</returns>
    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var response = await _authService.LoginAsync(request);
        return Ok(response);
    }

    /// <summary>
    /// 公开注册，创建租户和管理员账户并自动登录
    /// </summary>
    /// <param name="request">注册请求（含企业信息和管理员信息）</param>
    /// <returns>认证响应（含 Access Token、Refresh Token 和用户信息）</returns>
    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var response = await _authService.RegisterAsync(request);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { code = 400, message = ex.Message });
        }
    }

    /// <summary>
    /// 获取所有可用套餐列表，用于注册页面展示
    /// </summary>
    /// <returns>套餐信息列表</returns>
    [HttpGet("plans")]
    [ProducesResponseType(typeof(List<PlanDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<PlanDto>>> GetPlans()
    {
        var plans = await _authService.GetPlansAsync();
        return Ok(plans);
    }

    /// <summary>
    /// 使用 Refresh Token 刷新 Access Token
    /// </summary>
    /// <param name="request">刷新令牌请求</param>
    /// <returns>新的认证响应</returns>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> Refresh([FromBody] RefreshTokenRequest request)
    {
        var response = await _authService.RefreshTokenAsync(request.RefreshToken);
        return Ok(response);
    }

    /// <summary>
    /// 用户登出，使当前 Token 失效
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Logout()
    {
        // 从 JWT Claims 中提取用户 ID
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
            ?? User.FindFirst("sub");

        if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
        {
            await _authService.LogoutAsync(userId);
        }

        return Ok(new { message = "登出成功" });
    }

    /// <summary>
    /// 修改密码，验证当前密码后设置新密码
    /// </summary>
    /// <param name="request">修改密码请求（当前密码 + 新密码）</param>
    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        // 从 JWT Claims 中提取用户 ID
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
            ?? User.FindFirst("sub");

        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            return Unauthorized(new { code = 401, message = "无法识别用户身份" });
        }

        await _authService.ChangePasswordAsync(userId, request);
        return Ok(new { message = "密码修改成功" });
    }

    /// <summary>
    /// 获取当前登录用户信息
    /// </summary>
    /// <returns>当前用户信息</returns>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
            ?? User.FindFirst("sub");

        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            return Unauthorized(new { code = 401, message = "无法识别用户身份" });
        }

        var user = await _userRepo.GetByIdAsync(userId);
        if (user == null)
        {
            return NotFound(new { code = 404, message = "用户不存在" });
        }

        return Ok(new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            DisplayName = user.DisplayName,
            Role = user.Role.ToString(),
            Email = user.Email,
            Phone = user.Phone,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        });
    }
}

/// <summary>
/// 刷新令牌请求 DTO
/// </summary>
public class RefreshTokenRequest
{
    /// <summary>
    /// 刷新令牌字符串
    /// </summary>
    public string RefreshToken { get; set; } = string.Empty;
}
