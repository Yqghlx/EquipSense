namespace EquipAI.Core.Security;

/// <summary>
/// OPC UA 连接安全配置校验器。
///
/// 与 <see cref="MqttSecurityConfigurationValidator"/> 不同，OPC UA 的安全模式为"告警"而非"阻断"——
/// 因为部分工业现场的老旧 PLC/OPC UA 服务器（如西门子 S7-1200 早期固件、部分本地化 HMI）
/// 不支持 Sign/SignAndEncrypt，强制阻断会导致网关无法采集数据。
///
/// 因此本校验器在生产环境检测到 None 模式时返回告警消息（由调用方决定如何记录），
/// 由运维人员评估现场设备能力后决定是否接受明文采集风险。
/// 开发环境默认 None 不产生告警。
/// </summary>
public static class OpcUaSecurityConfigurationValidator
{
    /// <summary>
    /// 校验 OPC UA 安全配置，返回需要记录的告警消息（无告警返回 null）。
    /// </summary>
    /// <param name="environmentName">当前宿主环境名称（Production 时才告警）。</param>
    /// <param name="securityMode">OPC UA 安全模式字符串（None / Sign / SignAndEncrypt，大小写不敏感）。</param>
    /// <param name="enabledProtocols">当前启用的协议列表（用于判断 OPC UA 是否实际启用；未启用则跳过校验）。</param>
    /// <returns>
    /// (level, message) 元组：level=Error 时为明文告警，Warning 时为仅签名告警；无告警返回 null。
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

        // OPC UA 未启用则跳过（网关可能只配了 Modbus）
        if (enabledProtocols is { Count: > 0 }
            && !enabledProtocols.Any(p => p.Equals("opcua", StringComparison.OrdinalIgnoreCase)))
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

        // signandencrypt 无告警
        return null;
    }
}

/// <summary>
/// OPC UA 安全告警级别。
/// </summary>
public enum OpcUaSecurityAlertLevel
{
    /// <summary>仅签名（数据完整性保护但可被嗅探）</summary>
    Warning,

    /// <summary>无安全模式（明文传输，可被嗅探/篡改）</summary>
    Error,
}
