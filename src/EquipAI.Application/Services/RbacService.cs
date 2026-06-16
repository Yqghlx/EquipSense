using EquipAI.Application.Interfaces;

namespace EquipAI.Application.Services;

/// <summary>
/// RBAC 权限校验服务实现
/// 基于静态权限矩阵，根据用户角色判断是否拥有指定权限
/// 权限格式为 "资源:操作"，如 "device:create"、"alert:configure"
/// </summary>
public class RbacService : IRbacService
{
    /// <summary>
    /// 静态权限矩阵：角色 -> 该角色拥有的权限集合
    /// 权限矩阵的设计原则：最小权限 + 按职责划分
    /// </summary>
    private static readonly Dictionary<string, HashSet<string>> _permissionMatrix = new(StringComparer.OrdinalIgnoreCase)
    {
        // 系统管理员：拥有所有权限
        ["SystemAdmin"] =
        [
            // 设备管理（全部 CRUD）
            "device:create", "device:read", "device:update", "device:delete",
            // 用户管理（全部 CRUD + 角色变更）
            "user:create", "user:read", "user:update", "user:delete", "user:role",
            // 租户管理（全部 CRUD）
            "tenant:create", "tenant:read", "tenant:update", "tenant:delete",
            // 告警管理（全部 CRUD + 确认）
            "alert:create", "alert:read", "alert:update", "alert:delete", "alert:config", "alert:acknowledge",
            // 工单管理（全部 CRUD + 全部状态流转）
            "workorder:create", "workorder:read", "workorder:update", "workorder:delete",
            "workorder:dispatch", "workorder:accept", "workorder:execute",
            "workorder:close", "workorder:cancel", "workorder:manage",
            // 知识库管理（全部 CRUD）
            "knowledge:create", "knowledge:read", "knowledge:update", "knowledge:delete", "knowledge:verify",
            // 报表
            "report:read",
            // AI 分析（全部 CRUD）
            "ai:read", "ai:query", "ai:configure",
            "analysis:read", "analysis:trigger", "analysis:configure",
            // 审计日志（全部读 + 导出）
            "audit:read"
        ],

        // 维保主管：设备读写、告警配置、工单派工验收、知识库验证、报表和 AI 只读
        ["MaintenanceLead"] =
        [
            // 设备管理（读 + 更新）
            "device:read", "device:update",
            // 用户管理（只读）
            "user:read",
            // 告警管理（读 + 确认 + 更新 + 配置）
            "alert:read", "alert:update", "alert:config", "alert:acknowledge",
            // 工单管理（创建 + 读 + 更新 + 派工 + 接受 + 管理）
            "workorder:create", "workorder:read", "workorder:update",
            "workorder:dispatch", "workorder:accept", "workorder:manage",
            // 知识库管理（读 + 更新 + 验证）
            "knowledge:read", "knowledge:update", "knowledge:verify",
            // 报表（只读）
            "report:read",
            // AI 分析（只读）
            "ai:read",
            // 审计日志（只读追溯）
            "audit:read"
        ],

        // 维保技师：设备只读、告警确认、工单执行、知识库只读、AI 查询
        ["Technician"] =
        [
            // 设备管理（只读）
            "device:read",
            // 告警管理（读 + 确认）
            "alert:read", "alert:acknowledge",
            // 工单管理（读 + 执行）
            "workorder:read", "workorder:execute",
            // 知识库管理（只读）
            "knowledge:read",
            // AI 分析（读 + 查询）
            "ai:read", "ai:query"
        ],

        // 操作员：设备只读、告警确认、工单只读、报表只读、AI 查询
        ["Operator"] =
        [
            // 设备管理（只读）
            "device:read",
            // 告警管理（读 + 确认）
            "alert:read", "alert:acknowledge",
            // 工单管理（只读）
            "workorder:read",
            // 报表（只读）
            "report:read",
            // AI 分析（读 + 查询）
            "ai:read", "ai:query"
        ],

        // 只读查看者：所有模块只读
        ["Viewer"] =
        [
            // 设备管理（只读）
            "device:read",
            // 告警管理（只读）
            "alert:read",
            // 工单管理（只读）
            "workorder:read",
            // 知识库管理（只读）
            "knowledge:read",
            // 报表（只读）
            "report:read"
        ]
    };

    /// <summary>
    /// 判断指定角色是否拥有某项权限
    /// </summary>
    /// <param name="role">用户角色名称（如 SystemAdmin、MaintenanceLead 等）</param>
    /// <param name="permission">所需权限标识（如 "device:create"、"alert:config" 等）</param>
    /// <returns>有权限返回 true，否则 false</returns>
    public bool HasPermission(string role, string permission)
    {
        if (string.IsNullOrWhiteSpace(role) || string.IsNullOrWhiteSpace(permission))
        {
            return false;
        }

        if (!_permissionMatrix.TryGetValue(role, out var permissions))
        {
            return false;
        }

        return permissions.Contains(permission);
    }
}
