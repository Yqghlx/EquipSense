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
    /// 跨时区关键场景：UTC 17:00 的告警在 Asia/Shanghai（UTC+8）应按本地日期分组
    ///
    /// Why this matters：工业客户在 UTC+8 时区，UTC 17:00 的告警属于本地次日 01:00；
    /// 如果按 UTC 日期分组，维护主管看到的日报日期会偏移一天。
    /// </summary>
    [Fact]
    public async Task GetStatsAsync_UTC17点告警按上海本地日期分组()
    {
        SetCurrentTenant(_tenantAId);
        var deviceId = Guid.NewGuid();

        // 使用前一个 UTC 日的 17:00，保证样本始终落在最近 7 天内且不会成为未来时间。
        var tz = TimeZoneInfo.FindSystemTimeZoneById("Asia/Shanghai");
        var utcDate = DateTime.UtcNow.Date.AddDays(-1);
        var eventUtc = new DateTime(utcDate.Year, utcDate.Month, utcDate.Day, 17, 0, 0, DateTimeKind.Utc);
        var expectedLocalDate = TimeZoneInfo.ConvertTimeFromUtc(eventUtc, tz).Date;

        _db.Alerts.Add(new Alert
        {
            DeviceId = deviceId,
            TenantId = _tenantAId,
            Metric = "cross-day",
            Severity = AlertSeverity.Critical,
            Value = 100,
            Threshold = 80,
            Status = AlertStatus.Active,
            OccurredAt = eventUtc,
            AlertCode = $"ALT-XD-{Guid.NewGuid():N}".Substring(0, 20),
        });
        await _db.SaveChangesAsync();

        var stats = await _service.GetStatsAsync(_tenantAId);

        stats.AlertTrend.Single(t => t.Date == expectedLocalDate.ToString("yyyy-MM-dd")).Count
            .Should().Be(1, "UTC 17:00 应按上海本地次日 01:00 所属日期分组");
        stats.AlertTrend.Single(t => t.Date == eventUtc.ToString("yyyy-MM-dd")).Count
            .Should().Be(0, "告警不应按 UTC 日期分组");
    }

    // =========================================================================
    // 设备多状态混合 — 可用率只计 Online，其他状态（Offline/Maintenance/Warning）一律不计
    // =========================================================================

    /// <summary>
    /// 边界场景：5 台设备混合 4 种状态（2 Online + 1 Offline + 1 Maintenance + 1 Warning）
    ///
    /// 业务定义：DashboardStatsService.Availability 是"瞬时在线比例"（Online/Total）。
    /// 维护主管可能误以为"维护中"也算可用，但代码层面只有 Online 计入。
    /// 此测试锁定该行为，避免后续重构时误把 Maintenance/Warning 也算进去导致数字虚高。
    /// </summary>
    [Fact]
    public async Task GetStatsAsync_设备多状态混合时只计Online入可用率()
    {
        SetCurrentTenant(_tenantAId);
        var deviceId = Guid.NewGuid();

        // 2 Online + 1 Offline + 1 Maintenance + 1 Warning = 5 台总数，2 台在线
        _db.Devices.AddRange(
            new Device { Name = "D-Online-1", Type = "pump", DeviceCode = "MIX-OL-1", TenantId = _tenantAId, Status = DeviceStatus.Online },
            new Device { Name = "D-Online-2", Type = "pump", DeviceCode = "MIX-OL-2", TenantId = _tenantAId, Status = DeviceStatus.Online },
            new Device { Name = "D-Offline", Type = "pump", DeviceCode = "MIX-OFF", TenantId = _tenantAId, Status = DeviceStatus.Offline },
            new Device { Name = "D-Maint", Type = "pump", DeviceCode = "MIX-MNT", TenantId = _tenantAId, Status = DeviceStatus.Maintenance },
            new Device { Name = "D-Warning", Type = "pump", DeviceCode = "MIX-WRN", TenantId = _tenantAId, Status = DeviceStatus.Warning }
        );
        await _db.SaveChangesAsync();

        var stats = await _service.GetStatsAsync(_tenantAId);

        stats.TotalDevices.Should().Be(5);
        stats.OnlineDevices.Should().Be(2, "只有 Online 状态计入，Maintenance/Warning/Offline 都不算");
        stats.Availability.Should().Be(40.0, "2/5 = 40.0%");
    }

    /// <summary>
    /// 边界场景：租户没有任何设备时，Availability 应为 0 而非抛 DivideByZero
    ///
    /// Why：DashboardStatsService.GetStatsAsync 内部用 Total > 0 判空，
    /// 此测试锁定该防御逻辑，避免后续重构时回归到除零异常。
    /// </summary>
    [Fact]
    public async Task GetStatsAsync_零设备时可用率返回零不抛异常()
    {
        SetCurrentTenant(_tenantAId);
        // 故意不播种任何设备

        // 0 设备是合法状态，不应抛 DivideByZero
        var act = async () => await _service.GetStatsAsync(_tenantAId);
        await act.Should().NotThrowAsync();

        var stats = await _service.GetStatsAsync(_tenantAId);
        stats.TotalDevices.Should().Be(0);
        stats.OnlineDevices.Should().Be(0);
        stats.Availability.Should().Be(0, "分母为 0 时应返回 0 而非 NaN 或抛异常");
    }

    // =========================================================================
    // 告警级别分布精确性 — 混合配比严格匹配
    // =========================================================================

    /// <summary>
    /// 边界场景：100 条活跃告警 = 70 Critical + 20 High + 10 Normal
    ///
    /// Why：真实场景中告警级别分布是排班和资源调配的关键依据。
    /// 如果某一级被漏统计（例如枚举 ToString 翻译问题），主管看到的分布比例就错了。
    /// 此测试用 100 条混合告警验证分布严格匹配预期，且总和等于 ActiveAlerts。
    /// </summary>
    [Fact]
    public async Task GetStatsAsync_告警级别分布严格匹配混合配比()
    {
        SetCurrentTenant(_tenantAId);
        var deviceId = Guid.NewGuid();
        var now = DateTime.UtcNow;

        // 70 Critical + 20 High + 10 Normal，全部 Active（无 Resolved，避免混淆）
        AddAlerts(deviceId, _tenantAId, AlertSeverity.Critical, 70, now);
        AddAlerts(deviceId, _tenantAId, AlertSeverity.High, 20, now);
        AddAlerts(deviceId, _tenantAId, AlertSeverity.Normal, 10, now);
        await _db.SaveChangesAsync();

        var stats = await _service.GetStatsAsync(_tenantAId);

        stats.ActiveAlerts.Should().Be(100);
        stats.AlertsBySeverity.Should().ContainKey("Critical").WhoseValue.Should().Be(70);
        stats.AlertsBySeverity.Should().ContainKey("High").WhoseValue.Should().Be(20);
        stats.AlertsBySeverity.Should().ContainKey("Normal").WhoseValue.Should().Be(10);
        stats.AlertsBySeverity.Should().NotContainKey("Low", "未播种 Low 级别告警");

        // 关键不变量：各级别之和必须等于 ActiveAlerts（防止漏统计或重复计数）
        stats.AlertsBySeverity.Values.Sum().Should().Be(stats.ActiveAlerts,
            "各级别告警数之和必须等于活跃告警总数，否则有漏统计或重复计数");
    }

    // =========================================================================
    // 工单状态分布全面性 — 9 个状态独立计数 + PendingWorkOrders 与 ByStatus 一致
    // =========================================================================

    /// <summary>
    /// 边界场景：播种全部 9 个 WorkOrderStatus 各若干条，验证：
    /// 1. WorkOrdersByStatus 字典每个状态都正确计数
    /// 2. PendingWorkOrders == WorkOrdersByStatus["PendingDispatch"]（同一字段的两个出口必须一致）
    ///
    /// Why：PendingWorkOrders 来自 byStatus.TryGetValue("PendingDispatch")，
    /// 如果 TryGetValue 失败（如字典 key 大小写不一致）会返回 0，但 ByStatus 字典里仍可能有值。
    /// 此测试锁定两出口的一致性，防止前端显示矛盾（顶部卡片显示 0，分布图里却显示 5）。
    /// </summary>
    [Fact]
    public async Task GetStatsAsync_工单状态分布含9个状态时准确计数()
    {
        SetCurrentTenant(_tenantAId);
        var deviceId = Guid.NewGuid();

        // 各状态独立播种：PendingDispatch=5, Assigned=3, InProgress=2, Completed=4,
        // Accepted=2, Rejected=1, SubmittedForApproval=2, Closed=1, Cancelled=1
        AddWorkOrders(deviceId, _tenantAId, WorkOrderStatus.PendingDispatch, 5);
        AddWorkOrders(deviceId, _tenantAId, WorkOrderStatus.Assigned, 3);
        AddWorkOrders(deviceId, _tenantAId, WorkOrderStatus.InProgress, 2);
        AddWorkOrders(deviceId, _tenantAId, WorkOrderStatus.Completed, 4);
        AddWorkOrders(deviceId, _tenantAId, WorkOrderStatus.Accepted, 2);
        AddWorkOrders(deviceId, _tenantAId, WorkOrderStatus.Rejected, 1);
        AddWorkOrders(deviceId, _tenantAId, WorkOrderStatus.SubmittedForApproval, 2);
        AddWorkOrders(deviceId, _tenantAId, WorkOrderStatus.Closed, 1);
        AddWorkOrders(deviceId, _tenantAId, WorkOrderStatus.Cancelled, 1);
        await _db.SaveChangesAsync();

        var stats = await _service.GetStatsAsync(_tenantAId);

        // 9 个状态全部独立校验
        stats.WorkOrdersByStatus["PendingDispatch"].Should().Be(5);
        stats.WorkOrdersByStatus["Assigned"].Should().Be(3);
        stats.WorkOrdersByStatus["InProgress"].Should().Be(2);
        stats.WorkOrdersByStatus["Completed"].Should().Be(4);
        stats.WorkOrdersByStatus["Accepted"].Should().Be(2);
        stats.WorkOrdersByStatus["Rejected"].Should().Be(1);
        stats.WorkOrdersByStatus["SubmittedForApproval"].Should().Be(2);
        stats.WorkOrdersByStatus["Closed"].Should().Be(1);
        stats.WorkOrdersByStatus["Cancelled"].Should().Be(1);

        // 关键一致性：顶部 PendingWorkOrders 必须等于 ByStatus["PendingDispatch"]
        stats.PendingWorkOrders.Should().Be(5);
        stats.PendingWorkOrders.Should().Be(stats.WorkOrdersByStatus["PendingDispatch"],
            "PendingWorkOrders 是 ByStatus['PendingDispatch'] 的快捷出口，两者必须始终一致");
    }

    // =========================================================================
    // 趋势补零 — 无数据时返回 7 个零点（非空列表）
    // =========================================================================

    /// <summary>
    /// 边界场景：租户没有任何告警历史时，AlertTrend 应返回 7 个零点而非空列表
    ///
    /// Why：前端 ECharts 趋势图依赖固定的 7 个数据点画图。
    /// 如果后端返回空列表，前端会渲染空白图（不是 7 天全零的直线），
    /// 用户会误以为"图表坏了"而非"过去 7 天确实没告警"。
    /// </summary>
    [Fact]
    public async Task GetStatsAsync_7天无告警时趋势为7个零点()
    {
        SetCurrentTenant(_tenantAId);
        // 故意不播种任何告警

        var stats = await _service.GetStatsAsync(_tenantAId);

        stats.AlertTrend.Should().NotBeEmpty("无告警时应返回 7 个零点，而非空列表");
        stats.AlertTrend.Should().HaveCount(7);
        stats.AlertTrend.Should().AllSatisfy(p => p.Count.Should().Be(0), "无告警时所有点应为零");

        // 同理工单趋势
        stats.WorkOrderTrend.Should().NotBeEmpty();
        stats.WorkOrderTrend.Should().HaveCount(7);
        stats.WorkOrderTrend.Should().AllSatisfy(p => p.Count.Should().Be(0));

        // 7 个日期连续且首日为 6 天前（按租户时区）
        var tz = TimeZoneInfo.FindSystemTimeZoneById("Asia/Shanghai");
        var expectedFirst = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz).Date.AddDays(-6);
        stats.AlertTrend[0].Date.Should().Be(expectedFirst.ToString("yyyy-MM-dd"));
        stats.AlertTrend[6].Date.Should().Be(expectedFirst.AddDays(6).ToString("yyyy-MM-dd"));
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

    /// <summary>
    /// 批量播种 N 条同级别活跃告警（绕过租户过滤器直接写入指定租户）
    /// AlertCode 全局唯一（截断到 20 字符以满足实体约束），用 GUID 避免跨测试冲突
    /// </summary>
    private void AddAlerts(Guid deviceId, Guid tenantId, AlertSeverity severity, int count, DateTime occurredAt)
    {
        for (var i = 0; i < count; i++)
        {
            _db.Alerts.Add(new Alert
            {
                DeviceId = deviceId,
                TenantId = tenantId,
                Metric = $"metric-{severity}-{i}",
                Severity = severity,
                Value = 90 + (i % 10),
                Threshold = 80,
                Status = AlertStatus.Active,
                OccurredAt = occurredAt,
                AlertCode = $"ALT-{severity}-{Guid.NewGuid():N}".Substring(0, 20),
            });
        }
    }

    /// <summary>
    /// 批量播种 N 条同状态工单（绕过租户过滤器直接写入指定租户）
    /// WorkOrderCode 用 GUID 前 8 字符保证唯一性
    /// （最长组合：WO-SubmittedForApproval-{8 字符 GUID} = 32 字符，远小于 50 字符限制）
    /// </summary>
    private void AddWorkOrders(Guid deviceId, Guid tenantId, WorkOrderStatus status, int count)
    {
        for (var i = 0; i < count; i++)
        {
            var guidSuffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            _db.WorkOrders.Add(new WorkOrder
            {
                Title = $"WO-{status}-{i}",
                WorkOrderCode = $"WO-{status}-{guidSuffix}",
                Status = status,
                Priority = WorkOrderPriority.Medium,
                DeviceId = deviceId,
                TenantId = tenantId,
                Type = WorkOrderType.Corrective,
            });
        }
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
