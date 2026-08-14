using System.Data.Common;
using EquipAI.Application.Telemetry;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Tests.Unit.Telemetry;

/// <summary>
/// TelemetryQueryService 单元测试
///
/// 该服务是设备详情页图表和实时数据展示的【高频读路径】，原无任何专属测试。
/// 测试维度：
/// 1. QueryAsync — 时间范围过滤、单指标查询、按时间升序、空数据
/// 2. GetLatestAsync — 多指标各自最新值、null Value 兜底为 0、空数据
///
/// 实现说明：DeviceTelemetry 是 HasNoKey 实体（TimescaleDB 超表），
/// EF Core ChangeTracker 拒绝追踪无主键实体，必须用 SQLite 内存 +
/// ExecuteSqlRawAsync 原生 INSERT 绕过追踪器（与 TrendAnalysisServiceTests 同模式）。
/// </summary>
public class TelemetryQueryServiceTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private ServiceProvider _sp = null!;
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly Guid _deviceId = Guid.NewGuid();
    private readonly SelectCommandCounter _selectCommandCounter = new();

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseSqlite(_connection));
        // 只读上下文（被测服务注入）：共享同一 SQLite 连接，保证能读到主库的种子数据
        services.AddDbContext<AppReadDbContext>(o => o
            .UseSqlite(_connection)
            .AddInterceptors(_selectCommandCounter));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(_tenantId));
        services.AddLogging();
        _sp = services.BuildServiceProvider();

        using (var scope = _sp.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.Database.EnsureCreatedAsync();
        }
    }

    public async Task DisposeAsync()
    {
        await _sp.DisposeAsync();
        await _connection.DisposeAsync();
    }

    private AppDbContext GetDb() => _sp.GetRequiredService<AppDbContext>();

    /// <summary>只读上下文（被测服务注入的类型）</summary>
    private AppReadDbContext GetReadDb() => _sp.GetRequiredService<AppReadDbContext>();

    private TelemetryQueryService CreateService(AppReadDbContext db)
    {
        var logger = _sp.GetRequiredService<ILogger<TelemetryQueryService>>();
        return new TelemetryQueryService(db, logger);
    }

    /// <summary>
    /// 用原生 SQL 植入一条 DeviceTelemetry 记录（绕过 HasNoKey 的 ChangeTracker 限制）
    /// 时间必须 SpecifyKind(Utc)，否则 SQLite provider 存储格式不一致会让时间过滤失效
    /// </summary>
    private async Task InsertTelemetryAsync(AppDbContext db, Guid deviceId, string metric,
        DateTime time, double? value)
    {
        var utcTime = DateTime.SpecifyKind(time.ToUniversalTime(), DateTimeKind.Utc);
        // 注意：SQLite EF Core provider 不支持将 DBNull.Value 作为 ExecuteSqlRawAsync 的参数
        // （无 DBNull 的 store type mapping）。value 为 null 时用 SQL 字面量 NULL 直接插入，
        // 非 null 时走参数化绑定（保留 SQL 注入防护）。
        if (!value.HasValue)
        {
            await db.Database.ExecuteSqlRawAsync(
                "INSERT INTO device_telemetry (time, tenant_id, device_id, metric, value, quality, source) " +
                "VALUES ({0}, {1}, {2}, {3}, NULL, {4}, {5})",
                utcTime, _tenantId, deviceId, metric, "good", "test");
        }
        else
        {
            await db.Database.ExecuteSqlRawAsync(
                "INSERT INTO device_telemetry (time, tenant_id, device_id, metric, value, quality, source) " +
                "VALUES ({0}, {1}, {2}, {3}, {4}, {5}, {6})",
                utcTime, _tenantId, deviceId, metric, value.Value, "good", "test");
        }
    }

    // =========================================================================
    // QueryAsync — 历史时序数据查询
    // =========================================================================

    [Fact]
    public async Task QueryAsync_ReturnsPointsInTimeOrder()
    {
        // 植入乱序数据，验证返回是否按时间升序排列
        var db = GetDb();
        var t0 = DateTime.UtcNow.AddHours(-2);
        var t1 = t0.AddHours(1);
        var t2 = t0.AddHours(2);
        // 故意逆序插入（t2 → t0 → t1）
        await InsertTelemetryAsync(db, _deviceId, "temperature", t2, 30.0);
        await InsertTelemetryAsync(db, _deviceId, "temperature", t0, 10.0);
        await InsertTelemetryAsync(db, _deviceId, "temperature", t1, 20.0);

        var service = CreateService(GetReadDb());
        var result = await service.QueryAsync(_deviceId, "temperature", t0.AddMinutes(-1), t2.AddMinutes(1));

        result.Should().HaveCount(3);
        // 升序：t0(10) → t1(20) → t2(30)
        result[0].Value.Should().Be(10.0);
        result[1].Value.Should().Be(20.0);
        result[2].Value.Should().Be(30.0);
        result.Select(p => p.Time).Should().BeInAscendingOrder();
    }

    [Fact]
    public async Task QueryAsync_FiltersByTimeRange()
    {
        // 验证时间窗口外的数据被正确排除（窗口边界外的早于/晚于数据都不返回）
        var db = GetDb();
        var windowStart = DateTime.UtcNow.AddHours(-5);
        var inside = windowStart.AddHours(2);
        var before = windowStart.AddHours(-1);   // 早于窗口
        var after = windowStart.AddHours(10);     // 晚于窗口

        await InsertTelemetryAsync(db, _deviceId, "pressure", before, 1.0);
        await InsertTelemetryAsync(db, _deviceId, "pressure", inside, 2.0);
        await InsertTelemetryAsync(db, _deviceId, "pressure", after, 3.0);

        var service = CreateService(GetReadDb());
        var result = await service.QueryAsync(_deviceId, "pressure", windowStart, windowStart.AddHours(5));

        result.Should().HaveCount(1);
        result[0].Value.Should().Be(2.0);
    }

    [Fact]
    public async Task QueryAsync_FiltersByMetric()
    {
        // 同一设备多指标，验证只返回指定 metric
        var db = GetDb();
        var t = DateTime.UtcNow.AddMinutes(-10);

        await InsertTelemetryAsync(db, _deviceId, "temperature", t, 25.0);
        await InsertTelemetryAsync(db, _deviceId, "humidity", t, 60.0);
        await InsertTelemetryAsync(db, _deviceId, "vibration", t, 5.0);

        var service = CreateService(GetReadDb());
        var result = await service.QueryAsync(_deviceId, "temperature", t.AddMinutes(-1), t.AddMinutes(1));

        result.Should().HaveCount(1);
        result[0].Value.Should().Be(25.0);
    }

    [Fact]
    public async Task QueryAsync_NullValueReturnsZero()
    {
        // DeviceTelemetry.Value 是 double?，null 时应兜底为 0（生产里 Value ?? 0 投影）
        var db = GetDb();
        var t = DateTime.UtcNow.AddMinutes(-5);
        await InsertTelemetryAsync(db, _deviceId, "current", t, value: null);

        var service = CreateService(GetReadDb());
        var result = await service.QueryAsync(_deviceId, "current", t.AddMinutes(-1), t.AddMinutes(1));

        result.Should().HaveCount(1);
        result[0].Value.Should().Be(0.0);
    }

    [Fact]
    public async Task QueryAsync_NoData_ReturnsEmpty()
    {
        var service = CreateService(GetReadDb());
        var result = await service.QueryAsync(_deviceId, "temperature",
            DateTime.UtcNow.AddHours(-1), DateTime.UtcNow);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task QueryAsync_历史时间范围超过上限_应在查询前拒绝()
    {
        var service = CreateService(GetReadDb());
        var start = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = start.AddDays(TelemetryQueryService.MaxHistoryRangeDays + 1);

        var action = () => service.QueryAsync(_deviceId, "temperature", start, end);

        await action.Should().ThrowAsync<ArgumentOutOfRangeException>()
            .WithMessage($"*{TelemetryQueryService.MaxHistoryRangeDays}*");
        _selectCommandCounter.Count.Should().Be(0,
            "超出历史范围的请求应在访问数据库前被拒绝");
    }

    [Fact]
    public async Task QueryAsync_结束时间早于起始时间_应在查询前拒绝()
    {
        var service = CreateService(GetReadDb());
        var start = new DateTime(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc);
        var end = start.AddHours(-1);

        var action = () => service.QueryAsync(_deviceId, "temperature", start, end);

        await action.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*结束时间必须晚于起始时间*");
        _selectCommandCounter.Count.Should().Be(0,
            "非法时间顺序应在访问数据库前被拒绝");
    }

    [Fact]
    public async Task QueryAsync_历史查询应在数据库侧限制返回点数()
    {
        var db = GetDb();
        var time = DateTime.UtcNow.AddMinutes(-1);
        await InsertTelemetryAsync(db, _deviceId, "temperature", time, 28.0);

        _selectCommandCounter.Reset();
        var service = CreateService(GetReadDb());
        await service.QueryAsync(_deviceId, "temperature", time.AddMinutes(-1), time.AddMinutes(1));

        _selectCommandCounter.LastCommandText.Should().Contain("LIMIT",
            "历史遥测查询必须在数据库侧设置结果上限，避免高频设备把海量点加载到应用内存");
    }

    [Fact]
    public async Task QueryAsync_收到请求取消信号_应停止数据库查询()
    {
        var service = CreateService(GetReadDb());
        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();

        var action = () => service.QueryAsync(
            _deviceId,
            "temperature",
            DateTime.UtcNow.AddMinutes(-1),
            DateTime.UtcNow,
            cancellation.Token);

        await action.Should().ThrowAsync<OperationCanceledException>();
    }

    // =========================================================================
    // GetLatestAsync — 各指标最新值聚合
    // =========================================================================

    [Fact]
    public async Task GetLatestAsync_ReturnsLatestValuePerMetric()
    {
        // 多指标、每个指标多条数据，验证每个 metric 只返回最新时间点的值
        var db = GetDb();
        var baseTime = DateTime.UtcNow.AddHours(-3);

        // temperature: 三条递增时间，最新值应为 28
        await InsertTelemetryAsync(db, _deviceId, "temperature", baseTime, 20.0);
        await InsertTelemetryAsync(db, _deviceId, "temperature", baseTime.AddHours(1), 25.0);
        await InsertTelemetryAsync(db, _deviceId, "temperature", baseTime.AddHours(2), 28.0);
        // pressure: 两条，最新值应为 1.2
        await InsertTelemetryAsync(db, _deviceId, "pressure", baseTime, 1.0);
        await InsertTelemetryAsync(db, _deviceId, "pressure", baseTime.AddHours(1), 1.2);

        var service = CreateService(GetReadDb());
        var result = await service.GetLatestAsync(_deviceId);

        result.Should().HaveCount(2);
        result["temperature"].Should().Be(28.0);
        result["pressure"].Should().Be(1.2);
    }

    [Fact]
    public async Task GetLatestAsync_NullValueReturnsZero()
    {
        // 最新记录的 Value 为 null 时应兜底为 0
        var db = GetDb();
        var t = DateTime.UtcNow.AddMinutes(-5);
        await InsertTelemetryAsync(db, _deviceId, "current", t, value: null);

        var service = CreateService(GetReadDb());
        var result = await service.GetLatestAsync(_deviceId);

        result.Should().ContainKey("current");
        result["current"].Should().Be(0.0);
    }

    [Fact]
    public async Task GetLatestAsync_NoData_ReturnsEmpty()
    {
        var service = CreateService(GetReadDb());
        var result = await service.GetLatestAsync(_deviceId);

        result.Should().BeEmpty();
    }

    /// <summary>
    /// 最新值查询必须在单次数据库读取中完成，避免设备指标数量增加时产生 N+1 查询。
    /// 这是设备详情页的高频路径；旧实现会先查最新时间，再为每个指标单独查值。
    /// </summary>
    [Fact]
    public async Task GetLatestAsync_应在单次数据库查询内返回所有指标()
    {
        var db = GetDb();
        var time = DateTime.UtcNow.AddMinutes(-1);
        await InsertTelemetryAsync(db, _deviceId, "temperature", time, 28.0);
        await InsertTelemetryAsync(db, _deviceId, "pressure", time, 1.2);
        await InsertTelemetryAsync(db, _deviceId, "vibration", time, 0.4);

        _selectCommandCounter.Reset();
        var service = CreateService(GetReadDb());
        var result = await service.GetLatestAsync(_deviceId);

        result.Should().BeEquivalentTo(new Dictionary<string, double>
        {
            ["temperature"] = 28.0,
            ["pressure"] = 1.2,
            ["vibration"] = 0.4,
        });
        _selectCommandCounter.Count.Should().Be(1,
            "最新遥测应由一次集合查询返回，不能随指标数量增加数据库往返次数");
    }

    /// <summary>统计只读上下文执行的 SELECT 命令次数，用于锁定高频查询的往返次数。</summary>
    private sealed class SelectCommandCounter : DbCommandInterceptor
    {
        private int _count;
        private string? _lastCommandText;

        public int Count => Volatile.Read(ref _count);
        public string? LastCommandText => Volatile.Read(ref _lastCommandText);

        public void Reset()
        {
            Interlocked.Exchange(ref _count, 0);
            Interlocked.Exchange(ref _lastCommandText, null);
        }

        public override InterceptionResult<DbDataReader> ReaderExecuting(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result)
        {
            CountSelect(command);
            return result;
        }

        public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result,
            CancellationToken cancellationToken = default)
        {
            CountSelect(command);
            return ValueTask.FromResult(result);
        }

        private void CountSelect(DbCommand command)
        {
            if (command.CommandText.TrimStart().StartsWith("SELECT", StringComparison.OrdinalIgnoreCase))
            {
                Interlocked.Increment(ref _count);
                Interlocked.Exchange(ref _lastCommandText, command.CommandText);
            }
        }
    }

    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
