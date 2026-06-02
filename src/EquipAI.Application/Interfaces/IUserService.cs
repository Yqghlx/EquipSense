using EquipAI.Application.DTOs.Common;
using EquipAI.Core.Models;
using EquipAI.Application.DTOs.Users;

namespace EquipAI.Application.Interfaces;

/// <summary>
/// 用户管理服务接口，提供用户 CRUD 和角色管理能力
/// 所有操作均在指定租户范围内进行
/// </summary>
public interface IUserService
{
    /// <summary>
    /// 分页查询用户列表
    /// </summary>
    /// <param name="query">分页查询参数</param>
    /// <param name="tenantId">租户 ID</param>
    /// <returns>分页用户结果</returns>
    Task<PagedResult<UserDto>> GetUsersAsync(PagedQuery query, Guid tenantId);

    /// <summary>
    /// 根据 ID 获取用户详情
    /// </summary>
    /// <param name="userId">用户 ID</param>
    /// <param name="tenantId">租户 ID</param>
    /// <returns>用户信息</returns>
    Task<UserDto?> GetUserByIdAsync(Guid userId, Guid tenantId);

    /// <summary>
    /// 创建新用户
    /// </summary>
    /// <param name="request">创建用户请求</param>
    /// <param name="tenantId">所属租户 ID</param>
    /// <returns>创建后的用户信息</returns>
    Task<UserDto> CreateUserAsync(CreateUserRequest request, Guid tenantId);

    /// <summary>
    /// 更新用户信息（非敏感字段）
    /// </summary>
    /// <param name="userId">用户 ID</param>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="request">更新用户请求</param>
    /// <returns>更新后的用户信息</returns>
    Task<UserDto> UpdateUserAsync(Guid userId, Guid tenantId, UpdateUserRequest request);

    /// <summary>
    /// 停用用户（软删除）
    /// </summary>
    /// <param name="userId">用户 ID</param>
    /// <param name="tenantId">租户 ID</param>
    Task DeactivateUserAsync(Guid userId, Guid tenantId);

    /// <summary>
    /// 变更用户角色
    /// </summary>
    /// <param name="userId">用户 ID</param>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="newRole">新角色名称</param>
    Task ChangeUserRoleAsync(Guid userId, Guid tenantId, string newRole);
}
