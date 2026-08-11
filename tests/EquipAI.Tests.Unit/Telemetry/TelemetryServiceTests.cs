using EquipAI.Application.Telemetry;
using EquipAI.Core.Entities;
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

        // AppDbContext 构造函数依赖 ITenantContext（全局查询过滤器需要），测试需补注册。
        // TenantId 取值对本套测试无关紧要：ValidateItemsAsync 一律走 IgnoreQueryFilters。
        var tenantCtx = new Mock<ITenantContext>();
        services.AddSingleton<ITenantContext>(tenantCtx.Object);

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
    ///
    /// 构造方式：先注册一台已知设备让遥测通过设备↔租户校验（否则被校验层拒为 unknown_device，
    /// 无法触达写入路径），再借助 InMemory 不支持 raw SQL INSERT 制造持续写入失败。
    /// </summary>
    [Fact]
    public async Task FlushAsync_当写入持续失败时_不应向外抛异常()
    {
        // 准备：注册已知设备，遥测租户与设备归属一致，使其通过校验进入写入路径
        var tenantId = Guid.NewGuid();
        var deviceId = Guid.NewGuid();
        var db = _serviceProvider.GetRequiredService<AppDbContext>();
        db.Devices.Add(new Device
        {
            Id = deviceId,
            TenantId = tenantId,
            DeviceCode = "D1",
            Name = "设备一",
            Type = "泵",
        });
        await db.SaveChangesAsync();

        // 入队一条数据，触发实际写入路径
        await _service.EnqueueAsync(
            tenantId, deviceId,
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

    /// <summary>
    /// 验证设备↔租户绑定校验：拒绝未知设备与租户不匹配项（防 MQTT 跨租户注入）
    ///
    /// 安全场景：MQTT 主题 tenantId 不可信。本测试构造三种遥测项：
    /// - 已注册设备、租户匹配 → 应通过
    /// - 设备不存在（伪造 deviceId） → 应拒绝（unknown_device）
    /// - 设备存在但上报租户与归属租户不符（跨租户注入） → 应拒绝（tenant_mismatch）
    /// </summary>
    [Fact]
    public async Task ValidateItemsAsync_应拒绝未知设备和跨租户遥测()
    {
        // 准备：租户 A 有一台设备 D1；租户 B 无设备
        var tenantA = Guid.NewGuid();
        var tenantB = Guid.NewGuid();
        var deviceD1 = Guid.NewGuid(); // 归属租户 A
        var deviceFake = Guid.NewGuid(); // 不存在

        var db = _serviceProvider.GetRequiredService<AppDbContext>();
        db.Devices.Add(new Device
        {
            Id = deviceD1,
            TenantId = tenantA,
            DeviceCode = "D1",
            Name = "设备一",
            Type = "泵",
        });
        await db.SaveChangesAsync();

        // 三条遥测：合法 / 未知设备 / 跨租户
        var items = new List<TelemetryQueueItem>
        {
            new() { TenantId = tenantA, DeviceId = deviceD1, Metric = "temperature", Value = 80 },     // 合法
            new() { TenantId = tenantA, DeviceId = deviceFake, Metric = "temperature", Value = 80 },   // 未知设备
            new() { TenantId = tenantB, DeviceId = deviceD1, Metric = "temperature", Value = 80 },     // 跨租户（D1 属 A，上报 B）
        };

        // 执行
        var valid = await _service.ValidateItemsAsync(db, items);

        // 验证：仅合法项通过
        valid.Should().HaveCount(1);
        valid[0].DeviceId.Should().Be(deviceD1);
        valid[0].TenantId.Should().Be(tenantA);
    }

    /// <summary>
    /// 验证全部遥测被拒绝时，FlushAsync 提前返回且不发布任何事件
    ///
    /// 场景：整批遥测均属未知/跨租户设备（如设备批量退役后网关仍在上报），校验后 validItems 为空，
    /// 此时应直接返回，既不触发写入也不发布事件，避免对已不存在的设备制造告警噪声。
    /// </summary>
    [Fact]
    public async Task FlushAsync_当全部遥测被校验拒绝时_应提前返回且不发布事件()
    {
        // 全部遥测的设备均未注册 → ValidateItemsAsync 全拒 → validItems 空 → 提前返回
        await _service.EnqueueAsync(
            Guid.NewGuid(), Guid.NewGuid(),
            "temperature", 95.0,
            DateTime.UtcNow, "good", "mqtt");

        var act = async () => await _service.FlushAsync();
        await act.Should().NotThrowAsync();

        _eventBusMock.Verify(
            e => e.PublishAsync(It.IsAny<IIntegrationEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    /// <summary>
    /// 数据库校验阶段异常时，后台 Timer/手动 flush 都不能把异常传播到调用方或进程级。
    /// </summary>
    [Fact]
    public async Task FlushAsync_数据库校验作用域创建失败时不应抛出异常()
    {
        var scopeFactory = new Mock<IServiceScopeFactory>();
        scopeFactory
            .Setup(factory => factory.CreateScope())
            .Throws<InvalidOperationException>();

        using var service = new TelemetryService(
            scopeFactory.Object,
            _eventBusMock.Object,
            _serviceProvider.GetRequiredService<ILogger<TelemetryService>>());

        await service.EnqueueAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "temperature",
            95.0,
            DateTime.UtcNow);

        var act = () => service.FlushAsync();

        await act.Should().NotThrowAsync();
    }

    public void Dispose()
    {
        _service.Dispose();
        _serviceProvider.Dispose();
    }
}
