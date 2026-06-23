using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Interfaces;

/// <summary>
/// 订阅管理服务实现 — 处理计划变更、配额查询和资源限制检查
/// 通过 IServiceScopeFactory 创建独立作用域，确保长生命周期场景下的 DbContext 正确释放
/// </summary>
public class SubscriptionService : ISubscriptionService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SubscriptionService> _logger;

    /// <summary>
    /// 各计划对应的配额限制（最大设备数、最大用户数、数据保留天数）
    /// </summary>
    private static readonly Dictionary<TenantPlan, (int MaxDevices, int MaxUsers, int RetentionDays)> PlanLimits = new()
    {
        [TenantPlan.Trial] = (5, 3, 30),
        [TenantPlan.Basic] = (50, 20, 90),
        [TenantPlan.Professional] = (200, 50, 180),
        [TenantPlan.Enterprise] = (500, 200, 365),
    };

    /// <summary>
    /// 所有套餐中最大的数据保留天数（当前 Enterprise=365）。
    ///
    /// 用途：TimescaleDB 的全局 drop_chunks 保留策略是超级表级、无差别丢弃超过阈值的整段数据，
    /// 无法按租户区分。该全局阈值必须 >= 最大套餐保留期，否则长期套餐（如 Enterprise 365 天）
    /// 的遥测会被提前丢弃。此处暴露最大值，供 TimescaleDbSetup 与回归测试引用，确保二者同步。
    /// 短保留期套餐（Trial/Basic/Professional）由 TelemetryCleanupService 按租户 DataRetentionDays 精细 DELETE。
    /// </summary>
    public static int MaxPlanRetentionDays => PlanLimits.Values.Max(p => p.RetentionDays);

    /// <summary>
    /// 初始化订阅管理服务
    /// </summary>
    /// <param name="scopeFactory">服务作用域工厂</param>
    /// <param name="logger">日志记录器</param>
    public SubscriptionService(IServiceScopeFactory scopeFactory, ILogger<SubscriptionService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<SubscriptionInfo> GetSubscriptionAsync(Guid tenantId, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var tenant = await db.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == tenantId, ct)
            ?? throw new KeyNotFoundException($"租户不存在: {tenantId}");

        // 查询当前设备数和用户数
        var deviceCount = await db.UnfilteredSet<Core.Entities.Device>()
            .CountAsync(d => d.TenantId == tenantId, ct);

        var userCount = await db.UnfilteredSet<Core.Entities.User>()
            .CountAsync(u => u.TenantId == tenantId, ct);

        return new SubscriptionInfo
        {
            TenantId = tenantId,
            Plan = tenant.Plan.ToString(),
            PlanDisplayName = GetPlanDisplayName(tenant.Plan),
            MaxDevices = tenant.MaxDevices,
            CurrentDevices = deviceCount,
            MaxUsers = tenant.MaxUsers,
            CurrentUsers = userCount,
            DataRetentionDays = tenant.DataRetentionDays,
            IsTrial = tenant.Plan == TenantPlan.Trial,
            IsActive = tenant.IsActive
        };
    }

    /// <inheritdoc />
    public async Task ChangePlanAsync(Guid tenantId, string newPlan, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var tenant = await db.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == tenantId, ct)
            ?? throw new KeyNotFoundException($"租户不存在: {tenantId}");

        if (!Enum.TryParse<TenantPlan>(newPlan, ignoreCase: true, out var plan))
            throw new ArgumentException($"无效的计划名称: {newPlan}");

        var limits = PlanLimits[plan];

        // 更新计划及对应配额
        tenant.Plan = plan;
        tenant.MaxDevices = limits.MaxDevices;
        tenant.MaxUsers = limits.MaxUsers;
        tenant.DataRetentionDays = limits.RetentionDays;

        await db.SaveChangesAsync(ct);

        _logger.LogInformation("租户 {TenantId} 计划变更: {NewPlan}，设备上限={MaxDevices}，用户上限={MaxUsers}",
            tenantId, plan, limits.MaxDevices, limits.MaxUsers);
    }

    /// <inheritdoc />
    public async Task<bool> CanCreateResourceAsync(Guid tenantId, string resourceType, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var tenant = await db.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == tenantId, ct);

        // 租户不存在时不允许创建资源
        if (tenant == null) return false;

        // 检查租户状态：Expired/Frozen/Closed 状态不允许创建资源
        if (tenant.Status == TenantStatus.Expired
            || tenant.Status == TenantStatus.Frozen
            || tenant.Status == TenantStatus.Closed)
        {
            _logger.LogWarning("租户 {TenantId} 状态为 {Status}，不允许创建资源", tenantId, tenant.Status);
            return false;
        }

        // 检查试用期是否过期：Trial 状态 + TrialEndsAt 已过期不允许创建资源
        if (tenant.Status == TenantStatus.Trial
            && tenant.TrialEndsAt.HasValue
            && tenant.TrialEndsAt.Value < DateTime.UtcNow)
        {
            _logger.LogWarning("租户 {TenantId} 试用期已于 {TrialEndsAt} 过期，不允许创建资源",
                tenantId, tenant.TrialEndsAt.Value);
            return false;
        }

        // 使用 CurrentDeviceCount/CurrentUserCount 字段判断配额（避免 COUNT 查询）
        return resourceType.ToLowerInvariant() switch
        {
            // 检查设备数是否已达上限
            "device" => tenant.CurrentDeviceCount < tenant.MaxDevices,
            // 检查用户数是否已达上限
            "user" => tenant.CurrentUserCount < tenant.MaxUsers,
            // 未知资源类型默认允许（保持前向兼容）
            _ => true
        };
    }

    /// <summary>
    /// 获取计划的中文显示名称
    /// </summary>
    private static string GetPlanDisplayName(TenantPlan plan) => plan switch
    {
        TenantPlan.Trial => "试用版",
        TenantPlan.Basic => "基础版",
        TenantPlan.Professional => "专业版",
        TenantPlan.Enterprise => "企业版",
        _ => plan.ToString()
    };
}
