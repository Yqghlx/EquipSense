namespace EquipAI.Core.Extensions;

/// <summary>
/// DateTime 安全扩展
///
/// 根因：PostgreSQL 的 timestamp with time zone 列要求 DateTime.Kind 为 Utc 或 Local，
/// 否则 Npgsql 抛 ArgumentException。项目中 DateTime 从多个入口进入（query string、
/// JSON 反序列化、new DateTime(...) 构造），Kind 可能是 Unspecified，直接查库会崩。
///
/// 此扩展提供统一的安全转换，在所有数据入库点调用 ToSafeUtc() 根治此类问题。
/// </summary>
public static class DateTimeExtensions
{
    /// <summary>
    /// 将 DateTime 转换为 Kind=Utc，供 PostgreSQL timestamptz 列使用。
    /// - Kind=Utc: 原样返回
    /// - Kind=Local: 按本地时区转为 Utc
    /// - Kind=Unspecified: 假定为 Utc（最常见场景：API 入参/JSON 反序列化的 UTC 时间戳）
    /// </summary>
    public static DateTime ToSafeUtc(this DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc),
        };
    }

    /// <summary>Nullable 版本 — null 原样返回，否则 ToSafeUtc</summary>
    public static DateTime? ToSafeUtc(this DateTime? value)
        => value.HasValue ? value.Value.ToSafeUtc() : null;
}
