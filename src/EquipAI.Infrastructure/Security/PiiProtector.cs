using System.Security.Cryptography;
using System.Text;
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace EquipAI.Infrastructure.Security;

/// <summary>
/// 使用 AES-256-GCM 保护用户邮箱和手机号，并使用字段隔离的 HMAC 生成盲索引。
/// </summary>
public sealed class PiiProtector : IPiiProtector
{
    /// <summary>
    /// 密文格式版本前缀，后续格式变更时通过版本实现平滑演进。
    /// </summary>
    public const string CipherTextPrefix = "enc:v1:";

    private const int KeyByteLength = 32;
    private const int NonceByteLength = 12;
    private const int TagByteLength = 16;
    private const string EmailField = "email";
    private const string PhoneField = "phone";
    private const string DevelopmentFallbackKey = "EquipSense-development-only-pii-key";

    private readonly byte[] _encryptionKey;
    private readonly byte[] _lookupKey;

    /// <inheritdoc />
    public string ModelCacheKey { get; }

    /// <summary>
    /// 初始化 PII 保护器。
    /// </summary>
    /// <param name="configuration">应用配置，生产环境必须提供 Security:PiiEncryptionKey。</param>
    /// <param name="hostEnvironment">宿主环境；直接单元测试可省略并从配置读取环境名。</param>
    public PiiProtector(IConfiguration configuration, IHostEnvironment? hostEnvironment = null)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        var environmentName = hostEnvironment?.EnvironmentName
            ?? configuration["ASPNETCORE_ENVIRONMENT"]
            ?? configuration["DOTNET_ENVIRONMENT"]
            ?? Environments.Production;
        var configuredKey = configuration["Security:PiiEncryptionKey"];

        if (string.IsNullOrWhiteSpace(configuredKey))
        {
            if (string.Equals(environmentName, Environments.Production, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "生产环境未配置 Security:PiiEncryptionKey，无法安全保护用户联系方式。");
            }

            // 开发/测试后备密钥只用于本地可重复启动，生产环境由上面的分支强制使用外部密钥。
            configuredKey = Convert.ToBase64String(
                SHA256.HashData(Encoding.UTF8.GetBytes(DevelopmentFallbackKey)));
        }

        byte[] masterKey;
        try
        {
            masterKey = Convert.FromBase64String(configuredKey);
        }
        catch (FormatException ex)
        {
            throw new InvalidOperationException(
                "Security:PiiEncryptionKey 必须是 Base64 编码的 32 字节密钥。", ex);
        }

        if (masterKey.Length != KeyByteLength)
        {
            throw new InvalidOperationException(
                "Security:PiiEncryptionKey 必须解码为 32 字节（AES-256）密钥。");
        }

