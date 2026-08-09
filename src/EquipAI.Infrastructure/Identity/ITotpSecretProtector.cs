namespace EquipAI.Infrastructure.Identity;

/// <summary>
/// TOTP 密钥保护接口。
/// TOTP 密钥可被用于生成登录验证码，必须与密码哈希一样避免明文落库。
/// </summary>
public interface ITotpSecretProtector
{
    /// <summary>
    /// 加密明文 TOTP 密钥。
    /// </summary>
    /// <param name="plainTextSecret">明文 Base32 TOTP 密钥。</param>
    /// <returns>带版本前缀的密文。</returns>
    string Protect(string plainTextSecret);

    /// <summary>
    /// 解密数据库中的 TOTP 密钥。
    /// 兼容历史版本的明文值，以便用户成功验证后自动升级存储格式。
    /// </summary>
    /// <param name="storedSecret">数据库中保存的密文或历史明文。</param>
    /// <returns>明文 Base32 TOTP 密钥。</returns>
    string Unprotect(string storedSecret);
}
