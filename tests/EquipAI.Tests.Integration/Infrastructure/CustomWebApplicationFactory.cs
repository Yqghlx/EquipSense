using EquipAI.Infrastructure.Cache;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Seeding;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace EquipAI.Tests.Integration.Infrastructure;

/// <summary>
/// 集成测试的 WebApplicationFactory，使用 SQLite 内存数据库替代 PostgreSQL，
/// 并用模拟的 Redis 服务替代真实的 Redis 连接，确保测试环境完全自包含。
/// 使用 TestAppDbContext 子类将 jsonb 列类型映射替换为 TEXT，解决 SQLite 兼容性问题。
/// </summary>
public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    /// <summary>
    /// 命名内存数据库需要一个保持打开的锚点连接，否则数据库会被销毁。
    /// 锚点只负责维持数据库生命周期，业务 DbContext 均通过连接字符串创建独立连接，避免并发复用同一连接实例。
    /// </summary>
    private const string SqliteConnectionString = "Data Source=EquipAIIntegration;Mode=Memory;Cache=Shared";
    private static readonly Microsoft.Data.Sqlite.SqliteConnection _sqliteKeepAliveConnection;

    /// <summary>
    /// 标记数据库 schema 是否已初始化，避免重复创建
    /// </summary>
    private static bool _databaseCreated;

    static CustomWebApplicationFactory()
    {
        // 创建并打开 SQLite 内存连接
        _sqliteKeepAliveConnection = new Microsoft.Data.Sqlite.SqliteConnection(SqliteConnectionString);
        _sqliteKeepAliveConnection.Open();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        // 测试环境显式注入仅用于测试的长密钥，避免依赖 appsettings.json 中的占位符。
        // 生产环境密钥仍由环境变量提供，测试凭据不会进入运行配置或仓库秘密。
        builder.UseSetting("Jwt:Secret", "integration-test-jwt-secret-at-least-32-characters");
        builder.UseSetting("Gateway:AuthKey", "integration-test-gateway-key-at-least-32-characters");

        builder.ConfigureServices(services =>
        {
            // 替换真实的 DbContext 为 SQLite 内存数据库
            // 使用 TestAppDbContext 子类覆写 OnModelCreating，将 jsonb 映射替换为 TEXT
            // 注意：必须先注册 DbContextOptions，再注册 AppDbContext 的工厂
            services.RemoveAll(typeof(DbContextOptions<AppDbContext>));
            services.RemoveAll<AppDbContext>();

            // 注册 DbContextOptions<AppDbContext>，使用 SQLite 连接
            services.AddSingleton(new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite(SqliteConnectionString)
                .Options);

            // 注册 AppDbContext 工厂，创建 TestAppDbContext 实例
            services.AddScoped<AppDbContext>(sp =>
            {
                var options = sp.GetRequiredService<DbContextOptions<AppDbContext>>();
                var tenantContext = sp.GetRequiredService<EquipAI.Core.Interfaces.ITenantContext>();
                return new TestAppDbContext(options, tenantContext);
            });

            // 替换 AppReadDbContext（CQRS 只读上下文）为 SQLite 内存，与 AppDbContext 共享连接
            // 未替换时生产注册用 Npgsql 连 ReadOnly 连接串，测试环境无 PG → 查询 500
            services.RemoveAll(typeof(DbContextOptions<AppReadDbContext>));
            services.RemoveAll<AppReadDbContext>();
            services.AddSingleton(new DbContextOptionsBuilder<AppReadDbContext>()
                .UseSqlite(SqliteConnectionString)
                .Options);
            services.AddScoped<AppReadDbContext>(sp =>
            {
                var options = sp.GetRequiredService<DbContextOptions<AppReadDbContext>>();
                var tenantContext = sp.GetRequiredService<EquipAI.Core.Interfaces.ITenantContext>();
                return new TestAppReadDbContext(options, tenantContext);
            });

            // 移除真实的 RedisService，替换为不依赖 Redis 连接的存根
            // RedisService 构造函数会尝试连接 Redis，在测试环境中不可用
            services.RemoveAll<RedisService>();
            services.AddSingleton<RedisService>(sp =>
            {
                // 使用 RuntimeHelpers.GetUninitializedObject 创建实例，绕过构造函数中的 Redis 连接
                // RedisService 的方法已标记为 virtual，FakeRedisService 重写了所有方法
                // 因此基类的 _database 字段不会被访问
#pragma warning disable SYSLIB0050 // FormatterServices.GetUninitializedObject 在 .NET 8 中标记为过时但仍可用
                var instance = (FakeRedisService)System.Runtime.Serialization
                    .FormatterServices.GetUninitializedObject(typeof(FakeRedisService))!;
#pragma warning restore SYSLIB0050
                return instance;
            });

            // 移除真实的 IConnectionMultiplexer，避免启动时连接 Redis（生产注册在 ServiceCollectionExtensions）
            // ConnectionMultiplexer.Connect 在测试环境会立即失败抛 RedisConnectionException
            // 测试环境无组件解析 IConnectionMultiplexer（唯一消费者 RedisDistributedLockProvider 已被下方存根替换）
            services.RemoveAll<StackExchange.Redis.IConnectionMultiplexer>();

            // 告警聚合在测试环境使用 AlertAggregator 的本地降级窗口，避免新增的 Redis 共享状态存储
            // 因缺少真实多路复用器而尝试建立外部连接；Redis 共享计数由单元测试单独覆盖。
            services.RemoveAll<EquipAI.Core.Interfaces.IAlertAggregationStateStore>();

            // 分布式锁：单实例测试环境用总是可获取的存根（无真实 Redis 依赖）
            services.RemoveAll<EquipAI.Core.Interfaces.IDistributedLockProvider>();
            services.AddSingleton<EquipAI.Core.Interfaces.IDistributedLockProvider, AlwaysAcquireLockProvider>();

            // 注册种子数据服务
            services.AddScoped<DataSeeder>();
        });
    }

    /// <summary>
    /// 初始化种子数据并返回 HttpClient
    /// 首次调用时通过 EnsureCreatedAsync 创建 SQLite schema，后续调用只重置种子数据
    /// </summary>
    public async Task<HttpClient> CreateClientWithSeedAsync()
    {
        var client = CreateClient();
        using var scope = Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 首次调用时创建数据库 schema。
        // 测试环境使用 EnsureCreatedAsync 而非生产迁移，因为：
        // 1. EnsureCreatedAsync 基于 OnModelCreating 的模型创建表，不依赖 migration SQL
        // 2. Migration 是为 Npgsql 生成的，包含 PG 特有语法（如 text[]），SQLite 无法执行
        // 3. Program.cs 在 Testing 环境跳过生产迁移，避免污染 SQLite 的迁移历史
        if (!_databaseCreated)
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite(SqliteConnectionString)
                .Options;
            using var initContext = new TestAppDbContext(options,
                scope.ServiceProvider.GetRequiredService<EquipAI.Core.Interfaces.ITenantContext>());
            await initContext.Database.EnsureCreatedAsync();

            _databaseCreated = true;
        }

        var seeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
        await seeder.SeedAsync();
        return client;
    }
}

