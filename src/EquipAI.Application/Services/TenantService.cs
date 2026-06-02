using AutoMapper;
using EquipAI.Application.DTOs.Common;
using EquipAI.Core.Models;
using EquipAI.Application.DTOs.Tenants;
using EquipAI.Application.Interfaces;
using EquipAI.Core.Constants;
using EquipAI.Core.Enums;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Services;

/// <summary>
/// 租户管理服务实现，提供租户 CRUD 和用量查询能力
/// 所有操作使用 IgnoreQueryFilters（管理操作跨租户，不受全局过滤器约束）
/// </summary>
public class TenantService : ITenantService
{
    private readonly AppDbContext _dbContext;
    private readonly IMapper _mapper;
    private readonly ILogger<TenantService> _logger;

    /// <summary>
    /// 初始化租户管理服务
    /// </summary>
    public TenantService(
        AppDbContext dbContext,
        IMapper mapper,
        ILogger<TenantService> logger)
    {
        _dbContext = dbContext;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// 分页查询租户列表
    /// 默认仅返回活跃租户，按创建时间降序排列
    /// </summary>
    /// <param name="query">分页查询参数</param>
    /// <returns>分页租户结果</returns>
    public async Task<PagedResult<TenantDto>> GetTenantsAsync(PagedQuery query)
    {
        // 管理操作使用 UnfilteredSet 跨租户查询
        var tenants = _dbContext.UnfilteredSet<Core.Entities.Tenant>()
            .Where(t => t.IsActive);

        // 关键词搜索：匹配租户名称或 Slug
        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            var keyword = $"%{query.Keyword}%";
            tenants = tenants.Where(t =>
                EF.Functions.ILike(t.Name, keyword) ||
                EF.Functions.ILike(t.Slug, keyword));
        }

        var (items, total) = await tenants.ToPagedAsync(query);

        return new PagedResult<TenantDto>
        {
            Items = _mapper.Map<List<TenantDto>>(items)!,
            Total = total,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }

    /// <summary>
    /// 根据 ID 获取租户详情
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <returns>租户信息，不存在则返回 null</returns>
    public async Task<TenantDto?> GetTenantByIdAsync(Guid tenantId)
    {
        var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == tenantId);

        return tenant == null ? null : _mapper.Map<TenantDto>(tenant);
    }

    /// <summary>
    /// 创建新租户
    /// 检查 Slug 唯一性（Slug 用于子域名路由，必须全局唯一）
    /// </summary>
    /// <param name="request">创建租户请求</param>
    /// <returns>创建后的租户信息</returns>
    /// <exception cref="InvalidOperationException">Slug 已被占用</exception>
    public async Task<TenantDto> CreateTenantAsync(CreateTenantRequest request)
    {
        // 检查 Slug 唯一性
        var slugExists = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
            .AnyAsync(t => t.Slug == request.Slug);

        if (slugExists)
        {
            throw new InvalidOperationException($"租户标识 '{request.Slug}' 已被占用");
        }

        var tenant = _mapper.Map<Core.Entities.Tenant>(request)!;

        _dbContext.Tenants.Add(tenant);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("租户 {Name}（Slug: {Slug}）创建成功", tenant.Name, tenant.Slug);

        return _mapper.Map<TenantDto>(tenant)!;
    }

    /// <summary>
    /// 更新租户信息
    /// 通过 AutoMapper 的 Condition 配置仅更新请求中非 null 的字段
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="request">更新租户请求</param>
    /// <returns>更新后的租户信息</returns>
    /// <exception cref="KeyNotFoundException">租户不存在</exception>
    public async Task<TenantDto> UpdateTenantAsync(Guid tenantId, UpdateTenantRequest request)
    {
        var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == tenantId)
            ?? throw new KeyNotFoundException($"租户 {tenantId} 不存在");

        _mapper.Map(request, tenant);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("租户 {TenantId} 信息已更新", tenantId);

