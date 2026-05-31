namespace EquipAI.Core.Interfaces;

/// <summary>
/// 租户上下文接口，提供当前请求的租户隔离信息
/// 由 Infrastructure 层实现，通过 DI 注入到需要租户感知的服务中
/// </summary>
public interface ITenantContext
{
    /// <summary>
    /// 当前请求关联的租户 ID
    /// </summary>
    Guid TenantId { get; }

    /// <summary>
    /// 当前租户的数据隔离模式
    /// </summary>
    string IsolationMode { get; }

    /// <summary>
    /// 当前用户是否为系统管理员（跨租户权限）
    /// </summary>
    bool IsSystemAdmin { get; }

    /// <summary>
    /// 当前用户 ID
    /// </summary>
    Guid UserId { get; }
}
