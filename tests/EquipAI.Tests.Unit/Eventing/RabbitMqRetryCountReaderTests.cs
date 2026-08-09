using System.Text;
using EquipAI.Infrastructure.Messaging;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Eventing;

/// <summary>
/// RabbitMQ 压缩 x-death 头解析测试。
/// </summary>
public sealed class RabbitMqRetryCountReaderTests
{
    [Fact]
    public void GetRejectedCount_记录被压缩_读取Count而不是数组长度()
    {
        var headers = Headers(Death("equipai.v2.main", "rejected", 4L));

        RabbitMqRetryCountReader.GetRejectedCount(headers, "equipai.v2.main").Should().Be(4);
    }

    [Fact]
    public void GetRejectedCount_存在多个队列和原因_只读取目标主队列Rejected记录()
    {
        var headers = Headers(
            Death("equipai.v2.main.retry", "expired", 20L),
            Death("other.queue", "rejected", 12L),
            Death("equipai.v2.main", "rejected", 3L));

        RabbitMqRetryCountReader.GetRejectedCount(headers, "equipai.v2.main").Should().Be(3);
    }

    [Theory]
    [InlineData((byte)2, 2)]
    [InlineData(3, 3)]
    [InlineData(4L, 4)]
    [InlineData((uint)5, 5)]
    [InlineData((ulong)6, 6)]
    public void GetRejectedCount_常见数值类型_正确转换(object count, int expected)
    {
        var headers = Headers(Death("main", "rejected", count));

        RabbitMqRetryCountReader.GetRejectedCount(headers, "main").Should().Be(expected);
    }

    [Fact]
    public void GetRejectedCount_超出Int范围_饱和到Int最大值()
    {
        var headers = Headers(Death("main", "rejected", ulong.MaxValue));

        RabbitMqRetryCountReader.GetRejectedCount(headers, "main").Should().Be(int.MaxValue);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("invalid")]
    [InlineData(-1L)]
    public void GetRejectedCount_计数非法_按零次处理(object? count)
    {
        var headers = Headers(Death("main", "rejected", count));

        RabbitMqRetryCountReader.GetRejectedCount(headers, "main").Should().Be(0);
    }

    [Fact]
    public void GetRejectedCount_头为空_按零次处理()
    {
        RabbitMqRetryCountReader.GetRejectedCount(null, "main").Should().Be(0);
    }

    [Fact]
    public void GetRejectedCount_文本使用ReadOnlyMemory编码_仍能匹配()
    {
        IDictionary<string, object?> death = new Dictionary<string, object?>
        {
            ["queue"] = new ReadOnlyMemory<byte>(Encoding.UTF8.GetBytes("main")),
            ["reason"] = "rejected",
            ["count"] = 7L,
        };

        RabbitMqRetryCountReader.GetRejectedCount(Headers(death), "main").Should().Be(7);
    }

    private static IDictionary<string, object?> Headers(params IDictionary<string, object?>[] deaths) =>
        new Dictionary<string, object?> { ["x-death"] = deaths.Cast<object>().ToList() };

    private static IDictionary<string, object?> Death(string queue, string reason, object? count) =>
        new Dictionary<string, object?>
        {
            ["queue"] = Encoding.UTF8.GetBytes(queue),
            ["reason"] = Encoding.UTF8.GetBytes(reason),
            ["count"] = count,
        };
}