        return _mapper.Map<TenantDto>(tenant)!;
    }

    /// <summary>
    /// 获取租户当前用量统计（设备数、用户数）
    /// 用于管理后台的配额监控和告警
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <returns>用量统计字典（deviceCount、userCount）</returns>
    public async Task<Dictionary<string, int>> GetTenantUsageAsync(Guid tenantId)
    {
        // 使用 UnfilteredSet 跨租户查询关联数据
        var deviceCount = await _dbContext.UnfilteredSet<Core.Entities.Device>()
            .CountAsync(d => d.TenantId == tenantId);

        var userCount = await _dbContext.UnfilteredSet<Core.Entities.User>()
            .CountAsync(u => u.TenantId == tenantId);

        return new Dictionary<string, int>
        {
            ["deviceCount"] = deviceCount,
            ["userCount"] = userCount
        };
    }

    /// <summary>
    /// 冻结租户 — 将 Status 设为 Frozen，IsActive 设为 false
    /// 通常用于违规或欠费场景，冻结后租户无法创建新资源
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <exception cref="KeyNotFoundException">租户不存在</exception>
    public async Task FreezeTenantAsync(Guid tenantId)
    {
        var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == tenantId)
            ?? throw new KeyNotFoundException($"租户 {tenantId} 不存在");

        tenant.Status = TenantStatus.Frozen;
        tenant.IsActive = false;

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("租户 {TenantId}（名称：{Name}）已冻结", tenantId, tenant.Name);
    }

    /// <summary>
    /// 解冻租户 — 将 Status 设为 Active，IsActive 设为 true
    /// 恢复租户正常使用，可以重新创建资源
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <exception cref="KeyNotFoundException">租户不存在</exception>
    public async Task UnfreezeTenantAsync(Guid tenantId)
    {
        var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == tenantId)
            ?? throw new KeyNotFoundException($"租户 {tenantId} 不存在");

        tenant.Status = TenantStatus.Active;
        tenant.IsActive = true;

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("租户 {TenantId}（名称：{Name}）已解冻", tenantId, tenant.Name);
    }

    /// <summary>
    /// 获取租户详情 — 包含基础信息 + 活跃告警数、待处理工单数、月度分析数、管理员信息
    /// 用于 system_admin 门户的租户详情页面
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <returns>租户详情，不存在则返回 null</returns>
    public async Task<TenantDetailDto?> GetTenantDetailAsync(Guid tenantId)
    {
        var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == tenantId);

        if (tenant == null) return null;

        var detail = _mapper.Map<TenantDetailDto>(tenant)!;

        // 查询活跃告警数（Active + Acknowledged 状态）
        detail.ActiveAlertCount = await _dbContext.UnfilteredSet<Core.Entities.Alert>()
            .CountAsync(a => a.TenantId == tenantId
                && (a.Status == AlertStatus.Active || a.Status == AlertStatus.Acknowledged));

        // 查询待处理工单数（PendingDispatch + Assigned 状态）
        detail.PendingWorkOrderCount = await _dbContext.UnfilteredSet<Core.Entities.WorkOrder>()
            .CountAsync(w => w.TenantId == tenantId
                && (w.Status == WorkOrderStatus.PendingDispatch || w.Status == WorkOrderStatus.Assigned));

        // 查询本月 AI 分析次数
        var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        detail.MonthlyAnalysisCount = await _dbContext.UnfilteredSet<Core.Entities.Analysis>()
            .CountAsync(a => a.TenantId == tenantId && a.CreatedAt >= monthStart);

        // 查询管理员信息（SystemAdmin 角色的第一个用户）
        var admin = await _dbContext.UnfilteredSet<Core.Entities.User>()
            .Where(u => u.TenantId == tenantId && u.Role == UserRole.SystemAdmin)
            .OrderBy(u => u.CreatedAt)
            .FirstOrDefaultAsync();

        if (admin != null)
        {
            detail.AdminUsername = admin.Username;
            detail.AdminEmail = admin.Email;
        }

        return detail;
    }

    /// <summary>
    /// 获取全局统计 — 排除系统租户
    /// 返回总租户数、活跃数、试用数、冻结数、总设备数、总用户数
    /// </summary>
    /// <returns>全局统计字典</returns>
    public async Task<Dictionary<string, object>> GetGlobalStatsAsync()
    {
        var systemTenantId = SystemConstants.SystemTenantId;

        // 排除系统租户的租户总数
        var totalTenants = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
            .CountAsync(t => t.Id != systemTenantId);

        // 活跃租户数（Status=Active 或 Status=Trial 且未过期）
        var activeTenants = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
            .CountAsync(t => t.Id != systemTenantId
                && (t.Status == TenantStatus.Active
                    || (t.Status == TenantStatus.Trial
                        && (!t.TrialEndsAt.HasValue || t.TrialEndsAt.Value >= DateTime.UtcNow))));

        // 试用中租户数
        var trialTenants = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
            .CountAsync(t => t.Id != systemTenantId && t.Status == TenantStatus.Trial);

        // 冻结租户数
        var frozenTenants = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
            .CountAsync(t => t.Id != systemTenantId && t.Status == TenantStatus.Frozen);

        // 总设备数（排除系统租户）
        var totalDevices = await _dbContext.UnfilteredSet<Core.Entities.Device>()
            .CountAsync(d => d.TenantId != systemTenantId);

        // 总用户数（排除系统租户）
        var totalUsers = await _dbContext.UnfilteredSet<Core.Entities.User>()
            .CountAsync(u => u.TenantId != systemTenantId);

        return new Dictionary<string, object>
        {
            ["totalTenants"] = totalTenants,
            ["activeTenants"] = activeTenants,
            ["trialTenants"] = trialTenants,
            ["frozenTenants"] = frozenTenants,
            ["totalDevices"] = totalDevices,
            ["totalUsers"] = totalUsers
        };
    }
}
