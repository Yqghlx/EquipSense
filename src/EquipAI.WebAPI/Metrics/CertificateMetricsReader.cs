using System.Formats.Asn1;
using System.Numerics;
using System.Security.Cryptography.X509Certificates;

namespace EquipAI.WebAPI.Metrics;

/// <summary>
/// 证书读取结果。
/// </summary>
public sealed record CertificateReadResult(
    string Name,
    bool IsAvailable,
    double ExpiryTimestampSeconds,
    double DaysUntilExpiry,
    string? Error);

/// <summary>
/// 从只读证书文件读取有效期，不读取证书私钥。
/// </summary>
public sealed class CertificateMetricsReader
{
    private const long MaxCertificateFileBytes = 4 * 1024 * 1024;

    /// <summary>
    /// 读取配置中的所有证书。
    /// 单个文件读取失败只影响该证书的结果，避免一个挂载故障让整个监控后台服务退出。
    /// </summary>
    /// <param name="certificates">固定证书名称到文件路径的映射。</param>
    /// <returns>按证书名称排序的读取结果。</returns>
    public IReadOnlyList<CertificateReadResult> Read(IReadOnlyDictionary<string, string> certificates)
    {
        ArgumentNullException.ThrowIfNull(certificates);

        return certificates
            .Where(pair => !string.IsNullOrWhiteSpace(pair.Key))
            .OrderBy(pair => pair.Key, StringComparer.Ordinal)
            .Select(pair => ReadOne(pair.Key, pair.Value))
            .ToList();
    }

    /// <summary>
    /// 读取单个证书文件并将预期的文件或 X.509 错误转换为不可用结果。
    /// </summary>
    private static CertificateReadResult ReadOne(string name, string? path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return Unavailable(name, "PathEmpty");
        }

        try
        {
            var fileInfo = new FileInfo(path);
            if (fileInfo.LinkTarget is not null
                || File.GetAttributes(path).HasFlag(FileAttributes.ReparsePoint))
            {
                return Unavailable(name, "SymbolicLinkNotAllowed");
            }

            if (fileInfo.Length > MaxCertificateFileBytes)
            {
                return Unavailable(name, "FileTooLarge");
            }

            var rawData = File.ReadAllBytes(path);
            if (LooksLikePkcs12(rawData))
            {
                return Unavailable(name, "PrivateKeyNotAllowed");
            }

            // DER/PEM 证书不包含私钥；对非 PFX 输入再做 HasPrivateKey 检查，防御误配的
            // 带密钥 PEM 或未来运行库行为变化。生产 Compose 本身不挂载任何私钥。
            using var certificate = new X509Certificate2(rawData, (string?)null);
            if (certificate.HasPrivateKey)
            {
                return Unavailable(name, "PrivateKeyNotAllowed");
            }

            var expiresAt = new DateTimeOffset(certificate.NotAfter.ToUniversalTime());
            var now = DateTimeOffset.UtcNow;

            return new CertificateReadResult(
                name,
                IsAvailable: true,
                ExpiryTimestampSeconds: expiresAt.ToUnixTimeSeconds(),
                DaysUntilExpiry: (expiresAt - now).TotalDays,
                Error: null);
        }
        catch (Exception exception)
        {
            // 只返回异常类型，不记录路径或证书内容，避免日志泄露运行时文件布局。
            return Unavailable(name, exception.GetType().Name);
        }
    }

    /// <summary>
    /// 在交给 X509Certificate2 前识别 PKCS#12 容器，避免为了检查 HasPrivateKey 而先加载私钥。
    /// PFX 的顶层结构第一个字段是版本整数 3，而 DER X.509 证书的第一个字段是序列。
    /// </summary>
    private static bool LooksLikePkcs12(byte[] rawData)
    {
        try
        {
            var reader = new AsnReader(rawData, AsnEncodingRules.BER);
            var pfx = reader.ReadSequence();
            return pfx.ReadInteger() == new BigInteger(3);
        }
        catch (AsnContentException)
        {
            return false;
        }
    }

    /// <summary>
    /// 创建不可用结果，并将数值归零以便 Prometheus 告警只依赖状态指标。
    /// </summary>
    private static CertificateReadResult Unavailable(string name, string error)
        => new(name, IsAvailable: false, ExpiryTimestampSeconds: 0, DaysUntilExpiry: 0, Error: error);
}
