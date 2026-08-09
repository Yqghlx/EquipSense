using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace EquipAI.Infrastructure.Cache;

/// <summary>
/// Redis 缓存服务，主要用于存储和管理 JWT 刷新令牌
/// 通过 ConnectionMultiplexer 与 Redis 建立连接，支持异步读写和删除操作
/// </summary>
public class RedisService
{
    private readonly IDatabase _database;

    /// <summary>
    /// 已轮换令牌反向索引值的前缀。值格式 "revoked:{userId}" 表示该 token 曾有效但已被轮换，
    /// 再次提交即为重放，由 <see cref="GetRefreshTokenStateAsync"/> 识别为 <see cref="RefreshTokenStatus.Reused"/>。
    /// </summary>
    private const string RevokedTokenPrefix = "revoked:";

    /// <summary>
    /// 初始化 Redis 服务，从配置中读取连接字符串并建立连接
    /// </summary>
    /// <param name="configuration">应用配置，需包含 Redis:ConnectionString 配置项</param>
    /// <param name="logger">日志记录器</param>
    public RedisService(IConfiguration configuration, ILogger<RedisService> logger)
    {
        var connectionString = configuration["Redis:ConnectionString"];
        if (string.IsNullOrEmpty(connectionString))
        {
            // 配置缺失时使用默认值并记录警告
            logger.LogWarning("Redis 连接字符串未配置（Redis:ConnectionString），使用默认值 localhost:6379");
            connectionString = "localhost:6379";
        }

        var multiplexer = ConnectionMultiplexer.Connect(connectionString);
        _database = multiplexer.GetDatabase();
    }

    /// <summary>
    /// 存储刷新令牌，同时写入反向索引（refresh_token → userId）
    /// 反向索引使 RefreshTokenAsync 可 O(1) 定位用户，无需全表扫描
    ///
    /// 键格式：
    ///   正向：refresh:{userId}        → refreshToken
    ///   反向：refresh_token:{token}   → userId（当前有效）或 "revoked:{userId}"（已轮换墓碑）
    ///
    /// 写入前将该用户旧 token 的反向索引转为"已轮换"墓碑（而非删除），用于检测刷新令牌重放。
    /// </summary>
    /// <param name="userId">用户 ID</param>
    /// <param name="refreshToken">刷新令牌字符串</param>
    /// <param name="expiry">令牌过期时间跨度</param>
    public virtual async Task SetRefreshTokenAsync(Guid userId, string refreshToken, TimeSpan expiry)
    {
        var forwardKey = $"refresh:{userId}";

        // 将旧 token 的反向索引转为"已轮换"墓碑（而非删除），用于检测刷新令牌重放：
        // 若该旧 token 再次被提交，说明同一 token 被两方持有（典型失窃场景），
        // GetRefreshTokenStateAsync 识别为 Reused，AuthService 据此吊销整个会话（OAuth 2.0 BCP）。
        var oldToken = await _database.StringGetAsync(forwardKey);
        if (oldToken.HasValue)
        {
            await _database.StringSetAsync(
                $"refresh_token:{oldToken}", $"{RevokedTokenPrefix}{userId}", expiry);
        }

        // 写入正向索引 + 新 token 反向索引（两条写入均为原子操作；极端宕机时最多出现单向残留，不影响正确性）
        await _database.StringSetAsync(forwardKey, refreshToken, expiry);
        await _database.StringSetAsync($"refresh_token:{refreshToken}", userId.ToString(), expiry);
    }

    /// <summary>
    /// 查询刷新令牌状态（用于重放检测），返回三态：
    /// <list type="bullet">
    /// <item><see cref="RefreshTokenStatus.Unknown"/>：反向索引不存在（从未颁发/已彻底过期）</item>
    /// <item><see cref="RefreshTokenStatus.Valid"/>：当前有效令牌，附带 userId</item>
    /// <item><see cref="RefreshTokenStatus.Reused"/>：曾有效但已被轮换的令牌（墓碑），附带 userId——再次提交即重放</item>
    /// </list>
    /// </summary>
    /// <param name="refreshToken">刷新令牌字符串</param>
    /// <returns>令牌状态条目</returns>
    public virtual async Task<RefreshTokenEntry> GetRefreshTokenStateAsync(string refreshToken)
    {
        var value = await _database.StringGetAsync($"refresh_token:{refreshToken}");
        if (!value.HasValue)
        {
            return RefreshTokenEntry.Unknown();
        }

        var raw = value.ToString();

        // 墓碑值 "revoked:{userId}"：该 token 曾有效但已被轮换，再次提交即为重放
        if (raw.StartsWith(RevokedTokenPrefix, StringComparison.Ordinal))
        {
            var uid = raw[RevokedTokenPrefix.Length..];
            return Guid.TryParse(uid, out var userId)
                ? RefreshTokenEntry.Reused(userId)
                : RefreshTokenEntry.Unknown();
        }

        return Guid.TryParse(raw, out var id)
            ? RefreshTokenEntry.Valid(id)
            : RefreshTokenEntry.Unknown();
    }

    /// <summary>
    /// 根据刷新令牌反向查找对应用户 ID（O(1) Redis 读取）
    /// 返回 null 表示令牌无效或已过期
    /// </summary>
    /// <param name="refreshToken">刷新令牌字符串</param>
    /// <returns>对应的用户 ID，不存在返回 null</returns>
    public virtual async Task<Guid?> GetUserIdByRefreshTokenAsync(string refreshToken)
    {
        var key = $"refresh_token:{refreshToken}";
        var value = await _database.StringGetAsync(key);
        if (!value.HasValue) return null;
        return Guid.TryParse(value.ToString(), out var userId) ? userId : null;
    }

