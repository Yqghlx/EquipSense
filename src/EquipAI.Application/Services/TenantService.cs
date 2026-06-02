using AutoMapper;
using EquipAI.Application.DTOs.Common;
using EquipAI.Core.Models;
using EquipAI.Application.DTOs.Tenants;
using EquipAI.Application.Interfaces;
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
}
