namespace EquipAI.Core.Interfaces;

/// <summary>
/// 用户联系方式的应用层保护接口。
/// 
/// 实体在内存中仍使用业务明文；实现负责将其转换为数据库密文，并生成只用于等值查找的盲索引。
/// </summary>
public interface IPiiProtector
{
    /// <summary>
    /// 用于 EF Core 模型缓存分区的密钥指纹，不包含可还原密钥材料。
    /// </summary>
    string ModelCacheKey { get; }

    /// <summary>
    /// 按字段规则规范化联系方式。
    /// </summary>
    /// <param name="field">字段名：email 或 phone。</param>
    /// <param name="value">原始联系方式。</param>
    /// <returns>规范化后的值；空输入返回 null。</returns>
    string? Normalize(string field, string? value);

    /// <summary>
    /// 使用随机 nonce 加密联系方式。
    /// </summary>
    /// <param name="value">内存中的业务明文。</param>
    /// <returns>带版本前缀的密文；空输入返回 null。</returns>
    string? Protect(string? value);

    /// <summary>
    /// 解密数据库中的联系方式密文。
    /// </summary>
    /// <param name="storedValue">数据库密文。</param>
    /// <returns>业务明文；空输入返回 null。</returns>
    /// <exception cref="System.Security.Cryptography.CryptographicException">密文格式无效或认证失败。</exception>
    string? Unprotect(string? storedValue);

    /// <summary>
    /// 为规范化联系方式生成字段隔离的 HMAC 盲索引。
    /// </summary>
    /// <param name="field">字段名：email 或 phone。</param>
    /// <param name="value">原始联系方式。</param>
    /// <returns>64 位小写十六进制摘要；空输入返回 null。</returns>
    string? CreateLookupHash(string field, string? value);
}
