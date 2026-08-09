using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace EquipAI.Infrastructure.Identity;

/// <summary>
/// 使用 AES-256-GCM 保护 TOTP 密钥。
/// 密钥通过配置注入，不写入代码库；每次保护使用新的随机 nonce，并包含认证标签防止篡改。
/// </summary>
public sealed class TotpSecretProtector : ITotpSecretProtector
{
    private const string CipherTextPrefix = "enc:v1:";
    private const int KeyByteLength = 32;
    private const int NonceByteLength = 12;
    private const int TagByteLength = 16;

    private readonly byte[] _key;

    /// <summary>
    /// 初始化 TOTP 密钥保护器。
    /// </summary>
    /// <param name="configuration">应用配置，生产环境必须包含 Security:TotpEncryptionKey。</param>
    public TotpSecretProtector(IConfiguration configuration)
    {
        var configuredKey = configuration["Security:TotpEncryptionKey"];
        if (string.IsNullOrWhiteSpace(configuredKey))
        {
            var environment = configuration["ASPNETCORE_ENVIRONMENT"]
                ?? configuration["DOTNET_ENVIRONMENT"]
                ?? "Production";
            if (string.Equals(environment, "Production", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "生产环境未配置 Security:TotpEncryptionKey，无法安全保护 TOTP 密钥。");
            }

            // 开发环境只为避免本地配置阻塞启动；生产环境由上面的分支强制使用外部密钥。
            _key = SHA256.HashData(Encoding.UTF8.GetBytes("EquipSense-development-only-totp-key"));
            return;
        }

        try
        {
            _key = Convert.FromBase64String(configuredKey);
        }
        catch (FormatException ex)
        {
            throw new InvalidOperationException(
                "Security:TotpEncryptionKey 必须是 Base64 编码的 32 字节密钥。", ex);
        }

        if (_key.Length != KeyByteLength)
        {
            throw new InvalidOperationException(
                "Security:TotpEncryptionKey 必须解码为 32 字节（AES-256）密钥。");
        }
    }

    /// <inheritdoc />
    public string Protect(string plainTextSecret)
    {
        if (string.IsNullOrWhiteSpace(plainTextSecret))
        {
            throw new ArgumentException("TOTP 密钥不能为空。", nameof(plainTextSecret));
        }

        var plainText = Encoding.UTF8.GetBytes(plainTextSecret);
        var nonce = RandomNumberGenerator.GetBytes(NonceByteLength);
        var cipherText = new byte[plainText.Length];
        var tag = new byte[TagByteLength];

        using var aes = new AesGcm(_key, TagByteLength);
        aes.Encrypt(nonce, plainText, cipherText, tag);

        return CipherTextPrefix + string.Join(
            '.',
            Convert.ToBase64String(nonce),
            Convert.ToBase64String(tag),
            Convert.ToBase64String(cipherText));
    }

    /// <inheritdoc />
    public string Unprotect(string storedSecret)
    {
        if (string.IsNullOrWhiteSpace(storedSecret))
        {
            throw new CryptographicException("TOTP 密钥为空。");
        }

        // 兼容历史版本的明文值；调用方在成功 MFA 后会重新 Protect 并完成迁移。
        if (!storedSecret.StartsWith(CipherTextPrefix, StringComparison.Ordinal))
        {
            return storedSecret;
        }

        var payload = storedSecret[CipherTextPrefix.Length..].Split('.', StringSplitOptions.None);
        if (payload.Length != 3)
        {
            throw new CryptographicException("TOTP 密钥密文格式无效。");
        }

        try
        {
            var nonce = Convert.FromBase64String(payload[0]);
            var tag = Convert.FromBase64String(payload[1]);
            var cipherText = Convert.FromBase64String(payload[2]);
            var plainText = new byte[cipherText.Length];

            if (nonce.Length != NonceByteLength || tag.Length != TagByteLength)
            {
                throw new CryptographicException("TOTP 密钥密文长度无效。");
            }

            using var aes = new AesGcm(_key, TagByteLength);
            aes.Decrypt(nonce, cipherText, tag, plainText);
            return Encoding.UTF8.GetString(plainText);
        }
        catch (FormatException ex)
        {
            throw new CryptographicException("TOTP 密钥密文不是有效的 Base64。", ex);
        }
    }
}
