using System.Text;
using EquipAI.Infrastructure.Messaging;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Eventing;

/// <summary>
/// RabbitMQ v2 拓扑命名测试。
/// </summary>
public sealed class RabbitMqTopologyNamesTests
{
    [Fact]
    public void GetMainQueueName_相同类型输入_结果稳定且不超过协议限制()
    {
        var first = RabbitMqTopologyNames.GetMainQueueName(typeof(TopologyEvent), typeof(TopologyHandler));
        var second = RabbitMqTopologyNames.GetMainQueueName(typeof(TopologyEvent), typeof(TopologyHandler));

        first.Should().Be(second).And.StartWith("equipai.v2.");
        Encoding.UTF8.GetByteCount(first).Should().BeLessThanOrEqualTo(255);
    }

    [Fact]
    public void GetMainQueueName_类型简称相同但命名空间不同_不会冲突()
    {
        var first = RabbitMqTopologyNames.GetMainQueueName(
            typeof(FirstContainer.SameNameEvent),
            typeof(TopologyHandler));
        var second = RabbitMqTopologyNames.GetMainQueueName(
            typeof(SecondContainer.SameNameEvent),
            typeof(TopologyHandler));

        first.Should().NotBe(second);
    }

    [Fact]
    public void GetQueueNames_每个处理器拥有独立主重试死信队列()
    {
        var firstMain = RabbitMqTopologyNames.GetMainQueueName(typeof(TopologyEvent), typeof(TopologyHandler));
        var secondMain = RabbitMqTopologyNames.GetMainQueueName(typeof(TopologyEvent), typeof(SecondTopologyHandler));

        firstMain.Should().NotBe(secondMain);
        RabbitMqTopologyNames.GetRetryQueueName(typeof(TopologyEvent), typeof(TopologyHandler))
            .Should().Be($"{firstMain}.retry");
        RabbitMqTopologyNames.GetDeadQueueName(typeof(TopologyEvent), typeof(TopologyHandler))
            .Should().Be($"{firstMain}.dead");
    }

    [Fact]
    public void GetExchangeName_同一事件的不同处理器_共享广播交换机()
    {
        var exchange = RabbitMqTopologyNames.GetExchangeName(typeof(TopologyEvent));

        exchange.Should().StartWith("equipai.v2.events.");
        Encoding.UTF8.GetByteCount(exchange).Should().BeLessThanOrEqualTo(255);
    }

    private sealed record TopologyEvent;
    private sealed class TopologyHandler;
    private sealed class SecondTopologyHandler;
    private sealed class FirstContainer
    {
        internal sealed record SameNameEvent;
    }

    private sealed class SecondContainer
    {
        internal sealed record SameNameEvent;
    }
}
