namespace EquipAI.Core.Enums;

/// <summary>
/// 用户角色枚举，定义系统中五种 RBAC 角色
/// </summary>
public enum UserRole
{
    /// <summary>系统管理员</summary>
    SystemAdmin,

    /// <summary>维保主管</summary>
    MaintenanceLead,

    /// <summary>维保技师</summary>
    Technician,

    /// <summary>操作员</summary>
    Operator,

    /// <summary>只读查看者</summary>
    Viewer
}
