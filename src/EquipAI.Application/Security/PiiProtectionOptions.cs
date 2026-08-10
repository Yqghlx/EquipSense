using Microsoft.Extensions.Configuration;

namespace EquipAI.Application.Security;

/// <summary>
/// 用户联系方式加密密钥的生产环境启动校验器。
/// </summary>
public static class PiiProtectionValidator
{
    private const int RequiredKeyByteLength = 32;

    /// <summary>
    /// 校验生产环境是否配置了可用于 AES-256-GCM 的外部密钥。
    /// </summary>
    /// <param name="configuration">应用配置。</param>
    /// <param name="environmentName">宿主环境名称。</param>
    /// <exception cref="InvalidOperationException">密钥缺失、格式错误或长度不符合要求时抛出。</exception>
    public static void ValidateForEnvironment(IConfiguration configuration, string environmentName)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        if (!string.Equals(environmentName, "Production", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var configuredKey = configuration["Security:PiiEncryptionKey"];
        if (string.IsNullOrWhiteSpace(configuredKey))
        {
            throw new InvalidOperationException(
                "生产环境未配置 Security:PiiEncryptionKey，无法安全保护用户联系方式。");
        }

        byte[] decodedKey;
        try
        {
            decodedKey = Convert.FromBase64String(configuredKey);
        }
        catch (FormatException ex)
        {
            throw new InvalidOperationException(
                "Security:PiiEncryptionKey 必须是 Base64 编码的 32 字节密钥。", ex);
        }

        if (decodedKey.Length != RequiredKeyByteLength)
        {
            throw new InvalidOperationException(
                "Security:PiiEncryptionKey 必须解码为 32 字节（AES-256）密钥。");
        }
    }
}
