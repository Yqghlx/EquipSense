using EquipAI.Application.Services;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Tests.Unit.Services;

/// <summary>
/// BillingService 单元测试
///
/// 账单服务是订阅计费的核心。如果价格/状态错误：
///   - 套餐价格错 → 客户被多收费或欠费，可能引发法务问题
///   - Trial 应自动 Paid 但生成 Pending → 客户看到不该有的待付款账单
///   - 跨租户串账单 → 严重的隐私和合规问题
///
/// 测试维度：
/// 1. 4 套餐价格锁定（Trial 0 / Basic 299 / Pro 999 / Enterprise 2999）
/// 2. Trial 套餐自动 Paid（amount=0）
/// 3. 付费套餐生成 Pending 状态
/// 4. 分页查询（page/pageSize 边界）
/// 5. 跨租户隔离
/// </summary>
public class BillingServiceTests : IAsyncDisposable
{
    private readonly ServiceProvider _sp;
    private readonly Guid _tenantId = Guid.NewGuid();

    public BillingServiceTests()
    {
        var dbName = $"BillingTest_{Guid.NewGuid()}";
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(dbName));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(_tenantId));
        services.AddLogging();
        _sp = services.BuildServiceProvider();
    }

    public async ValueTask DisposeAsync() => await _sp.DisposeAsync();

    private AppDbContext GetDb() => _sp.GetRequiredService<AppDbContext>();

    private BillingService CreateService(AppDbContext db)
    {
        var logger = _sp.GetRequiredService<ILogger<BillingService>>();
        return new BillingService(db, logger);
    }

    // =========================================================================
    // 套餐价格 — 业务契约，不能改
    // =========================================================================

    /// <summary>
    /// 关键不变量：4 个套餐的价格是业务契约
    ///
    /// Why：价格变更需要法务和市场审批，代码里值不应被误改。
    /// 此 Theory 锁定当前价格，任何变更都需显式更新此测试。
    /// </summary>
    [Theory]
    [InlineData(TenantPlan.Trial, 0)]
    [InlineData(TenantPlan.Basic, 299)]
    [InlineData(TenantPlan.Professional, 999)]
    [InlineData(TenantPlan.Enterprise, 2999)]
    public void GetPlanPrice_各套餐价格锁定(TenantPlan plan, int expectedPrice)
    {
        var db = GetDb();
        var service = CreateService(db);

        service.GetPlanPrice(plan).Should().Be(expectedPrice,
            $"{plan} 套餐价格应锁定为 {expectedPrice} 元");
    }

    // =========================================================================
    // GenerateBillAsync — Trial 自动 Paid / 付费 Pending
    // =========================================================================

    /// <summary>
    /// Trial 套餐（amount=0）应自动标记为 Paid，不生成待付款账单
    ///
    /// Why：试用本身不收费，如果生成 Pending 账单，客户会看到"待付款 0 元"
    /// 的怪异账单，产生困惑且占用账务系统资源。
    /// </summary>
    [Fact]
    public async Task GenerateBillAsync_Trial套餐_amount为零_自动标记为Paid()
    {
        var db = GetDb();
        var service = CreateService(db);

        var record = await service.GenerateBillAsync(_tenantId, TenantPlan.Trial,
            new DateTime(2026, 6, 1), new DateTime(2026, 6, 30));

        record.Amount.Should().Be(0);
        record.Status.Should().Be(BillingStatus.Paid, "Trial 0 元应自动 Paid");
        record.PaymentMethod.Should().Be("System", "Trial 由系统标记，无需客户付款");
    }

    /// <summary>
    /// 付费套餐应生成 Pending 状态，等待客户付款
    /// </summary>
    [Theory]
    [InlineData(TenantPlan.Basic, 299)]
    [InlineData(TenantPlan.Professional, 999)]
    [InlineData(TenantPlan.Enterprise, 2999)]
    public async Task GenerateBillAsync_付费套餐_金额正确_状态为Pending(
        TenantPlan plan, int expectedAmount)
    {
        var db = GetDb();
        var service = CreateService(db);

        var record = await service.GenerateBillAsync(_tenantId, plan,
            new DateTime(2026, 6, 1), new DateTime(2026, 6, 30));

        record.Amount.Should().Be(expectedAmount);
        record.Status.Should().Be(BillingStatus.Pending, "付费套餐应生成待付款账单");
    }

    /// <summary>
    /// 生成的账单应完整写入数据库
    /// </summary>
    [Fact]
    public async Task GenerateBillAsync_完整持久化到数据库()
    {
        var db = GetDb();
        var service = CreateService(db);

        await service.GenerateBillAsync(_tenantId, TenantPlan.Professional,
            new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 6, 30, 0, 0, 0, DateTimeKind.Utc),
            remark: "Pro 升级");

        var saved = await db.BillingRecords.SingleAsync();
        saved.TenantId.Should().Be(_tenantId);
        saved.Plan.Should().Be(TenantPlan.Professional);
        saved.Amount.Should().Be(999);
        saved.Remark.Should().Be("Pro 升级");
        saved.PeriodStart.Should().Be(new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc));
        saved.PeriodEnd.Should().Be(new DateTime(2026, 6, 30, 0, 0, 0, DateTimeKind.Utc));
    }

    // =========================================================================
    // GetBillingHistoryAsync — 分页查询
    // =========================================================================

    /// <summary>
    /// 分页查询应正确按 createdAt 降序返回，且只返回当前租户
    /// </summary>
    [Fact]
    public async Task GetBillingHistoryAsync_分页查询_按CreatedAt降序_只返回当前租户()
    {
        var db = GetDb();
        var service = CreateService(db);
        var otherTenant = Guid.NewGuid();

        // 当前租户：5 条
        for (var i = 0; i < 5; i++)
        {
            db.BillingRecords.Add(new BillingRecord
            {
                TenantId = _tenantId,
                Plan = TenantPlan.Professional,
                Amount = 999,
                PeriodStart = DateTime.UtcNow.AddDays(-30),
                PeriodEnd = DateTime.UtcNow,
                Status = BillingStatus.Paid,
                PaymentMethod = "Alipay",
                CreatedAt = DateTime.UtcNow.AddDays(-5 + i),  // i=0 最早，i=4 最新
            });
        }
        // 其他租户：3 条
        for (var i = 0; i < 3; i++)
        {
            db.BillingRecords.Add(new BillingRecord
            {
                TenantId = otherTenant,
                Plan = TenantPlan.Enterprise,
                Amount = 2999,
                PeriodStart = DateTime.UtcNow.AddDays(-30),
                PeriodEnd = DateTime.UtcNow,
                Status = BillingStatus.Paid,
                PaymentMethod = "WeChatPay",
                CreatedAt = DateTime.UtcNow,
            });
        }
        await db.SaveChangesAsync();

        // 查第 1 页，每页 2 条
        var (items, total) = await service.GetBillingHistoryAsync(_tenantId, page: 1, pageSize: 2);

        total.Should().Be(5, "只统计当前租户的 5 条，其他租户 3 条不计");
        items.Should().HaveCount(2);
        // 按降序：i=4 应在第一位，i=3 在第二位
        items[0].CreatedAt.Should().BeAfter(items[1].CreatedAt, "应按 CreatedAt 降序排列");
    }

    /// <summary>
    /// 分页边界：第 2 页（剩余数据）
    /// </summary>
    [Fact]
    public async Task GetBillingHistoryAsync_第2页_返回剩余数据()
    {
        var db = GetDb();
        var service = CreateService(db);

        for (var i = 0; i < 5; i++)
        {
            db.BillingRecords.Add(new BillingRecord
            {
                TenantId = _tenantId,
                Plan = TenantPlan.Professional,
                Amount = 999,
                PeriodStart = DateTime.UtcNow.AddDays(-30),
                PeriodEnd = DateTime.UtcNow,
                Status = BillingStatus.Paid,
                CreatedAt = DateTime.UtcNow.AddDays(-i),
            });
        }
        await db.SaveChangesAsync();

        var (items, total) = await service.GetBillingHistoryAsync(_tenantId, page: 2, pageSize: 2);

        total.Should().Be(5);
        items.Should().HaveCount(2, "第 2 页应返回剩余 2 条（5 - 2 = 3，但第 2 页只有 2 条 + 第 3 页有 1 条）");
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
