using EquipAI.Application.Telemetry;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace EquipAI.Tests.Unit.Telemetry;

/// <summary>
/// 遥测去重回归测试（TelemetryService.DedupBatchAsync + FlushCoreAsync 集成）。
///
/// 背景：device_telemetry 无唯一约束、INSERT 无 ON CONFLICT。MQTT QoS1 至少一次投递的重传、边缘网关
/// 断线恢复后本地缓冲重放、写入重试的"模糊成功"都会产生相同 (tenant, device, metric, time) 的重复行，
/// 污染基线（AVG/STDDEV 翻倍）、扭曲数据质量评分、绕过聚合防风暴触发重复告警。入库前应用层去重兜底。
///
/// 为什么用 SQLite 而非 InMemory：去重依赖"实际写入 DB 后再用存在性查询排除"——InMemory provider 不支持
/// raw SQL INSERT（ExecuteSqlRawAsync 抛异常），无法让数据真正落库。SQLite 支持原生 SQL INSERT +
/// LINQ 查询翻译，完整复刻"写入→去重查询→排除"的真实路径。参见现有 TelemetryServiceTests 仅能测
/// 失败路径（InMemory 模拟写入失败）的限制。
///
/// 回归证明：旧代码无 DedupBatchAsync，InsertBatchAsync 直接插全集 → 这些用例会因 DB 出现重复行 /
/// 事件多发而失败；新代码去重后通过。
/// </summary>
public class TelemetryServiceDedupTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private ServiceProvider _sp = null!;
    private TelemetryService _service = null!;
    private Mock<IEventBus> _eventBusMock = null!;

    private Guid _tenantId = Guid.NewGuid();
    private Guid _deviceId = Guid.NewGuid();

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();

        _eventBusMock = new Mock<IEventBus>();

        var services = new ServiceCollection();
        services.AddLogging();
        // AppDbContext 构造依赖 ITenantContext（全局查询过滤器）。去重查询走 IgnoreQueryFilters，
        // 故 TenantId 取值对本套测试无影响，给空租户上下文即可。
        var tenantCtx = new Mock<ITenantContext>();
        services.AddSingleton<ITenantContext>(tenantCtx.Object);
        // SQLite：支持原生 SQL INSERT 与 LINQ 翻译，让去重的"写入后存在性查询"真实执行
        services.AddDbContext<AppDbContext>(o => o.UseSqlite(_connection));
        _sp = services.BuildServiceProvider();

        using (var seedScope = _sp.CreateScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.Database.EnsureCreatedAsync();

            // 注册已知设备 + 租户，使遥测通过 ValidateItemsAsync 的设备↔租户校验进入写入路径
            db.Tenants.Add(new Tenant
            {
                Id = _tenantId,
                Name = "测试租户",
                Slug = "t-test",
            });
            db.Devices.Add(new Device
            {
                Id = _deviceId,
                TenantId = _tenantId,
                DeviceCode = "D1",
                Name = "设备一",
                Type = "泵",
            });
            await db.SaveChangesAsync();
        }

        var logger = _sp.GetRequiredService<ILogger<TelemetryService>>();
        _service = new TelemetryService(
            _sp.GetRequiredService<IServiceScopeFactory>(),
            _eventBusMock.Object,
            logger);
    }

    public async Task DisposeAsync()
    {
        _service.Dispose();
        await _sp.DisposeAsync();
        await _connection.DisposeAsync();
    }

    /// <summary>统计当前 DB 中 device_telemetry 的行数（跨租户，IgnoreQueryFilters）。</summary>
    private async Task<int> CountTelemetryRowsAsync()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await db.DeviceTelemetry.IgnoreQueryFilters().CountAsync();
    }

    /// <summary>
    /// 批内去重：同一批次内相同 (device, metric, time) 只保留首条，其余折叠。
    ///
    /// 场景：MQTT/HTTP 上报在同一 flush 窗口内涌入两条完全同键的遥测（如双发/客户端重试）。
    /// 旧代码会插两行（值不同也按 time 维度重复），污染该时刻的指标值。
    /// </summary>
    [Fact]
    public async Task 批内同键重复应折叠为首条且只发一次事件()
    {
        var t1 = DateTime.UtcNow;
        var t2 = t1.AddSeconds(1);

        // 入队 3 条：T1 重复两条（同 device/metric/time，值不同）+ T2 新一条
        await _service.EnqueueAsync(_tenantId, _deviceId, "temperature", 80.0, t1, "good", "mqtt"); // 首条
        await _service.EnqueueAsync(_tenantId, _deviceId, "temperature", 99.0, t1, "good", "mqtt"); // 同键重复
        await _service.EnqueueAsync(_tenantId, _deviceId, "temperature", 81.0, t2, "good", "mqtt"); // 新时刻

        await _service.FlushAsync();

        // 去重后仅 2 行（T1 首条 + T2），而非 3 行
        (await CountTelemetryRowsAsync()).Should().Be(2,
            "批内同 (device,metric,time) 应折叠为首条，T1 重复行被去除");

        // 仅为实际写入的 2 行发布事件（非 3 条）
        _eventBusMock.Verify(
            e => e.PublishAsync(It.IsAny<IIntegrationEvent>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    /// <summary>
    /// 跨批去重：已落库的同键行在新批次中被存在性查询排除，不重复写入也不重复发事件。
    ///
    /// 场景：边缘网关断线恢复后本地缓冲重放，或 MQTT QoS1 重传，把"上一批已成功入库"的遥测再发一遍。
    /// 旧代码会重复插入并重复触发 TelemetryReceivedEvent → 告警引擎对同一时刻数据二次评估，叠加聚合
    /// 防风暴窗口边界处可能漏过，产生重复告警。
    /// </summary>
    [Fact]
    public async Task 跨批重复应排除DB已有行且仅为新行发事件()
    {
        var t1 = DateTime.UtcNow;
        var t2 = t1.AddSeconds(1);

        // 第一批：写入 T1（1 行，1 事件）
        await _service.EnqueueAsync(_tenantId, _deviceId, "temperature", 80.0, t1, "good", "mqtt");
        await _service.FlushAsync();
        (await CountTelemetryRowsAsync()).Should().Be(1);

        // 重置事件计数器，专注第二批
        _eventBusMock.Invocations.Clear();

        // 第二批：T1（与 DB 中已有行完全同键，应被排除）+ T2（新行）
        await _service.EnqueueAsync(_tenantId, _deviceId, "temperature", 80.0, t1, "good", "mqtt"); // 跨批重复
        await _service.EnqueueAsync(_tenantId, _deviceId, "temperature", 85.0, t2, "good", "mqtt"); // 新行
        await _service.FlushAsync();

        // 仍只有 2 行（T1 未被重复插入），而非 3 行
        (await CountTelemetryRowsAsync()).Should().Be(2,
            "跨批重复的 T1 已在 DB 中，应被存在性查询排除，不重复写入");

        // 仅为新行 T2 发 1 个事件（重复的 T1 不应再触发告警评估）
        _eventBusMock.Verify(
            e => e.PublishAsync(It.IsAny<IIntegrationEvent>(), It.IsAny<CancellationToken>()),
            Times.Exactly(1));
    }

    /// <summary>
    /// 全部重复：整批均为 DB 已有同键行时，跳过写入且不发布任何事件（避免重复告警噪声）。
    /// </summary>
    [Fact]
    public async Task 整批全为重复时应跳过写入且不发布事件()
    {
        var t1 = DateTime.UtcNow;

        // 先写入 T1
        await _service.EnqueueAsync(_tenantId, _deviceId, "temperature", 80.0, t1, "good", "mqtt");
        await _service.FlushAsync();
        (await CountTelemetryRowsAsync()).Should().Be(1);
        _eventBusMock.Invocations.Clear();

        // 再发完全相同的 T1 → 全批去重后为空
        await _service.EnqueueAsync(_tenantId, _deviceId, "temperature", 80.0, t1, "good", "mqtt");
        await _service.FlushAsync();

        // 行数不变（未被重复写入）
        (await CountTelemetryRowsAsync()).Should().Be(1, "重复行不应被再次写入");

        // 不发任何事件
        _eventBusMock.Verify(
            e => e.PublishAsync(It.IsAny<IIntegrationEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    /// <summary>
    /// DedupBatchAsync 单元级验证：传入含批内重复 + DB 已存在键的集合，应精确返回去重后的待写集合。
    /// 不经过队列/校验，直接断言去重算法本身（便于定位是去重逻辑还是写入路径的问题）。
    /// </summary>
    [Fact]
    public async Task DedupBatchAsync应折叠批内重复并排除DB已有行()
    {
        var t1 = DateTime.UtcNow;
        var t2 = t1.AddSeconds(1);
        var t3 = t1.AddSeconds(2);

        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 预置 DB 中已有 T1（模拟上一批已落库）
        await db.Database.ExecuteSqlRawAsync(
            "INSERT INTO device_telemetry (time, tenant_id, device_id, metric, value, quality, source) " +
            "VALUES ({0}, {1}, {2}, {3}, {4}, {5}, {6})",
            t1, _tenantId, _deviceId, "temperature", 80.0, "good", "seed");

        var items = new List<TelemetryQueueItem>
        {
            new() { TenantId = _tenantId, DeviceId = _deviceId, Metric = "temperature", Value = 80.0, Timestamp = t1 }, // DB 已存在 → 排除
            new() { TenantId = _tenantId, DeviceId = _deviceId, Metric = "temperature", Value = 99.0, Timestamp = t1 }, // 批内重复（同 t1）→ 折叠
            new() { TenantId = _tenantId, DeviceId = _deviceId, Metric = "temperature", Value = 82.0, Timestamp = t2 }, // 新 → 保留
            new() { TenantId = _tenantId, DeviceId = _deviceId, Metric = "temperature", Value = 83.0, Timestamp = t3 }, // 新 → 保留
        };

        var deduped = await _service.DedupBatchAsync(db, items);

        // 去重后仅 2 条（t2、t3）：t1 被 DB 存在性排除，其批内重复被折叠
        deduped.Should().HaveCount(2);
        deduped.Select(i => i.Timestamp).Should().BeEquivalentTo(new[] { t2, t3 });
    }
}
