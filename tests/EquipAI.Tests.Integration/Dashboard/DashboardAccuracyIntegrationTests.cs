using System.Text.Json;
using EquipAI.Application.Dashboard;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit;

namespace EquipAI.Tests.Integration.Dashboard;

/// <summary>
/// Dashboard 数据准确性集成测试 — 在 SQLite 真实 SQL 翻译路径下验证：
///
/// 1. 多租户严格隔离（单元测试用 TestTenantContext 是单租户，无法暴露此问题）
/// 2. EF Core 在真实 SQL 数据库下正确翻译 LINQ（InMemory 不走 SQL 翻译）
/// 3. 时区转换 + 日期边界在 SQL 层面的正确性
///
/// 这些场景单元测试无法覆盖，因为：
/// - TestTenantContext 是单个租户，无法模拟多租户并发
/// - InMemory 数据库不验证 SQL 翻译，可能掩盖生产环境才暴露的 EF Core 翻译 bug
/// </summary>
public class DashboardAccuracyIntegrationTests : IDisposable
{
    private readonly Microsoft.Data.Sqlite.SqliteConnection _connection;
    private readonly AppDbContext _db;
    private readonly DashboardStatsService _service;
    private readonly Guid _tenantAId;
    private readonly Guid _tenantBId;

    public DashboardAccuracyIntegrationTests()
    {
        // 每个测试实例独立的 SQLite 内存连接，避免跨测试污染
        _connection = new Microsoft.Data.Sqlite.SqliteConnection("Data Source=:memory:");
        _connection.Open();

        _tenantAId = Guid.NewGuid();
        _tenantBId = Guid.NewGuid();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        // 默认上下文为租户 A，测试中切换以验证隔离
        _db = new TestAppDbContext(options, new SwitchableTenantContext(_tenantAId));
        _db.Database.EnsureCreated();

        var logger = LoggerFactory.Create(_ => { }).CreateLogger<DashboardStatsService>();
        _service = new DashboardStatsService(_db, logger);

        SeedTwoTenants();
    }

    /// <summary>
    /// 写入两个租户的基础数据，后续测试在各自上下文中查询验证隔离
    /// </summary>
    private void SeedTwoTenants()
    {
        _db.Tenants.AddRange(
            new Tenant
            {
                Id = _tenantAId,
                Name = "租户A-精密制造",
                Slug = $"tenant-a-{_tenantAId:N}",
                Plan = TenantPlan.Professional,
                Status = TenantStatus.Active,
                IsActive = true,
                TimeZone = "Asia/Shanghai",
            },
            new Tenant
            {
                Id = _tenantBId,
                Name = "租户B-化工",
                Slug = $"tenant-b-{_tenantBId:N}",
                Plan = TenantPlan.Professional,
                Status = TenantStatus.Active,
                IsActive = true,
                TimeZone = "UTC",
            }
        );
        _db.SaveChanges();
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }

    /// <summary>
    /// 切换当前 DbContext 的租户过滤器目标（验证多租户隔离的关键）
    /// </summary>
    private void SetCurrentTenant(Guid tenantId)
    {
        ((SwitchableTenantContext)_db.TenantContextAccessor()).SwitchTo(tenantId);
    }

    // =========================================================================
    // 多租户隔离 — Dashboard 必须严格按租户过滤
    // =========================================================================

