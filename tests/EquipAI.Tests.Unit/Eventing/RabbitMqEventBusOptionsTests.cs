using EquipAI.Infrastructure.Messaging;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace EquipAI.Tests.Unit.Eventing;

/// <summary>
/// RabbitMQ 事件总线配置测试
///
/// 不需要真实 broker：验证默认值、配置绑定、计算属性。
/// RabbitMqEventBus 实例化需要 broker 连接，端到端交付测试在集成层（需 RabbitMQ 容器）。
/// </summary>
public class RabbitMqEventBusOptionsTests
{
    [Fact]
    public void 默认值_应符合生产可用基线()
    {
        var opts = new RabbitMqOptions();

        opts.Host.Should().Be("localhost");
        opts.Port.Should().Be(5672);
        opts.VirtualHost.Should().Be("/");
        opts.Username.Should().Be("guest");
        opts.Password.Should().Be("guest");
        opts.HeartbeatSeconds.Should().Be(30);
        opts.AutomaticRecoveryEnabled.Should().BeTrue();
        opts.ConnectionTimeoutSeconds.Should().Be(10);
        opts.PrefetchCount.Should().Be(50);
        opts.HandlerTimeoutSeconds.Should().Be(120);
        opts.MaxRetryCount.Should().Be(5);
        opts.RetryIntervalSeconds.Should().Be(30);
    }

    [Fact]
    public void 配置绑定_应正确映射EventBusRabbitMq节()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["EventBus:RabbitMq:Host"] = "rabbitmq-host",
                ["EventBus:RabbitMq:Port"] = "5673",
                ["EventBus:RabbitMq:Username"] = "equipai",
                ["EventBus:RabbitMq:Password"] = "s3cret",
                ["EventBus:RabbitMq:ConnectionTimeoutSeconds"] = "15",
                ["EventBus:RabbitMq:MaxRetryCount"] = "10",
                ["EventBus:RabbitMq:RetryIntervalSeconds"] = "60",
            })
            .Build();

        var opts = new RabbitMqOptions();
        config.GetSection("EventBus:RabbitMq").Bind(opts);

        opts.Host.Should().Be("rabbitmq-host");
        opts.Port.Should().Be(5673);
        opts.Username.Should().Be("equipai");
        opts.Password.Should().Be("s3cret");
        opts.ConnectionTimeoutSeconds.Should().Be(15);
        opts.MaxRetryCount.Should().Be(10);
        opts.RetryIntervalSeconds.Should().Be(60);
    }

}
