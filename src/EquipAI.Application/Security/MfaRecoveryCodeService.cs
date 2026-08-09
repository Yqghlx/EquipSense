using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace EquipAI.Application.Security;

/// <summary>
/// MFA 恢复码生成结果。
/// </summary>
public sealed record MfaRecoveryCodeSet(
    IReadOnlyList<string> Codes,
    string SerializedHashes);

/// <summary>
/// MFA 一次性恢复码服务。
/// 恢复码使用密码学安全随机数生成；数据库只保存 SHA-256 摘要，成功消费后从摘要列表移除。
/// </summary>
public static class MfaRecoveryCodeService
{
    private const int CodeCount = 8;
    private const int CodeGroupLength = 4;
    private const int CodeGroupCount = 4;
    private const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    /// <summary>
    /// 生成一组新的 MFA 恢复码。
    /// </summary>
    /// <returns>仅本次响应返回明文恢复码，同时返回可持久化的摘要 JSON。</returns>
    public static MfaRecoveryCodeSet Generate()
    {
        var codes = Enumerable.Range(0, CodeCount)
            .Select(_ => GenerateCode())
            .ToArray();
        var hashes = codes
            .Select(code => Hash(Normalize(code)!))
            .ToArray();

        return new MfaRecoveryCodeSet(codes, JsonSerializer.Serialize(hashes));
    }

    /// <summary>
    /// 尝试消费一个恢复码。
    /// </summary>
    /// <param name="serializedHashes">数据库中保存的摘要 JSON。</param>
    /// <param name="candidate">用户输入的恢复码。</param>
    /// <param name="remainingSerializedHashes">消费成功后的剩余摘要 JSON；失败时原样返回。</param>
    /// <returns>恢复码有效且成功消费时返回 true。</returns>
    public static bool TryConsume(
        string? serializedHashes,
        string candidate,
        out string? remainingSerializedHashes)
    {
        remainingSerializedHashes = serializedHashes;
        var normalizedCandidate = Normalize(candidate);
        if (string.IsNullOrEmpty(serializedHashes) || normalizedCandidate == null)
        {
            return false;
        }

        List<string>? hashes;
        try
        {
            hashes = JsonSerializer.Deserialize<List<string>>(serializedHashes);
        }
        catch (JsonException)
        {
            // 数据损坏时拒绝恢复码登录，保留原值供管理员排查，不能把异常变成认证绕过。
            return false;
        }

        if (hashes is null || hashes.Count == 0)
        {
            return false;
        }

        var candidateHash = Convert.FromHexString(Hash(normalizedCandidate));
        for (var index = 0; index < hashes.Count; index++)
        {
            if (string.IsNullOrWhiteSpace(hashes[index]))
            {
                continue;
            }

            byte[] storedHash;
            try
            {
                storedHash = Convert.FromHexString(hashes[index]);
            }
            catch (FormatException)
            {
                continue;
            }

            if (!CryptographicOperations.FixedTimeEquals(candidateHash, storedHash))
            {
                continue;
            }

            hashes.RemoveAt(index);
            remainingSerializedHashes = hashes.Count == 0
                ? null
                : JsonSerializer.Serialize(hashes);
            return true;
        }

        return false;
    }

    /// <summary>
    /// 规范化用户输入，允许用户忽略大小写和分组连字符，但不放宽字符集合和长度限制。
    /// </summary>
    private static string? Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var normalized = new string(value
            .Where(character => character != '-' && !char.IsWhiteSpace(character))
            .ToArray())
            .ToUpperInvariant();

        if (normalized.Length != CodeGroupLength * CodeGroupCount
            || normalized.Any(character => !Alphabet.Contains(character)))
        {
            return null;
        }

        return normalized;
    }

    /// <summary>
    /// 生成一个 16 字符恢复码，使用 32 字符字母表避免模偏差。
    /// </summary>
    private static string GenerateCode()
    {
        Span<byte> randomBytes = stackalloc byte[CodeGroupLength * CodeGroupCount];
        RandomNumberGenerator.Fill(randomBytes);
        Span<char> characters = stackalloc char[randomBytes.Length];

        for (var index = 0; index < randomBytes.Length; index++)
        {
            characters[index] = Alphabet[randomBytes[index] & 31];
        }

        var rawCode = new string(characters);
        return string.Join('-', Enumerable.Range(0, CodeGroupCount)
            .Select(group => rawCode.Substring(group * CodeGroupLength, CodeGroupLength)));
    }

    /// <summary>
    /// 计算恢复码摘要；恢复码本身有足够熵，不需要把可逆密钥放进数据库。
    /// </summary>
    private static string Hash(string normalizedCode)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(normalizedCode)));
}
