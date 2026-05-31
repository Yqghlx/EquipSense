namespace EquipAI.Infrastructure.Middleware;

/// <summary>
/// 权限要求特性，标注在 Controller 或 Action 上用于声明所需的权限
/// 由 PermissionMiddleware 在请求管道中读取并进行权限校验
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true)]
public class RequirePermissionAttribute : Attribute
{
    /// <summary>
    /// 所需的权限标识（如 "device:create"、"alert:configure" 等）
    /// </summary>
    public string Permission { get; }

    /// <summary>
    /// 初始化权限要求特性
    /// </summary>
    /// <param name="permission">所需权限标识</param>
    public RequirePermissionAttribute(string permission)
    {
        Permission = permission;
    }
}
