using EquipAI.Application.DTOs.Common;
using EquipAI.Application.DTOs.Tenants;

namespace EquipAI.Application.Interfaces;

/// <summary>
/// 租户管理服务接口，提供租户 CRUD 和用量查询能力
/// </summary>
public interface ITenantService
{
    /// <summary>
    /// 分页查询租户列表
    /// </summary>
    /// <param name="query">分页查询参数</param>
    /// <returns>分页租户结果</returns>
    Task<PagedResult<TenantDto>> GetTenantsAsync(PagedQuery query);

    /// <summary>
    /// 根据 ID 获取租户详情
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <returns>租户信息</returns>
    Task<TenantDto?> GetTenantByIdAsync(Guid tenantId);

    /// <summary>
    /// 创建新租户
    /// </summary>
    /// <param name="request">创建租户请求</param>
    /// <returns>创建后的租户信息</returns>
    Task<TenantDto> CreateTenantAsync(CreateTenantRequest request);

    /// <summary>
    /// 更新租户信息
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="request">更新租户请求</param>
    /// <returns>更新后的租户信息</returns>
    Task<TenantDto> UpdateTenantAsync(Guid tenantId, UpdateTenantRequest request);

    /// <summary>
    /// 获取租户当前用量统计（设备数、用户数等）
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <returns>用量统计字典（如 deviceCount、userCount）</returns>
    Task<Dictionary<string, int>> GetTenantUsageAsync(Guid tenantId);
}
