namespace EquipAI.WebAPI.Metrics;

/// <summary>
/// 证书监控生产配置门禁。
/// </summary>
public static class CertificateMonitoringOptionsValidator
{
    private static readonly IReadOnlyDictionary<string, string> ExpectedCertificatePaths =
        new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["nginx_tls"] = "/etc/equipai/tls/cert.pem",
            ["mqtt_server"] = "/etc/equipai/mqtt-certs/server.crt",
            ["mqtt_ca"] = "/etc/equipai/mqtt-certs/ca.crt",
        };

    /// <summary>
    /// 校验指定环境的证书监控配置。
    /// 生产环境必须启用监控并声明 Nginx/MQTT 三份公钥证书；开发和测试环境可以关闭监控。
    /// </summary>
    /// <param name="options">证书监控配置。</param>
    /// <param name="environmentName">应用环境名称。</param>
    public static void ValidateForEnvironment(
        CertificateMonitoringOptions options,
        string environmentName)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (!string.Equals(environmentName, "Production", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        if (!options.Enabled)
        {
            throw new InvalidOperationException(
                "生产环境必须启用证书生命周期监控，不能通过 CERTIFICATE_MONITORING_ENABLED 关闭");
        }

        var certificates = options.Certificates
            ?? new Dictionary<string, string>(StringComparer.Ordinal);
        var invalidCertificates = ExpectedCertificatePaths
            .Where(pair => !certificates.TryGetValue(pair.Key, out var path)
                || !string.Equals(path, pair.Value, StringComparison.Ordinal))
            .Select(pair => pair.Key);
        var unexpectedCertificates = certificates.Keys
            .Where(name => !ExpectedCertificatePaths.ContainsKey(name))
            .OrderBy(name => name, StringComparer.Ordinal);
        var invalidCertificateNames = invalidCertificates
            .Concat(unexpectedCertificates)
            .ToArray();

        if (invalidCertificateNames.Length > 0)
        {
            throw new InvalidOperationException(
                $"生产环境证书监控必须使用固定公钥证书路径，且不得包含未知证书配置：{string.Join(", ", invalidCertificateNames)}");
        }
    }
}