/// <summary>
/// Redis 服务的内存替代实现，用于集成测试环境
/// 使用 ConcurrentDictionary 存储刷新令牌，避免依赖真实的 Redis 服务
/// 继承 RedisService 并重写其虚方法，通过反射创建实例绕过 Redis 连接
/// </summary>
internal class FakeRedisService : RedisService
{
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, string> _store = new();

    /// <summary>
    /// 注意：此构造函数不应被直接调用
    /// 在 CustomWebApplicationFactory 中通过 FormatterServices.GetUninitializedObject 创建实例
    /// </summary>
    private FakeRedisService()
        : base(CreateDummyConfig(), Microsoft.Extensions.Logging.Abstractions.NullLogger<RedisService>.Instance)
    {
    }

    /// <summary>
    /// 创建一个后备配置，仅在反射创建失败时使用
    /// </summary>
    private static IConfiguration CreateDummyConfig()
    {
        var builder = new ConfigurationBuilder();
        builder.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Redis:ConnectionString"] = "127.0.0.1:1,abortConnect=true,connectTimeout=1"
        });
        return builder.Build();
    }

    public override Task SetRefreshTokenAsync(Guid userId, string refreshToken, TimeSpan expiry)
        => SetRefreshTokenAsync(userId, RedisService.LegacySessionId, refreshToken, expiry);

    public override Task SetRefreshTokenAsync(
        Guid userId,
        string sessionId,
        string refreshToken,
        TimeSpan expiry)
    {
        var generation = _store.GetOrAdd(
            $"refresh_generation:{userId}",
            _ => Guid.NewGuid().ToString("N"));
        var sessionKey = $"refresh_session:{userId}:{sessionId}";
        if (_store.TryGetValue(sessionKey, out var oldRecord))
        {
            var oldToken = oldRecord.Split('|', StringSplitOptions.None)[0];
            _store[$"refresh_token:{oldToken}"] = $"revoked|{userId}|{sessionId}|{generation}";
        }
        _store[sessionKey] = $"{refreshToken}|{generation}";
        _store[$"refresh_token:{refreshToken}"] = $"{userId}|{sessionId}|{generation}";
        if (sessionId == RedisService.LegacySessionId)
        {
            _store[$"refresh:{userId}"] = refreshToken;
        }
        return Task.CompletedTask;
    }

    public override Task<RefreshTokenEntry> GetRefreshTokenStateAsync(string refreshToken)
    {
        if (!_store.TryGetValue($"refresh_token:{refreshToken}", out var raw))
        {
            return Task.FromResult(RefreshTokenEntry.Unknown());
        }
        if (raw.StartsWith("revoked:", StringComparison.Ordinal))
        {
            var uid = raw["revoked:".Length..];
            return Task.FromResult(Guid.TryParse(uid, out var userId)
                ? RefreshTokenEntry.Reused(userId, RedisService.LegacySessionId)
                : RefreshTokenEntry.Unknown());
        }

        var fields = raw.Split('|', StringSplitOptions.None);
        if (fields.Length == 4 && fields[0] == "revoked"
            && Guid.TryParse(fields[1], out var reusedUserId))
        {
            return Task.FromResult(RefreshTokenEntry.Reused(reusedUserId, fields[2]));
        }

        if (fields.Length == 3 && Guid.TryParse(fields[0], out var validUserId)
            && !string.IsNullOrWhiteSpace(fields[1])
            && _store.TryGetValue($"refresh_generation:{validUserId}", out var currentGeneration)
            && currentGeneration == fields[2])
        {
            return Task.FromResult(RefreshTokenEntry.Valid(validUserId, fields[1]));
        }

        return Task.FromResult(Guid.TryParse(raw, out var id)
            ? RefreshTokenEntry.Valid(id, RedisService.LegacySessionId)
            : RefreshTokenEntry.Unknown());
    }

    public override async Task<Guid?> GetUserIdByRefreshTokenAsync(string refreshToken)
    {
        var state = await GetRefreshTokenStateAsync(refreshToken);
        return state.Status == RefreshTokenStatus.Valid ? state.UserId : null;
    }

    public override Task<string?> GetRefreshTokenForSessionAsync(Guid userId, string sessionId)
    {
        var sessionKey = $"refresh_session:{userId}:{sessionId}";
        if (_store.TryGetValue(sessionKey, out var raw))
        {
            var fields = raw.Split('|', StringSplitOptions.None);
            if (fields.Length == 2
                && _store.TryGetValue($"refresh_generation:{userId}", out var generation)
                && fields[1] == generation)
            {
                return Task.FromResult<string?>(fields[0]);
            }
        }

        if (sessionId == RedisService.LegacySessionId
            && _store.TryGetValue($"refresh:{userId}", out var legacyToken))
        {
            return Task.FromResult<string?>(legacyToken);
        }

        return Task.FromResult<string?>(null);
    }

    public override Task RemoveRefreshTokenSessionAsync(Guid userId, string sessionId)
    {
        var sessionKey = $"refresh_session:{userId}:{sessionId}";
        if (_store.TryRemove(sessionKey, out var raw))
        {
            var token = raw.Split('|', StringSplitOptions.None)[0];
            _store.TryRemove($"refresh_token:{token}", out _);
        }
        if (sessionId == RedisService.LegacySessionId)
        {
            _store.TryRemove($"refresh:{userId}", out _);
        }
        return Task.CompletedTask;
    }

    public override Task RemoveRefreshTokenAsync(Guid userId)
    {
        var sessionPrefix = $"refresh_session:{userId}:";
        foreach (var key in _store.Keys.Where(key => key.StartsWith(sessionPrefix, StringComparison.Ordinal)).ToList())
        {
            if (_store.TryRemove(key, out var raw))
            {
                var token = raw.Split('|', StringSplitOptions.None)[0];
                _store.TryRemove($"refresh_token:{token}", out _);
            }
        }
        _store.TryRemove($"refresh:{userId}", out _);
        _store.TryRemove($"refresh_generation:{userId}", out _);
        return Task.CompletedTask;
    }

    /// <summary>
    /// 通用字符串写入（集成测试内存实现），AuthService 正向索引一致性检查会调用
    /// </summary>
    public override Task SetStringAsync(string key, string value, TimeSpan expiry)
    {
        _store[key] = value;
        return Task.CompletedTask;
    }

    /// <summary>
    /// 通用字符串读取（集成测试内存实现）
    /// </summary>
    public override Task<string?> GetStringAsync(string key)
    {
        _store.TryGetValue(key, out var value);
        return Task.FromResult(value);
    }

    /// <summary>
    /// 一次性凭据的原子读取删除内存实现，保持与生产 Redis GETDEL 的语义一致。
    /// </summary>
    public override Task<string?> GetAndDeleteStringAsync(string key)
    {
        return Task.FromResult(_store.TryRemove(key, out var value) ? value : null);
    }
}