    /// <summary>
    /// 删除指定用户的刷新令牌（正向索引）及其反向索引
    /// 用于令牌吊销或登出场景
    /// </summary>
    /// <param name="userId">用户 ID</param>
    public virtual async Task RemoveRefreshTokenAsync(Guid userId)
    {
        var forwardKey = $"refresh:{userId}";
        // 先读取当前 token 用于清理反向索引
        var currentToken = await _database.StringGetAsync(forwardKey);
        if (currentToken.HasValue)
        {
            await _database.KeyDeleteAsync($"refresh_token:{currentToken}");
        }
        await _database.KeyDeleteAsync(forwardKey);
    }

    /// <summary>
    /// 存储任意字符串值（带过期），用于密码重置 token 等短期凭据
    /// </summary>
    /// <param name="key">缓存键（完整键名，调用方负责命名空间）</param>
    /// <param name="value">字符串值</param>
    /// <param name="expiry">过期时间</param>
    public virtual async Task SetStringAsync(string key, string value, TimeSpan expiry)
    {
        await _database.StringSetAsync(key, value, expiry);
    }

    /// <summary>
    /// 读取任意字符串值，不存在时返回 null
    /// </summary>
    public virtual async Task<string?> GetStringAsync(string key)
    {
        var value = await _database.StringGetAsync(key);
        return value.HasValue ? value.ToString() : null;
    }

    /// <summary>
    /// 原子读取并删除字符串值，适用于一次性挑战令牌和其他不可重放凭据。
    /// 需要 Redis 6.2 及以上版本提供 GETDEL 命令；生产与开发 Compose 均使用 Redis 7。
    /// </summary>
    public virtual async Task<string?> GetAndDeleteStringAsync(string key)
    {
        var value = await _database.StringGetDeleteAsync(key);
        return value.HasValue ? value.ToString() : null;
    }

    /// <summary>
    /// 删除指定键
    /// </summary>
    public virtual async Task RemoveKeyAsync(string key)
    {
        await _database.KeyDeleteAsync(key);
    }

    /// <summary>
    /// 获取租户配额缓存
    /// 键格式：quota:{tenantId}:{resourceType}
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="resourceType">资源类型（device/user）</param>
    /// <returns>缓存的数量值，不存在则返回 null</returns>
    public virtual async Task<int?> GetQuotaCacheAsync(Guid tenantId, string resourceType)
    {
        var key = $"quota:{tenantId}:{resourceType}";
        var value = await _database.StringGetAsync(key);
        return value.HasValue ? (int?)value : null;
    }

    /// <summary>
    /// 设置租户配额缓存
    /// 默认过期时间为 5 分钟，避免缓存与实际数据长时间不一致
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="resourceType">资源类型（device/user）</param>
    /// <param name="count">当前资源数量</param>
    /// <param name="expiry">可选过期时间，默认 5 分钟</param>
    public virtual async Task SetQuotaCacheAsync(Guid tenantId, string resourceType, int count, TimeSpan? expiry = null)
    {
        var key = $"quota:{tenantId}:{resourceType}";
        await _database.StringSetAsync(key, count, expiry ?? TimeSpan.FromMinutes(5));
    }

    /// <summary>
    /// 使租户配额缓存失效
    /// 在创建/删除资源后调用，确保下次查询获取最新数据
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="resourceType">资源类型（device/user）</param>
    public virtual async Task InvalidateQuotaCacheAsync(Guid tenantId, string resourceType)
    {
        var key = $"quota:{tenantId}:{resourceType}";
        await _database.KeyDeleteAsync(key);
    }
}

/// <summary>
/// 刷新令牌在 Redis 反向索引中的三态，用于重放检测
/// </summary>
public enum RefreshTokenStatus
{
    /// <summary>反向索引不存在：令牌从未颁发或已彻底过期/清理</summary>
    Unknown,

    /// <summary>当前有效的令牌（反向索引值为 userId）</summary>
    Valid,

    /// <summary>曾有效但已被轮换的令牌（反向索引值为 "revoked:{userId}" 墓碑）。
    /// 再次提交即说明同一 token 被两方持有，按 OAuth 2.0 BCP 吊销整个会话</summary>
    Reused,
}

/// <summary>
/// <see cref="RedisService.GetRefreshTokenStateAsync"/> 的返回结果，携带状态与（有效/重用时的）用户 ID
/// </summary>
/// <param name="Status">令牌状态</param>
/// <param name="UserId">Valid/Reused 时的用户 ID；Unknown 时为 null</param>
public readonly record struct RefreshTokenEntry(RefreshTokenStatus Status, Guid? UserId)
{
    /// <summary>构造 Unknown 状态</summary>
    public static RefreshTokenEntry Unknown() => new(RefreshTokenStatus.Unknown, null);

    /// <summary>构造 Valid 状态</summary>
    public static RefreshTokenEntry Valid(Guid userId) => new(RefreshTokenStatus.Valid, userId);

    /// <summary>构造 Reused 状态</summary>
    public static RefreshTokenEntry Reused(Guid userId) => new(RefreshTokenStatus.Reused, userId);
}