    /// <summary>
    /// 关键测试：租户 A 有 10 台设备（5 在线），租户 B 有 3 台设备（3 在线），
    /// 租户 A 查询必须只看到自己的 10 台，不能看到 B 的任何设备。
    ///
    /// Why：EF Core 全局查询过滤器是隔离的唯一防线，任何配置错误都会导致数据泄漏。
    /// </summary>
    [Fact]
    public async Task GetStatsAsync_多租户环境下设备数严格按租户隔离()
    {
        // Arrange：绕过过滤器写入两个租户的数据
        SeedDevicesForTenant(_tenantAId, total: 10, online: 5);
        SeedDevicesForTenant(_tenantBId, total: 3, online: 3);

        // Act：切换到租户 A 上下文查询
        SetCurrentTenant(_tenantAId);
        var statsA = await _service.GetStatsAsync(_tenantAId);

        // Assert：A 只看到自己的 10 台设备、5 台在线
        statsA.TotalDevices.Should().Be(10, "租户 A 不应看到租户 B 的设备");
        statsA.OnlineDevices.Should().Be(5);
        statsA.Availability.Should().Be(50.0);

        // Act：切换到租户 B 上下文
        SetCurrentTenant(_tenantBId);
        var statsB = await _service.GetStatsAsync(_tenantBId);

        // Assert：B 只看到自己的 3 台设备，全部在线
        statsB.TotalDevices.Should().Be(3, "租户 B 不应看到租户 A 的设备");
        statsB.OnlineDevices.Should().Be(3);
        statsB.Availability.Should().Be(100.0);
    }

    /// <summary>
    /// 关键测试：租户 A 的活跃告警不应出现在租户 B 的 Dashboard 中
    /// 即使两个租户使用同一个设备 ID（理论上不会，但验证过滤器健壮性）
    /// </summary>
    [Fact]
    public async Task GetStatsAsync_多租户环境下告警严格按租户隔离()
    {
        // Arrange：租户 A 有 4 条活跃告警，租户 B 有 2 条
        SeedAlertsForTenant(_tenantAId, count: 4, severity: AlertSeverity.High);
        SeedAlertsForTenant(_tenantBId, count: 2, severity: AlertSeverity.Critical);

        // Act & Assert：A 只看到自己的 4 条
        SetCurrentTenant(_tenantAId);
        var statsA = await _service.GetStatsAsync(_tenantAId);
        statsA.ActiveAlerts.Should().Be(4);
        statsA.AlertsBySeverity.Should().ContainKey("High").WhoseValue.Should().Be(4);
        statsA.AlertsBySeverity.Should().NotContainKey("Critical", "租户 A 不应看到租户 B 的 Critical 告警");

        // Act & Assert：B 只看到自己的 2 条
        SetCurrentTenant(_tenantBId);
        var statsB = await _service.GetStatsAsync(_tenantBId);
        statsB.ActiveAlerts.Should().Be(2);
        statsB.AlertsBySeverity.Should().ContainKey("Critical").WhoseValue.Should().Be(2);
        statsB.AlertsBySeverity.Should().NotContainKey("High");
    }

    /// <summary>
    /// 关键测试：租户 A 的工单不应计入租户 B 的工单状态分布
    /// </summary>
    [Fact]
    public async Task GetStatsAsync_多租户环境下工单严格按租户隔离()
    {
        SeedWorkOrdersForTenant(_tenantAId, pendingDispatch: 5, inProgress: 2, closed: 1);
        SeedWorkOrdersForTenant(_tenantBId, pendingDispatch: 1, inProgress: 0, closed: 0);

        SetCurrentTenant(_tenantAId);
        var statsA = await _service.GetStatsAsync(_tenantAId);
        statsA.PendingWorkOrders.Should().Be(5);
        statsA.WorkOrdersByStatus["PendingDispatch"].Should().Be(5);
        statsA.WorkOrdersByStatus["InProgress"].Should().Be(2);
        statsA.WorkOrdersByStatus["Closed"].Should().Be(1);

        SetCurrentTenant(_tenantBId);
        var statsB = await _service.GetStatsAsync(_tenantBId);
        statsB.PendingWorkOrders.Should().Be(1);
        statsB.WorkOrdersByStatus.Should().ContainSingle(kvp => kvp.Value > 0, "租户 B 应只有 1 个 PendingDispatch 工单");
    }

    // =========================================================================
    // 告警状态边界（回归 v1.3 修复：Acknowledged 也计入活跃）
    // =========================================================================

