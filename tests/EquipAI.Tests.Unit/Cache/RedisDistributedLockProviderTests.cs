using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Cache;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using StackExchange.Redis;
using Xunit;

namespace EquipAI.Tests.Unit.Cache;

/// <summary>
/// RedisDistributedLockProvider 单元测试
/// 验证分布式锁的加锁/解锁语义：SET NX PX 原子加锁、token 匹配才删、未获取时跳过。
/// 后台服务多实例互斥依赖此正确性——锁失效会导致重复执行（升级/清理重复）或误删他人锁。
/// </summary>
public class RedisDistributedLockProviderTests
{
    private static RedisDistributedLockProvider CreateProvider(out Mock<IDatabase> dbMock)
    {
        dbMock = new Mock<IDatabase>(MockBehavior.Loose);
        var logger = LoggerFactory.Create(_ => { }).CreateLogger<RedisDistributedLockProvider>();
        // 用 internal 测试构造函数直接注入 mock IDatabase，绕过 ConnectionMultiplexer（无法 mock 扩展方法）
        return new RedisDistributedLockProvider(dbMock.Object, logger);
    }

    [Fact]
    public async Task AcquireAsync_加锁成功_返回IsAcquired为true的句柄()
    {
        var provider = CreateProvider(out var dbMock);
        dbMock.Setup(d => d.StringSetAsync(It.IsAny<RedisKey>(), It.IsAny<RedisValue>(), It.IsAny<TimeSpan?>(), It.IsAny<When>()))
            .ReturnsAsync(true);

        var handle = await provider.AcquireAsync("test-resource", TimeSpan.FromMinutes(1), TimeSpan.Zero);

        handle.IsAcquired.Should().BeTrue();
        // 验证使用了 NX（When.NotExists）语义
        dbMock.Verify(d => d.StringSetAsync(
            It.IsAny<RedisKey>(), It.IsAny<RedisValue>(), It.IsAny<TimeSpan?>(),
            When.NotExists), Times.Once);
    }

    [Fact]
    public async Task AcquireAsync_加锁失败且waitTime为零_立即返回未获取句柄()
    {
        var provider = CreateProvider(out var dbMock);
        dbMock.Setup(d => d.StringSetAsync(It.IsAny<RedisKey>(), It.IsAny<RedisValue>(), It.IsAny<TimeSpan?>(), It.IsAny<When>()))
            .ReturnsAsync(false); // 锁已被他人持有

        var handle = await provider.AcquireAsync("test-resource", TimeSpan.FromMinutes(1), TimeSpan.Zero);

        handle.IsAcquired.Should().BeFalse("锁被他人持有时应返回未获取句柄，调用方据此跳过本轮");
    }

    [Fact]
    public async Task AcquireAsync_加锁键名带lock前缀和资源名()
    {
        var provider = CreateProvider(out var dbMock);
        RedisKey? capturedKey = null;
        dbMock.Setup(d => d.StringSetAsync(It.IsAny<RedisKey>(), It.IsAny<RedisValue>(), It.IsAny<TimeSpan?>(), It.IsAny<When>()))
            .Callback<RedisKey, RedisValue, TimeSpan?, When>((k, _, _, _) => capturedKey = k)
            .ReturnsAsync(true);

        await provider.AcquireAsync("sla-escalation", TimeSpan.FromMinutes(1), TimeSpan.Zero);

        capturedKey.Should().NotBeNull();
        capturedKey!.Value.ToString().Should().Be("lock:sla-escalation");
    }

    [Fact]
    public async Task AcquireAsync_两次调用生成不同token()
    {
        var provider = CreateProvider(out var dbMock);
        var tokens = new List<RedisValue>();
        dbMock.Setup(d => d.StringSetAsync(It.IsAny<RedisKey>(), It.IsAny<RedisValue>(), It.IsAny<TimeSpan?>(), It.IsAny<When>()))
            .Callback<RedisKey, RedisValue, TimeSpan?, When>((_, v, _, _) => tokens.Add(v))
            .ReturnsAsync(true);

        await provider.AcquireAsync("res", TimeSpan.FromMinutes(1), TimeSpan.Zero);
        await provider.AcquireAsync("res", TimeSpan.FromMinutes(1), TimeSpan.Zero);

        tokens.Should().HaveCount(2);
        tokens[0].Should().NotBe(tokens[1], "每次获取生成独立 token，解锁时据此识别持有者");
    }

    [Fact]
    public async Task DisposeAsync_释放时执行Lua脚本删除键()
    {
        var provider = CreateProvider(out var dbMock);
        dbMock.Setup(d => d.StringSetAsync(It.IsAny<RedisKey>(), It.IsAny<RedisValue>(), It.IsAny<TimeSpan?>(), It.IsAny<When>()))
            .ReturnsAsync(true);
        dbMock.Setup(d => d.ScriptEvaluateAsync(
                It.IsAny<string>(), It.IsAny<RedisKey[]>(), It.IsAny<RedisValue[]>(), CommandFlags.None))
            .ReturnsAsync(RedisResult.Create(1, ResultType.Integer));

        var handle = await provider.AcquireAsync("test-res", TimeSpan.FromMinutes(1), TimeSpan.Zero);
        await handle.DisposeAsync();

        // 验证调用了 Lua 解锁脚本（原子 check-and-delete）
        dbMock.Verify(d => d.ScriptEvaluateAsync(
            It.IsAny<string>(),
            It.Is<RedisKey[]>(keys => keys.Length == 1),
            It.Is<RedisValue[]>(vals => vals.Length == 1),
            CommandFlags.None), Times.Once);
    }

    [Fact]
    public async Task DisposeAsync_未获取的句柄释放不调用Redis()
    {
        var provider = CreateProvider(out var dbMock);
        dbMock.Setup(d => d.StringSetAsync(It.IsAny<RedisKey>(), It.IsAny<RedisValue>(), It.IsAny<TimeSpan?>(), It.IsAny<When>()))
            .ReturnsAsync(false);

        var handle = await provider.AcquireAsync("test-res", TimeSpan.FromMinutes(1), TimeSpan.Zero);
        await handle.DisposeAsync();

        // 未获取的句柄不应尝试释放（没有锁可释放）
        dbMock.Verify(d => d.ScriptEvaluateAsync(
            It.IsAny<string>(), It.IsAny<RedisKey[]>(), It.IsAny<RedisValue[]>(), CommandFlags.None),
            Times.Never);
    }

    [Fact]
    public async Task DisposeAsync_释放失败不抛异常_依赖TTL兜底()
    {
        var provider = CreateProvider(out var dbMock);
        dbMock.Setup(d => d.StringSetAsync(It.IsAny<RedisKey>(), It.IsAny<RedisValue>(), It.IsAny<TimeSpan?>(), It.IsAny<When>()))
            .ReturnsAsync(true);
        dbMock.Setup(d => d.ScriptEvaluateAsync(
                It.IsAny<string>(), It.IsAny<RedisKey[]>(), It.IsAny<RedisValue[]>(), CommandFlags.None))
            .ThrowsAsync(new RedisException("连接断开"));

        var handle = await provider.AcquireAsync("test-res", TimeSpan.FromMinutes(1), TimeSpan.Zero);

        var act = async () => await handle.DisposeAsync();
        await act.Should().NotThrowAsync("释放失败不应影响业务，锁会随 TTL 自动过期");
    }
}
