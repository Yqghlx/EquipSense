namespace EquipAI.Infrastructure.Identity;

/// <summary>
/// 密码哈希工具类，使用 BCrypt 算法进行密码加密与验证
/// 静态类设计，无需实例化即可使用
/// </summary>
public static class PasswordHasher
{
    /// <summary>
    /// 对明文密码进行 BCrypt 哈希处理
    /// BCrypt 自动生成盐值并嵌入哈希结果中，每次调用产生不同的哈希值
    /// </summary>
    /// <param name="password">明文密码</param>
    /// <returns>BCrypt 哈希字符串</returns>
    public static string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    /// <summary>
    /// 验证明文密码与 BCrypt 哈希是否匹配
    /// </summary>
    /// <param name="password">用户输入的明文密码</param>
    /// <param name="hash">数据库中存储的 BCrypt 哈希值</param>
    /// <returns>匹配返回 true，不匹配返回 false</returns>
    public static bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }
}