    [Fact]
    public async Task GetStatsAsync_真实SQL路径下Acknowledged状态计入活跃告警()
    {
        SetCurrentTenant(_tenantAId);
        var deviceId = Guid.NewGuid();
        var now = DateTime.UtcNow;

        _db.Alerts.AddRange(
            // 3 条 Active（High 2 条，Critical 1 条）
            new Alert { DeviceId = deviceId, TenantId = _tenantAId, Metric = "t1", Severity = AlertSeverity.High, Value = 90, Threshold = 80, Status = AlertStatus.Active, OccurredAt = now, AlertCode = $"ALT-A1-{Guid.NewGuid():N}".Substring(0, 20) },
            new Alert { DeviceId = deviceId, TenantId = _tenantAId, Metric = "t2", Severity = AlertSeverity.High, Value = 91, Threshold = 80, Status = AlertStatus.Active, OccurredAt = now, AlertCode = $"ALT-A2-{Guid.NewGuid():N}".Substring(0, 20) },
            new Alert { DeviceId = deviceId, TenantId = _tenantAId, Metric = "t3", Severity = AlertSeverity.Critical, Value = 95, Threshold = 80, Status = AlertStatus.Active, OccurredAt = now, AlertCode = $"ALT-A3-{Guid.NewGuid():N}".Substring(0, 20) },
            // 2 条 Acknowledged（Normal 2 条）
            new Alert { DeviceId = deviceId, TenantId = _tenantAId, Metric = "t4", Severity = AlertSeverity.Normal, Value = 70, Threshold = 60, Status = AlertStatus.Acknowledged, OccurredAt = now, AlertCode = $"ALT-K1-{Guid.NewGuid():N}".Substring(0, 20) },
            new Alert { DeviceId = deviceId, TenantId = _tenantAId, Metric = "t5", Severity = AlertSeverity.Normal, Value = 71, Threshold = 60, Status = AlertStatus.Acknowledged, OccurredAt = now, AlertCode = $"ALT-K2-{Guid.NewGuid():N}".Substring(0, 20) },
            // 1 条 Resolved（Low，不应出现）
            new Alert { DeviceId = deviceId, TenantId = _tenantAId, Metric = "t6", Severity = AlertSeverity.Low, Value = 50, Threshold = 40, Status = AlertStatus.Resolved, OccurredAt = now, AlertCode = $"ALT-R1-{Guid.NewGuid():N}".Substring(0, 20) }
        );
        await _db.SaveChangesAsync();

        var stats = await _service.GetStatsAsync(_tenantAId);

        // 3 Active + 2 Acknowledged = 5 活跃（Resolved 不算）
        stats.ActiveAlerts.Should().Be(5);
        stats.AlertsBySeverity["High"].Should().Be(2);
        stats.AlertsBySeverity["Critical"].Should().Be(1);
        stats.AlertsBySeverity["Normal"].Should().Be(2);
        stats.AlertsBySeverity.Should().NotContainKey("Low");
    }

    // =========================================================================
    // 时区边界 — 真实 SQL 路径下验证（SQLite 也能暴露日期比较的 SQL 翻译问题）
    // =========================================================================

    /// <summary>
    /// 边界场景：告警恰好发生在"7 天前的 00:00"是否算入窗口
    /// 当前实现使用 >= 比较，理论上算入；测试锁定此行为
    /// </summary>
    [Fact]
    public async Task GetStatsAsync_告警趋势窗口包含恰好7天前的告警()
    {
        SetCurrentTenant(_tenantAId);
        var deviceId = Guid.NewGuid();

        // 计算租户 A 时区（Asia/Shanghai）下的"今天 0:00"和"7 天前 0:00"
        var tz = TimeZoneInfo.FindSystemTimeZoneById("Asia/Shanghai");
        var todayLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz).Date;
        var sevenDaysAgoLocal = todayLocal.AddDays(-6); // DashboardStatsService 用 -6（含今天共 7 天）

        // 关键：将本地 7 天前 0:00 转 UTC 作为 OccurredAt
        var boundaryUtc = TimeZoneInfo.ConvertTimeToUtc(sevenDaysAgoLocal, tz);

