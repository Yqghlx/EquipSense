using EquipAI.Infrastructure.Cache;
using FluentAssertions;
using Moq;
using StackExchange.Redis;

namespace EquipAI.Tests.Unit.Cache;

/// <summary>
/// Redis 告警聚合状态存储单元测试。
/// </summary>
public class RedisAlertAggregationStateStoreTests
{
    [Fact]
    public async Task IncrementAsync_应通过Lua原子递增并传入窗口毫秒数()
    {
        var database = new Mock<IDatabase>();
        database
            .Setup(d => d.ScriptEvaluateAsync(
                It.IsAny<string>(),
                It.IsAny<RedisKey[]>(),
                It.IsAny<RedisValue[]>(),
                CommandFlags.None))
            .ReturnsAsync(RedisResult.Create(2, ResultType.Integer));
        var store = new RedisAlertAggregationStateStore(database.Object);

        var result = await store.IncrementAsync(
            "alert:aggregate:device:rule:temperature",
            TimeSpan.FromMinutes(30));

        result.Should().Be(2);
        database.Verify(d => d.ScriptEvaluateAsync(
                It.Is<string>(script => script.Contains("INCR") && script.Contains("PEXPIRE")),
                It.Is<RedisKey[]>(keys => keys.Length == 1 && keys[0] == "alert:aggregate:device:rule:temperature"),
                It.Is<RedisValue[]>(values => values.Length == 1 && values[0].ToString() == "1800000"),
                CommandFlags.None),
            Times.Once);
    }

    [Fact]
    public async Task IncrementAsync_收到已取消令牌时_不应访问Redis()
    {
        var database = new Mock<IDatabase>();
        var store = new RedisAlertAggregationStateStore(database.Object);

        var act = () => store.IncrementAsync(
            "alert:aggregate:device:rule:temperature",
            TimeSpan.FromMinutes(30),
            new CancellationToken(canceled: true));

        await act.Should().ThrowAsync<OperationCanceledException>();
        database.VerifyNoOtherCalls();
    }
}
