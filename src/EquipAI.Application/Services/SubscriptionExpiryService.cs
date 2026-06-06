using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Services;

/// <summary>
/// 订阅到期检查后台服务 — 每 6 小时检查一次试用和订阅到期状态，
/// 自动将到期租户降级为 Trial 或标记为 Expired/Frozen
/// </summary>
public class SubscriptionExpiryService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SubscriptionExpiryService> _logger;

    /// <summary>
    /// 检查间隔（6 小时）
    /// </summary>
    private static readonly TimeSpan CheckInterval = TimeSpan.FromHours(6);

    public SubscriptionExpiryService(
        IServiceScopeFactory scopeFactory,
        ILogger<SubscriptionExpiryService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("订阅到期检查服务已启动，每 {Hours} 小时检查一次", CheckInterval.TotalHours);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckAndProcessExpirationsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "订阅到期检查执行异常");
            }

            await Task.Delay(CheckInterval, stoppingToken);
        }
    }

    /// <summary>
    /// 检查并处理到期的试用和订阅
    /// </summary>
    private async Task CheckAndProcessExpirationsAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var now = DateTime.UtcNow;

        // 1. 试用期到期 → 标记为 Expired
        var expiredTrials = await db.Tenants
            .Where(t => t.Status == TenantStatus.Trial
                     && t.TrialEndsAt != null
                     && t.TrialEndsAt < now)
            .ToListAsync(ct);

        foreach (var tenant in expiredTrials)
        {
            tenant.Status = TenantStatus.Expired;
            _logger.LogInformation("租户 {TenantId}({Name}) 试用期已到期，标记为 Expired", tenant.Id, tenant.Name);
        }

        // 2. 付费订阅到期 → 降级为 Trial 并重置配额
        var expiredSubscriptions = await db.Tenants
            .Where(t => (t.Status == TenantStatus.Active || t.Plan != TenantPlan.Trial)
                     && t.SubscriptionEndsAt != null
                     && t.SubscriptionEndsAt < now)
            .ToListAsync(ct);

        foreach (var tenant in expiredSubscriptions)
        {
            var oldPlan = tenant.Plan;
            tenant.Plan = TenantPlan.Trial;
            tenant.Status = TenantStatus.Expired;
            tenant.MaxDevices = 5;
            tenant.MaxUsers = 3;
            tenant.DataRetentionDays = 30;

            _logger.LogWarning("租户 {TenantId}({Name}) 订阅已到期（{OldPlan}），降级为 Trial",
                tenant.Id, tenant.Name, oldPlan);
        }

        if (expiredTrials.Count > 0 || expiredSubscriptions.Count > 0)
        {
            await db.SaveChangesAsync(ct);
            _logger.LogInformation("订阅到期检查完成：{TrialCount} 个试用到期，{SubCount} 个订阅到期",
                expiredTrials.Count, expiredSubscriptions.Count);
        }
        else
        {
            _logger.LogDebug("订阅到期检查完成，无需处理");
        }
    }
}
