using EquipAI.Application.Telemetry;
using EquipAI.Core.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace EquipAI.Tests.Unit.Telemetry;

public class TelemetryServiceTests : IDisposable
{
    private readonly ServiceProvider _serviceProvider;
    private readonly Mock<IEventBus> _eventBusMock;
    private readonly TelemetryService _service;

    public TelemetryServiceTests()
    {
        _eventBusMock = new Mock<IEventBus>();

        var services = new ServiceCollection();
        services.AddLogging();

        _serviceProvider = services.BuildServiceProvider();
        var logger = _serviceProvider.GetRequiredService<ILogger<TelemetryService>>();

        _service = new TelemetryService(
            _serviceProvider.GetRequiredService<IServiceScopeFactory>(),
            _eventBusMock.Object,
            logger);
    }

    /// <summary>
    /// 验证 EnqueueAsync 正常入队不抛异常
    /// </summary>
    [Fact]
    public async Task EnqueueAsync_ShouldNotThrow()
    {
        var act = async () => await _service.EnqueueAsync(
            Guid.NewGuid(), Guid.NewGuid(),
            "temperature", 85.5,
            DateTime.UtcNow, "good", "mqtt");

        await act.Should().NotThrowAsync();
    }

    /// <summary>
    /// 验证空队列时 FlushAsync 不抛异常
    /// </summary>
    [Fact]
    public async Task FlushAsync_WithEmptyQueue_ShouldNotThrow()
    {
        var act = async () => await _service.FlushAsync();
        await act.Should().NotThrowAsync();
    }

    public void Dispose()
    {
        _service.Dispose();
        _serviceProvider.Dispose();
    }
}
