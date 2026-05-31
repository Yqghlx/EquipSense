using EquipAI.Application.Eventing;
using EquipAI.Core.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace EquipAI.Tests.Unit.Eventing;

public record TestEvent(
    Guid EventId,
    DateTime OccurredAt,
    Guid TenantId,
    string Message
) : IIntegrationEvent;

public class TestEventHandler : IEventHandler<TestEvent>
{
    public static List<TestEvent> ReceivedEvents { get; } = [];

    public Task HandleAsync(TestEvent @event, CancellationToken ct = default)
    {
        ReceivedEvents.Add(@event);
        return Task.CompletedTask;
    }
}

public class InMemoryEventBusTests : IDisposable
{
    private readonly ServiceProvider _serviceProvider;
    private readonly InMemoryEventBus _eventBus;

    public InMemoryEventBusTests()
    {
        TestEventHandler.ReceivedEvents.Clear();

        var services = new ServiceCollection();
        services.AddSingleton<TestEventHandler>();
        services.AddLogging();

        _serviceProvider = services.BuildServiceProvider();
        var logger = _serviceProvider.GetRequiredService<ILogger<InMemoryEventBus>>();
        _eventBus = new InMemoryEventBus(_serviceProvider, logger);
    }

    [Fact]
    public async Task PublishAsync_ShouldDeliverToSubscribedHandler()
    {
        _eventBus.Subscribe<TestEvent, TestEventHandler>();
        var testEvent = new TestEvent(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid(), "测试消息");

        await _eventBus.PublishAsync(testEvent);
        await Task.Delay(500);

        TestEventHandler.ReceivedEvents.Should().ContainSingle()
            .Which.Message.Should().Be("测试消息");
    }

    [Fact]
    public async Task PublishAsync_WithNoSubscribers_ShouldNotThrow()
    {
        var testEvent = new TestEvent(Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid(), "无订阅者");
        var act = () => _eventBus.PublishAsync(testEvent);
        await act.Should().NotThrowAsync();
    }

    public void Dispose()
    {
        _eventBus.Dispose();
        _serviceProvider.Dispose();
    }
}
