using EquipAI.Infrastructure.Cache;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using Xunit;

namespace EquipAI.Tests.Unit.Cache;

/// <summary>
/// RedisService 构造方式契约测试。
/// Redis 连接必须由依赖注入容器统一管理，避免缓存服务和分布式锁各自创建连接池。
/// </summary>
public class RedisServiceTests
{
    /// <summary>
    /// 生产构造函数应接收共享连接多路复用器，而不是在服务内部自行建立连接。
    /// </summary>
    [Fact]
    public void 生产构造函数_应注入共享Redis连接多路复用器()
    {
        var constructor = typeof(RedisService).GetConstructor(
            new[] { typeof(IConnectionMultiplexer), typeof(ILogger<RedisService>) });

        constructor.Should().NotBeNull(
            "RedisService 必须复用 DI 管理的连接，避免创建第二个未托管的 Redis 连接池");
    }
}
