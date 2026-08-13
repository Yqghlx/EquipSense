using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Messaging;
using EquipAI.WebAPI.Extensions;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Moq;

namespace EquipAI.Tests.Unit.Extensions;

/// <summary>
/// 事件总线依赖注入身份和探针标签测试。
/// </summary>
public sealed class ServiceCollectionExtensionsEventBusTests
{
    [Fact]
    public void AddInfrastructure_RabbitMq模式_传输层保持单例业务总线使用事务包装()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddHttpContextAccessor();
        var hostEnvironment = new Mock<IHostEnvironment>();
        hostEnvironment.SetupGet(environment => environment.EnvironmentName).Returns("Testing");
        services.AddSingleton<IHostEnvironment>(hostEnvironment.Object);
        services.AddInfrastructure(BuildConfiguration("RabbitMQ"));
        using var provider = services.BuildServiceProvider();

        var concrete = provider.GetRequiredService<RabbitMqEventBus>();
        var transport = provider.GetRequiredService<IEventBusTransport>();
        var state = provider.GetRequiredService<IRabbitMqConnectionState>();
        var hosted = services
            .Where(descriptor =>
                descriptor.ServiceType == typeof(IHostedService)
                && descriptor.ImplementationFactory is not null)
            .Select(descriptor => descriptor.ImplementationFactory!(provider))
            .OfType<RabbitMqEventBus>()
            .Single();

        using var scope = provider.CreateScope();
        var eventBus = scope.ServiceProvider.GetRequiredService<IEventBus>();

        transport.Should().BeSameAs(concrete);
        state.Should().BeSameAs(concrete);
        hosted.Should().BeSameAs(concrete);
        eventBus.Should().BeOfType<TransactionalEventBus>();
        eventBus.Should().NotBeSameAs(concrete);
    }

    [Fact]
    public void AddInfrastructure_RabbitMq模式_健康检查只标记Ready()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddInfrastructure(BuildConfiguration("RabbitMQ"));
        using var provider = services.BuildServiceProvider();

        var registration = provider.GetRequiredService<IOptions<HealthCheckServiceOptions>>().Value
            .Registrations.Single(item => item.Name == "rabbitmq-eventbus");

        registration.Tags.Should().BeEquivalentTo(["ready"]);
        registration.Tags.Should().NotContain("liveness");
    }

    [Fact]
    public void AddInfrastructure_未知Provider_拒绝注册()
    {
        var services = new ServiceCollection();

        var action = () => services.AddInfrastructure(BuildConfiguration("RabittMQ"));

        action.Should().Throw<InvalidOperationException>().WithMessage("*RabittMQ*");
    }

    private static IConfiguration BuildConfiguration(string provider) =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["EventBus:Provider"] = provider,
                ["EventBus:RabbitMq:Host"] = "127.0.0.1",
                ["EventBus:RabbitMq:Port"] = "1",
                ["ConnectionStrings:Default"] = "Host=localhost;Database=test",
                ["Redis:ConnectionString"] = "localhost:6379",
                ["ASPNETCORE_ENVIRONMENT"] = "Testing",
                ["Security:PiiEncryptionKey"] = Convert.ToBase64String(new byte[32]),
            })
            .Build();
}
