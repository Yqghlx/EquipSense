using System.Reflection;
using EquipAI.Infrastructure.Cache;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Seeding;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;

namespace EquipAI.Tests.Integration.Infrastructure;

/// <summary>
/// 集成测试的 WebApplicationFactory，使用内存数据库替代 PostgreSQL，
/// 并用模拟的 Redis 服务替代真实的 Redis 连接，确保测试环境完全自包含
/// </summary>
public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // 替换真实的 DbContext 为内存数据库
            services.RemoveAll(typeof(DbContextOptions<AppDbContext>));
            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseInMemoryDatabase("EquipAI_TestDb");
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
    /// 每次调用都会重新填充种子数据，确保测试之间相互独立
    /// </summary>
    public async Task<HttpClient> CreateClientWithSeedAsync()
    {
        var client = CreateClient();
        using var scope = Services.CreateScope();
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
        : base(CreateDummyConfig())
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
        _store[$"refresh:{userId}"] = refreshToken;
        return Task.CompletedTask;
    }

    public override Task<string?> GetRefreshTokenAsync(Guid userId)
    {
        _store.TryGetValue($"refresh:{userId}", out var token);
        return Task.FromResult(token);
    }

    public override Task RemoveRefreshTokenAsync(Guid userId)
    {
        _store.TryRemove($"refresh:{userId}", out _);
        return Task.CompletedTask;
    }
}
