namespace EquipAI.WebAPI.Metrics;

/// <summary>
/// OpenTelemetry OTLP 导出端点的环境配置门禁。
/// </summary>
public static class OpenTelemetryConfigurationValidator
{
    /// <summary>
    /// 按宿主环境校验 OTLP 端点。
    /// 生产环境必须明确指定 HTTP(S) 端点；开发和测试环境允许留空以使用 Console exporter。
    /// </summary>
    /// <param name="endpoint">OTLP 导出端点。</param>
    /// <param name="environmentName">当前宿主环境名称。</param>
    /// <exception cref="ArgumentException">宿主环境名称为空。</exception>
    /// <exception cref="InvalidOperationException">端点不符合当前环境要求。</exception>
    public static void ValidateForEnvironment(string? endpoint, string environmentName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(environmentName);

        var isProduction = string.Equals(environmentName, "Production", StringComparison.OrdinalIgnoreCase);
        if (string.IsNullOrWhiteSpace(endpoint))
        {
            if (isProduction)
            {
                throw new InvalidOperationException(
                    "生产环境必须配置 OTEL_EXPORTER_OTLP_ENDPOINT，禁止退回 Console exporter");
            }

            return;
        }

        if (endpoint.Any(char.IsWhiteSpace)
            || !Uri.TryCreate(endpoint, UriKind.Absolute, out var uri)
            || (!string.Equals(uri.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase)
                && !string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
            || string.IsNullOrWhiteSpace(uri.Host)
            || !string.IsNullOrEmpty(uri.UserInfo))
        {
            throw new InvalidOperationException(
                "OTEL_EXPORTER_OTLP_ENDPOINT 必须是包含主机的 http:// 或 https:// 地址，且不得包含空白字符或内嵌凭据");
        }
    }
}
