namespace EquipAI.Core.Security;

/// <summary>
/// MQTT 连接安全配置校验器。
/// 将生产环境必须满足的安全约束集中在领域无关的纯逻辑中，便于 WebAPI 和边缘网关复用。
/// </summary>
public static class MqttSecurityConfigurationValidator
{
    /// <summary>
    /// 校验 MQTT 连接配置。
    /// </summary>
    /// <param name="componentName">配置前缀名称，例如 Mqtt 或 Gateway。</param>
    /// <param name="environmentName">当前宿主环境名称。</param>
    /// <param name="port">Broker 端口。</param>
    /// <param name="useTls">是否启用 TLS。</param>
    /// <param name="allowUntrustedCertificates">是否忽略服务端证书信任错误。</param>
    /// <param name="caCertificatePath">可选的自定义 CA 证书路径。</param>
    /// <param name="username">MQTT 用户名。</param>
    /// <param name="password">MQTT 密码。</param>
    /// <exception cref="InvalidOperationException">配置不满足安全约束时抛出。</exception>
    public static void Validate(
        string componentName,
        string environmentName,
        int port,
        bool useTls,
        bool allowUntrustedCertificates,
        string? caCertificatePath,
        string? username,
        string? password)
    {
        var errors = new List<string>();
        var isProduction = string.Equals(environmentName, "Production", StringComparison.OrdinalIgnoreCase);

        if (port is < 1 or > 65535)
        {
            errors.Add($"{componentName}:Port 必须在 1 到 65535 之间");
        }

        if (!string.IsNullOrWhiteSpace(caCertificatePath) && !File.Exists(caCertificatePath))
        {
            errors.Add($"{componentName}:CaCertificatePath 指向的文件不存在");
        }

        if (isProduction && !useTls)
        {
            errors.Add($"{componentName}:UseTls 必须为 true");
        }

        if (isProduction && allowUntrustedCertificates)
        {
            errors.Add($"{componentName}:AllowUntrustedCertificates 生产环境必须为 false");
        }

        if (isProduction && IsUnsafeProductionCredential(username, "device"))
        {
            errors.Add($"{componentName}:Username 不能为空");
        }

        if (isProduction && IsUnsafeProductionCredential(password, "device123"))
        {
            errors.Add($"{componentName}:Password 不能为空");
        }

        if (errors.Count > 0)
        {
            throw new InvalidOperationException(
                $"MQTT 安全配置无效：{string.Join("；", errors)}。请检查对应配置项后重启服务。");
        }
    }

    /// <summary>
    /// 判断凭据是否为空、占位符或仓库中的公开默认值。
    /// </summary>
    private static bool IsUnsafeProductionCredential(string? value, string knownDefault)
        => string.IsNullOrWhiteSpace(value)
            || string.Equals(value, knownDefault, StringComparison.OrdinalIgnoreCase)
            || value.Contains("请修改", StringComparison.Ordinal)
            || value.Equals("change-me", StringComparison.OrdinalIgnoreCase)
            || value.Equals("password", StringComparison.OrdinalIgnoreCase);
}
