using EquipAI.Application.Dashboard;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Xunit;

namespace EquipAI.Tests.Unit.Dashboard;

/// <summary>
/// 仪表盘统计服务单元测试
/// </summary>
public class DashboardStatsServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly DashboardStatsService _service;
    private readonly Guid _tenantId;

    public DashboardStatsServiceTests()
    {
        _tenantId = Guid.NewGuid();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"DashboardStats_{Guid.NewGuid()}")
            .Options;

        _db = new AppDbContext(options, new TestTenantContext(_tenantId));
        var logger = LoggerFactory.Create(_ => { }).CreateLogger<DashboardStatsService>();
        _service = new DashboardStatsService(_db, logger);
    }

    public void Dispose()
    {
        _db.Dispose();
    }

    // =========================================================================
    // 基础统计
    // =========================================================================

    [Fact]
    public async Task GetStatsAsync_无数据时应返回零值()
    {
        var result = await _service.GetStatsAsync(_tenantId, CancellationToken.None);

        result.TotalDevices.Should().Be(0);
        result.OnlineDevices.Should().Be(0);
        result.ActiveAlerts.Should().Be(0);
        result.PendingWorkOrders.Should().Be(0);
        result.Availability.Should().Be(0);
    }

    [Fact]
    public async Task GetStatsAsync_有设备时应正确计算可用率()
    {
        // 添加 5 台设备，3 台在线
        for (var i = 0; i < 5; i++)
        {
            _db.Devices.Add(new Device
            {
                Name = $"设备{i}",
                Type = "pump",
                DeviceCode = $"DEV-{i:D3}",
                TenantId = _tenantId,
                Status = i < 3 ? DeviceStatus.Online : DeviceStatus.Offline,
            });
        }
        await _db.SaveChangesAsync();

        var result = await _service.GetStatsAsync(_tenantId, CancellationToken.None);

        result.TotalDevices.Should().Be(5);
        result.OnlineDevices.Should().Be(3);
        result.Availability.Should().Be(60.0);
    }

    // =========================================================================
    // 告警统计
    // =========================================================================

    [Fact]
    public async Task GetStatsAsync_应正确统计告警级别分布()
    {
        var deviceId = Guid.NewGuid();

        // 添加 2 个 Critical、1 个 High、3 个 Normal（Active 状态）
        _db.Alerts.Add(new Core.Entities.Alert
        {
            DeviceId = deviceId, TenantId = _tenantId, Metric = "temp", Severity = AlertSeverity.Critical,
            Value = 100, Threshold = 80,
            Status = AlertStatus.Active, OccurredAt = DateTime.UtcNow,
        });
        _db.Alerts.Add(new Core.Entities.Alert
        {
            DeviceId = deviceId, TenantId = _tenantId, Metric = "temp", Severity = AlertSeverity.Critical,
            Value = 95, Threshold = 80,
            Status = AlertStatus.Active, OccurredAt = DateTime.UtcNow,
        });
        _db.Alerts.Add(new Core.Entities.Alert
        {
            DeviceId = deviceId, TenantId = _tenantId, Metric = "vibration", Severity = AlertSeverity.High,
            Value = 5, Threshold = 3,
            Status = AlertStatus.Active, OccurredAt = DateTime.UtcNow,
        });
        for (var i = 0; i < 3; i++)
        {
            _db.Alerts.Add(new Core.Entities.Alert
            {
                DeviceId = deviceId, TenantId = _tenantId, Metric = "pressure", Severity = AlertSeverity.Normal,
                Value = 110, Threshold = 100,
                Status = AlertStatus.Active, OccurredAt = DateTime.UtcNow,
            });
        }
        // 已解决的不计入
        _db.Alerts.Add(new Core.Entities.Alert
        {
            DeviceId = deviceId, TenantId = _tenantId, Metric = "temp", Severity = AlertSeverity.Low,
            Value = 10, Threshold = 5,
            Status = AlertStatus.Resolved, OccurredAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();

        var result = await _service.GetStatsAsync(_tenantId, CancellationToken.None);

        result.ActiveAlerts.Should().Be(6);
        result.AlertsBySeverity["Critical"].Should().Be(2);
        result.AlertsBySeverity["High"].Should().Be(1);
        result.AlertsBySeverity["Normal"].Should().Be(3);
        // Low 是 Resolved，不在 Active 中
        result.AlertsBySeverity.Should().NotContainKey("Low");
    }

    /// <summary>
    /// 关键修复测试：Acknowledged 状态（已确认未解决）应计入活跃告警
    ///
    /// 修复前：只算 Status=Active，用户确认告警后活跃数立即减少，误以为问题已处理
    /// 修复后：包含 Active + Acknowledged，只有 Resolved 才从活跃数中扣除
    /// </summary>
    [Fact]
    public async Task GetStatsAsync_已确认未解决的告警应计入活跃数()
    {
        var deviceId = Guid.NewGuid();

        // 1 个 Active + 2 个 Acknowledged + 1 个 Resolved
        _db.Alerts.Add(new Core.Entities.Alert
        {
            DeviceId = deviceId, TenantId = _tenantId, Metric = "temp", Severity = AlertSeverity.High,
            Value = 100, Threshold = 80,
            Status = AlertStatus.Active, OccurredAt = DateTime.UtcNow,
        });
        _db.Alerts.Add(new Core.Entities.Alert
        {
            DeviceId = deviceId, TenantId = _tenantId, Metric = "temp", Severity = AlertSeverity.High,
            Value = 95, Threshold = 80,
            Status = AlertStatus.Acknowledged, OccurredAt = DateTime.UtcNow,
        });
        _db.Alerts.Add(new Core.Entities.Alert
        {
            DeviceId = deviceId, TenantId = _tenantId, Metric = "vibration", Severity = AlertSeverity.Normal,
            Value = 5, Threshold = 3,
            Status = AlertStatus.Acknowledged, OccurredAt = DateTime.UtcNow,
        });
        _db.Alerts.Add(new Core.Entities.Alert
        {
            DeviceId = deviceId, TenantId = _tenantId, Metric = "pressure", Severity = AlertSeverity.Low,
            Value = 110, Threshold = 100,
            Status = AlertStatus.Resolved, OccurredAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();

        var result = await _service.GetStatsAsync(_tenantId, CancellationToken.None);

        // 1 Active + 2 Acknowledged = 3 活跃（Resolved 不算）
        result.ActiveAlerts.Should().Be(3, "Acknowledged 也应计入活跃告警");
        result.AlertsBySeverity["High"].Should().Be(2, "1 Active + 1 Acknowledged 都是 High");
        result.AlertsBySeverity["Normal"].Should().Be(1);
        result.AlertsBySeverity.Should().NotContainKey("Low", "Resolved 不应出现");
    }

    /// <summary>
    /// v1.4 修复测试：跨时区用户的趋势图按租户时区分组，不再按 UTC。
    ///
    /// 本测试必须对"当前运行时刻"不变。早期写法用 <c>DateTime.UtcNow.Date</c> 植入 todayUtc+17h 告警
    /// 并断言它不算在今天——但当 UTC 时间处于 16:00~24:00 时，租户本地(UTC+8)已跨日，"今天本地"翻转，
    /// 使该告警落入今天桶、断言反转（每天约 1/3 时段失败，CI flaky）。
    ///
    /// 修复后写法：一切以"租户本地今天"(todayLocal)为锚点（与生产 GetAlertTrendAsync 计算方式一致），
    /// 植入一条 UTC 日期与本地日期 deliberately 不同的告警（本地凌晨 04:00 = 前一天 20:00 UTC），
    /// 断言它按【本地日期】落入对应桶、而非按 UTC 日期。锚点恒为 todayLocal，与当前小时无关。
    /// </summary>
    [Fact]
    public async Task GetStatsAsync_跨时区告警应按租户时区分组()
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById("Asia/Shanghai");

        _db.Tenants.Add(new Tenant
        {
            Id = _tenantId,
            Name = "测试租户",
            Slug = "test-tenant",
            TimeZone = "Asia/Shanghai",
        });

        // 锚点：租户本地的"今天"（与生产 GetAlertTrendAsync 一致）；窗口为 [todayLocal-6, todayLocal]
        var todayLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz).Date;
        var startLocal = todayLocal.AddDays(-6);

        // 植入一条告警：本地"昨天 04:00"，换算 UTC 为"前天 20:00"。
        // 即告警的 UTC 日期 = 昨天-1，本地日期 = 昨天——两者不同，正是 v1.4 要覆盖的跨时区分组场景。
        var targetLocalDate = todayLocal.AddDays(-1);               // 昨天（本地）
        var occurredLocal = targetLocalDate.AddHours(4);            // 本地 04:00
        var occurredUtc = TimeZoneInfo.ConvertTimeToUtc(occurredLocal, tz); // UTC = 前一天 20:00

        _db.Alerts.Add(new Core.Entities.Alert
        {
            DeviceId = Guid.NewGuid(),
            TenantId = _tenantId,
            Metric = "temp",
            Severity = AlertSeverity.High,
            Value = 100,
            Threshold = 80,
            Status = AlertStatus.Active,
            OccurredAt = occurredUtc,
        });
        await _db.SaveChangesAsync();

        var result = await _service.GetStatsAsync(_tenantId, CancellationToken.None);

        result.AlertTrend.Should().HaveCount(7);

        // 昨天(本地)在 7 天窗口内的下标 = 5
        var expectedBucket = (int)(targetLocalDate - startLocal).TotalDays;

        // 按本地日期分组：告警应落在"昨天"桶，证明按租户本地日期分组
        result.AlertTrend[expectedBucket].Count.Should().Be(1,
            "告警应按租户本地日期(昨天)分组，落在窗口第 {0} 个点", expectedBucket);
        // 反向佐证：若按 UTC 日期(旧 bug)分组，该告警会落到更早一个点(expectedBucket-1)，那里应为 0
        result.AlertTrend[expectedBucket - 1].Count.Should().Be(0,
            "UTC 日期比本地日期早一天——按 UTC 分组才会落此点，应为 0，反向证明按本地分组");
        result.AlertTrend[6].Count.Should().Be(0, "告警本地日期为昨天，不应计入今天桶");
    }

    /// <summary>
    /// 时区字段无效时应降级为 UTC，不抛异常
    /// </summary>
    [Fact]
    public async Task GetStatsAsync_无效时区应降级为UTC()
    {
        _db.Tenants.Add(new Tenant
        {
            Id = _tenantId,
            Name = "无效时区租户",
            Slug = "bad-tz",
            TimeZone = "Invalid/NotReal",
        });
        await _db.SaveChangesAsync();

        // 不应抛异常，应正常返回（降级 UTC）
        var result = await _service.GetStatsAsync(_tenantId, CancellationToken.None);
        result.AlertTrend.Should().HaveCount(7);
    }

    // =========================================================================
    // 工单统计
    // =========================================================================

    [Fact]
    public async Task GetStatsAsync_应正确统计工单状态分布()
    {
        var deviceId = Guid.NewGuid();

        // 添加各种状态的工单
        _db.WorkOrders.Add(new WorkOrder
        {
            Title = "工单1", Status = WorkOrderStatus.PendingDispatch,
            Priority = WorkOrderPriority.High, WorkOrderCode = "WO-001",
            DeviceId = deviceId, TenantId = _tenantId,
        });
        _db.WorkOrders.Add(new WorkOrder
        {
            Title = "工单2", Status = WorkOrderStatus.PendingDispatch,
            Priority = WorkOrderPriority.Medium, WorkOrderCode = "WO-002",
            DeviceId = deviceId, TenantId = _tenantId,
        });
        _db.WorkOrders.Add(new WorkOrder
        {
            Title = "工单3", Status = WorkOrderStatus.InProgress,
            Priority = WorkOrderPriority.Low, WorkOrderCode = "WO-003",
            DeviceId = deviceId, TenantId = _tenantId,
        });
        _db.WorkOrders.Add(new WorkOrder
        {
            Title = "工单4", Status = WorkOrderStatus.Closed,
            Priority = WorkOrderPriority.High, WorkOrderCode = "WO-004",
            DeviceId = deviceId, TenantId = _tenantId,
        });
        await _db.SaveChangesAsync();

        var result = await _service.GetStatsAsync(_tenantId, CancellationToken.None);

        result.PendingWorkOrders.Should().Be(2);
        result.WorkOrdersByStatus["PendingDispatch"].Should().Be(2);
        result.WorkOrdersByStatus["InProgress"].Should().Be(1);
        result.WorkOrdersByStatus["Closed"].Should().Be(1);
    }

    // =========================================================================
    // 趋势数据
    // =========================================================================

    [Fact]
    public async Task GetStatsAsync_告警趋势应返回7天数据()
    {
        var deviceId = Guid.NewGuid();
        var today = DateTime.UtcNow.Date;

        // 今天 3 个告警
        for (var i = 0; i < 3; i++)
        {
            _db.Alerts.Add(new Core.Entities.Alert
            {
                DeviceId = deviceId, TenantId = _tenantId, Metric = "temp", Severity = AlertSeverity.High,
                Value = 90, Threshold = 80,
                Status = AlertStatus.Active, OccurredAt = DateTime.UtcNow,
            });
        }
        // 3 天前 2 个告警
        for (var i = 0; i < 2; i++)
        {
            _db.Alerts.Add(new Core.Entities.Alert
            {
                DeviceId = deviceId, TenantId = _tenantId, Metric = "temp", Severity = AlertSeverity.Normal,
                Value = 85, Threshold = 80,
                Status = AlertStatus.Active, OccurredAt = today.AddDays(-3).AddHours(10),
            });
        }
        // 10 天前的不应计入（超出 7 天范围）
        _db.Alerts.Add(new Core.Entities.Alert
        {
            DeviceId = deviceId, TenantId = _tenantId, Metric = "temp", Severity = AlertSeverity.Low,
            Value = 81, Threshold = 80,
            Status = AlertStatus.Active, OccurredAt = today.AddDays(-10),
        });
        await _db.SaveChangesAsync();

        var result = await _service.GetStatsAsync(_tenantId, CancellationToken.None);

        result.AlertTrend.Should().HaveCount(7);
        // 总数应为 5（3 今天 + 2 三天前 = 5，超出范围的不计）
        result.AlertTrend.Sum(t => t.Count).Should().Be(5);
        // 第一天（6天前）应为 0
        result.AlertTrend[0].Count.Should().Be(0);
    }

    [Fact]
    public async Task GetStatsAsync_工单趋势应返回7天数据()
    {
        // 使用明确的 DateTime（带 Kind=Utc）确保 InMemory 比较一致
        var now = DateTime.UtcNow;
        var today = new DateTime(now.Year, now.Month, now.Day, 12, 0, 0, DateTimeKind.Utc);

        _db.WorkOrders.Add(new WorkOrder
        {
            Title = "工单A", Status = WorkOrderStatus.Closed,
            Priority = WorkOrderPriority.High, WorkOrderCode = "WO-A",
            DeviceId = Guid.NewGuid(), TenantId = _tenantId,
            CreatedAt = today,
        });
        _db.WorkOrders.Add(new WorkOrder
        {
            Title = "工单B", Status = WorkOrderStatus.Closed,
            Priority = WorkOrderPriority.Medium, WorkOrderCode = "WO-B",
            DeviceId = Guid.NewGuid(), TenantId = _tenantId,
            CreatedAt = today.AddDays(-1),
        });
        await _db.SaveChangesAsync();

        var result = await _service.GetStatsAsync(_tenantId, CancellationToken.None);

        result.WorkOrderTrend.Should().HaveCount(7);
        // 总数应为 2（所有工单都在 7 天范围内）
        result.WorkOrderTrend.Sum(t => t.Count).Should().Be(2);
    }

    /// <summary>
    /// 测试用租户上下文
    /// </summary>
    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode { get; } = "shared";
        public bool IsSystemAdmin { get; } = false;
        public Guid UserId { get; } = Guid.NewGuid();
    }
}