        // 使用用途标签派生独立子密钥，避免同一密钥材料同时暴露给加密和盲索引算法。
        _encryptionKey = DeriveKey(masterKey, "EquipSense:PII:Encryption:v1");
        _lookupKey = DeriveKey(masterKey, "EquipSense:PII:Lookup:v1");
        ModelCacheKey = Convert.ToHexString(SHA256.HashData(masterKey));
        CryptographicOperations.ZeroMemory(masterKey);
    }

    /// <inheritdoc />
    public string? Normalize(string field, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var normalizedField = NormalizeFieldName(field);
        var trimmed = value.Trim();

        if (normalizedField == EmailField)
        {
            return trimmed.ToLowerInvariant();
        }

        // 手机号通常从通讯录或人工录入而来，统一移除常见展示格式字符，保留国家码前导加号。
        var compact = string.Concat(trimmed.Where(character =>
            !char.IsWhiteSpace(character)
            && character is not '-'
            && character is not '('
            && character is not ')'));
        return compact.Length == 0 ? null : compact;
    }

    /// <inheritdoc />
    public string? Protect(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var plainText = Encoding.UTF8.GetBytes(value);
        var nonce = RandomNumberGenerator.GetBytes(NonceByteLength);
        var cipherText = new byte[plainText.Length];
        var tag = new byte[TagByteLength];

        using (var aes = new AesGcm(_encryptionKey, TagByteLength))
        {
            aes.Encrypt(nonce, plainText, cipherText, tag);
        }

        return CipherTextPrefix + string.Join(
            '.',
            Convert.ToBase64String(nonce),
            Convert.ToBase64String(tag),
            Convert.ToBase64String(cipherText));
    }

    /// <inheritdoc />
    public string? Unprotect(string? storedValue)
    {
        if (string.IsNullOrWhiteSpace(storedValue))
        {
            return null;
        }

        if (!storedValue.StartsWith(CipherTextPrefix, StringComparison.Ordinal))
        {
            throw new CryptographicException("用户联系方式不是受支持的密文格式。");
        }

        var payload = storedValue[CipherTextPrefix.Length..].Split('.', StringSplitOptions.None);
        if (payload.Length != 3)
        {
            throw new CryptographicException("用户联系方式密文格式无效。");
        }

        try
        {
            var nonce = Convert.FromBase64String(payload[0]);
            var tag = Convert.FromBase64String(payload[1]);
            var cipherText = Convert.FromBase64String(payload[2]);

            if (nonce.Length != NonceByteLength || tag.Length != TagByteLength)
            {
                throw new CryptographicException("用户联系方式密文长度无效。");
            }

            var plainText = new byte[cipherText.Length];
            using (var aes = new AesGcm(_encryptionKey, TagByteLength))
            {
                aes.Decrypt(nonce, cipherText, tag, plainText);
            }

            return Encoding.UTF8.GetString(plainText);
        }
        catch (FormatException ex)
        {
            throw new CryptographicException("用户联系方式密文不是有效的 Base64。", ex);
        }
    }

    /// <inheritdoc />
    public string? CreateLookupHash(string field, string? value)
    {
        var normalizedField = NormalizeFieldName(field);
        var normalizedValue = Normalize(normalizedField, value);
        if (normalizedValue is null)
        {
            return null;
        }

        var scopedValue = Encoding.UTF8.GetBytes(normalizedField + ":" + normalizedValue);
        return Convert.ToHexString(HMACSHA256.HashData(_lookupKey, scopedValue)).ToLowerInvariant();
    }

    private static byte[] DeriveKey(byte[] masterKey, string purpose)
        => HMACSHA256.HashData(masterKey, Encoding.UTF8.GetBytes(purpose));

    private static string NormalizeFieldName(string field)
    {
        if (string.Equals(field, EmailField, StringComparison.OrdinalIgnoreCase))
        {
            return EmailField;
        }

        if (string.Equals(field, PhoneField, StringComparison.OrdinalIgnoreCase))
        {
            return PhoneField;
        }

        throw new ArgumentException("PII 字段必须是 email 或 phone。", nameof(field));
    }
}

/// <summary>
/// 未注入生产保护器时供直接构造的测试上下文使用的明文实现。
/// 生产 DI 始终注册 <see cref="PiiProtector"/>，该实现不会在生产配置下被使用。
/// </summary>
internal sealed class PlaintextPiiProtector : IPiiProtector
{
    /// <summary>
    /// 全局无状态实例。
    /// </summary>
    public static PlaintextPiiProtector Instance { get; } = new();

    /// <inheritdoc />
    public string ModelCacheKey => "plaintext-test-only";

    /// <inheritdoc />
    public string? Normalize(string field, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var normalizedField = NormalizeFieldName(field);
        var trimmed = value.Trim();
        if (normalizedField == "email")
        {
            return trimmed.ToLowerInvariant();
        }

        var compact = string.Concat(trimmed.Where(character =>
            !char.IsWhiteSpace(character)
            && character is not '-'
            && character is not '('
            && character is not ')'));
        return compact.Length == 0 ? null : compact;
    }

    /// <inheritdoc />
    public string? Protect(string? value) => string.IsNullOrWhiteSpace(value) ? null : value;

    /// <inheritdoc />
    public string? Unprotect(string? storedValue) => string.IsNullOrWhiteSpace(storedValue) ? null : storedValue;

    /// <inheritdoc />
    public string? CreateLookupHash(string field, string? value)
    {
        var normalizedField = NormalizeFieldName(field);
        var normalizedValue = Normalize(normalizedField, value);
        return normalizedValue is null
            ? null
            : Convert.ToHexString(
                SHA256.HashData(Encoding.UTF8.GetBytes(normalizedField + ":" + normalizedValue)))
                .ToLowerInvariant();
    }

    private static string NormalizeFieldName(string field)
    {
        if (string.Equals(field, "email", StringComparison.OrdinalIgnoreCase))
        {
            return "email";
        }

        if (string.Equals(field, "phone", StringComparison.OrdinalIgnoreCase))
        {
            return "phone";
        }

        throw new ArgumentException("PII 字段必须是 email 或 phone。", nameof(field));
    }
}
