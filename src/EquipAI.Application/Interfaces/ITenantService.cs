using EquipAI.Application.DTOs.Common;
using EquipAI.Core.Models;
using EquipAI.Application.DTOs.Tenants;

namespace EquipAI.Application.Interfaces;

/// <summary>
/// 租户管理服务接口，提供租户 CRUD、用量查询和状态管理能力
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

    /// <summary>
    /// 冻结租户 — 禁止创建资源，通常用于违规或欠费场景
    /// 将 Status 设为 Frozen，IsActive 设为 false
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <exception cref="KeyNotFoundException">租户不存在</exception>
    Task FreezeTenantAsync(Guid tenantId);

    /// <summary>
    /// 解冻租户 — 恢复正常使用
    /// 将 Status 设为 Active，IsActive 设为 true
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <exception cref="KeyNotFoundException">租户不存在</exception>
    Task UnfreezeTenantAsync(Guid tenantId);

    /// <summary>
    /// 获取租户详情 — 包含基础信息 + 活跃告警数、待处理工单数、月度分析数、管理员信息
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <returns>租户详情，不存在则返回 null</returns>
    Task<TenantDetailDto?> GetTenantDetailAsync(Guid tenantId);

    /// <summary>
    /// 获取全局统计 — 总租户数、活跃数、试用数、冻结数、总设备、总用户
    /// 排除系统租户
    /// </summary>
    /// <returns>全局统计字典</returns>
    Task<Dictionary<string, object>> GetGlobalStatsAsync();
}
