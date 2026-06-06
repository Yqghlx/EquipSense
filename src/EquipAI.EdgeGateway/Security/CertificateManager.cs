using System.Security.Cryptography.X509Certificates;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace EquipAI.EdgeGateway.Security;

/// <summary>
/// OPC UA 证书管理器 — 负责加载客户端证书和受信任的服务器证书。
/// <para>
/// 使用方式：在 OpcUaAdapter.ConnectAsync 中通过 CertificateManager 配置 ApplicationConfiguration 的证书相关选项。
/// 支持从 PFX 文件加载客户端证书，从目录加载受信任的服务器 CA 证书。
/// </para>
/// </summary>
public class CertificateManager
{
    private readonly GatewayOptions _options;
    private readonly ILogger<CertificateManager> _logger;

    public CertificateManager(IOptions<GatewayOptions> options, ILogger<CertificateManager> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    /// <summary>
    /// 解析 OPC UA 安全模式配置字符串为 SecurityMode 枚举值。
    /// 无法识别时回退到 None。
    /// </summary>
    public OpcUaSecurityMode GetSecurityMode()
    {
        return _options.OpcUaSecurityMode?.ToLowerInvariant() switch
        {
            "sign" => OpcUaSecurityMode.Sign,
            "signandencrypt" => OpcUaSecurityMode.SignAndEncrypt,
            _ => OpcUaSecurityMode.None,
        };
    }

    /// <summary>
    /// 加载客户端 PFX 证书。配置了路径且文件存在时返回 X509Certificate2，否则返回 null。
    /// </summary>
    public X509Certificate2? LoadClientCertificate()
    {
        var certPath = _options.OpcUaClientCertificatePath;
        if (string.IsNullOrWhiteSpace(certPath))
            return null;

        if (!File.Exists(certPath))
        {
            _logger.LogWarning("客户端证书文件不存在: {Path}，将使用自动生成的自签名证书", certPath);
            return null;
        }

        try
        {
            var password = _options.OpcUaClientCertificatePassword;
            var cert = string.IsNullOrEmpty(password)
                ? new X509Certificate2(certPath)
                : new X509Certificate2(certPath, password, X509KeyStorageFlags.MachineKeySet);

            _logger.LogInformation("已加载 OPC UA 客户端证书: {Subject}（有效期至 {NotAfter:yyyy-MM-dd}）",
                cert.Subject, cert.NotAfter);

            if (cert.NotAfter < DateTime.UtcNow)
            {
                _logger.LogWarning("客户端证书已过期: {NotAfter:yyyy-MM-dd}", cert.NotAfter);
            }

            return cert;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "加载客户端证书失败: {Path}", certPath);
            return null;
        }
    }

    /// <summary>
    /// 获取受信任证书的存储路径。未配置时使用默认路径。
    /// </summary>
    public string GetTrustedStorePath()
    {
        return !string.IsNullOrWhiteSpace(_options.OpcUaTrustedCertificatesPath)
            ? _options.OpcUaTrustedCertificatesPath
            : "certificates/trusted";
    }

    /// <summary>
    /// 是否应自动接受不受信任的证书。
    /// 安全模式为 None 时自动接受（开发模式），Sign/SignAndEncrypt 时拒绝。
    /// </summary>
    public bool ShouldAutoAcceptUntrustedCertificates()
    {
        return GetSecurityMode() == OpcUaSecurityMode.None;
    }
}

/// <summary>
/// OPC UA 安全模式枚举
/// </summary>
public enum OpcUaSecurityMode
{
    /// <summary>无安全（开发模式）</summary>
    None,
    /// <summary>仅签名</summary>
    Sign,
    /// <summary>签名 + 加密</summary>
    SignAndEncrypt,
}
