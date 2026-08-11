using EquipAI.Application.Analysis;
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
/// OEE 服务单元测试 — 重点验证多租户隔离和数据准确性
///
/// 这些测试用例直接对应 v1.3.0 发现的两个 P0 问题：
/// 1. 原 CalculateAsync 用 IgnoreQueryFilters() 绕过租户过滤器，是真实的多租户安全漏洞
/// 2. Performance 在无遥测时返回 1.0（满值）会误导用户以为设备性能正常
/// </summary>
public class OeeServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly Guid _tenantId;
    private readonly Guid _otherTenantId;

    public OeeServiceTests()
    {
        _tenantId = Guid.NewGuid();
        _otherTenantId = Guid.NewGuid();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"OeeService_{Guid.NewGuid()}")
            .Options;

        _db = new AppDbContext(options, new TestTenantContext(_tenantId));
    }

    public void Dispose()
    {
        _db.Dispose();
    }

    // =========================================================================
    // P0 测试：跨租户隔离
    // =========================================================================

    [Fact]
    public async Task CalculateAsync_其他租户的Critical告警不应污染本租户Quality()
    {
        // 场景：本租户有 4 台设备无告警；另一租户有 1 条 Critical 告警
        // 修复前（IgnoreQueryFilters）：devicesWithCriticalAlert=1 → quality=1-1/4=75%（被污染）
        // 修复后（默认过滤器）：devicesWithCriticalAlert=0 → quality=100%（正确）

        var myDevice1 = Guid.NewGuid();
        var myDevice2 = Guid.NewGuid();
        var otherDevice = Guid.NewGuid();

        _db.Devices.Add(new Device
        {
            Name = "我方设备1", Type = "compressor", DeviceCode = "DEV-MY-1",
            TenantId = _tenantId, Status = DeviceStatus.Online,
        });
        _db.Devices.Add(new Device
        {
            Name = "我方设备2", Type = "compressor", DeviceCode = "DEV-MY-2",
            TenantId = _tenantId, Status = DeviceStatus.Online,
        });
        // 另一租户的设备（不应出现在本租户 TotalDevices 里）
        _db.Devices.Add(new Device
        {
            Name = "他方设备", Type = "compressor", DeviceCode = "DEV-OTHER",
            TenantId = _otherTenantId, Status = DeviceStatus.Online,
        });
        // 另一租户的 Critical 告警（绝对不能影响本租户）
        _db.Alerts.Add(new Alert
        {
            DeviceId = otherDevice, TenantId = _otherTenantId,
            Metric = "temp", Severity = AlertSeverity.Critical,
            Value = 100, Threshold = 80,
            Status = AlertStatus.Active, OccurredAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();

        var service = new OeeService(_db, LoggerFactory.Create(_ => { }).CreateLogger<OeeService>());
        var result = await service.CalculateAsync(_tenantId, CancellationToken.None);

        // 本租户应只看到 2 台设备
        result.TotalDevices.Should().Be(2, "他方设备不应被本租户看到");
        // Quality 应为 100%（本租户无 Critical 告警）
        result.Quality.Should().Be(100.0, "他方告警不能影响本租户 Quality");
    }

    [Fact]
    public async Task CalculateAsync_应按显式租户参数筛选设备而不是只依赖当前上下文()
    {
        _db.Devices.AddRange(
            new Device
            {
                Name = "当前上下文设备", Type = "compressor", DeviceCode = "DEV-CURRENT",
                TenantId = _tenantId, Status = DeviceStatus.Offline,
            },
            new Device
            {
                Name = "目标租户设备", Type = "compressor", DeviceCode = "DEV-OTHER-EXPLICIT",
                TenantId = _otherTenantId, Status = DeviceStatus.Online,
            });
        await _db.SaveChangesAsync();

        var service = new OeeService(_db, LoggerFactory.Create(_ => { }).CreateLogger<OeeService>());
        var result = await service.CalculateAsync(_otherTenantId, CancellationToken.None);

        result.TotalDevices.Should().Be(1);
        result.OnlineDevices.Should().Be(1);
        result.Availability.Should().Be(100.0);
    }

    // =========================================================================
    // P0 测试：Performance 无数据时不再返回 1.0
    // =========================================================================

    [Fact]
    public async Task CalculateAsync_无AirFlow遥测时Performance应为0()
    {
        // 场景：有 2 台在线设备但完全没有 air_flow 遥测数据
        // 修复前：Performance=1.0（误导性满值）
        // 修复后：Performance=0（让前端展示"数据不足"）

        _db.Devices.Add(new Device
        {
            Name = "设备A", Type = "compressor", DeviceCode = "DEV-A",
            TenantId = _tenantId, Status = DeviceStatus.Online,
        });
        _db.Devices.Add(new Device
        {
            Name = "设备B", Type = "compressor", DeviceCode = "DEV-B",
            TenantId = _tenantId, Status = DeviceStatus.Online,
        });
        await _db.SaveChangesAsync();

        var service = new OeeService(_db, LoggerFactory.Create(_ => { }).CreateLogger<OeeService>());
        var result = await service.CalculateAsync(_tenantId, CancellationToken.None);

        result.Performance.Should().Be(0, "无遥测时不应假设满性能");
        // 综合结果也应为 0（A × P × Q = 100% × 0 × 100% = 0）
        result.Oee.Should().Be(0);
    }

    // =========================================================================
    // 正常路径
    // =========================================================================

    [Fact]
    public async Task CalculateAsync_无设备时应返回零值不抛异常()
    {
        var service = new OeeService(_db, LoggerFactory.Create(_ => { }).CreateLogger<OeeService>());
        var result = await service.CalculateAsync(_tenantId, CancellationToken.None);

        result.TotalDevices.Should().Be(0);
        result.OnlineDevices.Should().Be(0);
        result.Availability.Should().Be(0);
        // Quality 默认为 100%（无设备时无 Critical 告警）
        result.Quality.Should().Be(100.0);
    }

    [Fact]
    public async Task CalculateAsync_应正确计算在线率作为Availability()
    {
        // 4 台设备，3 在线 → Availability=75%
        // 注意：这是瞬时在线率，不是工业可用率（详见服务头注释）
        for (var i = 0; i < 4; i++)
        {
            _db.Devices.Add(new Device
            {
                Name = $"设备{i}", Type = "compressor", DeviceCode = $"DEV-{i}",
                TenantId = _tenantId, Status = i < 3 ? DeviceStatus.Online : DeviceStatus.Offline,
            });
        }
        await _db.SaveChangesAsync();

        var service = new OeeService(_db, LoggerFactory.Create(_ => { }).CreateLogger<OeeService>());
        var result = await service.CalculateAsync(_tenantId, CancellationToken.None);

        result.TotalDevices.Should().Be(4);
        result.OnlineDevices.Should().Be(3);
        result.Availability.Should().Be(75.0);
    }

    [Fact]
    public async Task CalculateAsync_本租户Critical告警应降低Quality()
    {
        var myDevice1 = Guid.NewGuid();
        var myDevice2 = Guid.NewGuid();

        _db.Devices.Add(new Device
        {
            Name = "设备1", Type = "compressor", DeviceCode = "DEV-1",
            TenantId = _tenantId, Status = DeviceStatus.Online,
        });
        _db.Devices.Add(new Device
        {
            Name = "设备2", Type = "compressor", DeviceCode = "DEV-2",
            TenantId = _tenantId, Status = DeviceStatus.Online,
        });
        // 设备1 有 Critical 告警
        _db.Alerts.Add(new Alert
        {
            DeviceId = myDevice1, TenantId = _tenantId,
            Metric = "temp", Severity = AlertSeverity.Critical,
            Value = 100, Threshold = 80,
            Status = AlertStatus.Active, OccurredAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();

        var service = new OeeService(_db, LoggerFactory.Create(_ => { }).CreateLogger<OeeService>());
        var result = await service.CalculateAsync(_tenantId, CancellationToken.None);

        // Quality = 1 - 1/2 = 50%
        result.Quality.Should().Be(50.0);
    }

    [Fact]
    public async Task CalculateAsync_已确认Acknowledged的Critical告警也应降低Quality()
    {
        // 业务定义（见 DashboardStatsService.GetAlertStatsAsync）：活跃告警 = Active + Acknowledged，
        // 「确认」≠「解决」（Resolved 才是真正解决）。
        //
        // 对称遗漏 bug：DashboardStatsService 告警统计已修正为 Active||Acknowledged，但 OEE Quality 仍只查 Active，
        // 导致运维「确认」一条 Critical 告警后 Quality 立即虚高——客户误以为严重故障已解决，实际设备仍带病运行。
        // 修复前（只 Active）：Acknowledged 不计入 → devicesWithCriticalAlert=0 → Quality=100%（虚高，掩盖未解决 Critical）
        // 修复后（Active||Acknowledged）：计入 → Quality=50%（正确：确认只是「看到了」，故障仍在）

        var myDevice1 = Guid.NewGuid();

        _db.Devices.Add(new Device
        {
            Name = "设备1", Type = "compressor", DeviceCode = "DEV-1",
            TenantId = _tenantId, Status = DeviceStatus.Online,
        });
        _db.Devices.Add(new Device
        {
            Name = "设备2", Type = "compressor", DeviceCode = "DEV-2",
            TenantId = _tenantId, Status = DeviceStatus.Online,
        });
        // 设备1 有 Acknowledged 状态的 Critical 告警（运维已确认但未解决）
        _db.Alerts.Add(new Alert
        {
            DeviceId = myDevice1, TenantId = _tenantId,
            Metric = "temp", Severity = AlertSeverity.Critical,
            Value = 100, Threshold = 80,
            Status = AlertStatus.Acknowledged, OccurredAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();

        var service = new OeeService(_db, LoggerFactory.Create(_ => { }).CreateLogger<OeeService>());
        var result = await service.CalculateAsync(_tenantId, CancellationToken.None);

        // Quality = 1 - 1/2 = 50%（Acknowledged 的 Critical 告警仍应计入）
        result.Quality.Should().Be(50.0, "确认告警≠解决问题，Acknowledged 的 Critical 应继续降低 Quality（与 DashboardStatsService 活跃告警定义一致）");
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
