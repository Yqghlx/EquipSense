using EquipAI.Core.Security;

namespace EquipAI.EdgeGateway;

/// <summary>
/// 边缘网关启动配置校验器。
/// 生产环境必须在启动阶段拒绝不完整配置，避免容器保持运行但无法注册、上传或持久化数据。
/// </summary>
public static class GatewayConfigurationValidator
{
    private static readonly string[] InsecureAuthKeyValues =
    [
        "SET_VIA_USER_SECRETS",
        "PLEASE_CHANGE_THIS_TO_ASCII_STRONG_KEY_AT_LEAST_32_CHARS",
        "change-me",
        "your-secret-key",
    ];

    /// <summary>
    /// 校验边缘网关配置。
    /// </summary>
    /// <param name="environmentName">宿主环境名称。</param>
    /// <param name="options">网关配置。</param>
    /// <exception cref="InvalidOperationException">生产配置不完整或不安全时抛出。</exception>
    public static void Validate(string environmentName, GatewayOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        // 开发环境允许使用 appsettings.json 的 localhost 和相对缓存路径，便于本地调试。
        // 生产环境则必须显式绑定租户和持久化目录，否则网关可能“健康但不工作”。
        if (!string.Equals(environmentName, "Production", StringComparison.OrdinalIgnoreCase))
            return;

        if (string.IsNullOrWhiteSpace(options.Id))
            throw new InvalidOperationException("生产环境必须配置 Gateway:Id");

        if (!Guid.TryParse(options.TenantId, out var tenantId) || tenantId == Guid.Empty)
        {
            throw new InvalidOperationException(
                "生产环境必须配置有效的 Gateway:TenantId（UUID），否则网关无法按租户注册和拉取设备配置");
        }

        if (string.IsNullOrWhiteSpace(options.BackendUrl))
            throw new InvalidOperationException("生产环境必须配置 Gateway:BackendUrl");

        if (!Uri.TryCreate(options.BackendUrl, UriKind.Absolute, out var backendUri)
            || (backendUri.Scheme != Uri.UriSchemeHttp && backendUri.Scheme != Uri.UriSchemeHttps)
            || string.IsNullOrWhiteSpace(backendUri.Host)
            || !string.IsNullOrEmpty(backendUri.UserInfo))
        {
            throw new InvalidOperationException(
                "生产环境 Gateway:BackendUrl 必须是不带用户信息的绝对 http:// 或 https:// 地址");
        }

        // CloudUploader 会按 host:port 解析 Broker；端口拼写错误不能静默回退到默认端口，
        // 否则网关会显示已启动但持续连接错误的 Broker，现场只能通过日志反推配置问题。
        var mqttParts = options.MqttBroker?.Split(':', 2, StringSplitOptions.TrimEntries) ?? [];
        var mqttPortIsValid = mqttParts.Length < 2
            || (int.TryParse(mqttParts[1], out var mqttPort) && mqttPort is >= 1 and <= 65535);
        if (mqttParts.Length == 0
            || string.IsNullOrWhiteSpace(mqttParts[0])
            || !mqttPortIsValid)
        {
            throw new InvalidOperationException(
                "生产环境 Gateway:MqttBroker 必须是有效的 host[:port] 地址，端口范围为 1-65535");
        }

        if (string.IsNullOrWhiteSpace(options.AuthKey))
            throw new InvalidOperationException("生产环境必须配置 Gateway:AuthKey");

        // 网关认证头会在后端与边缘网关之间传输；短密钥、模板占位符或非可打印字符
        // 都可能导致已知凭据运行、请求头解析失败或运维误把中文占位值部署到生产。
        if (options.AuthKey.Length < 32)
            throw new InvalidOperationException("生产环境 Gateway:AuthKey 长度必须至少为 32 个字符");

        if (InsecureAuthKeyValues.Contains(options.AuthKey, StringComparer.OrdinalIgnoreCase)
            || options.AuthKey.Contains("${", StringComparison.Ordinal)
            || options.AuthKey.Contains("PLEASE_CHANGE", StringComparison.OrdinalIgnoreCase)
            || options.AuthKey.Contains("CHANGE_ME", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("生产环境 Gateway:AuthKey 不能使用占位值");
        }

        if (options.AuthKey.Any(character => character < 0x21 || character > 0x7E))
            throw new InvalidOperationException("生产环境 Gateway:AuthKey 必须只包含可打印 ASCII 字符");

        // Docker 镜像以非 root 用户运行，低于 1024 的端口即使格式合法也无法监听；
        // 提前拒绝越界和特权端口，避免容器启动后才进入假健康状态。
        if (options.HealthPort is < 1024 or > 65535)
            throw new InvalidOperationException("生产环境 Gateway:HealthPort 必须在 1024-65535 范围内");

        if (string.IsNullOrWhiteSpace(options.BufferPath) || !Path.IsPathRooted(options.BufferPath))
        {
            throw new InvalidOperationException(
                "生产环境 Gateway:BufferPath 必须是绝对路径，并指向持久化卷（例如 /data/buffer.db）");
        }

        if (options.UseLocalDeviceConfigFallback)
        {
            throw new InvalidOperationException(
                "生产环境禁止启用 Gateway:UseLocalDeviceConfigFallback，设备配置必须来自后端登记数据");
        }
    }

    /// <summary>
    /// 校验 OPC UA 实际启用时的生产安全策略。
    /// </summary>
    /// <param name="environmentName">宿主环境名称。</param>
    /// <param name="options">网关配置。</param>
    /// <param name="enabledProtocols">从后端拉取并实际启用的协议列表。</param>
    /// <returns>
    /// 启动允许时返回需要记录的 OPC UA 告警；SignAndEncrypt、未启用 OPC UA 或非生产环境返回 null。
    /// 生产环境的 Error 级结果只有在明确的 None break-glass 配置下才会返回，否则直接抛出异常。
    /// </returns>
    /// <exception cref="InvalidOperationException">生产环境未显式授权不安全 OPC UA 配置时抛出。</exception>
    public static (OpcUaSecurityAlertLevel Level, string Message)? ValidateOpcUaSecurity(
        string environmentName,
        GatewayOptions options,
        IReadOnlyCollection<string> enabledProtocols)
    {
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(enabledProtocols);

        var alert = OpcUaSecurityConfigurationValidator.Validate(
            environmentName,
            options.OpcUaSecurityMode,
            enabledProtocols);

        var explicitlyAllowsPlaintext = string.Equals(
            options.OpcUaSecurityMode?.Trim(),
            "None",
            StringComparison.OrdinalIgnoreCase);
        if (alert is { } opcUaAlert
            && opcUaAlert.Level == OpcUaSecurityAlertLevel.Error
            && (!options.AllowInsecureOpcUa || !explicitlyAllowsPlaintext))
        {
            throw new InvalidOperationException(
                $"{opcUaAlert.Message} 如必须兼容旧设备，请在完成网络隔离和风险评估后显式设置 Gateway:AllowInsecureOpcUa=true。");
        }

        return alert;
    }
}
