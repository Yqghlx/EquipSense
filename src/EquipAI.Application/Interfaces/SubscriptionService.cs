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

        // 租户不存在或未激活时不允许创建资源
        if (tenant == null || !tenant.IsActive) return false;

        return resourceType.ToLowerInvariant() switch
        {
            // 检查设备数是否已达上限
            "device" => await db.UnfilteredSet<Core.Entities.Device>()
                .CountAsync(d => d.TenantId == tenantId, ct) < tenant.MaxDevices,
            // 检查用户数是否已达上限
            "user" => await db.UnfilteredSet<Core.Entities.User>()
                .CountAsync(u => u.TenantId == tenantId, ct) < tenant.MaxUsers,
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