        _db.Alerts.Add(new Alert
        {
            DeviceId = deviceId,
            TenantId = _tenantAId,
            Metric = "boundary",
            Severity = AlertSeverity.High,
            Value = 90,
            Threshold = 80,
            Status = AlertStatus.Active,
            OccurredAt = boundaryUtc, // 恰好边界
            AlertCode = $"ALT-BND-{Guid.NewGuid():N}".Substring(0, 20),
        });
        await _db.SaveChangesAsync();

        var stats = await _service.GetStatsAsync(_tenantAId);

        // 趋势第一天应该包含此告警（因为 >= 边界值）
        stats.AlertTrend[0].Count.Should().Be(1, "边界值（7天前 00:00）的告警应算入趋势第一天");
        stats.AlertTrend.Sum(t => t.Count).Should().Be(1);
    }

    /// <summary>
    /// 边界场景：8 天前的告警不应出现在 7 天趋势窗口中
    /// </summary>
    [Fact]
    public async Task GetStatsAsync_告警趋势窗口排除8天前的告警()
    {
        SetCurrentTenant(_tenantAId);
        var deviceId = Guid.NewGuid();
        var tz = TimeZoneInfo.FindSystemTimeZoneById("Asia/Shanghai");
        var todayLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz).Date;
        var eightDaysAgoLocal = todayLocal.AddDays(-7); // 窗口外
        var outsideUtc = TimeZoneInfo.ConvertTimeToUtc(eightDaysAgoLocal, tz);

        _db.Alerts.Add(new Alert
        {
            DeviceId = deviceId,
            TenantId = _tenantAId,
            Metric = "outside",
            Severity = AlertSeverity.Normal,
            Value = 70,
            Threshold = 60,
            Status = AlertStatus.Active,
            OccurredAt = outsideUtc,
            AlertCode = $"ALT-OUT-{Guid.NewGuid():N}".Substring(0, 20),
        });
        await _db.SaveChangesAsync();

        var stats = await _service.GetStatsAsync(_tenantAId);

        stats.AlertTrend.Sum(t => t.Count).Should().Be(0, "8 天前的告警不应出现在 7 天窗口");
    }

    /// <summary>
    /// 跨时区关键场景：UTC 17:00 发生的告警在 Asia/Shanghai（UTC+8）时区下属于"次日"
    /// 该告警应该被分到趋势图的"未来某天"（实际上是趋势窗口外的明天）
    ///
    /// Why this matters：工业客户在 UTC+8 时区，凌晨 01:00 的告警如果按 UTC 分组会算到"昨天"，
    /// 导致维护主管早上看 Dashboard 以为昨晚没出问题，实际可能漏掉关键告警。
    /// </summary>
    [Fact]
    public async Task GetStatsAsync_UTC17点告警在上海时区应归到次日()
    {
        SetCurrentTenant(_tenantAId);
        var deviceId = Guid.NewGuid();

        // 构造 UTC 今天 17:00 — 这个时间在上海时区是次日 01:00
        var utcNow = DateTime.UtcNow;
        var todayUtc17 = new DateTime(utcNow.Year, utcNow.Month, utcNow.Day, 17, 0, 0, DateTimeKind.Utc);

        _db.Alerts.Add(new Alert
        {
            DeviceId = deviceId,
            TenantId = _tenantAId,
            Metric = "cross-day",
            Severity = AlertSeverity.Critical,
            Value = 100,
            Threshold = 80,
            Status = AlertStatus.Active,
            OccurredAt = todayUtc17,
            AlertCode = $"ALT-XD-{Guid.NewGuid():N}".Substring(0, 20),
        });
        await _db.SaveChangesAsync();

        var stats = await _service.GetStatsAsync(_tenantAId);

        // UTC 17:00 在上海时区是次日 01:00，超出趋势窗口的"今天"
        stats.AlertTrend[6].Count.Should().Be(0, "UTC 17:00 在上海时区是次日 01:00，应算到明天，不出现在 7 天趋势中");
    }

    // =========================================================================
    // 辅助播种方法 — 直接绕过租户过滤器写入
    // =========================================================================

    private void SeedDevicesForTenant(Guid tenantId, int total, int online)
    {
        for (var i = 0; i < total; i++)
        {
            _db.Devices.Add(new Device
            {
                Name = $"Device-{tenantId:N}-{i}",
                Type = "pump",
                DeviceCode = $"DEV-{tenantId:N}".Substring(0, 10) + $"-{i:D3}",
                TenantId = tenantId,
                Status = i < online ? DeviceStatus.Online : DeviceStatus.Offline,
            });
        }
        _db.SaveChanges();
    }

    private void SeedAlertsForTenant(Guid tenantId, int count, AlertSeverity severity)
    {
        var deviceId = Guid.NewGuid();
        var now = DateTime.UtcNow;
        for (var i = 0; i < count; i++)
        {
            _db.Alerts.Add(new Alert
            {
                DeviceId = deviceId,
                TenantId = tenantId,
                Metric = "metric",
                Severity = severity,
                Value = 90 + i,
                Threshold = 80,
                Status = AlertStatus.Active,
                OccurredAt = now,
                AlertCode = $"ALT-{tenantId:N}".Substring(0, 15) + $"-{i:D3}",
            });
        }
        _db.SaveChanges();
    }

    private void SeedWorkOrdersForTenant(Guid tenantId, int pendingDispatch, int inProgress, int closed)
    {
        var deviceId = Guid.NewGuid();
        for (var i = 0; i < pendingDispatch; i++)
        {
            _db.WorkOrders.Add(new WorkOrder
            {
                Title = $"WO-PD-{i}",
                WorkOrderCode = $"WO-{tenantId:N}".Substring(0, 15) + $"-P{i:D3}",
                Status = WorkOrderStatus.PendingDispatch,
                Priority = WorkOrderPriority.Medium,
                DeviceId = deviceId,
                TenantId = tenantId,
                Type = WorkOrderType.Corrective,
            });
        }
        for (var i = 0; i < inProgress; i++)
        {
            _db.WorkOrders.Add(new WorkOrder
            {
                Title = $"WO-IP-{i}",
                WorkOrderCode = $"WO-{tenantId:N}".Substring(0, 15) + $"-I{i:D3}",
                Status = WorkOrderStatus.InProgress,
                Priority = WorkOrderPriority.Medium,
                DeviceId = deviceId,
                TenantId = tenantId,
                Type = WorkOrderType.Corrective,
            });
        }
        for (var i = 0; i < closed; i++)
        {
            _db.WorkOrders.Add(new WorkOrder
            {
                Title = $"WO-CL-{i}",
                WorkOrderCode = $"WO-{tenantId:N}".Substring(0, 15) + $"-C{i:D3}",
                Status = WorkOrderStatus.Closed,
                Priority = WorkOrderPriority.Medium,
                DeviceId = deviceId,
                TenantId = tenantId,
                Type = WorkOrderType.Corrective,
            });
        }
        _db.SaveChanges();
    }
}

