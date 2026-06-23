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
/// SlaManagementService 单元测试
///
/// SLA（服务等级协议）是工单系统的核心契约：客户承诺"Critical 4 小时响应，
/// High 8 小时"等。如果 SLA 计算错误：
///   - 误判 OnTrack → 超时工单不被升级，主管收不到通知
///   - 误判 Overdue → 不超时的工单被错误升级，扰乱派工
///   - 自动升级失效 → 所有超时工单永远停留在原优先级
///
/// 测试维度：
/// 1. GetSlaStatus 4 状态判定（OnTrack / Warning / Overdue / Completed）
/// 2. Warning 阈值边界（剩余 &lt; SLA×20%）
/// 3. GetSlaDeadline 4 种优先级时限（Critical 4h / High 8h / Medium 24h / Low 72h）
/// 4. CheckAndEscalateAsync 自动升级（Low→Medium→High→Critical）
/// 5. Critical 已是最高优先级不再升级
/// 6. 已关闭/取消的工单不参与扫描
/// 7. GetSummaryAsync 按 SLA 状态分组统计
/// </summary>
public class SlaManagementServiceTests : IAsyncDisposable
{
    private readonly ServiceProvider _sp;
    private readonly Guid _tenantId = Guid.NewGuid();

    public SlaManagementServiceTests()
    {
        var dbName = $"SlaTest_{Guid.NewGuid()}";
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(dbName));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(_tenantId));
        services.AddLogging();
        _sp = services.BuildServiceProvider();
    }

    public async ValueTask DisposeAsync() => await _sp.DisposeAsync();

    private AppDbContext GetDb() => _sp.GetRequiredService<AppDbContext>();

    private SlaManagementService CreateService(AppDbContext db)
    {
        var logger = _sp.GetRequiredService<ILogger<SlaManagementService>>();
        return new SlaManagementService(db, logger);
    }

    /// <summary>构造工单（CreatedAt 控制用来模拟时间过去多久）</summary>
    private static Core.Entities.WorkOrder CreateWorkOrder(
        WorkOrderPriority priority, WorkOrderStatus status,
        DateTime createdAt) => new()
    {
        WorkOrderCode = $"WO-{Guid.NewGuid():N}".Substring(0, 12),
        Title = "Test WO",
        TenantId = Guid.NewGuid(),  // GetSlaStatus 是静态方法不查租户；CheckAndEscalateAsync 用过滤
        DeviceId = Guid.NewGuid(),
        Priority = priority,
        Status = status,
        CreatedAt = createdAt,
        CreatedBy = Guid.NewGuid(),
    };

    // =========================================================================
    // GetSlaStatus — 4 状态判定
    // =========================================================================

    /// <summary>
    /// 已关闭工单返回 Completed，不再计算 SLA
    ///
    /// Why：关闭/取消是终态，重新计算 SLA 没意义且会让历史工单的统计混乱。
    /// </summary>
    [Theory]
    [InlineData(WorkOrderStatus.Closed)]
    [InlineData(WorkOrderStatus.Cancelled)]
    public void GetSlaStatus_关闭或取消的工单_返回Completed(WorkOrderStatus terminalStatus)
    {
        var wo = CreateWorkOrder(WorkOrderPriority.Critical, terminalStatus, DateTime.UtcNow.AddHours(-100));

        SlaManagementService.GetSlaStatus(wo).Should().Be(SlaStatus.Completed,
            "终态工单不应再参与 SLA 计算，即使严重超时");
    }

    /// <summary>
    /// OnTrack：剩余时间充足（≥ SLA×20%）
    ///
    /// 构造：Critical 工单刚创建 1 小时（SLA 4h，已过 25%，剩余 75% ≥ 20%）
    /// </summary>
    [Fact]
    public void GetSlaStatus_剩余时间充足_返回OnTrack()
    {
        var wo = CreateWorkOrder(WorkOrderPriority.Critical, WorkOrderStatus.Assigned,
            DateTime.UtcNow.AddHours(-1));  // 创建 1 小时前

        SlaManagementService.GetSlaStatus(wo).Should().Be(SlaStatus.OnTrack,
            "Critical SLA 4h，已过 1h 剩 3h（75%）应正常");
    }

    /// <summary>
    /// Warning：剩余时间 < SLA×20%
    ///
    /// 构造：Critical 工单创建 3.5 小时前（SLA 4h，剩余 0.5h = 12.5% < 20%）
    /// </summary>
    [Fact]
    public void GetSlaStatus_剩余时间低于20percent_返回Warning()
    {
        var wo = CreateWorkOrder(WorkOrderPriority.Critical, WorkOrderStatus.Assigned,
            DateTime.UtcNow.AddHours(-3.5));  // 已过 3.5h，剩 0.5h（12.5% < 20%）

        SlaManagementService.GetSlaStatus(wo).Should().Be(SlaStatus.Warning,
            "Critical SLA 4h，剩 0.5h（12.5%）低于 20% 阈值应预警");
    }

    /// <summary>
    /// Overdue：当前时间已超过 SLA 截止时间
    ///
    /// 构造：Critical 工单创建 5 小时前（SLA 4h，已超 1h）
    /// </summary>
    [Fact]
    public void GetSlaStatus_已超过SLA截止时间_返回Overdue()
    {
        var wo = CreateWorkOrder(WorkOrderPriority.Critical, WorkOrderStatus.Assigned,
            DateTime.UtcNow.AddHours(-5));  // 已过 5h，SLA 是 4h

        SlaManagementService.GetSlaStatus(wo).Should().Be(SlaStatus.Overdue,
            "Critical SLA 4h，已过 5h 应判定超时");
    }

    // =========================================================================
    // GetSlaDeadline — 4 种优先级时限
    // =========================================================================

    /// <summary>
    /// 关键不变量：4 种优先级有固定的 SLA 时限
    ///
    /// Why：时限是业务契约，如果代码里值变了（如误把 Critical 改成 8h），
    /// 客户承诺的 SLA 会失效，违约风险。锁定为：Critical 4 / High 8 / Medium 24 / Low 72 小时。
    /// </summary>
    [Theory]
    [InlineData(WorkOrderPriority.Critical, 4)]
    [InlineData(WorkOrderPriority.High, 8)]
    [InlineData(WorkOrderPriority.Medium, 24)]
    [InlineData(WorkOrderPriority.Low, 72)]
    public void GetSlaDeadline_各优先级时限正确(WorkOrderPriority priority, int expectedHours)
    {
        var createdAt = new DateTime(2026, 6, 23, 10, 0, 0, DateTimeKind.Utc);
        var wo = CreateWorkOrder(priority, WorkOrderStatus.Assigned, createdAt);

        var deadline = SlaManagementService.GetSlaDeadline(wo);

        deadline.Should().Be(createdAt.AddHours(expectedHours),
            $"{priority} 优先级 SLA 时限应为 {expectedHours} 小时");
    }

    // =========================================================================
    // CheckAndEscalateAsync — 自动升级
    // =========================================================================

    /// <summary>
    /// 关键场景：超时的非 Critical 工单应自动升级到更高优先级
    ///
    /// Low → Medium → High → Critical（升级方向：优先级值减小）
    /// </summary>
    [Fact]
    public async Task CheckAndEscalateAsync_超时的非Critical工单_自动升级一级()
    {
        var db = GetDb();
        var service = CreateService(db);

        // 构造 3 个超时工单：Low / Medium / High（创建时间都超过其 SLA）
        var low = CreateWorkOrder(WorkOrderPriority.Low, WorkOrderStatus.Assigned, DateTime.UtcNow.AddHours(-73));
        var medium = CreateWorkOrder(WorkOrderPriority.Medium, WorkOrderStatus.InProgress, DateTime.UtcNow.AddHours(-25));
        var high = CreateWorkOrder(WorkOrderPriority.High, WorkOrderStatus.Assigned, DateTime.UtcNow.AddHours(-9));
        low.TenantId = _tenantId;
        medium.TenantId = _tenantId;
        high.TenantId = _tenantId;
        db.WorkOrders.AddRange(low, medium, high);
        await db.SaveChangesAsync();

        var count = await service.CheckAndEscalateAsync(_tenantId);

        count.Should().Be(3, "3 个超时工单都应升级");
        low.Priority.Should().Be(WorkOrderPriority.Medium, "Low 应升级到 Medium");
        medium.Priority.Should().Be(WorkOrderPriority.High, "Medium 应升级到 High");
        high.Priority.Should().Be(WorkOrderPriority.Critical, "High 应升级到 Critical");
    }

    /// <summary>
    /// 边界场景：Critical 工单超时不应再升级（已是最高优先级）
    ///
    /// Why：Critical 已经是最高，没有更高级可升。如果代码硬升 Priority 值 +1，
    /// 会得到未定义的枚举值（Critical=0，+1=High=1 反而是降级，逻辑完全错误）。
    /// </summary>
    [Fact]
    public async Task CheckAndEscalateAsync_Critical工单超时_不升级()
    {
        var db = GetDb();
        var service = CreateService(db);

        var critical = CreateWorkOrder(WorkOrderPriority.Critical, WorkOrderStatus.Assigned,
            DateTime.UtcNow.AddHours(-10));  // Critical SLA 4h，已超 6h
        critical.TenantId = _tenantId;
        db.WorkOrders.Add(critical);
        await db.SaveChangesAsync();

        var count = await service.CheckAndEscalateAsync(_tenantId);

        count.Should().Be(0, "Critical 已是最高优先级，没有更高级可升");
        critical.Priority.Should().Be(WorkOrderPriority.Critical, "Critical 工单不应被修改");
    }

    /// <summary>
    /// 未超时的工单不应升级（即使接近截止时间）
    /// </summary>
    [Fact]
    public async Task CheckAndEscalateAsync_未超时工单_不升级()
    {
        var db = GetDb();
        var service = CreateService(db);

        // Critical 创建 1 小时（SLA 4h，剩 75%）
        var onTrack = CreateWorkOrder(WorkOrderPriority.Critical, WorkOrderStatus.Assigned, DateTime.UtcNow.AddHours(-1));
        // High 创建 7 小时（SLA 8h，剩 12.5%，Warning 但未超时）
        var warning = CreateWorkOrder(WorkOrderPriority.High, WorkOrderStatus.InProgress, DateTime.UtcNow.AddHours(-7));
        onTrack.TenantId = _tenantId;
        warning.TenantId = _tenantId;
        db.WorkOrders.AddRange(onTrack, warning);
        await db.SaveChangesAsync();

        var count = await service.CheckAndEscalateAsync(_tenantId);

        count.Should().Be(0, "Warning 状态的工单还未超时，不应升级");
        onTrack.Priority.Should().Be(WorkOrderPriority.Critical);
        warning.Priority.Should().Be(WorkOrderPriority.High);
    }

    /// <summary>
    /// 关键不变量：扫描只看活动状态工单，已关闭/取消的不参与升级
    /// </summary>
    [Fact]
    public async Task CheckAndEscalateAsync_已关闭的工单_不参与扫描()
    {
        var db = GetDb();
        var service = CreateService(db);

        var closed = CreateWorkOrder(WorkOrderPriority.Low, WorkOrderStatus.Closed,
            DateTime.UtcNow.AddHours(-100));  // 即使严重超时（100h > Low 72h SLA）
        closed.TenantId = _tenantId;
        db.WorkOrders.Add(closed);
        await db.SaveChangesAsync();

        var count = await service.CheckAndEscalateAsync(_tenantId);

        count.Should().Be(0, "已关闭工单不应被升级");
        closed.Priority.Should().Be(WorkOrderPriority.Low, "已关闭工单的优先级不应被修改");
    }

    // =========================================================================
    // GetSummaryAsync — 按 SLA 状态分组统计
    // =========================================================================

    /// <summary>
    /// 统计：把活动工单按 SLA 状态分组（OnTrack / Warning / Overdue）
    ///
    /// Why：Dashboard 显示"X 个工单即将超时"，让运维优先处理。
    /// 如果统计错误，运维会漏处理或重复处理。
    /// </summary>
    [Fact]
    public async Task GetSummaryAsync_按SlaStatus分组统计()
    {
        var db = GetDb();
        var service = CreateService(db);

        // 4 个工单：1 OnTrack + 1 Warning + 1 Overdue + 1 已关闭（不计入）
        var onTrack = CreateWorkOrder(WorkOrderPriority.Critical, WorkOrderStatus.Assigned, DateTime.UtcNow.AddHours(-1));
        var warning = CreateWorkOrder(WorkOrderPriority.High, WorkOrderStatus.InProgress, DateTime.UtcNow.AddHours(-7));
        var overdue = CreateWorkOrder(WorkOrderPriority.Medium, WorkOrderStatus.Assigned, DateTime.UtcNow.AddHours(-30));
        var closed = CreateWorkOrder(WorkOrderPriority.Low, WorkOrderStatus.Closed, DateTime.UtcNow.AddHours(-100));
        foreach (var wo in new[] { onTrack, warning, overdue, closed })
            wo.TenantId = _tenantId;
        db.WorkOrders.AddRange(onTrack, warning, overdue, closed);
        await db.SaveChangesAsync();

        var summary = await service.GetSummaryAsync(_tenantId);

        summary.Total.Should().Be(3, "已关闭工单不计入统计（只有 3 个活动工单）");
        summary.OnTrack.Should().Be(1);
        summary.Warning.Should().Be(1);
        summary.Overdue.Should().Be(1);
    }

    /// <summary>
    /// 跨租户隔离：其他租户的工单不参与统计
    /// </summary>
    [Fact]
    public async Task GetSummaryAsync_跨租户工单_不参与统计()
    {
        var db = GetDb();
        var service = CreateService(db);

        // 当前租户：1 个超时
        var mine = CreateWorkOrder(WorkOrderPriority.Critical, WorkOrderStatus.Assigned, DateTime.UtcNow.AddHours(-10));
        mine.TenantId = _tenantId;

        // 其他租户：3 个超时
        var otherTenant = Guid.NewGuid();
        var o1 = CreateWorkOrder(WorkOrderPriority.Critical, WorkOrderStatus.Assigned, DateTime.UtcNow.AddHours(-10));
        var o2 = CreateWorkOrder(WorkOrderPriority.High, WorkOrderStatus.Assigned, DateTime.UtcNow.AddHours(-20));
        var o3 = CreateWorkOrder(WorkOrderPriority.Medium, WorkOrderStatus.Assigned, DateTime.UtcNow.AddHours(-50));
        o1.TenantId = otherTenant;
        o2.TenantId = otherTenant;
        o3.TenantId = otherTenant;

        db.WorkOrders.AddRange(mine, o1, o2, o3);
        await db.SaveChangesAsync();

        var summary = await service.GetSummaryAsync(_tenantId);

        summary.Total.Should().Be(1, "只统计当前租户的活动工单");
        summary.Overdue.Should().Be(1);
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
