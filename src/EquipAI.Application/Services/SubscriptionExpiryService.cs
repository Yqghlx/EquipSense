using EquipAI.Application.Hosting;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Services;

/// <summary>
/// 订阅到期检查后台服务 — 每 6 小时检查一次试用和订阅到期状态，
/// 自动将到期租户降级为 Trial 或标记为 Expired/Frozen
/// 多实例部署下通过分布式锁保证仅一个实例执行检查（避免重复降级 + 重复 DB 负载）。
/// </summary>
public class SubscriptionExpiryService : LockedTimerService
{
    private readonly IServiceScopeFactory _scopeFactory;

    public SubscriptionExpiryService(
        IServiceScopeFactory scopeFactory,
        IDistributedLockProvider lockProvider,
        ILogger<SubscriptionExpiryService> logger)
        : base(lockProvider, logger, lockResource: "subscription-expiry", lockExpiry: TimeSpan.FromHours(6))
    {
        _scopeFactory = scopeFactory;
    }

    /// <summary>
    /// 启动延迟：等待数据库迁移和种子初始化完成后再执行首次检查，
    /// 避免应用启动阶段与 schema 创建、其他后台服务争用数据库。
    /// </summary>
    protected override TimeSpan DefaultStartupDelay => TimeSpan.FromSeconds(30);

    /// <summary>检查间隔：6 小时。</summary>
    protected override TimeSpan DefaultInterval => TimeSpan.FromHours(6);

    /// <summary>
    /// 基类回调：持锁后执行到期检查。委托给 <see cref="CheckAndProcessExpirationsAsync"/> 以便单元测试直接验证。
    /// </summary>
    protected override Task ExecuteWorkAsync(CancellationToken ct) => CheckAndProcessExpirationsAsync(ct);

    /// <summary>
    /// 检查并处理到期的试用和订阅
    /// 设为 public 以便单元测试直接验证到期处理逻辑（跳过 ExecuteWorkAsync 的调度）。
    /// </summary>
    public async Task CheckAndProcessExpirationsAsync(CancellationToken ct = default)
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
            Logger.LogInformation("租户 {TenantId}({Name}) 试用期已到期，标记为 Expired", tenant.Id, tenant.Name);
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
            // 降级为【可用】试用版：订阅到期后客户仍可用 5 设备免费版（SaaS 留存策略，引导续费）。
            // ⚠️ Status 必须为 Trial（非 Expired）：
            //   - CanCreateResourceAsync 对 Expired/Frozen/Closed 直接拒绝创建 → 降级配额 MaxDevices=5 永不生效
            //   - DeviceHealthRecalculation / SlaEscalation 等 HostedService 都 Where(Status != Expired) 跳过监控
            //   - 原代码设 Expired 让降级客户被完全锁死（加不了设备 + 健康度/SLA 监控失效），与「降级可用」矛盾。
            // ⚠️ TrialEndsAt 必须清空：降级是长期免费版（非限时试用），保留旧 TrialEndsAt（可能已过期）会触发
            //   CanCreateResourceAsync 的试用过期检查（TrialEndsAt < now）误锁创建。
            tenant.Plan = TenantPlan.Trial;
            tenant.Status = TenantStatus.Trial;
            tenant.TrialEndsAt = null;
            tenant.MaxDevices = 5;
            tenant.MaxUsers = 3;
            tenant.DataRetentionDays = 30;

            Logger.LogWarning("租户 {TenantId}({Name}) 订阅已到期（{OldPlan}），降级为可用 Trial（5 设备免费版）",
                tenant.Id, tenant.Name, oldPlan);
        }

        if (expiredTrials.Count > 0 || expiredSubscriptions.Count > 0)
        {
            await db.SaveChangesAsync(ct);
            Logger.LogInformation("订阅到期检查完成：{TrialCount} 个试用到期，{SubCount} 个订阅到期",
                expiredTrials.Count, expiredSubscriptions.Count);
        }
        else
        {
            Logger.LogDebug("订阅到期检查完成，无需处理");
        }
    }
}
