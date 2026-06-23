using EquipAI.Application.Alerts.Handlers;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace EquipAI.Tests.Unit.Alerts;

/// <summary>
/// TelemetryEventHandler 单元测试
///
/// 该 Handler 是 MQTT 遥测数据进入系统的第一站，负责：
/// 1. 更新设备在线状态 + LastSeenAt（Dashboard 在线设备数 / OEE 计算的数据源）
/// 2. 触发告警评估链
///
/// 关键测试维度：
/// - 未知设备静默跳过（防日志噪音 + 防无效评估）
/// - 离线/维护/告警状态翻转为 Online（业务语义：收到数据即在线）
/// - 已在线设备仅刷新 LastSeenAt（高频写入优化）
/// - IgnoreQueryFilters 跨租户查找（多租户逃逸口，必须锁定）
/// - 评估器参数正确传递（tenantId/deviceId/metric/value）
/// </summary>
public class TelemetryEventHandlerTests : IAsyncDisposable
{
    private readonly ServiceProvider _sp;
    private readonly Guid _currentTenantId = Guid.NewGuid();
    private readonly Mock<IAlertEvaluationService> _evalServiceMock = new();

    public TelemetryEventHandlerTests()
    {
        // 每个测试独立的内存数据库，避免状态污染
        var dbName = $"TelemetryHandlerTest_{Guid.NewGuid()}";
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(dbName));
        // ITenantContext 设为 _currentTenantId，但 Handler 用 IgnoreQueryFilters 绕过，
        // 所以即使设备属于其他租户也能被找到（这是测试要锁定的行为）
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(_currentTenantId));
        services.AddLogging();
        _sp = services.BuildServiceProvider();
    }

    public async ValueTask DisposeAsync()
    {
        await _sp.DisposeAsync();
    }

    private AppDbContext GetDb() => _sp.GetRequiredService<AppDbContext>();

    private TelemetryEventHandler CreateHandler(AppDbContext db)
    {
        var logger = _sp.GetRequiredService<ILogger<TelemetryEventHandler>>();
        return new TelemetryEventHandler(_evalServiceMock.Object, db, logger);
    }

    /// <summary>
    /// 构造测试用 TelemetryReceivedEvent
    /// </summary>
    private static TelemetryReceivedEvent CreateEvent(Guid deviceId, Guid tenantId, string metric = "temperature", double value = 75.0)
    {
        var now = DateTime.UtcNow;
        return new TelemetryReceivedEvent(
            EventId: Guid.NewGuid(),
            OccurredAt: now,
            TenantId: tenantId,
            DeviceId: deviceId,
            Metric: metric,
            Value: value,
            Timestamp: now,
            Quality: "good");
    }

    // =========================================================================
    // 未知设备处理 — 收到不存在设备的遥测时应静默跳过
    // =========================================================================

    /// <summary>
    /// 边界场景：收到未注册设备的遥测数据
    ///
    /// Why：MQTT topic 可能配错或设备未入库，这种"野生"遥测不应让系统崩溃，
    /// 也不应调用评估器（评估无意义的告警规则只会产生噪音）。
    /// Handler 应只记录 Warning 日志然后返回。
    /// </summary>
    [Fact]
    public async Task HandleAsync_未知设备_静默跳过_不调用评估器()
    {
        // Arrange：空数据库，deviceId 不存在
        var db = GetDb();
        var handler = CreateHandler(db);
        var unknownDeviceId = Guid.NewGuid();

        // Act：不应抛异常
        var act = async () => await handler.HandleAsync(CreateEvent(unknownDeviceId, _currentTenantId));
        await act.Should().NotThrowAsync("未知设备是合法输入，不应让 Handler 崩溃");

        // Assert：评估器未被调用（避免对幽灵设备产生无意义告警）
        _evalServiceMock.Verify(
            x => x.EvaluateForDeviceAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<double>(), It.IsAny<DeviceContext>(),
                It.IsAny<CancellationToken>()),
            Times.Never,
            "未知设备不应触发告警评估，否则会产生大量幽灵告警");
    }

    // =========================================================================
    // 设备状态翻转 — 非在线状态翻转为 Online
    // =========================================================================

    /// <summary>
    /// 离线设备收到遥测后应翻转为 Online，并更新 LastSeenAt
    ///
    /// Why：Dashboard 在线设备数依赖 Status==Online 计数。如果翻转逻辑失效，
    /// 设备会一直显示离线，运维误以为设备没在传数据。
    /// </summary>
    [Fact]
    public async Task HandleAsync_离线设备_翻转_为Online_更新LastSeenAt()
    {
        // Arrange：预置一台 Offline 设备
        var db = GetDb();
        var deviceId = Guid.NewGuid();
        var originalLastSeen = DateTime.UtcNow.AddMinutes(-10);
        db.Devices.Add(new Device
        {
            Id = deviceId,
            Name = "Pump-001",
            Type = "pump",
            DeviceCode = "PUMP-001",
            TenantId = _currentTenantId,
            Status = DeviceStatus.Offline,
            LastSeenAt = originalLastSeen,
        });
        await db.SaveChangesAsync();

        var handler = CreateHandler(db);
        var beforeCall = DateTime.UtcNow;

        // Act
        await handler.HandleAsync(CreateEvent(deviceId, _currentTenantId));

        // Assert：设备应已翻转为 Online，LastSeenAt 应刷新到"刚刚"
        var updated = await db.Devices.AsNoTracking().FirstAsync(d => d.Id == deviceId);
        updated.Status.Should().Be(DeviceStatus.Online, "收到遥测即视为在线");
        updated.LastSeenAt.Should().BeOnOrAfter(beforeCall, "LastSeenAt 应刷新为处理时刻的 UTC 时间");
        updated.LastSeenAt.Should().NotBe(originalLastSeen, "LastSeenAt 必须被更新，否则 DeviceStatusMonitor 会误判超时");
    }

    /// <summary>
    /// 维护中设备收到遥测后也应翻转为 Online
    ///
    /// Why：Maintenance 状态通常是人工设置的，但设备主动传数据说明它已经"恢复运行"，
    /// 应自动翻转回 Online，避免一直停留在 Maintenance 影响可用率统计。
    /// </summary>
    [Fact]
    public async Task HandleAsync_Maintenance状态_翻转_为Online()
    {
        var db = GetDb();
        var deviceId = Guid.NewGuid();
        db.Devices.Add(new Device
        {
            Id = deviceId,
            Name = "Pump-Maint",
            Type = "pump",
            DeviceCode = "PUMP-MNT",
            TenantId = _currentTenantId,
            Status = DeviceStatus.Maintenance,
        });
        await db.SaveChangesAsync();

        var handler = CreateHandler(db);
        await handler.HandleAsync(CreateEvent(deviceId, _currentTenantId));

        var updated = await db.Devices.AsNoTracking().FirstAsync(d => d.Id == deviceId);
        updated.Status.Should().Be(DeviceStatus.Online, "Maintenance 设备收到遥测也应翻转为 Online");
    }

    /// <summary>
    /// 告警状态（Warning）设备收到遥测也应翻转为 Online
    ///
    /// Why：Warning 是因为有未确认告警，但设备本身仍在传数据，应算"在线"
    /// （这与"可用率"不同 — 可用率是 Status==Online 的瞬时比例，
    ///   不是工业定义的"运行时间 / 计划运行时间"，详见 DashboardStatsService 注释）
    /// </summary>
    [Fact]
    public async Task HandleAsync_Warning状态_翻转_为Online()
    {
        var db = GetDb();
        var deviceId = Guid.NewGuid();
        db.Devices.Add(new Device
        {
            Id = deviceId,
            Name = "Pump-Warn",
            Type = "pump",
            DeviceCode = "PUMP-WRN",
            TenantId = _currentTenantId,
            Status = DeviceStatus.Warning,
        });
        await db.SaveChangesAsync();

        var handler = CreateHandler(db);
        await handler.HandleAsync(CreateEvent(deviceId, _currentTenantId));

        var updated = await db.Devices.AsNoTracking().FirstAsync(d => d.Id == deviceId);
        updated.Status.Should().Be(DeviceStatus.Online, "Warning 设备收到遥测也应翻转为 Online（瞬时在线状态）");
    }

    /// <summary>
    /// 已在线设备收到遥测：状态保持 Online，仅刷新 LastSeenAt
    ///
    /// Why：高频遥测场景下（如每秒 1 条），如果每次都写 Status 字段会触发无意义的 UPDATE。
    /// Handler 通过 wasOffline 判断避免冗余写入，这是性能优化关键路径。
    /// 测试锁定该优化行为，防止后续重构改成"无脑写"导致 DB 压力飙升。
    /// </summary>
    [Fact]
    public async Task HandleAsync_已在线设备_状态保持_仅更新LastSeenAt()
    {
        var db = GetDb();
        var deviceId = Guid.NewGuid();
        var originalLastSeen = DateTime.UtcNow.AddMinutes(-5);
        db.Devices.Add(new Device
        {
            Id = deviceId,
            Name = "Pump-Online",
            Type = "pump",
            DeviceCode = "PUMP-ONL",
            TenantId = _currentTenantId,
            Status = DeviceStatus.Online,
            LastSeenAt = originalLastSeen,
        });
        await db.SaveChangesAsync();

        var handler = CreateHandler(db);
        await handler.HandleAsync(CreateEvent(deviceId, _currentTenantId));

        var updated = await db.Devices.AsNoTracking().FirstAsync(d => d.Id == deviceId);
        updated.Status.Should().Be(DeviceStatus.Online, "已在线不应改变状态");
        updated.LastSeenAt.Should().BeOnOrAfter(originalLastSeen.AddSeconds(1),
            "LastSeenAt 必须刷新，否则 DeviceStatusMonitor 会误判超时");
    }

    // =========================================================================
    // 告警评估 — 参数正确传递给 AlertEvaluationService
    // =========================================================================

    /// <summary>
    /// 有效设备的遥测事件应触发一次告警评估，参数完整传递
    ///
    /// 关键参数：TenantId（来自事件）/ DeviceId（来自事件）/ Metric / Value
    /// 如果任一参数丢失或错位，告警评估会失败或针对错误设备
    /// </summary>
    [Fact]
    public async Task HandleAsync_有效设备_调用评估器一次_参数完整传递()
    {
        var db = GetDb();
        var deviceId = Guid.NewGuid();
        var tenantId = _currentTenantId;
        db.Devices.Add(new Device
        {
            Id = deviceId,
            Name = "Pump-Eval",
            Type = "pump",
            DeviceCode = "PUMP-EVL",
            TenantId = tenantId,
            Status = DeviceStatus.Online,
        });
        await db.SaveChangesAsync();

        var handler = CreateHandler(db);

        // Act：触发温度=85.5 的遥测事件
        await handler.HandleAsync(CreateEvent(deviceId, tenantId, metric: "temperature", value: 85.5));

        // Assert：评估器被调用一次，且参数完整正确
        _evalServiceMock.Verify(
            x => x.EvaluateForDeviceAsync(
                tenantId,
                deviceId,
                string.Empty,
                "temperature",
                85.5,
                It.Is<DeviceContext>(ctx => ctx.Metrics.ContainsKey("temperature") && ctx.Metrics["temperature"] == 85.5),
                It.IsAny<CancellationToken>()),
            Times.Once,
            "有效设备应触发一次告警评估，参数须完整传递（tenantId/deviceId/metric/value/context）");
    }

    // =========================================================================
    // 多租户隔离逃逸口 — IgnoreQueryFilters 是设计选择，必须锁定
    // =========================================================================

    /// <summary>
    /// 关键不变量：Handler 用 IgnoreQueryFilters 绕过多租户过滤器查找设备
    ///
    /// Why：MQTT 后台消费时没有 HTTP 上下文，ITenantContext.TenantId 是默认值（Guid.Empty 或构造时传入的 ID），
    /// 无法与遥测消息中的 TenantId 匹配。Handler 通过设备 Id（全局唯一）直接定位，
    /// 绕过租户过滤器是必要的 — 否则永远找不到设备，所有遥测都会变成"未知设备"。
    ///
    /// 此测试锁定该设计：即使当前 ITenantContext 是租户 A，也能更新属于租户 B 的设备。
    /// 如果后续重构去掉了 IgnoreQueryFilters，会破坏整个遥测处理链路。
    /// </summary>
    [Fact]
    public async Task HandleAsync_跨租户设备_绕过过滤器_仍能更新()
    {
        var db = GetDb();
        var deviceId = Guid.NewGuid();
        var otherTenantId = Guid.NewGuid();  // 设备实际所属租户

        // 设备属于"另一个"租户，与当前 ITenantContext 不同
        db.Devices.Add(new Device
        {
            Id = deviceId,
            Name = "Pump-OtherTenant",
            Type = "pump",
            DeviceCode = "PUMP-OTH",
            TenantId = otherTenantId,
            Status = DeviceStatus.Offline,
        });
        await db.SaveChangesAsync();

        var handler = CreateHandler(db);

        // Act：当前 ITenantContext 是 _currentTenantId，但事件来自 otherTenantId
        await handler.HandleAsync(CreateEvent(deviceId, otherTenantId));

        // Assert：设备仍被找到并翻转（IgnoreQueryFilters 生效）
        // 测试代码自己也用 IgnoreQueryFilters，否则会被全局过滤器挡住看不到 otherTenantId 的设备
        var updated = await db.Devices.IgnoreQueryFilters().AsNoTracking().FirstAsync(d => d.Id == deviceId);
        updated.Status.Should().Be(DeviceStatus.Online,
            "Handler 必须用 IgnoreQueryFilters 绕过租户过滤器，否则后台消费时所有遥测都会变成未知设备");

        // 评估器也应被调用，且传入的 tenantId 是事件中的（而非 ITenantContext 中的）
        _evalServiceMock.Verify(
            x => x.EvaluateForDeviceAsync(otherTenantId, deviceId, It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<double>(), It.IsAny<DeviceContext>(),
                It.IsAny<CancellationToken>()),
            Times.Once,
            "评估器收到的 tenantId 应来自事件本身（事件携带真实租户），而非 ITenantContext（无 HTTP 上下文）");
    }

    // =========================================================================
    // 测试辅助类
    // =========================================================================

    /// <summary>
    /// 测试用租户上下文 — 模拟无 HTTP 上下文时的默认状态
    /// </summary>
    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
