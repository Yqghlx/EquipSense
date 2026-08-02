using System.Net.Security;
using System.Security.Cryptography.X509Certificates;

namespace EquipAI.Core.Security;

/// <summary>
/// MQTT 服务端证书校验辅助类。
/// </summary>
public static class MqttServerCertificateValidator
{
    /// <summary>
    /// 使用系统信任链或指定的自定义 CA 校验 MQTT Broker 证书。
    /// 自定义 CA 只放宽信任根来源，不放宽主机名、证书存在性或吊销检查。
    /// </summary>
    /// <param name="certificate">Broker 返回的服务端证书。</param>
    /// <param name="sslPolicyErrors">系统 TLS 校验结果。</param>
    /// <param name="caCertificatePath">自定义 CA 证书路径。</param>
    public static bool Validate(
        X509Certificate certificate,
        SslPolicyErrors sslPolicyErrors,
        string caCertificatePath)
    {
        var fatalErrors = sslPolicyErrors
            & (SslPolicyErrors.RemoteCertificateNameMismatch
                | SslPolicyErrors.RemoteCertificateNotAvailable);
        if (fatalErrors != SslPolicyErrors.None)
        {
            return false;
        }

        // 系统信任链已经通过时直接接受，避免为每次连接重复构造自定义链。
        if (sslPolicyErrors == SslPolicyErrors.None)
        {
            return true;
        }

        using var caCertificate = new X509Certificate2(caCertificatePath);
        using var candidateCertificate = new X509Certificate2(certificate);
        using var customChain = new X509Chain();
        customChain.ChainPolicy.TrustMode = X509ChainTrustMode.CustomRootTrust;
        customChain.ChainPolicy.CustomTrustStore.Add(caCertificate);
        customChain.ChainPolicy.RevocationMode = X509RevocationMode.Online;
        customChain.ChainPolicy.RevocationFlag = X509RevocationFlag.ExcludeRoot;
        // 私有 CA 常常没有公开 CRL 分发地址：保留在线吊销检查，只有在状态未知/无法获取 CRL 时放行；
        // 如果 CRL 明确返回证书已吊销，仍会保持失败。
        customChain.ChainPolicy.VerificationFlags =
            X509VerificationFlags.IgnoreEndRevocationUnknown
            | X509VerificationFlags.IgnoreCertificateAuthorityRevocationUnknown;

        return customChain.Build(candidateCertificate);
    }
}
