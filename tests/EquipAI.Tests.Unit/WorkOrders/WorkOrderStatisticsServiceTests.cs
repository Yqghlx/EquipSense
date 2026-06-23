using EquipAI.Application.WorkOrders;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Tests.Unit.WorkOrders;

/// <summary>
/// WorkOrderStatisticsService 单元测试
///
/// 该服务为 Dashboard 提供工单聚合视图（分布/趋势/时长/SLA）。如果聚合错误：
///   - 按状态分布错误 → 主管误判派工压力
///   - 完成时长错误 → KPI 失真，团队效率评估偏差
///   - SLA 达成率错误 → 服务等级违约风险
///
/// 测试维度：
/// 1. 按状态/类型/优先级分布准确
/// 2. 新建/完成趋势（连续日期，无数据补零）
/// 3. 时间窗口过滤（periodDays 边界）
/// 4. 平均完成时长（按优先级分组）
/// 5. SLA 达成率（在 DueDate 前完成 / 仍在窗口内）
/// 6. 跨租户隔离
/// 7. 空数据不抛异常
/// </summary>
public class WorkOrderStatisticsServiceTests : IAsyncDisposable
{
    private readonly ServiceProvider _sp;
    private readonly Guid _tenantId = Guid.NewGuid();

    public WorkOrderStatisticsServiceTests()
    {
        var dbName = $"WoStatsTest_{Guid.NewGuid()}";
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(dbName));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(_tenantId));
        services.AddLogging();
        _sp = services.BuildServiceProvider();
    }

    public async ValueTask DisposeAsync() => await _sp.DisposeAsync();

    private AppDbContext GetDb() => _sp.GetRequiredService<AppDbContext>();

    private WorkOrderStatisticsService CreateService(AppDbContext db)
    {
        var logger = _sp.GetRequiredService<ILogger<WorkOrderStatisticsService>>();
        return new WorkOrderStatisticsService(db, logger);
    }

    /// <summary>构造工单（CreatedAt/CompletedAt/DueDate 可空）</summary>
    private static WorkOrder CreateWorkOrder(
        WorkOrderStatus status, WorkOrderType type, WorkOrderPriority priority,
        DateTime createdAt, DateTime? completedAt = null, DateTime? dueDate = null,
        Guid? tenantId = null) => new()
    {
        WorkOrderCode = $"WO-{Guid.NewGuid():N}".Substring(0, 12),
        Title = "Test WO",
        TenantId = tenantId ?? Guid.NewGuid(),
        DeviceId = Guid.NewGuid(),
        Type = type,
        Priority = priority,
        Status = status,
        CreatedAt = createdAt,
        CreatedBy = Guid.NewGuid(),
        CompletedAt = completedAt,
        DueDate = dueDate,
    };

    // =========================================================================
    // 分布统计 — 按状态/类型/优先级
    // =========================================================================

    /// <summary>
    /// 按状态/类型/优先级 3 个维度分组都应准确
    ///
    /// 构造：3 个 Closed Corrective High + 2 个 InProgress Preventive Low
    /// </summary>
    [Fact]
    public async Task GetStatisticsAsync_多维度分组_正确统计()
    {
        var db = GetDb();
        var service = CreateService(db);
        var now = DateTime.UtcNow;

        for (var i = 0; i < 3; i++)
            db.WorkOrders.Add(CreateWorkOrder(WorkOrderStatus.Closed, WorkOrderType.Corrective,
                WorkOrderPriority.High, now.AddDays(-1), tenantId: _tenantId));
        for (var i = 0; i < 2; i++)
            db.WorkOrders.Add(CreateWorkOrder(WorkOrderStatus.InProgress, WorkOrderType.Preventive,
                WorkOrderPriority.Low, now.AddDays(-1), tenantId: _tenantId));
        await db.SaveChangesAsync();

        var stats = await service.GetStatisticsAsync(_tenantId, periodDays: 7);

        stats.Total.Should().Be(5);
        stats.ByStatus["Closed"].Should().Be(3);
        stats.ByStatus["InProgress"].Should().Be(2);
        stats.ByType["Corrective"].Should().Be(3);
        stats.ByType["Preventive"].Should().Be(2);
        stats.ByPriority["High"].Should().Be(3);
        stats.ByPriority["Low"].Should().Be(2);
    }

    // =========================================================================
    // 时间窗口过滤 — periodDays 边界
    // =========================================================================

    /// <summary>
    /// periodDays 之外的旧工单不参与统计
    ///
    /// Why：Dashboard 切换"7 天/30 天/90 天"统计周期，旧数据混入会让趋势分析失真
    /// （如本月工单 5 个，但混入上月 50 个，误以为本月工作量暴涨）。
    /// </summary>
    [Fact]
    public async Task GetStatisticsAsync_超出时间窗口的旧工单_不参与统计()
    {
        var db = GetDb();
        var service = CreateService(db);
        var now = DateTime.UtcNow;

        // 7 天内 2 个 + 30 天前 3 个
        db.WorkOrders.Add(CreateWorkOrder(WorkOrderStatus.Closed, WorkOrderType.Corrective,
            WorkOrderPriority.High, now.AddDays(-1), tenantId: _tenantId));
        db.WorkOrders.Add(CreateWorkOrder(WorkOrderStatus.Closed, WorkOrderType.Corrective,
            WorkOrderPriority.High, now.AddDays(-3), tenantId: _tenantId));
        for (var i = 0; i < 3; i++)
            db.WorkOrders.Add(CreateWorkOrder(WorkOrderStatus.Closed, WorkOrderType.Corrective,
                WorkOrderPriority.High, now.AddDays(-30 - i), tenantId: _tenantId));
        await db.SaveChangesAsync();

        var stats = await service.GetStatisticsAsync(_tenantId, periodDays: 7);

        stats.Total.Should().Be(2, "30 天前的 3 个工单应被过滤");
    }

    // =========================================================================
    // 趋势 — 连续日期 + 无数据补零
    // =========================================================================

    /// <summary>
    /// 趋势数据应包含 periodDays 内每一天，无数据日补零
    ///
    /// Why：前端 ECharts 折线图需要连续日期作为 X 轴。
    /// 如果某天没工单就让趋势数组缺这天，折线会变形（X 轴不等距）。
    /// </summary>
    [Fact]
    public async Task GetStatisticsAsync_趋势数据_连续日期_无数据补零()
    {
        var db = GetDb();
        var service = CreateService(db);
        var now = DateTime.UtcNow;

        // 只在今天和 3 天前各创建 1 个工单，中间 2 天空
        db.WorkOrders.Add(CreateWorkOrder(WorkOrderStatus.Closed, WorkOrderType.Corrective,
            WorkOrderPriority.High, now, completedAt: now.AddHours(2), tenantId: _tenantId));
        db.WorkOrders.Add(CreateWorkOrder(WorkOrderStatus.Closed, WorkOrderType.Corrective,
            WorkOrderPriority.High, now.AddDays(-3), completedAt: now.AddDays(-3).AddHours(2), tenantId: _tenantId));
        await db.SaveChangesAsync();

        var stats = await service.GetStatisticsAsync(_tenantId, periodDays: 7);

        // 7 天趋势应有 7 个点
        stats.CreatedTrend.Should().HaveCount(7);
        stats.CompletedTrend.Should().HaveCount(7);

        // 中间 2 天（昨天、前天）应补零
        stats.CreatedTrend.Should().Contain(p => p.Count == 0, "无数据日应补零");

        // 趋势按日期升序
        stats.CreatedTrend.Select(p => p.Date).Should().BeInAscendingOrder();
    }

    // =========================================================================
    // 平均完成时长 — 按优先级分组
    // =========================================================================

    /// <summary>
    /// 按优先级分组的平均完成时长应准确
    ///
    /// 构造：
    /// - Critical: 1 个完成（耗时 4h）
    /// - High: 2 个完成（耗时 6h 和 12h，平均 9h）
    /// </summary>
    [Fact]
    public async Task GetStatisticsAsync_按优先级平均完成时长_正确计算()
    {
        var db = GetDb();
        var service = CreateService(db);
        var now = DateTime.UtcNow;

        // Critical 4 小时完成
        db.WorkOrders.Add(CreateWorkOrder(WorkOrderStatus.Closed, WorkOrderType.Corrective,
            WorkOrderPriority.Critical, now.AddHours(-4),
            completedAt: now, tenantId: _tenantId));

        // High 两个：6h 和 12h
        db.WorkOrders.Add(CreateWorkOrder(WorkOrderStatus.Closed, WorkOrderType.Corrective,
            WorkOrderPriority.High, now.AddHours(-6),
            completedAt: now, tenantId: _tenantId));
        db.WorkOrders.Add(CreateWorkOrder(WorkOrderStatus.Closed, WorkOrderType.Corrective,
            WorkOrderPriority.High, now.AddHours(-12),
            completedAt: now, tenantId: _tenantId));

        // 未完成的不参与计算
        db.WorkOrders.Add(CreateWorkOrder(WorkOrderStatus.InProgress, WorkOrderType.Corrective,
            WorkOrderPriority.High, now.AddHours(-2), tenantId: _tenantId));

        await db.SaveChangesAsync();

        var stats = await service.GetStatisticsAsync(_tenantId, periodDays: 7);

        stats.AvgCompletionHoursByPriority["Critical"].Should().Be(4.0,
            "Critical 工单完成耗时 4h");
        stats.AvgCompletionHoursByPriority["High"].Should().Be(9.0,
            "High 工单 6h 和 12h 平均 = 9h");
        stats.AvgCompletionHoursByPriority.Should().NotContainKey("Medium",
            "无 Medium 工单完成，不应有该 key");
    }

    // =========================================================================
    // SLA 达成率 — 在 DueDate 之前完成 + 未完成但在窗口内
    // =========================================================================

    /// <summary>
    /// SLA 达成率：在 DueDate 之前完成 OR 未完成但当前时间还在 DueDate 内
    ///
    /// 构造：4 个 High 工单
    /// - 2 个按时完成（CompletedAt <= DueDate）✓
    /// - 1 个超时完成（CompletedAt > DueDate）✗
    /// - 1 个未完成但还在窗口内（Now < DueDate）✓
    /// → SLA 达成率 = 3/4 = 75%
    /// </summary>
    [Fact]
    public async Task GetStatisticsAsync_SLA达成率_按时完成和未超时都算达成()
    {
        var db = GetDb();
        var service = CreateService(db);
        var now = DateTime.UtcNow;

        // 1. 按时完成（提前 1h）
        db.WorkOrders.Add(CreateWorkOrder(WorkOrderStatus.Closed, WorkOrderType.Corrective,
            WorkOrderPriority.High, now.AddDays(-2),
            completedAt: now.AddDays(-1),
            dueDate: now,  // DueDate 在未来
            tenantId: _tenantId));

        // 2. 按时完成（恰好在 DueDate）
        db.WorkOrders.Add(CreateWorkOrder(WorkOrderStatus.Closed, WorkOrderType.Corrective,
            WorkOrderPriority.High, now.AddDays(-2),
            completedAt: now.AddDays(-1),
            dueDate: now.AddDays(-1),  // DueDate 与 CompletedAt 相同
            tenantId: _tenantId));

        // 3. 超时完成（CompletedAt > DueDate）
        db.WorkOrders.Add(CreateWorkOrder(WorkOrderStatus.Closed, WorkOrderType.Corrective,
            WorkOrderPriority.High, now.AddDays(-3),
            completedAt: now.AddDays(-1),
            dueDate: now.AddDays(-2),  // DueDate 早于 CompletedAt
            tenantId: _tenantId));

        // 4. 未完成但还在窗口内
        db.WorkOrders.Add(CreateWorkOrder(WorkOrderStatus.InProgress, WorkOrderType.Corrective,
            WorkOrderPriority.High, now.AddDays(-1),
            dueDate: now.AddDays(1),  // DueDate 在未来
            tenantId: _tenantId));

        await db.SaveChangesAsync();

        var stats = await service.GetStatisticsAsync(_tenantId, periodDays: 7);

        stats.SlaRateByPriority["High"].Should().Be(75.0,
            "3/4 达成（2 按时完成 + 1 未完成但未超时）");
    }

    /// <summary>
    /// 无 DueDate 的工单不参与 SLA 达成率计算（分母不含）
    /// </summary>
    [Fact]
    public async Task GetStatisticsAsync_无DueDate的工单_不参与SLA计算()
    {
        var db = GetDb();
        var service = CreateService(db);
        var now = DateTime.UtcNow;

        // 1 个有 DueDate 且按时完成
        db.WorkOrders.Add(CreateWorkOrder(WorkOrderStatus.Closed, WorkOrderType.Corrective,
            WorkOrderPriority.High, now.AddDays(-2),
            completedAt: now.AddDays(-1),
            dueDate: now,
            tenantId: _tenantId));

        // 3 个无 DueDate（不应影响 SLA 分母）
        for (var i = 0; i < 3; i++)
            db.WorkOrders.Add(CreateWorkOrder(WorkOrderStatus.Closed, WorkOrderType.Corrective,
                WorkOrderPriority.High, now.AddDays(-1), tenantId: _tenantId));

        await db.SaveChangesAsync();

        var stats = await service.GetStatisticsAsync(_tenantId, periodDays: 7);

        stats.SlaRateByPriority["High"].Should().Be(100.0,
            "只有 1 个有 DueDate 的工单参与计算，按时完成 = 100%");
    }

    // =========================================================================
    // 跨租户隔离 — 关键不变量
    // =========================================================================

    /// <summary>
    /// 其他租户的工单不参与统计
    /// </summary>
    [Fact]
    public async Task GetStatisticsAsync_跨租户工单_不参与统计()
    {
        var db = GetDb();
        var service = CreateService(db);
        var now = DateTime.UtcNow;
        var otherTenant = Guid.NewGuid();

        // 当前租户：2 个工单
        db.WorkOrders.Add(CreateWorkOrder(WorkOrderStatus.Closed, WorkOrderType.Corrective,
            WorkOrderPriority.High, now.AddDays(-1), tenantId: _tenantId));
        db.WorkOrders.Add(CreateWorkOrder(WorkOrderStatus.InProgress, WorkOrderType.Corrective,
            WorkOrderPriority.Medium, now.AddDays(-1), tenantId: _tenantId));

        // 其他租户：10 个工单
        for (var i = 0; i < 10; i++)
            db.WorkOrders.Add(CreateWorkOrder(WorkOrderStatus.Closed, WorkOrderType.Corrective,
                WorkOrderPriority.Critical, now.AddDays(-1), tenantId: otherTenant));

        await db.SaveChangesAsync();

        var stats = await service.GetStatisticsAsync(_tenantId, periodDays: 7);

        stats.Total.Should().Be(2, "其他租户的 10 个工单不应计入");
        stats.ByPriority.Should().NotContainKey("Critical", "Critical 工单都属于其他租户");
    }

    // =========================================================================
    // 空数据 — 不抛异常
    // =========================================================================

    [Fact]
    public async Task GetStatisticsAsync_空数据_不抛异常()
    {
        var db = GetDb();
        var service = CreateService(db);

        var stats = await service.GetStatisticsAsync(_tenantId, periodDays: 7);

        stats.Total.Should().Be(0);
        stats.ByStatus.Should().BeEmpty();
        stats.AvgCompletionHoursByPriority.Should().BeEmpty();
        stats.SlaRateByPriority.Should().BeEmpty();
        stats.CreatedTrend.Should().HaveCount(7, "趋势仍应补零 7 天");
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
