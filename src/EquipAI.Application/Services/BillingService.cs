using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Services;

/// <summary>
/// 账单服务 — 管理租户订阅账单的生成、查询和状态变更
/// </summary>
public class BillingService
{
    private readonly AppDbContext _db;
    private readonly ILogger<BillingService> _logger;

    /// <summary>
    /// 各套餐月度价格（元）
    /// </summary>
    private static readonly Dictionary<TenantPlan, decimal> PlanPrices = new()
    {
        [TenantPlan.Trial] = 0,
        [TenantPlan.Basic] = 299,
        [TenantPlan.Professional] = 999,
        [TenantPlan.Enterprise] = 2999,
    };

    public BillingService(AppDbContext db, ILogger<BillingService> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// 为租户生成账单（套餐变更或续费时调用）
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="plan">目标套餐</param>
    /// <param name="periodStart">计费起始时间</param>
    /// <param name="periodEnd">计费结束时间</param>
    /// <param name="remark">备注</param>
    /// <returns>生成的账单记录</returns>
    public async Task<BillingRecord> GenerateBillAsync(
        Guid tenantId,
        TenantPlan plan,
        DateTime periodStart,
        DateTime periodEnd,
        string? remark = null)
    {
        var amount = PlanPrices.GetValueOrDefault(plan, 0);

        var record = new BillingRecord
        {
            TenantId = tenantId,
            Plan = plan,
            Amount = amount,
            PeriodStart = periodStart,
            PeriodEnd = periodEnd,
            Status = amount == 0 ? BillingStatus.Paid : BillingStatus.Pending,
            PaymentMethod = "System",
            Remark = remark,
        };

        _db.BillingRecords.Add(record);
        await _db.SaveChangesAsync();

        _logger.LogInformation("已为租户 {TenantId} 生成账单：{Plan}，金额 {Amount} 元，周期 {Start:yyyy-MM-dd} ~ {End:yyyy-MM-dd}",
            tenantId, plan, amount, periodStart, periodEnd);

        return record;
    }

    /// <summary>
    /// 查询租户的账单历史
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="page">页码</param>
    /// <param name="pageSize">每页条数</param>
    /// <returns>账单列表和总数</returns>
    public async Task<(List<BillingRecord> Items, int Total)> GetBillingHistoryAsync(
        Guid tenantId, int page = 1, int pageSize = 20)
    {
        var query = _db.BillingRecords
            .Where(b => b.TenantId == tenantId)
            .OrderByDescending(b => b.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, total);
    }

    /// <summary>
    /// 获取套餐价格
    /// </summary>
    public decimal GetPlanPrice(TenantPlan plan) => PlanPrices.GetValueOrDefault(plan, 0);
}
