using System.Security.Cryptography;
using System.Text;
using EquipAI.Application.DTOs.Auth;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace EquipAI.WebAPI.Security;

/// <summary>
/// 认证响应令牌暴露策略。
///
/// 浏览器主路径使用 HttpOnly Cookie，不应再把 JWT 暴露给页面脚本或浏览器扩展；
/// 机器客户端仍可通过独立的 X-API-Key 显式声明身份，兼容压测、模拟器和自动化集成。
/// </summary>
public sealed class AuthResponsePolicy
{
    /// <summary>机器客户端令牌响应所需的 API Key 请求头。</summary>
    public const string MachineApiKeyHeaderName = "X-API-Key";

    private readonly IHostEnvironment _environment;
    private readonly byte[]? _machineApiKeyBytes;

    /// <summary>初始化认证响应策略。</summary>
    public AuthResponsePolicy(IConfiguration configuration, IHostEnvironment environment)
    {
        _environment = environment;
        var configuredKey = configuration["Auth:MachineApiKey"];
        if (!string.IsNullOrWhiteSpace(configuredKey))
            _machineApiKeyBytes = Encoding.UTF8.GetBytes(configuredKey);
    }

    /// <summary>
    /// 判断当前请求是否允许在响应体中返回访问令牌和刷新令牌。
    /// 开发/测试保留现有契约；生产及其他非本地环境必须使用配置的机器客户端密钥。
    /// </summary>
    public bool ShouldExposeTokens(string? providedApiKey)
    {
        if (_environment.IsDevelopment() || _environment.IsEnvironment("Testing"))
            return true;

        if (_machineApiKeyBytes is null || string.IsNullOrEmpty(providedApiKey))
            return false;

        var providedBytes = Encoding.UTF8.GetBytes(providedApiKey);
        return providedBytes.Length == _machineApiKeyBytes.Length
            && CryptographicOperations.FixedTimeEquals(_machineApiKeyBytes, providedBytes);
    }

    /// <summary>在写入响应前按策略清除不应暴露的令牌；Cookie 已由控制器在调用前写入。</summary>
    public AuthResponse PrepareForResponse(AuthResponse response, string? providedApiKey)
    {
        ArgumentNullException.ThrowIfNull(response);

        if (ShouldExposeTokens(providedApiKey))
            return response;

        response.AccessToken = string.Empty;
        response.RefreshToken = string.Empty;
        return response;
    }
}
