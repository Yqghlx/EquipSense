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

        // 添加 2 个 Critical、1 个 High、3 个 Normal
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
