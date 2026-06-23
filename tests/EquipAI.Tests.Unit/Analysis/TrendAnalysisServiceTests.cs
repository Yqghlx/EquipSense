using EquipAI.Application.Analysis;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Tests.Unit.Analysis;

/// <summary>
/// TrendAnalysisService 单元测试
///
/// 趋势预警服务基于线性回归预测"指标 X 天后超阈值"。如果数学计算错误或
/// 边界条件处理失误，会让运维：
///   - 误以为设备健康（实际即将超阈值）→ 漏预警
///   - 误以为即将超阈值（实际稳定）→ 假预警，浪费人力
///
/// 测试维度：
/// 1. 样本不足 early return（&lt; 10 原始数据 / &lt; 5 小时聚合）
/// 2. 趋势方向判定（上升 / 平稳 / 下降）
/// 3. 超阈值预测的 7 天边界（窗口内预警 / 窗口外不算）
/// 4. 无阈值时跳过预测
/// 5. AnalyzeAllTrendsAsync 批量只返回预警
///
/// 注意：DeviceTelemetry 是 HasNoKey 实体（TimescaleDB 超表），
/// EF Core 不允许通过 ChangeTracker 植入。改用 SQLite 内存 +
/// ExecuteSqlRawAsync 原生 INSERT 绕过追踪。
/// </summary>
public class TrendAnalysisServiceTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private ServiceProvider _sp = null!;
    private readonly Guid _tenantId = Guid.NewGuid();

    public async Task InitializeAsync()
    {
        // SQLite 内存数据库（连接保持打开期间数据持久）
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseSqlite(_connection));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(_tenantId));
        services.AddLogging();
        _sp = services.BuildServiceProvider();

        // 建表（含 device_telemetry）
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

    private AppDbContext GetDb()
    {
        var db = _sp.GetRequiredService<AppDbContext>();
        return db;
    }

    private TrendAnalysisService CreateService(AppDbContext db)
    {
        var logger = _sp.GetRequiredService<ILogger<TrendAnalysisService>>();
        return new TrendAnalysisService(db, logger);
    }

    /// <summary>
    /// 用原生 SQL 植入一条 DeviceTelemetry 记录
    ///
    /// Why：DeviceTelemetry 配置了 HasNoKey（见 DeviceTelemetryConfiguration.cs:11），
    /// EF Core ChangeTracker 拒绝追踪无主键实体。生产环境通过 ExecuteSqlRawAsync
    /// 多值 INSERT 写入（TelemetryService.cs:112），测试必须用同样方式绕过追踪器。
    /// </summary>
    private static async Task InsertTelemetryAsync(AppDbContext db, Guid deviceId, Guid tenantId,
        string metric, DateTime time, double value, string quality = "good")
    {
        await db.Database.ExecuteSqlRawAsync(
            "INSERT INTO device_telemetry (time, tenant_id, device_id, metric, value, quality, source) " +
            "VALUES ({0}, {1}, {2}, {3}, {4}, {5}, {6})",
            time.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"), tenantId, deviceId, metric, value, quality, "test");
    }

    /// <summary>
    /// 构造连续小时级遥测数据（每小时一条，等距时间序列）
    ///
    /// 时间从 now 往前推 hours 小时，保证所有数据点都在 7 天窗口内（服务只看最近 7 天）。
    /// </summary>
    /// <param name="hours">生成多少小时的数据（每小时一条）</param>
    /// <param name="baseValue">起始值（最老一条）</param>
    /// <param name="incrementPerHour">每小时增量（线性趋势）</param>
    private static async Task SeedTelemetryAsync(
        AppDbContext db, Guid deviceId, Guid tenantId, string metric, int hours,
        double baseValue, double incrementPerHour)
    {
        var now = DateTime.UtcNow;
        for (var i = 0; i < hours; i++)
        {
            // 从 (now - hours + 1) 小时到 now，每小时一条
            var t = now.AddHours(-hours + i + 1);
            await InsertTelemetryAsync(db, deviceId, tenantId, metric, t, baseValue + incrementPerHour * i);
        }
    }

    private static async Task SeedAlertRuleAsync(AppDbContext db, Guid deviceId, Guid tenantId,
        string metric, double threshold, AlertSeverity severity = AlertSeverity.High)
    {
        db.AlertRules.Add(new AlertRule
        {
            DeviceId = deviceId,
            TenantId = tenantId,  // 必须匹配 ITenantContext.TenantId 才能通过全局过滤器
            Name = $"rule-{metric}",
            Metric = metric,
            RuleType = RuleType.Threshold,
            Operator = ">",
            Threshold = (decimal)threshold,
            Severity = severity,
            Enabled = true,
            CooldownSeconds = 60,
        });
        await db.SaveChangesAsync();
    }

    // =========================================================================
    // 样本不足 early return — 防止小样本误判趋势
    // =========================================================================

    /// <summary>
    /// 原始数据不足 10 条时返回 null
    ///
    /// Why：样本太少时线性回归极易受噪声影响，
    /// 2-3 个偶然高点会被算成"上升趋势"导致假预警。要求 ≥10 条原始数据。
    /// </summary>
    [Fact]
    public async Task AnalyzeTrendAsync_原始数据不足10条_返回null()
    {
        var db = GetDb();
        var service = CreateService(db);
        var deviceId = Guid.NewGuid();

        // 只放 5 条数据
        await SeedTelemetryAsync(db, deviceId, _tenantId, "temp", 5, 50.0, 0.1);

        var result = await service.AnalyzeTrendAsync(deviceId, "temp");

        result.Should().BeNull("样本不足时不应强行计算趋势");
    }

    /// <summary>
    /// 聚合后小时数不足 5 个时返回 null
    ///
    /// Why：10 条原始数据可能集中在 1-2 小时内（如每分钟 1 条），
    /// 按小时聚合后只有 1-2 个点，仍不足以计算趋势。需要 ≥5 小时数据。
    /// </summary>
    [Fact]
    public async Task AnalyzeTrendAsync_小时聚合后不足5个_返回null()
    {
        var db = GetDb();
        var service = CreateService(db);
        var deviceId = Guid.NewGuid();

        // 10 条数据但都集中在 1 小时内（同一小时内每分钟一条）
        var now = DateTime.UtcNow;
        for (var i = 0; i < 10; i++)
        {
            await InsertTelemetryAsync(db, deviceId, _tenantId, "temp",
                now.AddMinutes(-i), 50 + i);
        }

        var result = await service.AnalyzeTrendAsync(deviceId, "temp");

        result.Should().BeNull("聚合后小时数不足 5 不应计算趋势");
    }

    // =========================================================================
    // 趋势方向判定 — 上升 / 平稳 / 下降
    // =========================================================================

    /// <summary>
    /// 数据稳定不变时判定为"平稳"
    ///
    /// slope ≈ 0（绝对值 < 0.0001），TrendDirection = "平稳"
    /// </summary>
    [Fact]
    public async Task AnalyzeTrendAsync_数据稳定_判定为平稳()
    {
        var db = GetDb();
        var service = CreateService(db);
        var deviceId = Guid.NewGuid();

        await SeedTelemetryAsync(db, deviceId, _tenantId, "temp", 12, 50.0, 0);

        var result = await service.AnalyzeTrendAsync(deviceId, "temp");

        result.Should().NotBeNull();
        result!.TrendDirection.Should().Be("平稳", "数据稳定时方向应为平稳");
        result.TrendSlope.Should().BeApproximately(0, 0.1, "稳定数据的斜率应接近 0");
        result.WillExceedThreshold.Should().BeFalse("平稳数据不应触发预警");
    }

    /// <summary>
    /// 数据持续上升时判定为"上升"
    /// 每小时增 0.5 → slope = 0.5/hour → TrendSlope = 0.5 × 24 = 12/day
    /// </summary>
    [Fact]
    public async Task AnalyzeTrendAsync_数据持续上升_判定为上升()
    {
        var db = GetDb();
        var service = CreateService(db);
        var deviceId = Guid.NewGuid();

        await SeedTelemetryAsync(db, deviceId, _tenantId, "temp", 12, 40.0, 0.5);

        var result = await service.AnalyzeTrendAsync(deviceId, "temp");

        result.Should().NotBeNull();
        result!.TrendDirection.Should().Be("上升");
        result.TrendSlope.Should().BeApproximately(12, 0.5, "每小时增 0.5 → 每天增 12");
        result.CurrentValue.Should().BeGreaterThan(result.AverageValue, "上升数据的当前值应大于平均值");
    }

    /// <summary>
    /// 数据持续下降时判定为"下降"
    /// </summary>
    [Fact]
    public async Task AnalyzeTrendAsync_数据持续下降_判定为下降()
    {
        var db = GetDb();
        var service = CreateService(db);
        var deviceId = Guid.NewGuid();

        await SeedTelemetryAsync(db, deviceId, _tenantId, "temp", 12, 80.0, -0.5);

        var result = await service.AnalyzeTrendAsync(deviceId, "temp");

        result.Should().NotBeNull();
        result!.TrendDirection.Should().Be("下降");
        result.TrendSlope.Should().BeApproximately(-12, 0.5, "每小时降 0.5 → 每天降 12");
        result.CurrentValue.Should().BeLessThan(result.AverageValue);
    }

    // =========================================================================
    // 超阈值预测 — 7 天窗口边界
    // =========================================================================

    /// <summary>
    /// 关键场景：数据上升 + 有阈值 + 7 天内会超 → 触发预警
    ///
    /// 构造：起始 50.0，每小时增 1.0，12 小时后当前值约 61.0
    /// 阈值 100，预测还需 (100 - 61) / (24 × 1) ≈ 1.6 天 → 在 7 天内
    /// </summary>
    [Fact]
    public async Task AnalyzeTrendAsync_7天内将超阈值_触发预警()
    {
        var db = GetDb();
        var service = CreateService(db);
        var deviceId = Guid.NewGuid();

        await SeedTelemetryAsync(db, deviceId, _tenantId, "temp", 12, 50.0, 1.0);
        await SeedAlertRuleAsync(db, deviceId, _tenantId, "temp", threshold: 100);

        var result = await service.AnalyzeTrendAsync(deviceId, "temp");

        result.Should().NotBeNull();
        result!.Threshold.Should().Be(100);
        result.WillExceedThreshold.Should().BeTrue("当前值约 61，每天增 24，约 1.6 天后超阈值 100");
        result.DaysToThreshold.Should().NotBeNull();
        result.DaysToThreshold.Should().BeGreaterThan(0);
        result.DaysToThreshold.Should().BeLessThanOrEqualTo(7, "应在 7 天窗口内");
    }

    /// <summary>
    /// 边界场景：当前值已超阈值 → 不应触发"将超"预警（因为已经超了）
    ///
    /// Why：服务职责是"预警"（提前告警），不是"已发告警"。已超阈值由告警引擎处理。
    /// </summary>
    [Fact]
    public async Task AnalyzeTrendAsync_当前值已超阈值_不触发预警()
    {
        var db = GetDb();
        var service = CreateService(db);
        var deviceId = Guid.NewGuid();

        // 12 小时数据，从 90 到 110（已超阈值 100）
        await SeedTelemetryAsync(db, deviceId, _tenantId, "temp", 12, 90.0, 2.0);
        await SeedAlertRuleAsync(db, deviceId, _tenantId, "temp", threshold: 100);

        var result = await service.AnalyzeTrendAsync(deviceId, "temp");

        result.Should().NotBeNull();
        result!.WillExceedThreshold.Should().BeFalse("当前值已超阈值，不应再触发'将超'预警");
    }

    /// <summary>
    /// 边界场景：上升但 7 天后才会超阈值 → 不触发预警
    ///
    /// 构造：起始 50.0，每小时增 0.01（极慢），12 小时后约 50.12
    /// 阈值 100，预测还需 (100 - 50.12) / 0.24 ≈ 207 天 → 远超 7 天
    /// </summary>
    [Fact]
    public async Task AnalyzeTrendAsync_上升但7天后才超_不触发预警()
    {
        var db = GetDb();
        var service = CreateService(db);
        var deviceId = Guid.NewGuid();

        await SeedTelemetryAsync(db, deviceId, _tenantId, "temp", 12, 50.0, 0.01);
        await SeedAlertRuleAsync(db, deviceId, _tenantId, "temp", threshold: 100);

        var result = await service.AnalyzeTrendAsync(deviceId, "temp");

        result.Should().NotBeNull();
        result!.WillExceedThreshold.Should().BeFalse("超阈值需要 200+ 天，超过 7 天窗口");
        // 生产代码仍计算 DaysToThreshold（如 207.9），但 > 7 天所以 WillExceedThreshold=false
        result.DaysToThreshold.Should().NotBeNull();
        result.DaysToThreshold.Should().BeGreaterThan(7, "实际超阈值时间远超 7 天窗口");
    }

    /// <summary>
    /// 边界场景：无告警规则（无阈值）→ 不做超阈值预测
    ///
    /// Why：没有阈值就无法预测"何时超阈值"。但仍返回趋势方向和变化率。
    /// </summary>
    [Fact]
    public async Task AnalyzeTrendAsync_无阈值规则_跳过预测_仍返回趋势()
    {
        var db = GetDb();
        var service = CreateService(db);
        var deviceId = Guid.NewGuid();

        await SeedTelemetryAsync(db, deviceId, _tenantId, "temp", 12, 50.0, 1.0);
        // 故意不创建告警规则

        var result = await service.AnalyzeTrendAsync(deviceId, "temp");

        result.Should().NotBeNull("无阈值也应返回趋势统计");
        result!.Threshold.Should().BeNull();
        result.DaysToThreshold.Should().BeNull();
        result.WillExceedThreshold.Should().BeFalse();
        result.TrendDirection.Should().Be("上升", "趋势方向与阈值无关");
    }

    // =========================================================================
    // AnalyzeAllTrendsAsync — 批量只返回预警设备
    // =========================================================================

    /// <summary>
    /// 批量分析只返回 willExceedThreshold=true 的设备
    ///
    /// Why：Dashboard 只展示预警，无预警的趋势对运维无价值（信息过载）。
    /// </summary>
    [Fact]
    public async Task AnalyzeAllTrendsAsync_只返回有预警的设备()
    {
        var db = GetDb();
        var service = CreateService(db);
        var warnDevice = Guid.NewGuid();
        var stableDevice = Guid.NewGuid();
        var noThresholdDevice = Guid.NewGuid();

        // 设备1：上升 + 阈值 100 + 7 天内超 → 预警
        await SeedTelemetryAsync(db, warnDevice, _tenantId, "temp", 12, 50.0, 1.0);
        await SeedAlertRuleAsync(db, warnDevice, _tenantId, "temp", 100);

        // 设备2：稳定 + 阈值 100 → 不预警（无趋势）
        await SeedTelemetryAsync(db, stableDevice, _tenantId, "temp", 12, 50.0, 0);
        await SeedAlertRuleAsync(db, stableDevice, _tenantId, "temp", 100);

        // 设备3：上升但无阈值 → 不预警（无法预测）
        await SeedTelemetryAsync(db, noThresholdDevice, _tenantId, "temp", 12, 50.0, 1.0);

        var results = await service.AnalyzeAllTrendsAsync(_tenantId);

        results.Should().ContainSingle("只有 warnDevice 满足'7 天内将超阈值'");
        results[0].DeviceId.Should().Be(warnDevice);
    }

    // =========================================================================
    // 测试辅助类
    // =========================================================================

    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