/// <summary>
/// 可切换租户上下文 — 测试中动态切换过滤器目标租户
/// </summary>
internal class SwitchableTenantContext : ITenantContext
{
    public Guid TenantId { get; private set; }
    public string IsolationMode { get; } = "shared";
    public bool IsSystemAdmin { get; } = false;
    public Guid UserId { get; } = Guid.NewGuid();

    public SwitchableTenantContext(Guid initialTenantId)
    {
        TenantId = initialTenantId;
    }

    public void SwitchTo(Guid tenantId)
    {
        TenantId = tenantId;
    }
}

/// <summary>
/// AppDbContext 扩展方法：暴露内部的 TenantContext 引用以便测试切换
/// </summary>
internal static class AppDbContextTestExtensions
{
    /// <summary>
    /// 通过反射获取 AppDbContext 内部持有的 ITenantContext 实例
    ///
    /// Why reflection：AppDbContext 的 _tenantContext 字段是 private，
    /// 测试需要切换租户以验证多租户隔离，但生产代码不应暴露此能力。
    /// </summary>
    public static ITenantContext TenantContextAccessor(this AppDbContext db)
    {
        var field = typeof(AppDbContext).GetField(
            "_tenantContext",
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
        return (ITenantContext)field!.GetValue(db)!;
    }
}
