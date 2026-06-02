using Microsoft.Extensions.Configuration;
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
    /// 初始化 Redis 服务，从配置中读取连接字符串并建立连接
    /// </summary>
    /// <param name="configuration">应用配置，需包含 Redis:ConnectionString 配置项</param>
    public RedisService(IConfiguration configuration)
    {
        var connectionString = configuration["Redis:ConnectionString"]
            ?? "localhost:6379";

        var multiplexer = ConnectionMultiplexer.Connect(connectionString);
        _database = multiplexer.GetDatabase();
    }

    /// <summary>
    /// 存储刷新令牌，以用户 ID 为键，设置过期时间
    /// 键格式：refresh:{userId}
    /// </summary>
    /// <param name="userId">用户 ID</param>
    /// <param name="refreshToken">刷新令牌字符串</param>
    /// <param name="expiry">令牌过期时间跨度</param>
    public virtual async Task SetRefreshTokenAsync(Guid userId, string refreshToken, TimeSpan expiry)
    {
        var key = $"refresh:{userId}";
        await _database.StringSetAsync(key, refreshToken, expiry);
    }

    /// <summary>
    /// 获取指定用户的刷新令牌
    /// </summary>
    /// <param name="userId">用户 ID</param>
    /// <returns>刷新令牌字符串，若不存在或已过期则返回 null</returns>
    public virtual async Task<string?> GetRefreshTokenAsync(Guid userId)
    {
        var key = $"refresh:{userId}";
        var value = await _database.StringGetAsync(key);
        return value.HasValue ? value.ToString() : null;
    }

    /// <summary>
    /// 删除指定用户的刷新令牌，用于令牌吊销或刷新后作废旧令牌
    /// </summary>
    /// <param name="userId">用户 ID</param>
    public virtual async Task RemoveRefreshTokenAsync(Guid userId)
    {
        var key = $"refresh:{userId}";
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
