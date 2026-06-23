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
    /// SQLite 内存连接需要保持打开状态，否则数据库会被销毁
    /// 使用静态实例确保所有测试共享同一个内存数据库连接
    /// </summary>
    private static readonly Microsoft.Data.Sqlite.SqliteConnection _sqliteConnection;

    /// <summary>
    /// 标记数据库 schema 是否已初始化，避免重复创建
    /// </summary>
    private static bool _databaseCreated;

    static CustomWebApplicationFactory()
    {
        // 创建并打开 SQLite 内存连接
        _sqliteConnection = new Microsoft.Data.Sqlite.SqliteConnection("Data Source=:memory:");
        _sqliteConnection.Open();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // 替换真实的 DbContext 为 SQLite 内存数据库
            // 使用 TestAppDbContext 子类覆写 OnModelCreating，将 jsonb 映射替换为 TEXT
            // 注意：必须先注册 DbContextOptions，再注册 AppDbContext 的工厂
            services.RemoveAll(typeof(DbContextOptions<AppDbContext>));
            services.RemoveAll<AppDbContext>();

            // 注册 DbContextOptions<AppDbContext>，使用 SQLite 连接
            services.AddSingleton(new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite(_sqliteConnection)
                .Options);

            // 注册 AppDbContext 工厂，创建 TestAppDbContext 实例
            services.AddScoped<AppDbContext>(sp =>
            {
                var options = sp.GetRequiredService<DbContextOptions<AppDbContext>>();
                var tenantContext = sp.GetRequiredService<EquipAI.Core.Interfaces.ITenantContext>();
                return new TestAppDbContext(options, tenantContext);
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

        // 首次调用时创建数据库 schema
        // 使用 EnsureCreatedAsync 而非 Migrate()，因为：
        // 1. EnsureCreatedAsync 基于 OnModelCreating 的模型创建表，不依赖 migration SQL
        // 2. Migration 是为 Npgsql 生成的，包含 PG 特有语法（如 text[]），SQLite 无法执行
        // 3. Program.cs 中的 Migrate() 只创建了 __EFMigrationsHistory 表但未创建业务表
        if (!_databaseCreated)
        {
            // 删除 Migrate() 创建的空 __EFMigrationsHistory 表
            // 确保 EnsureCreatedAsync 不会因为检测到该表而跳过 schema 创建
            await dbContext.Database.ExecuteSqlRawAsync(
                "DROP TABLE IF EXISTS __EFMigrationsHistory");

            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite(_sqliteConnection)
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
    {
        // 将旧 token 反向索引转为"已轮换"墓碑（模拟真实 RedisService 重放检测行为）
        if (_store.TryGetValue($"refresh:{userId}", out var oldToken))
        {
            _store[$"refresh_token:{oldToken}"] = $"revoked:{userId}";
        }
        _store[$"refresh:{userId}"] = refreshToken;
        _store[$"refresh_token:{refreshToken}"] = userId.ToString();
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
                ? RefreshTokenEntry.Reused(userId)
                : RefreshTokenEntry.Unknown());
        }
        return Task.FromResult(Guid.TryParse(raw, out var id)
            ? RefreshTokenEntry.Valid(id)
            : RefreshTokenEntry.Unknown());
    }

    public override Task<Guid?> GetUserIdByRefreshTokenAsync(string refreshToken)
    {
        if (_store.TryGetValue($"refresh_token:{refreshToken}", out var userIdStr)
            && Guid.TryParse(userIdStr, out var userId))
        {
            return Task.FromResult<Guid?>(userId);
        }
        return Task.FromResult<Guid?>(null);
    }

    public override Task RemoveRefreshTokenAsync(Guid userId)
    {
        if (_store.TryGetValue($"refresh:{userId}", out var token))
        {
            _store.TryRemove($"refresh_token:{token}", out _);
        }
        _store.TryRemove($"refresh:{userId}", out _);
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
}
