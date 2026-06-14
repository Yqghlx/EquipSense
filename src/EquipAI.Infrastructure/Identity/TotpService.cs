using System.Security.Cryptography;
using OtpNet;

namespace EquipAI.Infrastructure.Identity;

/// <summary>
/// TOTP 服务接口，提供 TOTP 密钥生成、QR 码 URI 构建和验证码校验
/// </summary>
public interface ITotpService
{
    /// <summary>
    /// 生成新的 TOTP 密钥（Base32 编码，20 字节随机）
    /// </summary>
    /// <returns>Base32 编码的密钥字符串</returns>
    string GenerateSecret();

    /// <summary>
    /// 构建 otpauth:// URI，供 authenticator 应用扫码绑定
    /// 格式：otpauth://totp/{issuer}:{account}?secret={secret}&issuer={issuer}&algorithm=SHA1&digits=6&period=30
    /// </summary>
    /// <param name="secret">Base32 编码的 TOTP 密钥</param>
    /// <param name="account">用户账户标识（通常为用户名或邮箱）</param>
    /// <param name="issuer">发行方名称（显示在 authenticator 应用中，如 "EquipSense"）</param>
    /// <returns>otpauth URI 字符串</returns>
    string BuildQrCodeUri(string secret, string account, string issuer);

    /// <summary>
    /// 校验 TOTP 验证码
    /// 使用 RFC 6238 标准算法，允许 ±1 步时间窗口偏移（共验证 3 个时间步）
    /// </summary>
    /// <param name="secret">Base32 编码的 TOTP 密钥</param>
    /// <param name="code">用户提供的 6 位数字验证码</param>
    /// <returns>验证码是否有效</returns>
    bool VerifyCode(string secret, string code);
}

/// <summary>
/// TOTP 服务实现，基于 Otp.NET 库
///
/// 安全说明：
/// - 密钥生成使用 RNGCryptoServiceProvider（CSPRNG，密码学安全随机数）
/// - 验证码校验允许 ±1 步偏移，容忍客户端/服务器轻微时钟偏差（±30 秒）
/// - 密钥以 Base32 编码存储，兼容 Google Authenticator / Microsoft Authenticator 等主流 authenticator
/// </summary>
public class TotpService : ITotpService
{
    /// <summary>
    /// TOTP 密钥长度（字节），符合 RFC 4226 推荐的 160 位（20 字节）最小值
    /// </summary>
    private const int SecretByteLength = 20;

    /// <summary>
    /// 生成新的 TOTP 密钥
    /// 使用 RandomNumberGenerator 保证密码学安全的随机性
    /// </summary>
    public string GenerateSecret()
    {
        var secretBytes = RandomNumberGenerator.GetBytes(SecretByteLength);
        // Base32 编码（无 padding），与 RFC 4226 兼容
        return Base32Encoding.ToString(secretBytes);
    }

    /// <summary>
    /// 构建 otpauth:// URI
    /// URI 格式遵循 Key URI Format 规范（https://github.com/google/google-authenticator/wiki/Key-Uri-Format）
    /// account 和 issuer 中的特殊字符需进行 URL 编码，防止 URI 解析错误
    /// </summary>
    public string BuildQrCodeUri(string secret, string account, string issuer)
    {
        // 对 account 和 issuer 进行 URL 编码（处理 @、空格等特殊字符）
        var encodedAccount = Uri.EscapeDataString(account);
        var encodedIssuer = Uri.EscapeDataString(issuer);

        return $"otpauth://totp/{encodedIssuer}:{encodedAccount}" +
               $"?secret={secret}" +
               $"&issuer={encodedIssuer}" +
               $"&algorithm=SHA1" +
               $"&digits=6" +
               $"&period=30";
    }

    /// <summary>
    /// 校验 TOTP 验证码
    ///
    /// 窗口偏移说明：
    /// - windowSeconds = 30（允许前后各 30 秒，共 3 个有效码）
    /// - 容忍客户端/服务器时钟偏差最多 30 秒
    /// - 过大的窗口会降低安全性（增大暴力破解概率），30 秒是业界推荐值
    /// </summary>
    public bool VerifyCode(string secret, string code)
    {
        if (string.IsNullOrWhiteSpace(secret) || string.IsNullOrWhiteSpace(code))
        {
            return false;
        }

        try
        {
            var secretBytes = Base32Encoding.ToBytes(secret);
            var totp = new Totp(secretBytes);

            // 校验验证码，允许 ±1 步时间窗口偏移
            // verificationWindow 默认即为前后 1 步（共 3 个有效码）
            return totp.VerifyTotp(code, out _, new VerificationWindow(previous: 1, future: 1));
        }
        catch
        {
            // 密钥格式错误（非 Base32）或验证码格式异常，统一返回 false
            return false;
        }
    }
}
