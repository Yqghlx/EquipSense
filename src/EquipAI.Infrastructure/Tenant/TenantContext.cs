using EquipAI.Core.Constants;
using EquipAI.Core.Interfaces;

namespace EquipAI.Infrastructure.Tenant;

/// <summary>
/// 租户上下文实现，Scoped 生命周期
/// 在每次 HTTP 请求中从 JWT Claims 解析出租户信息，供全局查询过滤器使用
/// </summary>
public class TenantContext : ITenantContext
{
    private readonly Guid _tenantId;
    private readonly bool _isSystemAdmin;

    /// <summary>
    /// 初始化租户上下文
    /// </summary>
    /// <param name="tenantId">当前请求关联的租户 ID</param>
    /// <param name="isolationMode">数据隔离模式</param>
    /// <param name="isSystemAdmin">是否为系统管理员（拥有跨租户权限）</param>
    /// <param name="userId">当前用户 ID</param>
    public TenantContext(Guid tenantId, string isolationMode, bool isSystemAdmin, Guid userId = default)
    {
        _tenantId = tenantId;
        _isSystemAdmin = isSystemAdmin;
        IsolationMode = isolationMode;
        UserId = userId;
    }

    /// <summary>
    /// 当前租户 ID
    /// 系统管理员且未指定具体租户时，默认使用系统租户 ID（用于访问行业预置模板等共享资源）
    /// </summary>
    public Guid TenantId => _isSystemAdmin && _tenantId == Guid.Empty
        ? SystemConstants.SystemTenantId
        : _tenantId;

    /// <inheritdoc />
    public string IsolationMode { get; }

    /// <inheritdoc />
    public bool IsSystemAdmin => _isSystemAdmin;

    /// <inheritdoc />
    public Guid UserId { get; }
}
