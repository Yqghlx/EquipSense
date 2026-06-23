using EquipAI.Application.Telemetry;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
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
        // 注册 InMemory DbContext，使 FlushCoreAsync 能取到 DbContext；
        // InMemory 不支持 raw SQL INSERT（ExecuteSqlRawAsync 会抛异常），用于模拟"写入失败"
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase($"TelemetrySvc_{Guid.NewGuid()}"));

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

    /// <summary>
    /// 验证 DB 写入持续失败时，FlushAsync 不向外抛异常
    ///
    /// 关键属性：FlushAsync 由 Timer(500ms) 回调以 async void 语义调用，若向外抛未捕获异常，
    /// 会击穿到 TaskScheduler.UnobservedTaskException 并杀死整个遥测管线 —— 后果是所有设备监控停摆。
    /// 因此无论 DB 怎么失败（瞬时抖动或持续不可用），FlushAsync 必须吞掉异常：
    /// 内部有界重试后优雅丢弃并计入指标，绝不把异常抛给调用方。
    /// 本测试用 InMemory DbContext 的 raw SQL 不支持来制造持续写入失败。
    /// </summary>
    [Fact]
    public async Task FlushAsync_当写入持续失败时_不应向外抛异常()
    {
        // 准备：入队一条数据，触发实际写入路径
        await _service.EnqueueAsync(
            Guid.NewGuid(), Guid.NewGuid(),
            "temperature", 95.0,
            DateTime.UtcNow, "good", "mqtt");

        // 执行 + 断言：重试耗尽后丢弃，但绝不向外抛
        var act = async () => await _service.FlushAsync();
        await act.Should().NotThrowAsync();

        // 写入失败时不应发布任何 TelemetryReceivedEvent（仅成功才发布）
        _eventBusMock.Verify(
            e => e.PublishAsync(It.IsAny<IIntegrationEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    public void Dispose()
    {
        _service.Dispose();
        _serviceProvider.Dispose();
    }
}
