using System.Text;
using EquipAI.Application.Analysis;
using EquipAI.Application.Reports;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace EquipAI.Tests.Unit.Reports;

/// <summary>
/// OperationsReportService 单元测试
///
/// 运营报表是给管理层看的，数据错误会直接影响决策（如"上月告警 50 个"实际 5 个，
/// 让管理层误判安全态势）。CSV 报表还会被 Excel 导入二次分析，格式错误（缺 BOM 头）
/// 会让中文乱码。
///
/// 测试维度：
/// 1. 空数据不抛异常（新租户首月没数据）
/// 2. UTF-8 + BOM 头（Excel 中文兼容）
/// 3. 设备统计正确（在线/离线/维护/平均健康度）
/// 4. 告警统计正确（4 严重程度 + 已解决/活跃 + 确认率）
/// 5. 工单统计正确（已完成/执行中/待派工 + 完成率）
/// 6. 时间窗口过滤（窗口外数据不参与统计）
/// 7. 跨租户隔离（其他租户数据不混入）
/// 8. OEE 计算失败时降级（不破坏整个报表）
/// </summary>
public class OperationsReportServiceTests : IAsyncDisposable
{
    private readonly ServiceProvider _sp;
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly Mock<OeeService> _oeeServiceMock;

    public OperationsReportServiceTests()
    {
        var dbName = $"ReportTest_{Guid.NewGuid()}";
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(dbName));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(_tenantId));
        services.AddLogging();
        _sp = services.BuildServiceProvider();

        // OeeService 构造函数签名 (AppDbContext, ILogger<OeeService>)
        // 用 Moq 模拟以便单独测试 OperationsReportService 不依赖 OeeService 的实现细节
        _oeeServiceMock = new Mock<OeeService>(
            _sp.GetRequiredService<AppDbContext>(),
            Mock.Of<ILogger<OeeService>>());
    }

    public async ValueTask DisposeAsync() => await _sp.DisposeAsync();

    private AppDbContext GetDb() => _sp.GetRequiredService<AppDbContext>();

    private OperationsReportService CreateService(AppDbContext db)
    {
        var logger = _sp.GetRequiredService<ILogger<OperationsReportService>>();
        return new OperationsReportService(db, _oeeServiceMock.Object, logger);
    }

    /// <summary>构造一台设备</summary>
    private static Device CreateDevice(Guid tenantId, string code, DeviceStatus status, decimal healthScore = 90m)
        => new()
        {
            Name = $"{code}-Name",
            Type = "pump",
            DeviceCode = code,
            TenantId = tenantId,
            Status = status,
            HealthScore = healthScore,
        };

    /// <summary>构造一条告警</summary>
    private static Alert CreateAlert(Guid tenantId, AlertSeverity severity, AlertStatus status,
        DateTime occurredAt, string metric = "temperature", bool acknowledged = false)
        => new()
        {
            AlertCode = $"AL-{Guid.NewGuid():N}".Substring(0, 12),
            TenantId = tenantId,
            DeviceId = Guid.NewGuid(),
            Severity = severity,
            Status = status,
            Metric = metric,
            OccurredAt = occurredAt,
            AcknowledgedAt = acknowledged ? occurredAt : null,
        };

    /// <summary>构造一个工单</summary>
    private static WorkOrder CreateWorkOrder(Guid tenantId, WorkOrderStatus status, DateTime createdAt)
        => new()
        {
            WorkOrderCode = $"WO-{Guid.NewGuid():N}".Substring(0, 12),
            Title = "Test WO",
            TenantId = tenantId,
            DeviceId = Guid.NewGuid(),
            Type = WorkOrderType.Corrective,
            Priority = WorkOrderPriority.Medium,
            Status = status,
            CreatedAt = createdAt,
            CreatedBy = Guid.NewGuid(),
        };

    // =========================================================================
    // 空数据 — 新租户首月没数据时不应崩溃
    // =========================================================================

    /// <summary>
    /// 空数据库不应抛异常，应返回仅含标题的报表
    ///
    /// Why：新租户首月没数据，运营查看报表应看到"0,0,0"而非 500 错误。
    /// </summary>
    [Fact]
    public async Task GenerateReportAsync_空数据_不抛异常_返回含BOM头()
    {
        var db = GetDb();
        var service = CreateService(db);

        var result = await service.GenerateReportAsync(_tenantId,
            new DateTime(2026, 1, 1), new DateTime(2026, 1, 31));

        result.Should().NotBeEmpty();
        // BOM 头（U+FEFF）= 0xEF 0xBB 0xBF
        result[0].Should().Be(0xEF);
        result[1].Should().Be(0xBB);
        result[2].Should().Be(0xBF, "BOM 头确保 Excel 中文不乱码");

        var content = Encoding.UTF8.GetString(result);
        content.Should().Contain("设备总数,在线,离线,维护中,平均健康度");
        content.Should().Contain("0,0,0,0,N/A", "空数据时显示 N/A 而非 NaN");
    }

    // =========================================================================
    // 设备统计 — 状态分布 + 平均健康度
    // =========================================================================

    /// <summary>
    /// 设备状态分布应准确反映植入的设备
    /// </summary>
    [Fact]
    public async Task GenerateReportAsync_设备状态统计正确()
    {
        var db = GetDb();
        var service = CreateService(db);

        // 5 台：2 在线 + 1 离线 + 2 维护中
        db.Devices.Add(CreateDevice(_tenantId, "D-1", DeviceStatus.Online, 90m));
        db.Devices.Add(CreateDevice(_tenantId, "D-2", DeviceStatus.Online, 80m));
        db.Devices.Add(CreateDevice(_tenantId, "D-3", DeviceStatus.Offline, 70m));
        db.Devices.Add(CreateDevice(_tenantId, "D-4", DeviceStatus.Maintenance, 50m));
        db.Devices.Add(CreateDevice(_tenantId, "D-5", DeviceStatus.Maintenance, 60m));
        await db.SaveChangesAsync();

        var result = await service.GenerateReportAsync(_tenantId,
            new DateTime(2026, 1, 1), new DateTime(2026, 1, 31));
        var content = Encoding.UTF8.GetString(result);

        // 设备总数=5, 在线=2, 离线=1, 维护=2, 平均健康度=(90+80+70+50+60)/5=70.0
        content.Should().Contain("5,2,1,2,70.0");
    }

    // =========================================================================
    // 告警统计 — 严重程度 + 解决/活跃 + 确认率
    // =========================================================================

    /// <summary>
    /// 告警按严重程度和状态统计正确，含确认率计算
    ///
    /// 构造：10 条告警 — 2 Critical + 3 High + 3 Normal + 2 Low
    /// 4 条 Resolved + 6 条 Active；3 条已确认
    /// </summary>
    [Fact]
    public async Task GenerateReportAsync_告警统计正确_含确认率()
    {
        var db = GetDb();
        var service = CreateService(db);
        var now = new DateTime(2026, 1, 15, 10, 0, 0, DateTimeKind.Utc);

        // 2 Critical
        db.Alerts.Add(CreateAlert(_tenantId, AlertSeverity.Critical, AlertStatus.Active, now, acknowledged: true));
        db.Alerts.Add(CreateAlert(_tenantId, AlertSeverity.Critical, AlertStatus.Resolved, now));
        // 3 High
        db.Alerts.Add(CreateAlert(_tenantId, AlertSeverity.High, AlertStatus.Active, now, acknowledged: true));
        db.Alerts.Add(CreateAlert(_tenantId, AlertSeverity.High, AlertStatus.Active, now));
        db.Alerts.Add(CreateAlert(_tenantId, AlertSeverity.High, AlertStatus.Resolved, now));
        // 3 Normal
        db.Alerts.Add(CreateAlert(_tenantId, AlertSeverity.Normal, AlertStatus.Active, now));
        db.Alerts.Add(CreateAlert(_tenantId, AlertSeverity.Normal, AlertStatus.Active, now, acknowledged: true));
        db.Alerts.Add(CreateAlert(_tenantId, AlertSeverity.Normal, AlertStatus.Resolved, now));
        // 2 Low
        db.Alerts.Add(CreateAlert(_tenantId, AlertSeverity.Low, AlertStatus.Active, now));
        db.Alerts.Add(CreateAlert(_tenantId, AlertSeverity.Low, AlertStatus.Resolved, now));
        await db.SaveChangesAsync();

        var result = await service.GenerateReportAsync(_tenantId,
            new DateTime(2026, 1, 1), new DateTime(2026, 1, 31));
        var content = Encoding.UTF8.GetString(result);

        // 总数=10, C=2, H=3, N=3, L=2, 已解决=4, 活跃=6, 确认率=30%
        content.Should().Contain("10,2,3,3,2,4,6,30.0%");
    }

    // =========================================================================
    // 工单统计 — 状态分布 + 完成率
    // =========================================================================

    [Fact]
    public async Task GenerateReportAsync_工单统计正确_含完成率()
    {
        var db = GetDb();
        var service = CreateService(db);
        var now = new DateTime(2026, 1, 15, 10, 0, 0, DateTimeKind.Utc);

        // 4 Closed + 2 InProgress + 1 PendingDispatch = 7 总，完成率 4/7 ≈ 57.1%
        for (var i = 0; i < 4; i++)
            db.WorkOrders.Add(CreateWorkOrder(_tenantId, WorkOrderStatus.Closed, now));
        for (var i = 0; i < 2; i++)
            db.WorkOrders.Add(CreateWorkOrder(_tenantId, WorkOrderStatus.InProgress, now));
        db.WorkOrders.Add(CreateWorkOrder(_tenantId, WorkOrderStatus.PendingDispatch, now));
        await db.SaveChangesAsync();

        var result = await service.GenerateReportAsync(_tenantId,
            new DateTime(2026, 1, 1), new DateTime(2026, 1, 31));
        var content = Encoding.UTF8.GetString(result);

        content.Should().Contain("7,4,2,1,57.1%");
    }

    // =========================================================================
    // 时间窗口过滤 — 窗口外的数据不参与统计
    // =========================================================================

    /// <summary>
    /// 时间窗口外的告警不参与统计
    ///
    /// Why：报表展示特定时间段，旧告警混入会让趋势分析失真
    /// （如把 12 月的告警算到 1 月，让 1 月告警数虚高）。
    /// </summary>
    [Fact]
    public async Task GenerateReportAsync_时间窗口外的告警_不参与统计()
    {
        var db = GetDb();
        var service = CreateService(db);

        // 窗口内 2 条 + 窗口外 3 条
        db.Alerts.Add(CreateAlert(_tenantId, AlertSeverity.High, AlertStatus.Active, new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc)));
        db.Alerts.Add(CreateAlert(_tenantId, AlertSeverity.High, AlertStatus.Active, new DateTime(2026, 1, 20, 0, 0, 0, DateTimeKind.Utc)));
        db.Alerts.Add(CreateAlert(_tenantId, AlertSeverity.High, AlertStatus.Active, new DateTime(2025, 12, 31, 0, 0, 0, DateTimeKind.Utc)));  // 窗口外
        db.Alerts.Add(CreateAlert(_tenantId, AlertSeverity.High, AlertStatus.Active, new DateTime(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc)));   // 窗口外
        db.Alerts.Add(CreateAlert(_tenantId, AlertSeverity.High, AlertStatus.Active, new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc)));    // 窗口外
        await db.SaveChangesAsync();

        var result = await service.GenerateReportAsync(_tenantId,
            new DateTime(2026, 1, 1), new DateTime(2026, 1, 31));
        var content = Encoding.UTF8.GetString(result);

        // 只统计 2 条窗口内的
        content.Should().Contain("2,0,2,0,0,0,2,0.0%", "窗口外 3 条告警应被过滤");
    }

    // =========================================================================
    // 跨租户隔离 — 关键不变量
    // =========================================================================

    /// <summary>
    /// 其他租户的设备/告警/工单不应混入报表
    ///
    /// Why：A 租户的运营报表混入 B 租户数据会让运营决策错乱
    /// （如 B 有 1000 告警被算到 A 上，A 误以为自己安全态势极差）。
    /// </summary>
    [Fact]
    public async Task GenerateReportAsync_跨租户数据_不混入报表()
    {
        var db = GetDb();
        var service = CreateService(db);
        var now = new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc);
        var otherTenant = Guid.NewGuid();

        // 当前租户：1 设备 + 1 告警 + 1 工单
        db.Devices.Add(CreateDevice(_tenantId, "MINE-1", DeviceStatus.Online));
        db.Alerts.Add(CreateAlert(_tenantId, AlertSeverity.High, AlertStatus.Active, now));
        db.WorkOrders.Add(CreateWorkOrder(_tenantId, WorkOrderStatus.Closed, now));

        // 其他租户：大量数据（不应混入）
        for (var i = 0; i < 10; i++)
        {
            db.Devices.Add(CreateDevice(otherTenant, $"OTHER-{i}", DeviceStatus.Online));
            db.Alerts.Add(CreateAlert(otherTenant, AlertSeverity.Critical, AlertStatus.Active, now));
            db.WorkOrders.Add(CreateWorkOrder(otherTenant, WorkOrderStatus.Closed, now));
        }
        await db.SaveChangesAsync();

        var result = await service.GenerateReportAsync(_tenantId,
            new DateTime(2026, 1, 1), new DateTime(2026, 1, 31));
        var content = Encoding.UTF8.GetString(result);

        // 设备总数 = 1（只有 MINE-1）
        content.Should().Contain("1,1,0,0,", "其他租户的 10 台设备不应计入");
        // 告警总数 = 1
        content.Should().Contain("\n1,0,1,0,0,0,1,0.0%", "其他租户的 10 条告警不应计入");
        // 工单总数 = 1
        content.Should().Contain("\n1,1,0,0,100.0%", "其他租户的 10 个工单不应计入");
    }

    // =========================================================================
    // OEE 降级 — OEE 计算失败不应破坏整个报表
    // =========================================================================

    /// <summary>
    /// OeeService 抛异常时，报表应降级显示"OEE 数据暂不可用"而非整个失败
    ///
    /// Why：报表包含 6 个章节，OEE 是其中之一。如果 OEE 失败让整个报表 500，
    /// 运营看不到其他 5 章数据（设备/告警/工单/健康度排名/告警分布）。
    /// </summary>
    [Fact]
    public async Task GenerateReportAsync_Oee计算失败_降级显示_不破坏报表()
    {
        var db = GetDb();
        var service = CreateService(db);

        // 让 OeeService 抛异常
        _oeeServiceMock
            .Setup(o => o.CalculateAsync(_tenantId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("OEE 计算依赖的设备状态数据缺失"));

        var result = await service.GenerateReportAsync(_tenantId,
            new DateTime(2026, 1, 1), new DateTime(2026, 1, 31));
        var content = Encoding.UTF8.GetString(result);

        content.Should().Contain("OEE 数据暂不可用", "OEE 失败时应降级显示");
        content.Should().Contain("=== 设备健康度排名", "其他章节仍应正常生成");
        content.Should().Contain("=== 告警按指标分布", "末尾章节也应正常");
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
