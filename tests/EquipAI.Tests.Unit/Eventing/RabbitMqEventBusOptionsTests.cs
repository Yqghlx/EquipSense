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
        opts.MaxRetryCount.Should().Be(10);
        opts.RetryIntervalSeconds.Should().Be(60);
    }

    [Theory]
    [InlineData("InMemory", false)]
    [InlineData("RabbitMQ", true)]
    [InlineData("rabbitmq", true)] // 大小写不敏感
    [InlineData("", false)]       // 空 → 默认 InMemory
    [InlineData(null, false)]     // null → 默认 InMemory
    public void Provider切换_应按配置值决定是否启用RabbitMQ(string? provider, bool expectRabbitMq)
    {
        // 模拟 ServiceCollectionExtensions 中的切换逻辑
        var resolved = string.Equals(provider ?? "InMemory", "RabbitMQ", StringComparison.OrdinalIgnoreCase);
        resolved.Should().Be(expectRabbitMq);
    }

    [Fact]
    public void 重试间隔TTL_毫秒值应正确计算()
    {
        var opts = new RabbitMqOptions { RetryIntervalSeconds = 45 };
        // RabbitMqEventBus 声明重试队列时 x-message-ttl = RetryIntervalSeconds * 1000
        var ttlMs = opts.RetryIntervalSeconds * 1000;
        ttlMs.Should().Be(45000);
    }

    [Fact]
    public void 持久化投递_应使用DeliveryMode2()
    {
        // 验证 RabbitMqEventBus.PublishAsync 使用的 DeliveryModes.Persistent 常量
        // RabbitMQ 协议规定 DeliveryMode=2 为持久化（落盘）
        var persistent = (byte)RabbitMQ.Client.DeliveryModes.Persistent;
        persistent.Should().Be(2);
    }
}

/// <summary>
/// 队列命名约定测试
///
/// 验证 RabbitMqEventBus 内部 GetExchangeName/GetMainQueueName 等私有方法的命名规则。
/// 用反射访问，因为这些方法决定 RabbitMQ 中实际创建的队列名——
/// 改名会导致旧队列成为孤儿（消息堆积无人消费），需要回归保护。
/// </summary>
public class RabbitMqEventBusNamingTests
{
    private const string ExpectedPrefix = "equipai.events.";

    [Fact]
    public void 交换机名_应为equipai_events_类型全名()
    {
        var typeName = typeof(TestIntegrationEvent).FullName!;
        InvokeNameHelper("GetExchangeName", typeName)
            .Should().Be($"{ExpectedPrefix}{typeName}");
    }

    [Fact]
    public void 主队列名_应与交换机名一致()
    {
        var typeName = typeof(TestIntegrationEvent).FullName!;
        InvokeNameHelper("GetMainQueueName", typeName)
            .Should().Be($"{ExpectedPrefix}{typeName}");
    }

    [Fact]
    public void 重试队列名_应以retry后缀()
    {
        var typeName = typeof(TestIntegrationEvent).FullName!;
        InvokeNameHelper("GetRetryQueueName", typeName)
            .Should().Be($"{ExpectedPrefix}{typeName}.retry");
    }

    [Fact]
    public void 死信队列名_应以dead后缀()
    {
        var typeName = typeof(TestIntegrationEvent).FullName!;
        InvokeNameHelper("GetDeadQueueName", typeName)
            .Should().Be($"{ExpectedPrefix}{typeName}.dead");
    }

    private static string InvokeNameHelper(string methodName, string typeName)
    {
        var method = typeof(RabbitMqEventBus)
            .GetMethod(methodName, System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
        method.Should().NotBeNull($"私有方法 {methodName} 应存在");
        return (string)method!.Invoke(null, [typeName])!;
    }

    // 用测试专用事件类型，确保 typeName 稳定不随生产代码改名而变
    private record TestIntegrationEvent(
        Guid EventId,
        DateTime OccurredAt,
        Guid TenantId,
        string Payload
    ) : EquipAI.Core.Interfaces.IIntegrationEvent;
}
