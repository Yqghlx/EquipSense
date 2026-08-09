using EquipAI.Infrastructure.Messaging;
using FluentAssertions;
using Microsoft.Extensions.Configuration;

namespace EquipAI.Tests.Unit.Eventing;

/// <summary>
/// 事件总线配置解析与生产安全边界测试。
/// </summary>
public sealed class EventBusConfigurationTests
{
    [Theory]
    [InlineData("InMemory", EventBusProvider.InMemory)]
    [InlineData("inmemory", EventBusProvider.InMemory)]
    [InlineData("RabbitMQ", EventBusProvider.RabbitMQ)]
    [InlineData("rabbitmq", EventBusProvider.RabbitMQ)]
    [InlineData(null, EventBusProvider.InMemory)]
    [InlineData("", EventBusProvider.InMemory)]
    public void ResolveProvider_合法配置_返回确定实现(string? raw, EventBusProvider expected)
    {
        var configuration = BuildConfiguration(("EventBus:Provider", raw));

        EventBusConfiguration.ResolveProvider(configuration).Should().Be(expected);
    }

    [Fact]
    public void ResolveProvider_未知值_拒绝静默降级()
    {
        var configuration = BuildConfiguration(("EventBus:Provider", "RabittMQ"));

        var action = () => EventBusConfiguration.ResolveProvider(configuration);

        action.Should().Throw<InvalidOperationException>()
            .WithMessage("*RabittMQ*");
    }

    [Fact]
    public void ValidateForEnvironment_生产使用InMemory且未授权_拒绝启动()
    {
        var configuration = BuildConfiguration(("EventBus:Provider", "InMemory"));

        var action = () => EventBusConfiguration.ValidateForEnvironment(configuration, "Production");

        action.Should().Throw<InvalidOperationException>()
            .WithMessage("*AllowInMemoryInProduction*");
    }

    [Fact]
    public void ValidateForEnvironment_生产显式授权InMemory_允许紧急降级()
    {
        var configuration = BuildConfiguration(
            ("EventBus:Provider", "InMemory"),
            ("EventBus:AllowInMemoryInProduction", "true"));

        var action = () => EventBusConfiguration.ValidateForEnvironment(configuration, "Production");

        action.Should().NotThrow();
    }

    [Theory]
    [InlineData("EventBus:RabbitMq:Host", "")]
    [InlineData("EventBus:RabbitMq:Port", "0")]
    [InlineData("EventBus:RabbitMq:Port", "65536")]
    [InlineData("EventBus:RabbitMq:PrefetchCount", "0")]
    [InlineData("EventBus:RabbitMq:ConnectionTimeoutSeconds", "0")]
    [InlineData("EventBus:RabbitMq:HandlerTimeoutSeconds", "0")]
    [InlineData("EventBus:RabbitMq:MaxRetryCount", "0")]
    [InlineData("EventBus:RabbitMq:RetryIntervalSeconds", "0")]
    public void ValidateForEnvironment_RabbitMq边界非法_拒绝启动(string key, string value)
    {
        var values = ValidRabbitMqValues();
        values[key] = value;
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(values).Build();

        var action = () => EventBusConfiguration.ValidateForEnvironment(configuration, "Development");

        action.Should().Throw<InvalidOperationException>()
            .WithMessage($"*{key.Split(':').Last()}*");
    }

    [Theory]
    [InlineData("guest", "strong-production-password")]
    [InlineData("equipai", "guest")]
    [InlineData("equipai", "short")]
    [InlineData("", "strong-production-password")]
    public void ValidateForEnvironment_生产RabbitMq凭证弱_拒绝启动(string username, string password)
    {
        var values = ValidRabbitMqValues();
        values["EventBus:RabbitMq:Username"] = username;
        values["EventBus:RabbitMq:Password"] = password;
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(values).Build();

        var action = () => EventBusConfiguration.ValidateForEnvironment(configuration, "Production");

        action.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void ValidateForEnvironment_生产RabbitMq关闭自动恢复_拒绝启动()
    {
        var values = ValidRabbitMqValues();
        values["EventBus:RabbitMq:AutomaticRecoveryEnabled"] = "false";
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(values).Build();

        var action = () => EventBusConfiguration.ValidateForEnvironment(configuration, "Production");

        action.Should().Throw<InvalidOperationException>()
            .WithMessage("*AutomaticRecoveryEnabled*");
    }

    [Fact]
    public void ValidateForEnvironment_生产RabbitMq主机仍为占位符_拒绝启动()
    {
        var values = ValidRabbitMqValues();
        values["EventBus:RabbitMq:Host"] = "SET_VIA_ENVIRONMENT";
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(values).Build();

        var action = () => EventBusConfiguration.ValidateForEnvironment(configuration, "Production");

        action.Should().Throw<InvalidOperationException>()
            .WithMessage("*Host*");
    }

    [Fact]
    public void ValidateForEnvironment_开发使用InMemory_无需RabbitMq配置()
    {
        var configuration = BuildConfiguration(("EventBus:Provider", "InMemory"));

        var action = () => EventBusConfiguration.ValidateForEnvironment(configuration, "Development");

        action.Should().NotThrow();
    }

    private static IConfiguration BuildConfiguration(params (string Key, string? Value)[] pairs) =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(pairs.ToDictionary(pair => pair.Key, pair => pair.Value))
            .Build();

    private static Dictionary<string, string?> ValidRabbitMqValues() => new()
    {
        ["EventBus:Provider"] = "RabbitMQ",
        ["EventBus:RabbitMq:Host"] = "rabbitmq",
        ["EventBus:RabbitMq:Port"] = "5672",
        ["EventBus:RabbitMq:VirtualHost"] = "/",
        ["EventBus:RabbitMq:Username"] = "equipai",
        ["EventBus:RabbitMq:Password"] = "strong-production-password",
        ["EventBus:RabbitMq:HeartbeatSeconds"] = "30",
        ["EventBus:RabbitMq:AutomaticRecoveryEnabled"] = "true",
        ["EventBus:RabbitMq:ConnectionTimeoutSeconds"] = "10",
        ["EventBus:RabbitMq:PrefetchCount"] = "50",
        ["EventBus:RabbitMq:HandlerTimeoutSeconds"] = "120",
        ["EventBus:RabbitMq:MaxRetryCount"] = "5",
        ["EventBus:RabbitMq:RetryIntervalSeconds"] = "30",
    };
}
