using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace EquipAI.Infrastructure.Identity;

/// <summary>
/// JWT 令牌服务，负责访问令牌的颁发、刷新令牌的生成以及令牌解析
/// 使用 HMAC-SHA256 签名，令牌有效期为 24 小时
/// </summary>
public class JwtTokenService
{
    private readonly IConfiguration _configuration;

    /// <summary>
    /// JWT 配置键名常量
    /// </summary>
    private static class JwtSettingsKeys
    {
        public const string Section = "Jwt";
        public const string Secret = "Jwt:Secret";
        public const string Issuer = "Jwt:Issuer";
        public const string Audience = "Jwt:Audience";
    }

    /// <summary>
    /// 初始化 JWT 令牌服务
    /// </summary>
    /// <param name="configuration">应用配置，从中读取 JWT 密钥、签发者和受众</param>
    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    /// <summary>
    /// 为指定用户生成 JWT 访问令牌
    /// 包含 Claims：sub（用户ID）、tenant_id、role、username、token_version、jti
    /// </summary>
    /// <param name="user">目标用户实体</param>
    /// <returns>签发后的 JWT 字符串</returns>
    public string GenerateAccessToken(User user)
    {
        var secret = _configuration[JwtSettingsKeys.Secret]
            ?? throw new InvalidOperationException("JWT 密钥未配置，请在 appsettings 中设置 Jwt:Secret");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // 构建声明列表：包含用户身份、租户、角色等关键信息
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new("tenant_id", user.TenantId.ToString()),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("role", user.Role.ToString()),
            new("username", user.Username),
            new("token_version", user.TokenVersion.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var issuer = _configuration[JwtSettingsKeys.Issuer] ?? "EquipAI";
        var audience = _configuration[JwtSettingsKeys.Audience] ?? "EquipAI";

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// 生成刷新令牌（基于 GUID，去除连字符以保持格式简洁）
    /// </summary>
    /// <returns>随机生成的刷新令牌字符串</returns>
    public string GenerateRefreshToken()
    {
        return Guid.NewGuid().ToString("N");
    }

    /// <summary>
    /// 从 JWT 字符串中解析出 ClaimsPrincipal
    /// 注意：不验证令牌过期时间（lifetimeValidation=false），适用于中间件需要解析已过期令牌的场景
    /// </summary>
    /// <param name="token">JWT 字符串</param>
    /// <returns>解析成功返回 ClaimsPrincipal，否则返回 null</returns>
    public ClaimsPrincipal? GetPrincipalFromToken(string token)
    {
        var secret = _configuration[JwtSettingsKeys.Secret];
        if (string.IsNullOrEmpty(secret))
        {
            return null;
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));

        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidAudience = _configuration[JwtSettingsKeys.Audience] ?? "EquipAI",
            ValidateIssuer = true,
            ValidIssuer = _configuration[JwtSettingsKeys.Issuer] ?? "EquipAI",
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key,
            // 中间件解析场景不验证过期时间，过期检查由认证中间件负责
            ValidateLifetime = false,
            ClockSkew = TimeSpan.Zero
        };

        var tokenHandler = new JwtSecurityTokenHandler();

        try
        {
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out _);
            return principal;
        }
        catch (Exception)
        {
            // 令牌格式无效或签名不匹配，返回 null
            return null;
        }
    }
}
