namespace EquipAI.Core.Security;

/// <summary>
/// OPC UA 连接安全配置校验器。
///
/// 本校验器只负责把 OPC UA 配置归一化为可审计的告警级别，不直接终止进程；
/// 边缘网关宿主会进一步把生产环境的 Error 级结果转换为启动门禁。
/// 这样既能让核心层保持无日志框架依赖，也能让调用方明确决定如何记录和呈现结果。
///
/// 对无法升级的老旧 PLC/OPC UA 服务器，兼容策略不再由“告警”隐式放行，
/// 而是由宿主层要求显式 break-glass 配置，并把网络隔离和风险评估留在部署审批中。
/// 开发环境默认 None 不产生告警。
/// </summary>
public static class OpcUaSecurityConfigurationValidator
{
    /// <summary>
    /// 校验 OPC UA 安全配置，返回供宿主执行门禁和记录的告警级别（无告警返回 null）。
    /// </summary>
    /// <param name="environmentName">当前宿主环境名称（Production 时才告警）。</param>
    /// <param name="securityMode">OPC UA 安全模式字符串（None / Sign / SignAndEncrypt，大小写不敏感）。</param>
    /// <param name="enabledProtocols">当前启用的协议列表（用于判断 OPC UA 是否实际启用；未启用则跳过校验）。</param>
    /// <returns>
    /// (level, message) 元组：level=Error 时表示必须由宿主阻止或显式 break-glass，
    /// Warning 时表示仅签名风险；无告警返回 null。
    /// </returns>
    public static (OpcUaSecurityAlertLevel Level, string Message)? Validate(
        string environmentName,
        string? securityMode,
        IReadOnlyCollection<string>? enabledProtocols = null)
    {
        var isProduction = string.Equals(environmentName, "Production", StringComparison.OrdinalIgnoreCase);

        // 非生产环境不校验（开发/测试默认 None 合理）
        if (!isProduction)
            return null;

        // OPC UA 未启用则跳过（网关可能只配了 Modbus，或当前还没有登记设备）。
        // null 仍按保守策略校验，表示调用方无法确认实际协议；空集合则明确表示没有设备。
        if (enabledProtocols is not null
            && !enabledProtocols.Any(p => string.Equals(p, "opcua", StringComparison.OrdinalIgnoreCase)))
        {
            return null;
        }

        var normalizedMode = (securityMode ?? "none").ToLowerInvariant().Trim();

        if (normalizedMode is "none" or "")
        {
            return (OpcUaSecurityAlertLevel.Error,
                "⚠️ 安全告警：OPC UA 安全模式为 None（明文采集）。" +
                "生产环境明文传输可被嗅探/篡改指令，建议升级为 SignAndEncrypt。" +
                "若现场设备不支持安全模式，请确认已通过其他手段（VPN/网络隔离/防火墙）保护 OPC UA 通信链路。" +
                "配置项：OpcUaSecurityMode（可选值：None / Sign / SignAndEncrypt）");
        }

        if (normalizedMode == "sign")
        {
            // Sign 模式仅签名不加密，数据可被嗅探但不可篡改——记录警告而非错误
            return (OpcUaSecurityAlertLevel.Warning,
                "OPC UA 安全模式为 Sign（仅签名，未加密）。数据完整性受保护但传输内容可被嗅探。" +
                "若现场设备支持，建议升级为 SignAndEncrypt 实现完整保护。");
        }

        if (normalizedMode == "signandencrypt")
        {
            // SignAndEncrypt 同时保护完整性和机密性，是生产环境的推荐模式。
            return null;
        }

        return (OpcUaSecurityAlertLevel.Error,
            $"OPC UA 安全模式不支持：{securityMode ?? "(未配置)"}。" +
            "可选值为 None、Sign 或 SignAndEncrypt，生产环境不会继续使用未知配置启动。");
    }
}

/// <summary>
/// OPC UA 安全告警级别。
/// </summary>
public enum OpcUaSecurityAlertLevel
{
    /// <summary>仅签名（数据完整性保护但可被嗅探）</summary>
    Warning,

    /// <summary>安全模式缺失、未知或明文传输（必须阻止或显式 break-glass）</summary>
    Error,
}
