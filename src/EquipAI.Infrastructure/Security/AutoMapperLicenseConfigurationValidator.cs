namespace EquipAI.Infrastructure.Security;

/// <summary>
/// AutoMapper 许可证配置校验器。
/// </summary>
public static class AutoMapperLicenseConfigurationValidator
{
    /// <summary>
    /// 校验当前运行环境的许可证配置。
    /// AutoMapper 15+ 在生产使用时需要许可证治理，因此生产环境不得缺失密钥或使用模板占位值。
    /// </summary>
    /// <param name="environmentName">ASP.NET Core 环境名称。</param>
    /// <param name="licenseKey">由外部密钥管理注入的许可证密钥。</param>
    /// <exception cref="InvalidOperationException">生产环境许可证配置无效时抛出。</exception>
    public static void Validate(string environmentName, string? licenseKey)
    {
        if (!environmentName.Equals("Production", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(licenseKey)
            || licenseKey.Trim().Length < 32
            || licenseKey.Contains("SET_VIA_ENVIRONMENT", StringComparison.OrdinalIgnoreCase)
            || licenseKey.Contains("PLEASE_CHANGE", StringComparison.OrdinalIgnoreCase)
            || licenseKey.Contains("CHANGE_ME", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "生产环境缺少有效的 AutoMapper 许可证密钥，请通过 AutoMapper__LicenseKey 注入后再启动。");
        }
    }
}
