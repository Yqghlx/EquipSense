using System.Globalization;
using Microsoft.Extensions.Configuration;

namespace EquipAI.WebAPI.Extensions;

/// <summary>
/// HTTP 限流参数。
/// </summary>
public sealed class RateLimitingOptions
{
    /// <summary>
    /// 配置节名称。
    /// </summary>
    public const string SectionName = "RateLimiting";

    /// <summary>
    /// 未认证请求按 IP 的窗口额度。
    /// </summary>
    public int PermitLimit { get; init; } = 60;

    /// <summary>
    /// 登录和其他认证接口按 IP 的窗口额度。
    /// </summary>
    public int AuthPermitLimit { get; init; } = 10;

    /// <summary>
    /// 已认证请求按租户的窗口额度。
    /// </summary>
    public int TenantPermitLimit { get; init; } = 1000;

    /// <summary>
    /// 限流窗口长度。
    /// </summary>
    public TimeSpan Window { get; init; } = TimeSpan.FromMinutes(1);

    /// <summary>
    /// 从配置读取并校验限流参数。
    /// </summary>
    public static RateLimitingOptions FromConfiguration(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        var section = configuration.GetSection(SectionName);
        var options = new RateLimitingOptions
        {
            PermitLimit = ReadPositiveInt(section, nameof(PermitLimit), 60),
            AuthPermitLimit = ReadPositiveInt(section, nameof(AuthPermitLimit), 10),
            TenantPermitLimit = ReadPositiveInt(section, nameof(TenantPermitLimit), 1000),
            Window = ReadWindow(section),
        };

        options.Validate();
        return options;
    }

    /// <summary>
    /// 校验限流参数，避免错误配置导致应用以异常或无限制策略启动。
    /// </summary>
    public void Validate()
    {
        if (PermitLimit <= 0)
            throw new InvalidOperationException("RateLimiting:PermitLimit 必须大于 0");
        if (AuthPermitLimit <= 0)
            throw new InvalidOperationException("RateLimiting:AuthPermitLimit 必须大于 0");
        if (TenantPermitLimit <= 0)
            throw new InvalidOperationException("RateLimiting:TenantPermitLimit 必须大于 0");
        if (Window <= TimeSpan.Zero)
            throw new InvalidOperationException("RateLimiting:Window 必须大于 0");
    }

    private static int ReadPositiveInt(
        IConfigurationSection section,
        string key,
        int defaultValue)
    {
        var rawValue = section[key];
        if (string.IsNullOrWhiteSpace(rawValue))
            return defaultValue;

        if (!int.TryParse(rawValue, NumberStyles.Integer, CultureInfo.InvariantCulture, out var value))
            throw new InvalidOperationException($"RateLimiting:{key} 必须是整数");

        if (value <= 0)
            throw new InvalidOperationException($"RateLimiting:{key} 必须大于 0");

        return value;
    }

    private static TimeSpan ReadWindow(IConfigurationSection section)
    {
        var rawValue = section[nameof(Window)];
        if (string.IsNullOrWhiteSpace(rawValue))
            return TimeSpan.FromMinutes(1);

        if (!TimeSpan.TryParse(rawValue, CultureInfo.InvariantCulture, out var value)
            || value <= TimeSpan.Zero)
        {
            throw new InvalidOperationException("RateLimiting:Window 必须是大于 0 的时间间隔");
        }

        return value;
    }
}

/// <summary>
/// 限流环境策略。
/// </summary>
public static class RateLimitingConfiguration
{
    /// <summary>
    /// 判断当前环境是否允许关闭限流。
    /// 生产环境无论外部开关如何配置都必须保持限流，避免测试开关成为暴力破解后门。
    /// </summary>
    public static bool ShouldDisable(string? environmentName, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        if (string.Equals(environmentName, "Production", StringComparison.OrdinalIgnoreCase))
            return false;

        if (string.Equals(environmentName, "Testing", StringComparison.OrdinalIgnoreCase))
            return true;

        return IsTrue(configuration["DisableRateLimiting"])
            || IsTrue(configuration["DISABLE_RATE_LIMITING"]);
    }

    private static bool IsTrue(string? value) =>
        bool.TryParse(value, out var result) && result;
}
