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
    /// 已轮换令牌反向索引值的前缀。值格式 "revoked|{userId}|{sessionId}|{generation}" 表示该 token 曾有效但已被轮换，
    /// 再次提交即为重放，由 <see cref="GetRefreshTokenStateAsync"/> 识别为 <see cref="RefreshTokenStatus.Reused"/>。
    /// </summary>
    private const string RevokedTokenPrefix = "revoked|";

    /// <summary>
    /// 兼容旧调用方的会话标识。新认证流程会为每次登录生成独立的随机会话标识。
    /// </summary>
    public const string LegacySessionId = "legacy";

    /// <summary>按用户和会话保存当前刷新令牌的 Redis 键前缀。</summary>
    private const string RefreshSessionKeyPrefix = "refresh_session:";

    /// <summary>按用户保存刷新令牌全局吊销代数的 Redis 键前缀。</summary>
    private const string RefreshGenerationKeyPrefix = "refresh_generation:";

    /// <summary>刷新令牌索引记录的字段分隔符；令牌、会话标识均为 GUID，不会包含该字符。</summary>
    private const string RefreshRecordSeparator = "|";

    /// <summary>
    /// 初始化 Redis 服务，复用依赖注入容器管理的连接多路复用器。
    /// ConnectionMultiplexer 应在应用进程内单例复用；每个服务自行 Connect 会创建额外连接池，
    /// 在高并发或多副本部署中会放大 Redis 连接数，并且难以由容器统一释放。
    /// </summary>
    /// <param name="multiplexer">由依赖注入容器管理的 Redis 连接多路复用器</param>
    /// <param name="logger">日志记录器</param>
    public RedisService(IConnectionMultiplexer multiplexer, ILogger<RedisService> logger)
    {
        ArgumentNullException.ThrowIfNull(multiplexer);
        _database = multiplexer.GetDatabase();
    }

    /// <summary>
    /// 为测试替身和需要继承 RedisService 的兼容场景保留的配置构造函数。
    /// 生产应用由公开构造函数注入共享连接，不会走此路径。
    /// </summary>
    /// <param name="configuration">应用配置，需包含 Redis:ConnectionString 配置项</param>
    /// <param name="logger">日志记录器</param>
    protected RedisService(IConfiguration configuration, ILogger<RedisService> logger)
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
    /// 存储兼容旧调用方的刷新令牌。
    /// 认证服务的新代码应调用包含 sessionId 的重载，以便同一用户的多个设备各自维护会话。
    /// </summary>
    /// <param name="userId">用户 ID</param>
    /// <param name="refreshToken">刷新令牌字符串</param>
    /// <param name="expiry">令牌过期时间跨度</param>
    public virtual Task SetRefreshTokenAsync(Guid userId, string refreshToken, TimeSpan expiry)
    {
        return SetRefreshTokenAsync(userId, LegacySessionId, refreshToken, expiry);
    }

    /// <summary>
    /// 按用户会话存储刷新令牌，同时写入反向索引。
    ///
    /// 键格式：
    ///   正向：refresh_session:{userId}:{sessionId} → refreshToken|generation
    ///   反向：refresh_token:{token} → userId|sessionId|generation
    ///   重放墓碑：refresh_token:{token} → revoked|userId|sessionId|generation
    ///
    /// 刷新令牌按会话隔离，登录新设备不会覆盖旧设备的令牌；同一会话内轮换仍保留墓碑，
    /// 用于识别被盗令牌重放。全局吊销通过用户代数 O(1) 失效全部会话，不需要扫描 Redis。
    /// </summary>
    /// <param name="userId">用户 ID</param>
    /// <param name="sessionId">会话 ID</param>
    /// <param name="refreshToken">刷新令牌字符串</param>
    /// <param name="expiry">令牌过期时间跨度</param>
    public virtual async Task SetRefreshTokenAsync(
        Guid userId,
        string sessionId,
        string refreshToken,
        TimeSpan expiry)
    {
        if (string.IsNullOrWhiteSpace(sessionId) || sessionId.Contains(RefreshRecordSeparator, StringComparison.Ordinal))
        {
            throw new ArgumentException("刷新令牌会话标识无效", nameof(sessionId));
        }

        if (string.IsNullOrWhiteSpace(refreshToken) || refreshToken.Contains(RefreshRecordSeparator, StringComparison.Ordinal))
        {
            throw new ArgumentException("刷新令牌无效", nameof(refreshToken));
        }

        var generation = await GetOrCreateRefreshGenerationAsync(userId, expiry);
        var sessionKey = GetRefreshSessionKey(userId, sessionId);
        var oldToken = await GetRawSessionTokenAsync(userId, sessionId);

        // 仅同一会话内的旧令牌转为墓碑；不同设备的令牌互不覆盖。
        if (!string.IsNullOrWhiteSpace(oldToken) && !string.Equals(oldToken, refreshToken, StringComparison.Ordinal))
        {
            await _database.StringSetAsync(
                $"refresh_token:{oldToken}",
                $"{RevokedTokenPrefix}{userId}{RefreshRecordSeparator}{sessionId}{RefreshRecordSeparator}{generation}",
                expiry);
        }

        await _database.StringSetAsync(
            sessionKey,
            $"{refreshToken}{RefreshRecordSeparator}{generation}",
            expiry);
        await _database.StringSetAsync(
            $"refresh_token:{refreshToken}",
            $"{userId}{RefreshRecordSeparator}{sessionId}{RefreshRecordSeparator}{generation}",
            expiry);

        // 保留旧正向键，便于旧版测试替身和外部兼容调用方平滑过渡；正式认证流程不再读取该键。
        if (sessionId == LegacySessionId)
        {
            await _database.StringSetAsync($"refresh:{userId}", refreshToken, expiry);
        }
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

        // 兼容旧版墓碑值 "revoked:{userId}"。
        if (raw.StartsWith("revoked:", StringComparison.Ordinal))
        {
            var uid = raw["revoked:".Length..];
            return Guid.TryParse(uid, out var userId)
                ? RefreshTokenEntry.Reused(userId, LegacySessionId)
                : RefreshTokenEntry.Unknown();
        }

        var fields = raw.Split(RefreshRecordSeparator, StringSplitOptions.None);
        var isRevoked = fields.Length == 4
            && string.Equals(fields[0], RevokedTokenPrefix.TrimEnd('|'), StringComparison.Ordinal);
        var offset = isRevoked ? 1 : 0;

        if ((fields.Length != 3 && !isRevoked) || (isRevoked && fields.Length != 4)
            || !Guid.TryParse(fields[offset], out var id)
            || string.IsNullOrWhiteSpace(fields[offset + 1])
            || string.IsNullOrWhiteSpace(fields[offset + 2]))
        {
            // 兼容旧版有效值：反向索引直接保存 userId。
            return Guid.TryParse(raw, out var legacyId)
                ? RefreshTokenEntry.Valid(legacyId, LegacySessionId)
                : RefreshTokenEntry.Unknown();
        }

        // 用户级全局吊销只需更新 generation，避免为每个设备做 O(N) 删除。
        if (!await IsRefreshGenerationCurrentAsync(id, fields[offset + 2]))
        {
            return RefreshTokenEntry.Unknown();
        }

        return isRevoked
            ? RefreshTokenEntry.Reused(id, fields[2])
            : RefreshTokenEntry.Valid(id, fields[1]);
    }

    /// <summary>
    /// 根据刷新令牌反向查找对应用户 ID（O(1) Redis 读取）
    /// 返回 null 表示令牌无效或已过期
    /// </summary>
    /// <param name="refreshToken">刷新令牌字符串</param>
    /// <returns>对应的用户 ID，不存在返回 null</returns>
    public virtual async Task<Guid?> GetUserIdByRefreshTokenAsync(string refreshToken)
    {
        var state = await GetRefreshTokenStateAsync(refreshToken);
        return state.Status == RefreshTokenStatus.Valid ? state.UserId : null;
    }

    /// <summary>
    /// 获取指定用户会话当前有效的刷新令牌。
    /// 当用户级 generation 已变化时返回 null，确保密码变更、管理员吊销等操作立即使全部会话失效。
    /// </summary>
    /// <param name="userId">用户 ID</param>
    /// <param name="sessionId">会话 ID</param>
    /// <returns>当前刷新令牌，不存在或已吊销时返回 null</returns>
    public virtual async Task<string?> GetRefreshTokenForSessionAsync(Guid userId, string sessionId)
    {
        var raw = await _database.StringGetAsync(GetRefreshSessionKey(userId, sessionId));
        if (!raw.HasValue && sessionId == LegacySessionId)
        {
            raw = await _database.StringGetAsync($"refresh:{userId}");
        }

        if (!raw.HasValue)
        {
            return null;
        }

        var fields = raw.ToString().Split(RefreshRecordSeparator, StringSplitOptions.None);
        if (fields.Length == 1)
        {
            return fields[0];
        }

        if (fields.Length != 2 || string.IsNullOrWhiteSpace(fields[0])
            || !await IsRefreshGenerationCurrentAsync(userId, fields[1]))
        {
            return null;
        }

        return fields[0];
    }

    /// <summary>
    /// 删除指定用户的一个刷新令牌会话。
    /// 用于当前浏览器登出或该会话发生刷新令牌重放时，不影响用户的其他设备。
    /// </summary>
    /// <param name="userId">用户 ID</param>
    /// <param name="sessionId">会话 ID</param>
    public virtual async Task RemoveRefreshTokenSessionAsync(Guid userId, string sessionId)
    {
        var sessionKey = GetRefreshSessionKey(userId, sessionId);
        var raw = await _database.StringGetAsync(sessionKey);
        string? token = null;

        if (raw.HasValue)
        {
            token = raw.ToString().Split(RefreshRecordSeparator, StringSplitOptions.None)[0];
        }
        else if (sessionId == LegacySessionId)
        {
            var legacyToken = await _database.StringGetAsync($"refresh:{userId}");
            token = legacyToken.HasValue ? legacyToken.ToString() : null;
        }

        if (!string.IsNullOrWhiteSpace(token))
        {
            await _database.KeyDeleteAsync($"refresh_token:{token}");
        }

        await _database.KeyDeleteAsync(sessionKey);
        if (sessionId == LegacySessionId)
        {
            await _database.KeyDeleteAsync($"refresh:{userId}");
        }
    }

    /// <summary>
    /// 全局吊销指定用户的刷新令牌。
    /// 通过更新用户 generation O(1) 使全部会话失效；新登录会沿用新 generation，不会被旧吊销标记阻断。
    /// </summary>
    /// <param name="userId">用户 ID</param>
    public virtual async Task RemoveRefreshTokenAsync(Guid userId)
    {
        await _database.StringSetAsync(
            GetRefreshGenerationKey(userId),
            Guid.NewGuid().ToString("N"),
            TimeSpan.FromDays(7));
        await RemoveRefreshTokenSessionAsync(userId, LegacySessionId);
    }

    /// <summary>生成或读取用户当前刷新令牌代数。</summary>
    private async Task<string> GetOrCreateRefreshGenerationAsync(Guid userId, TimeSpan expiry)
    {
        var generationKey = GetRefreshGenerationKey(userId);
        var existing = await _database.StringGetAsync(generationKey);
        if (existing.HasValue && !string.IsNullOrWhiteSpace(existing.ToString()))
        {
            await _database.KeyExpireAsync(generationKey, expiry);
            return existing.ToString();
        }

        var generation = Guid.NewGuid().ToString("N");
        var created = await _database.StringSetAsync(
            generationKey,
            generation,
            expiry,
            When.NotExists);
        if (created)
        {
            return generation;
        }

        var observed = await _database.StringGetAsync(generationKey);
        return observed.HasValue && !string.IsNullOrWhiteSpace(observed.ToString())
            ? observed.ToString()
            : generation;
    }

    /// <summary>读取指定会话当前记录中的令牌，不做代数校验，仅用于轮换前写入墓碑。</summary>
    private async Task<string?> GetRawSessionTokenAsync(Guid userId, string sessionId)
    {
        var raw = await _database.StringGetAsync(GetRefreshSessionKey(userId, sessionId));
        if (!raw.HasValue && sessionId == LegacySessionId)
        {
            raw = await _database.StringGetAsync($"refresh:{userId}");
        }

        return raw.HasValue
            ? raw.ToString().Split(RefreshRecordSeparator, StringSplitOptions.None)[0]
            : null;
    }

    /// <summary>检查记录代数是否仍为用户当前代数；没有代数键时兼容旧数据并视为有效。</summary>
    private async Task<bool> IsRefreshGenerationCurrentAsync(Guid userId, string generation)
    {
        var current = await _database.StringGetAsync(GetRefreshGenerationKey(userId));
        return !current.HasValue || string.Equals(current.ToString(), generation, StringComparison.Ordinal);
    }

    private static string GetRefreshSessionKey(Guid userId, string sessionId)
        => $"{RefreshSessionKeyPrefix}{userId}:{sessionId}";

    private static string GetRefreshGenerationKey(Guid userId)
        => $"{RefreshGenerationKeyPrefix}{userId}";

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

    /// <summary>曾有效但已被轮换的令牌（反向索引值为 revoked 墓碑）。
    /// 再次提交即说明同一 token 被两方持有，按 OAuth 2.0 BCP 吊销当前会话</summary>
    Reused,
}

/// <summary>
/// <see cref="RedisService.GetRefreshTokenStateAsync"/> 的返回结果，携带状态与（有效/重用时的）用户 ID
/// </summary>
/// <param name="Status">令牌状态</param>
/// <param name="UserId">Valid/Reused 时的用户 ID；Unknown 时为 null</param>
/// <param name="SessionId">Valid/Reused 时的会话 ID；旧数据使用 legacy</param>
public readonly record struct RefreshTokenEntry(
    RefreshTokenStatus Status,
    Guid? UserId,
    string? SessionId = null)
{
    /// <summary>构造 Unknown 状态</summary>
    public static RefreshTokenEntry Unknown() => new(RefreshTokenStatus.Unknown, null);

    /// <summary>构造 Valid 状态</summary>
    public static RefreshTokenEntry Valid(Guid userId, string? sessionId = null)
        => new(RefreshTokenStatus.Valid, userId, sessionId);

    /// <summary>构造 Reused 状态</summary>
    public static RefreshTokenEntry Reused(Guid userId, string? sessionId = null)
        => new(RefreshTokenStatus.Reused, userId, sessionId);
}
