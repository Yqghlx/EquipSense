namespace EquipAI.Application.Interfaces;

/// <summary>
/// RBAC 权限校验服务接口
/// 根据用户角色和所需权限判断是否授权
/// </summary>
public interface IRbacService
{
    /// <summary>
    /// 判断指定角色是否拥有某项权限
    /// </summary>
    /// <param name="role">用户角色名称（如 SystemAdmin、MaintenanceLead 等）</param>
    /// <param name="permission">所需权限标识（如 "device:create"、"alert:configure" 等）</param>
    /// <returns>有权限返回 true，否则 false</returns>
    bool HasPermission(string role, string permission);
}
